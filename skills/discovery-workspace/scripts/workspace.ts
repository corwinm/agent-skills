#!/usr/bin/env node
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { loadWorkspace, main as renderMain, sourceDigest } from "./render_discovery.ts";
import { main as reviewMain } from "./review_server.ts";

function writeJson(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}

function titleFromId(id: string): string {
  const words = id.replace(/[^a-zA-Z0-9]+/g, " ").trim();
  return words ? words[0]!.toUpperCase() + words.slice(1) : "New discovery";
}

export function initialize(rootInput: string): void {
  const root = resolve(rootInput);
  const discoveryPath = join(root, "discovery.json");
  if (existsSync(discoveryPath)) throw new Error(`workspace already exists: ${discoveryPath}`);
  const id =
    basename(root)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "new-discovery";
  const createdAt = new Date().toISOString();
  for (const directory of ["records", "comments", "history", "sources"]) {
    mkdirSync(join(root, directory), { recursive: true });
  }
  writeJson(discoveryPath, {
    version: "0.1",
    id,
    title: titleFromId(id),
    stage: "intake",
    updated_at: createdAt,
    review: { mode: "interactive-browser", authority: "risk-based" },
    request: {
      id: "request-001",
      verbatim: "Replace with the original request.",
      requester: "unknown",
      proposed_solution: "unknown",
    },
    decision_needed: "Define the next discovery decision.",
    recommendation: "No recommendation yet.",
  });
  for (const name of ["evidence", "hypotheses", "decisions", "experiments"]) {
    writeJson(join(root, "records", `${name}.json`), []);
  }
  writeJson(join(root, "history/revisions.json"), [
    {
      id: "revision-001",
      created_at: createdAt,
      triggered_by: [],
      changed_records: ["request-001"],
      summary: "Initialized discovery workspace",
    },
  ]);
  console.log(`Initialized discovery workspace: ${root}`);
}

function usage(): never {
  throw new Error(
    "usage: workspace.ts <init|export|check|review> <workspace> [port]\n" +
      "  init    create a new canonical workspace\n" +
      "  export  generate an optional static presentation snapshot\n" +
      "  check   validate canonical workspace data\n" +
      "  review  start the dynamic interactive review server",
  );
}

export function main(argv = process.argv.slice(2)): void {
  const [command, rootInput, port] = argv;
  if (!command || !rootInput) usage();
  const root = resolve(rootInput);
  if (command === "init") return initialize(root);
  if (command === "export") {
    process.exitCode = renderMain([root]);
    return;
  }
  if (command === "check") {
    loadWorkspace(root);
    sourceDigest(root);
    console.log(`Canonical workspace is valid: ${root}`);
    return;
  }
  if (command === "review") {
    reviewMain([root, ...(port ? [port] : [])]);
    return;
  }
  usage();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}
