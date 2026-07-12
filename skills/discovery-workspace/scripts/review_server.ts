#!/usr/bin/env node
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { CliAgentAdapter, validateAgentResponse } from "./review/cli-agent.ts";
import { SqliteReviewStorage } from "./review/store.ts";
import { loadWorkspace, renderFiles, sourceDigest } from "./render_discovery.ts";
import type { AgentAdapter, AgentProposal, AgentRequest, CommentInput } from "./review/types.ts";

const json = (res: ServerResponse, status: number, value: unknown): void => {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(JSON.stringify(value));
};
async function body(req: IncomingMessage): Promise<Record<string, unknown>> {
  let value = "";
  for await (const chunk of req) {
    value += chunk;
    if (value.length > 1_000_000) throw new Error("request too large");
  }
  return value ? JSON.parse(value) : {};
}
function canonical(
  root: string,
  target: { record_id: string; field?: string },
): { file?: string; value?: unknown; record?: Record<string, unknown>; document?: unknown } {
  const discoveryPath = join(root, "discovery.json");
  const discovery = JSON.parse(readFileSync(discoveryPath, "utf8")) as Record<string, unknown>;
  if (target.record_id === discovery.id)
    return {
      file: discoveryPath,
      value: target.field ? discovery[target.field] : discovery,
      record: discovery,
      document: discovery,
    };
  const request = discovery.request as Record<string, unknown>;
  if (target.record_id === request?.id)
    return {
      file: discoveryPath,
      value: target.field ? request[target.field] : request,
      record: request,
      document: discovery,
    };
  for (const name of ["evidence", "hypotheses", "decisions", "experiments"]) {
    const file = join(root, "records", `${name}.json`);
    const records = JSON.parse(readFileSync(file, "utf8")) as Record<string, unknown>[];
    const record = records.find((item) => item.id === target.record_id);
    if (record)
      return {
        file,
        value: target.field ? record[target.field] : record,
        record,
        document: records,
      };
  }
  return {};
}
function applyProposal(
  root: string,
  proposal: AgentProposal,
  target: { record_id: string; field?: string },
  commentId: string,
): void {
  if (
    !proposal.record_id ||
    !proposal.field ||
    proposal.record_id !== target.record_id ||
    proposal.field !== target.field
  )
    throw new Error("proposal target does not match the reviewed field");
  const found = canonical(root, proposal as { record_id: string; field: string });
  if (
    !found.file ||
    !found.record ||
    !Object.hasOwn(found.record, proposal.field) ||
    !isDeepStrictEqual(found.value, proposal.before)
  )
    throw new Error("proposal is stale or target is missing");
  found.record[proposal.field] = proposal.after;
  const createdAt = new Date().toISOString();
  const discoveryPath = join(root, "discovery.json");
  if (found.file === discoveryPath) {
    (found.document as Record<string, unknown>).updated_at = createdAt;
    writeFileSync(found.file, JSON.stringify(found.document, null, 2) + "\n");
  } else {
    writeFileSync(found.file, JSON.stringify(found.document, null, 2) + "\n");
    const discovery = JSON.parse(readFileSync(discoveryPath, "utf8")) as Record<string, unknown>;
    discovery.updated_at = createdAt;
    writeFileSync(discoveryPath, JSON.stringify(discovery, null, 2) + "\n");
  }
  const ledgerPath = join(root, "history/revisions.json");
  const ledger = JSON.parse(readFileSync(ledgerPath, "utf8")) as unknown[];
  ledger.push({
    id: `revision-${crypto.randomUUID()}`,
    created_at: createdAt,
    triggered_by: [commentId],
    changed_records: [proposal.record_id],
    summary: proposal.summary,
  });
  writeFileSync(ledgerPath, JSON.stringify(ledger, null, 2) + "\n");
}
function dynamicPresentation(root: string): Map<string, Buffer> {
  return renderFiles(loadWorkspace(root), sourceDigest(root), {
    includePrivateMeetingArtifacts: true,
  });
}
function archiveComment(root: string, commentId: string, item: unknown): void {
  mkdirSync(join(root, "comments"), { recursive: true });
  writeFileSync(
    join(root, "comments", `${basename(commentId)}.json`),
    JSON.stringify(item, null, 2) + "\n",
  );
}
export function createReviewServer(
  rootInput: string,
  options: { database?: string; agent?: AgentAdapter } = {},
) {
  const root = resolve(rootInput);
  if (!existsSync(join(root, "discovery.json")))
    throw new Error("workspace must contain discovery.json");
  loadWorkspace(root);
  const storage = new SqliteReviewStorage(options.database ?? join(root, ".review/review.sqlite"));
  const agent =
    options.agent ??
    new CliAgentAdapter(process.execPath, [
      fileURLToPath(new URL("./mock_review_agent.ts", import.meta.url)),
    ]);
  const server = createServer(async (req, res) => {
    try {
      const url = new URL(req.url ?? "/", "http://localhost");
      const parts = url.pathname.split("/").filter(Boolean).map(decodeURIComponent);
      const localPort = String(req.socket.localPort ?? "");
      const allowedHost = (value: string | undefined): boolean => {
        if (!value) return false;
        try {
          const authority = new URL(`http://${value}`);
          return (
            ["127.0.0.1", "localhost", "[::1]"].includes(authority.hostname) &&
            authority.port === localPort
          );
        } catch {
          return false;
        }
      };
      if (!allowedHost(req.headers.host)) return json(res, 403, { error: "host denied" });
      if (url.pathname.startsWith("/api/") && !["GET", "HEAD"].includes(req.method ?? "")) {
        const origin = req.headers.origin;
        if (!origin || !allowedHost(new URL(origin).host))
          return json(res, 403, { error: "origin denied" });
        if (!String(req.headers["content-type"] ?? "").startsWith("application/json"))
          return json(res, 415, { error: "application/json required" });
      }
      if (url.pathname.startsWith("/api/")) {
        if (req.method === "GET" && url.pathname === "/api/comments")
          return json(res, 200, storage.listComments());
        if (req.method === "POST" && url.pathname === "/api/comments") {
          const input = (await body(req)) as CommentInput;
          const target = canonical(root, input.target ?? { record_id: "" });
          if (!target.record || (input.target.field && !(input.target.field in target.record)))
            return json(res, 422, { error: "comment target is missing" });
          return json(res, 201, storage.createComment(input));
        }
        if (parts[1] === "comments" && parts[2]) {
          const commentId = parts[2];
          if (req.method === "GET" && parts.length === 3) {
            const item = storage.getComment(commentId);
            return json(res, item ? 200 : 404, item ?? { error: "not found" });
          }
          if (req.method === "POST" && parts[3] === "replies") {
            const input = await body(req);
            return json(
              res,
              201,
              storage.addReply(
                commentId,
                String(input.body ?? ""),
                input.author ? String(input.author) : undefined,
              ),
            );
          }
          if (req.method === "POST" && parts[3] === "resolve") {
            const input = await body(req);
            const item = storage.resolveComment(
              commentId,
              String(input.resolution ?? "accepted-no-change"),
            );
            archiveComment(root, commentId, item);
            return json(res, 200, item);
          }
          if (req.method === "POST" && parts[3] === "agent") {
            const thread = storage.getComment(commentId) as Record<string, unknown> | undefined;
            if (!thread) return json(res, 404, { error: "not found" });
            const job = storage.createJob(commentId) as Record<string, unknown>;
            const discovery = JSON.parse(
              readFileSync(join(root, "discovery.json"), "utf8"),
            ) as Record<string, unknown>;
            const target = thread.target as { record_id: string; field?: string };
            const request: AgentRequest = {
              version: "1",
              workspace: {
                id: String(discovery.id),
                authority: String(
                  (discovery.review as Record<string, unknown>)?.authority ?? "risk-based",
                ),
              },
              thread,
              canonical: canonical(root, target),
            };
            void agent
              .handle(request)
              .then((value) => {
                const response = validateAgentResponse(value);
                storage.updateJob(String(job.id), "completed", response);
                storage.addReply(commentId, response.message, "agent");
              })
              .catch((error) =>
                storage.updateJob(String(job.id), "failed", undefined, String(error)),
              );
            return json(res, 202, job);
          }
        }
        if (req.method === "GET" && url.pathname === "/api/jobs")
          return json(res, 200, storage.listJobs());
        if (parts[1] === "jobs" && parts[2]) {
          const job = storage.getJob(parts[2]) as Record<string, unknown> | undefined;
          if (req.method === "GET" && parts.length === 3)
            return json(res, job ? 200 : 404, job ?? { error: "not found" });
          if (req.method === "POST" && parts[3] === "apply") {
            if (!job || job.status !== "completed")
              return json(res, 409, { error: "job is not completed" });
            const response = validateAgentResponse(job.response);
            if (!response.proposal) return json(res, 409, { error: "job has no proposal" });
            const thread = storage.getComment(String(job.thread_id)) as
              | { target?: { record_id: string; field?: string } }
              | undefined;
            if (!thread?.target) return json(res, 409, { error: "comment target is missing" });
            const proposalTarget = canonical(
              root,
              response.proposal as {
                record_id: string;
                field: string;
              },
            );
            if (!proposalTarget.file)
              return json(res, 409, { error: "proposal target is missing" });
            const ledgerPath = join(root, "history/revisions.json");
            const discoveryPath = join(root, "discovery.json");
            const canonicalBefore = readFileSync(proposalTarget.file);
            const discoveryBefore = readFileSync(discoveryPath);
            const ledgerBefore = readFileSync(ledgerPath);
            try {
              applyProposal(root, response.proposal, thread.target, String(job.thread_id));
              loadWorkspace(root);
            } catch (error) {
              writeFileSync(proposalTarget.file, canonicalBefore);
              writeFileSync(discoveryPath, discoveryBefore);
              writeFileSync(ledgerPath, ledgerBefore);
              throw error;
            }
            const item = storage.resolveComment(
              String(job.thread_id),
              response.proposal.resolution ?? "revised",
            );
            archiveComment(root, String(job.thread_id), item);
            return json(res, 200, item);
          }
        }
        return json(res, 404, { error: "not found" });
      }
      if (req.method !== "GET" && req.method !== "HEAD")
        return json(res, 405, { error: "method not allowed" });
      const name = url.pathname === "/" ? "index.html" : url.pathname.slice(1);
      if (!/^[a-zA-Z0-9._-]+$/.test(name)) return json(res, 404, { error: "not found" });
      const content = dynamicPresentation(root).get(name);
      if (!content) return json(res, 404, { error: "not found" });
      const types: Record<string, string> = {
        ".html": "text/html; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".json": "application/json; charset=utf-8",
      };
      res.writeHead(200, {
        "content-type": types[extname(name)] ?? "application/octet-stream",
        "x-content-type-options": "nosniff",
      });
      res.end(req.method === "HEAD" ? undefined : content);
    } catch (error) {
      json(res, error instanceof SyntaxError ? 400 : 422, {
        error: String(error instanceof Error ? error.message : error),
      });
    }
  });
  server.on("close", () => storage.close());
  return server;
}
export function main(argv = process.argv.slice(2)): void {
  const root = resolve(argv[0] ?? "examples/deployment-visibility");
  const port = Number(argv[1] ?? process.env.PORT ?? 4173);
  createReviewServer(root).listen(port, "127.0.0.1", () =>
    console.log(`Review ${root} at http://127.0.0.1:${port}`),
  );
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
