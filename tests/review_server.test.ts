import assert from "node:assert/strict";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { createReviewServer } from "../scripts/review_server.ts";
import { CliAgentAdapter, validateAgentResponse } from "../scripts/review/cli-agent.ts";
import type { AgentAdapter } from "../scripts/review/types.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const WORKSPACE = join(ROOT, "examples/deployment-visibility");
async function running(
  run: (base: string, workspace: string) => Promise<void>,
  agent?: AgentAdapter,
): Promise<void> {
  const temporary = mkdtempSync(join(tmpdir(), "review-test-"));
  const workspace = join(temporary, "workspace");
  cpSync(WORKSPACE, workspace, { recursive: true });
  const server = createReviewServer(workspace, agent ? { agent } : {});
  await new Promise<void>((resolveListen) => server.listen(0, "127.0.0.1", resolveListen));
  const address = server.address();
  assert.ok(address && typeof address === "object");
  try {
    await run(`http://127.0.0.1:${address.port}`, workspace);
  } finally {
    await new Promise<void>((done) => server.close(() => done()));
    rmSync(temporary, { recursive: true, force: true });
  }
}
const request = async (base: string, path: string, options?: RequestInit) =>
  fetch(base + path, {
    ...options,
    headers: {
      origin: base,
      "content-type": "application/json",
      ...(options?.headers ?? {}),
    },
  });

