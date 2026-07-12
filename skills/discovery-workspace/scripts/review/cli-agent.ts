import { spawn } from "node:child_process";
import type { AgentAdapter, AgentRequest, AgentResponse } from "./types.ts";

const risks = new Set(["meaning-preserving", "material"]);
const resolutions = new Set([
  "revised",
  "accepted-no-change",
  "needs-clarification",
  "needs-evidence",
  "superseded",
]);
export function validateAgentResponse(value: unknown): AgentResponse {
  if (!value || typeof value !== "object") throw new Error("response must be an object");
  const response = value as Record<string, unknown>;
  if (response.version !== "1" || typeof response.message !== "string" || !response.message.trim())
    throw new Error("invalid agent response envelope");
  if (response.proposal !== undefined) {
    if (!response.proposal || typeof response.proposal !== "object")
      throw new Error("proposal must be an object");
    const proposal = response.proposal as Record<string, unknown>;
    for (const field of ["summary", "record_id", "field"])
      if (typeof proposal[field] !== "string" || !String(proposal[field]).trim())
        throw new Error(`proposal.${field} is required`);
    if (!risks.has(String(proposal.risk))) throw new Error("proposal.risk is invalid");
    if (proposal.resolution !== undefined && !resolutions.has(String(proposal.resolution)))
      throw new Error("proposal.resolution is invalid");
    if (!Object.hasOwn(proposal, "before") || !Object.hasOwn(proposal, "after"))
      throw new Error("proposal.before and proposal.after are required");
  }
  return response as AgentResponse;
}

export class CliAgentAdapter implements AgentAdapter {
  readonly command: string;
  readonly args: string[];
  readonly timeoutMs: number;
  readonly maxOutputBytes: number;

  constructor(
    command: string,
    args: string[] = [],
    options: { timeoutMs?: number; maxOutputBytes?: number } = {},
  ) {
    this.command = command;
    this.args = args;
    this.timeoutMs = options.timeoutMs ?? 120_000;
    this.maxOutputBytes = options.maxOutputBytes ?? 1_000_000;
  }

  handle(request: AgentRequest): Promise<AgentResponse> {
    return new Promise((resolve, reject) => {
      const child = spawn(this.command, this.args, { stdio: ["pipe", "pipe", "pipe"] });
      let stdout = "";
      let stderr = "";
      let settled = false;
      const fail = (error: Error): void => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        child.kill("SIGKILL");
        reject(error);
      };
      const timer = setTimeout(
        () => fail(new Error(`agent timed out after ${this.timeoutMs}ms`)),
        this.timeoutMs,
      );
      const append = (current: string, chunk: string): string => {
        const next = current + chunk;
        if (Buffer.byteLength(next) > this.maxOutputBytes)
          fail(new Error(`agent output exceeded ${this.maxOutputBytes} bytes`));
        return next;
      };
      child.stdout.setEncoding("utf8").on("data", (chunk: string) => {
        stdout = append(stdout, chunk);
      });
      child.stderr.setEncoding("utf8").on("data", (chunk: string) => {
        stderr = append(stderr, chunk);
      });
      child.on("error", fail);
      child.on("close", (code) => {
        if (settled) return;
        clearTimeout(timer);
        if (code !== 0) return fail(new Error(`agent exited ${code}: ${stderr.trim()}`));
        try {
          const response = validateAgentResponse(JSON.parse(stdout));
          settled = true;
          resolve(response);
        } catch (error) {
          fail(new Error(`invalid agent JSON: ${String(error)}`));
        }
      });
      child.stdin.end(JSON.stringify(request) + "\n");
    });
  }
}