test("HTTP API persists comments/replies and serves only presentation files", async () =>
  running(async (base) => {
    assert.equal((await request(base, "/")).status, 200);
    assert.equal((await request(base, "/../discovery.json")).status, 404);
    assert.equal((await request(base, "/%2e%2e%2fdiscovery.json")).status, 404);
    assert.equal(
      (
        await fetch(base + "/api/comments", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: "{}",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await fetch(base + "/api/comments", {
          method: "POST",
          headers: {
            host: "attacker.example",
            origin: "http://attacker.example",
            "content-type": "application/json",
          },
          body: "{}",
        })
      ).status,
      403,
    );
    assert.equal(
      (
        await request(base, "/api/comments", {
          method: "POST",
          headers: { origin: "https://attacker.example", "content-type": "application/json" },
          body: JSON.stringify({ target: { record_id: "problem-001" }, body: "Cross-site" }),
        })
      ).status,
      403,
    );
    const pageComment = await request(base, "/api/comments", {
      method: "POST",
      body: JSON.stringify({
        target: { record_id: "deployment-visibility", page: "hypotheses.html" },
        body: "Review the whole comparison",
      }),
    });
    assert.equal(pageComment.status, 201, await pageComment.text());
    const created = await (
      await request(base, "/api/comments", {
        method: "POST",
        body: JSON.stringify({
          target: { record_id: "problem-001", field: "difficulty" },
          body: "Clarify this",
          author: "Ada",
        }),
      })
    ).json();
    assert.equal(created.status, "open");
    const replied = await (
      await request(base, `/api/comments/${created.id}/replies`, {
        method: "POST",
        body: JSON.stringify({ body: "Agreed" }),
      })
    ).json();
    assert.equal(replied.replies.length, 1);
    assert.equal(
      (await (await request(base, `/api/comments/${created.id}`)).json()).body,
      "Clarify this",
    );
  }));

test("agent queue uses portable one-request/one-response CLI protocol", async () =>
  running(async (base, workspace) => {
    const created = await (
      await request(base, "/api/comments", {
        method: "POST",
        body: JSON.stringify({
          target: { record_id: "problem-001", field: "difficulty" },
          body: "Agent please",
        }),
      })
    ).json();
    const queued = await (
      await request(base, `/api/comments/${created.id}/agent`, { method: "POST", body: "{}" })
    ).json();
    let job;
    for (let index = 0; index < 50; index++) {
      job = await (await request(base, `/api/jobs/${queued.id}`)).json();
      if (job.status !== "queued") break;
      await new Promise((done) => setTimeout(done, 20));
    }
    assert.equal(job.status, "completed");
    assert.equal(job.response.version, "1");
    assert.equal(job.response.proposal.risk, "material");
    const thread = await (await request(base, `/api/comments/${created.id}`)).json();
    assert.equal(thread.replies.at(-1).author, "agent");
    const applied = await request(base, `/api/jobs/${queued.id}/apply`, {
      method: "POST",
      body: "{}",
    });
    assert.equal(applied.status, 200, await applied.text());
    const hypotheses = JSON.parse(readFileSync(join(workspace, "records/hypotheses.json"), "utf8"));
    assert.equal(hypotheses[0].difficulty, job.response.proposal.after);
    assert.ok(
      readFileSync(join(workspace, "presentation/hypotheses.html"), "utf8").includes(
        job.response.proposal.after,
      ),
    );
    assert.ok(existsSync(join(workspace, "comments", `${created.id}.json`)));
    const adapter = new CliAgentAdapter(process.execPath, [
      join(ROOT, "scripts/mock_review_agent.ts"),
    ]);
    const response = await adapter.handle({
      version: "1",
      workspace: { id: "x", authority: "risk-based" },
      thread: { target: { record_id: "r", field: "f" } },
      canonical: { value: "before" },
    });
    assert.equal(response.proposal?.after, "[mock revision] before");
    const hanging = new CliAgentAdapter(process.execPath, ["-e", "setInterval(() => {}, 1000)"], {
      timeoutMs: 25,
    });
    await assert.rejects(
      () =>
        hanging.handle({
          version: "1",
          workspace: { id: "x", authority: "risk-based" },
          thread: {},
          canonical: {},
        }),
      /timed out/,
    );
  }));

test("malformed injected agent responses fail the job before persistence", async () => {
  const agent = {
    async handle() {
      return { version: "1", message: "" };
    },
  } as AgentAdapter;
  await running(async (base) => {
    const created = await (
      await request(base, "/api/comments", {
        method: "POST",
        body: JSON.stringify({
          target: { record_id: "problem-001", field: "difficulty" },
          body: "Ask the agent",
        }),
      })
    ).json();
    const queued = await (
      await request(base, `/api/comments/${created.id}/agent`, { method: "POST", body: "{}" })
    ).json();
    let job;
    for (let index = 0; index < 50; index++) {
      job = await (await request(base, `/api/jobs/${queued.id}`)).json();
      if (job.status !== "queued") break;
      await new Promise((done) => setTimeout(done, 20));
    }
    assert.equal(job.status, "failed");
    assert.match(job.error, /invalid agent response envelope/);
    assert.equal(job.response, null);
  }, agent);
});

test("failed regeneration rolls back the canonical record and revision ledger", async () => {
  const agent: AgentAdapter = {
    async handle(request) {
      const canonical = request.canonical as { value: unknown };
      return {
        version: "1",
        message: "Proposed a revision",
        proposal: {
          summary: "Change the reviewed field",
          record_id: "problem-001",
          field: "difficulty",
          before: canonical.value,
          after: "This must be rolled back",
          risk: "material",
        },
      };
    },
  };
  await running(async (base, workspace) => {
    const canonicalPath = join(workspace, "records/hypotheses.json");
    const ledgerPath = join(workspace, "history/revisions.json");
    const canonicalBefore = readFileSync(canonicalPath, "utf8");
    const ledgerBefore = readFileSync(ledgerPath, "utf8");
    const created = await (
      await request(base, "/api/comments", {
        method: "POST",
        body: JSON.stringify({
          target: { record_id: "problem-001", field: "difficulty" },
          body: "Revise this",
        }),
      })
    ).json();
    const queued = await (
      await request(base, `/api/comments/${created.id}/agent`, { method: "POST", body: "{}" })
    ).json();
    let job;
    for (let index = 0; index < 50; index++) {
      job = await (await request(base, `/api/jobs/${queued.id}`)).json();
      if (job.status !== "queued") break;
      await new Promise((done) => setTimeout(done, 20));
    }
    assert.equal(job.status, "completed");
    writeFileSync(join(workspace, "records/evidence.json"), "not json\n");
    const applied = await request(base, `/api/jobs/${queued.id}/apply`, {
      method: "POST",
      body: "{}",
    });
    assert.equal(applied.status, 400);
    assert.equal(readFileSync(canonicalPath, "utf8"), canonicalBefore);
    assert.equal(readFileSync(ledgerPath, "utf8"), ledgerBefore);
    assert.equal(
      (await (await request(base, `/api/comments/${created.id}`)).json()).status,
      "open",
    );
  }, agent);
});

test("generated UI contains stable targets, accessible controls, drawer, statuses, and proposal actions", () => {
  const html = readFileSync(join(WORKSPACE, "presentation/hypotheses.html"), "utf8");
  const scriptPath = join(WORKSPACE, "presentation/artifact.js");
  const script = readFileSync(scriptPath, "utf8");
  const syntax = spawnSync(process.execPath, ["--check", scriptPath], { encoding: "utf8" });
  assert.equal(syntax.status, 0, syntax.stderr);
  for (const marker of [
    'data-record-id="problem-001"',
    'data-field="difficulty"',
    'aria-label="Comment on this page"',
    'id="review-drawer"',
    'aria-live="polite"',
  ])
    assert.ok(html.includes(marker), marker);
  for (const marker of [
    "Request agent",
    "data-agent",
    "data-reply",
    "/replies",
    "data-apply",
    "proposal",
    "location.reload",
    "/api/comments",
  ])
    assert.ok(script.includes(marker), marker);
});

test("mock rejects malformed input and emits exactly one JSON document", () => {
  const good = spawnSync(process.execPath, [join(ROOT, "scripts/mock_review_agent.ts")], {
    input: JSON.stringify({ thread: { target: {} }, canonical: {} }),
    encoding: "utf8",
  });
  assert.equal(good.status, 0);
  assert.doesNotThrow(() => JSON.parse(good.stdout));
  const bad = spawnSync(process.execPath, [join(ROOT, "scripts/mock_review_agent.ts")], {
    input: "not json",
    encoding: "utf8",
  });
  assert.notEqual(bad.status, 0);
});
