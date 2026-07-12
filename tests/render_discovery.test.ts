import assert from "node:assert/strict";
import {
  mkdtempSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { replacePresentation } from "../scripts/render_discovery.ts";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const RENDERER = join(ROOT, "scripts/render_discovery.ts");
const BUNDLED_RENDERER = join(ROOT, "skills/discovery-workspace/scripts/render_discovery.ts");
const BUNDLED_WORKSPACE_CLI = join(ROOT, "skills/discovery-workspace/scripts/workspace.ts");
function writeJson(path: string, value: unknown): void {
  mkdirSync(resolve(path, ".."), { recursive: true });
  writeFileSync(path, JSON.stringify(value, null, 2) + "\n");
}
function workspace(root: string): void {
  writeJson(join(root, "discovery.json"), {
    version: "0.1",
    id: "deployment-visibility",
    title: "Deployment visibility",
    stage: "problem-framing",
    updated_at: "2026-07-11T18:00:00Z",
    review: {
      mode: "github-pull-request",
      authority: "risk-based",
      repository: "corwinm/example",
      pull_request: 12,
    },
    request: {
      id: "request-001",
      verbatim: "Build <all> the dashboards",
      requester: "Engineering leadership",
      proposed_solution: "Central dashboard",
    },
    decision_needed: "Choose the next experiment",
    recommendation: "Test a plain-language status response",
  });
  writeJson(join(root, "records/evidence.json"), [
    {
      id: "evidence-001",
      type: "reported-experience",
      statement: "Support asks engineering whether a fix is live.",
      source_id: "source-001",
      limitations: ["Frequency is not established"],
    },
    {
      id: "evidence-002",
      type: "direct-quote",
      statement: "Remote context was difficult to recover.",
      source_id: "meeting-001",
      source_excerpt: "I had to reconstruct what the agent was doing.",
      source_locator: {
        path: "sources/meeting-001/transcript.md",
        segment_id: "seg-0002",
        start_time: "00:04:10",
        speaker: "P1",
      },
      limitations: ["One participant"],
    },
  ]);
  writeJson(join(root, "records/hypotheses.json"), [
    {
      id: "problem-001",
      affected_group: "Support representatives",
      situation: "Responding to customers waiting for a fix",
      goal: "Determine whether the fix is available",
      difficulty: "Deployment state requires interpretation",
      consequence: "Responses are delayed",
      supporting_evidence_ids: ["evidence-001"],
      contradicting_evidence_ids: [],
      unknowns: ["Request frequency"],
      status: "leading",
    },
  ]);
  writeJson(join(root, "records/decisions.json"), [
    {
      id: "decision-001",
      decision: "Run a reversible experiment",
      owner: "Director of Engineering",
      rationale: "The critical assumption can be tested manually.",
      unresolved_dissent: [],
    },
  ]);
  writeJson(join(root, "records/experiments.json"), [
    {
      id: "experiment-001",
      problem_hypothesis_id: "problem-001",
      critical_assumption: "A plain-language response avoids interruptions",
      intervention: "Manually assisted status response",
      signals: ["Requests answered without a developer"],
      decision_rule: "Automate after seven of ten successful requests",
    },
  ]);
  writeJson(join(root, "comments/comment-001.json"), {
    id: "comment-001",
    target: { record_id: "problem-001", record_type: "problem-hypothesis", field: "difficulty" },
    selection: { exact: "Deployment state requires interpretation", prefix: "", suffix: "" },
    body: "Narrow this to cases where CI and runtime disagree.",
    author: { github: "corwinm" },
    created_at: "2026-07-11T18:42:00Z",
    status: "open",
  });
  writeJson(join(root, "history/revisions.json"), [
    {
      id: "revision-001",
      created_at: "2026-07-11T18:00:00Z",
      triggered_by: [],
      changed_records: ["problem-001"],
      summary: "Added initial problem hypothesis",
    },
  ]);
  writeJson(join(root, "sources/meeting-001/meeting.json"), {
    version: "0.1",
    id: "meeting-001",
    kind: "discovery-interview",
    status: "ingested",
    title: "Remote workflow interview",
    learning_questions: [
      { id: "lq-001", question: "Where does remote context break down?", related_record_ids: [] },
    ],
    participants: [
      {
        participant_id: "participant-001",
        pseudonym: "P1",
        role: "Developer",
        consent: {
          discovery_use: "granted",
          direct_quote_use: "granted-with-anonymization",
          external_sharing: "granted-with-anonymization",
        },
      },
      { participant_id: "facilitator-001", pseudonym: "F1", role: "Facilitator" },
    ],
    consent: {
      recording: "granted",
      transcription: "granted",
      discovery_use: "granted",
      direct_quote_use: "granted-with-anonymization",
      external_sharing: "granted-with-anonymization",
    },
    privacy: { classification: "confidential", transcript_redacted: true },
    artifacts: { guide: "guide.md", transcript: "transcript.md" },
    ingestion: { status: "ingested", evidence_ids: ["evidence-002"] },
  });
  writeFileSync(
    join(root, "sources/meeting-001/guide.md"),
    "# Guide\n\nAsk about recent remote development episodes.\n",
  );
  writeFileSync(
    join(root, "sources/meeting-001/transcript.md"),
    "# Transcript\n\n## seg-0001 | 00:00:01 | F1\n\nDo you consent?\n\n## seg-0002 | 00:04:10 | P1\n\nI had to reconstruct what the agent was doing.\n",
  );
}
function run(root: string, ...args: string[]) {
  return spawnSync(process.execPath, [RENDERER, root, ...args], { cwd: ROOT, encoding: "utf8" });
}
function temporary(runTest: (root: string) => void): void {
  const root = mkdtempSync(join(tmpdir(), "discovery-test-"));
  try {
    runTest(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

test("renders hybrid pages, manifest, anchors, context, and escaped HTML", () =>
  temporary((root) => {
    workspace(root);
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
    const names = new Set(readdirSync(join(root, "presentation")));
    assert.deepEqual(
      names,
      new Set([
        "index.html",
        "evidence.html",
        "hypotheses.html",
        "decisions.html",
        "experiment.html",
        "sources.html",
        "review.html",
        "artifact.css",
        "artifact.js",
        "manifest.json",
      ]),
    );
    const index = readFileSync(join(root, "presentation/index.html"), "utf8");
    for (const text of [
      "Choose the next experiment",
      "Test a plain-language status response",
      'href="experiment.html"',
      "Review proposed experiment",
      "problem-001",
      "Support asks engineering whether a fix is live.",
      "Frequency is not established",
      "1 open comment",
      "Build &lt;all&gt; the dashboards",
    ])
      assert.match(index, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
    assert.doesNotMatch(index, /Build <all> the dashboards/);
    const review = readFileSync(join(root, "presentation/review.html"), "utf8");
    for (const text of [
      'data-record-id="problem-001"',
      'data-field="difficulty"',
      "Narrow this to cases where CI and runtime disagree.",
      "corwinm/example/pull/12",
      "comment-001",
    ])
      assert.ok(review.includes(text));
    const manifest = JSON.parse(readFileSync(join(root, "presentation/manifest.json"), "utf8"));
    assert.equal(manifest.workspace_id, "deployment-visibility");
    assert.equal(manifest.renderer_version, "0.2.0");
    assert.match(manifest.source_digest, /^sha256:[0-9a-f]{64}$/);
    const sources = readFileSync(join(root, "presentation/sources.html"), "utf8");
    for (const text of [
      "Remote workflow interview",
      "Where does remote context break down?",
      "Guide withheld from static export.",
      "Transcript withheld by consent or privacy policy.",
      'data-record-id="meeting-001"',
    ])
      assert.ok(sources.includes(text), text);
  }));
test("meeting bundles validate transcript locators and ingestion evidence links", () =>
  temporary((root) => {
    workspace(root);
    const evidencePath = join(root, "records/evidence.json");
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    evidence[1].source_locator.segment_id = "seg-missing";
    writeJson(evidencePath, evidence);
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /seg-missing/);
  }));
test("meeting evidence locator path must match the configured transcript", () =>
  temporary((root) => {
    workspace(root);
    const evidencePath = join(root, "records/evidence.json");
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    evidence[1].source_locator.path = "sources/other/transcript.md";
    writeJson(evidencePath, evidence);
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /other\/transcript/);
  }));
test("meeting bundles reject direct quotes when quotation consent is absent", () =>
  temporary((root) => {
    workspace(root);
    const manifestPath = join(root, "sources/meeting-001/meeting.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.participants[0].consent.direct_quote_use = "not-granted";
    writeJson(manifestPath, manifest);
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /direct.quote/i);
  }));
test("transcript speakers must be declared meeting participants", () =>
  temporary((root) => {
    workspace(root);
    const transcriptPath = join(root, "sources/meeting-001/transcript.md");
    writeFileSync(
      transcriptPath,
      readFileSync(transcriptPath, "utf8") +
        "\n## seg-undeclared | 00:10:00–00:10:10 | Participant 9\n\nUndeclared speaker.\n",
    );
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /speaker Participant 9 is not a declared participant/);
  }));
test("static export withholds meeting-derived evidence without participant sharing consent", () =>
  temporary((root) => {
    workspace(root);
    const manifestPath = join(root, "sources/meeting-001/meeting.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.participants[0].consent.external_sharing = "not-granted";
    writeJson(manifestPath, manifest);
    const hypothesesPath = join(root, "records/hypotheses.json");
    const canonicalHypotheses = JSON.parse(readFileSync(hypothesesPath, "utf8"));
    canonicalHypotheses[0].supporting_evidence_ids.push("evidence-002");
    writeJson(hypothesesPath, canonicalHypotheses);
    const result = run(root);
    assert.equal(result.status, 0, result.stderr);
    const evidence = readFileSync(join(root, "presentation/evidence.html"), "utf8");
    const overview = readFileSync(join(root, "presentation/index.html"), "utf8");
    const hypotheses = readFileSync(join(root, "presentation/hypotheses.html"), "utf8");
    const decisions = readFileSync(join(root, "presentation/decisions.html"), "utf8");
    assert.doesNotMatch(evidence, /Remote context was difficult to recover/);
    assert.doesNotMatch(overview, /Remote context was difficult to recover/);
    assert.doesNotMatch(hypotheses, /Deployment state requires interpretation/);
    assert.doesNotMatch(decisions, /Run a reversible experiment/);
    assert.match(overview, /Withheld from static export/);
  }));
test("meeting evidence speaker must match the transcript segment speaker", () =>
  temporary((root) => {
    workspace(root);
    const manifestPath = join(root, "sources/meeting-001/meeting.json");
    const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    manifest.participants.push({
      participant_id: "participant-002",
      pseudonym: "P2",
      role: "Developer",
      consent: {
        discovery_use: "granted",
        direct_quote_use: "granted-with-anonymization",
        external_sharing: "granted-with-anonymization",
      },
    });
    writeJson(manifestPath, manifest);
    const evidencePath = join(root, "records/evidence.json");
    const evidence = JSON.parse(readFileSync(evidencePath, "utf8"));
    evidence[1].source_locator.speaker = "P2";
    writeJson(evidencePath, evidence);
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /speaker does not match transcript segment/);
  }));
test("symlinked sources roots are rejected", () =>
  temporary((root) => {
    workspace(root);
    const external = mkdtempSync(join(tmpdir(), "external-sources-"));
    try {
      rmSync(join(root, "sources"), { recursive: true });
      symlinkSync(external, join(root, "sources"), "dir");
      const result = run(root);
      assert.notEqual(result.status, 0);
      assert.match(result.stderr, /sources directory must not be a symbolic link/);
    } finally {
      rmSync(external, { recursive: true, force: true });
    }
  }));
test("render is deterministic and check detects stale output", () =>
  temporary((root) => {
    workspace(root);
    assert.equal(run(root).status, 0);
    const before = Object.fromEntries(
      readdirSync(join(root, "presentation")).map((name) => [
        name,
        readFileSync(join(root, "presentation", name)),
      ]),
    );
    assert.equal(run(root).status, 0);
    for (const [name, content] of Object.entries(before))
      assert.deepEqual(readFileSync(join(root, "presentation", name)), content);
    assert.equal(run(root, "--check").status, 0);
    const discovery = JSON.parse(readFileSync(join(root, "discovery.json"), "utf8"));
    discovery.recommendation = "Changed without rendering";
    writeJson(join(root, "discovery.json"), discovery);
    const stale = run(root, "--check");
    assert.notEqual(stale.status, 0);
    assert.match(stale.stderr, /stale/i);
  }));
test("check recursively detects changed and unexpected entries", () =>
  temporary((root) => {
    workspace(root);
    assert.equal(run(root).status, 0);
    writeFileSync(join(root, "presentation/index.html"), "tampered");
    assert.match(run(root, "--check").stderr, /changed/i);
    assert.equal(run(root).status, 0);
    writeFileSync(join(root, "presentation/obsolete.html"), "old");
    assert.match(run(root, "--check").stderr, /unexpected/i);
    assert.equal(run(root).status, 0);
    mkdirSync(join(root, "presentation/unexpected"));
    writeFileSync(join(root, "presentation/unexpected/file.txt"), "unverified");
    assert.match(run(root, "--check").stderr, /unexpected/i);
  }));
test("failed directory swap restores original and preserves unrelated backup", () =>
  temporary((root) => {
    mkdirSync(join(root, "presentation"));
    writeFileSync(join(root, "presentation/index.html"), "original");
    mkdirSync(join(root, ".presentation-backup"));
    writeFileSync(join(root, ".presentation-backup/user-data.txt"), "preserve");
    let calls = 0;
    const rename = (from: string, to: string) => {
      calls++;
      if (calls === 2) throw new Error("simulated install failure");
      renameSync(from, to);
    };
    assert.throws(
      () =>
        replacePresentation(root, new Map([["index.html", Buffer.from("replacement")]]), rename),
      /simulated/,
    );
    assert.equal(readFileSync(join(root, "presentation/index.html"), "utf8"), "original");
    assert.equal(
      readFileSync(join(root, ".presentation-backup/user-data.txt"), "utf8"),
      "preserve",
    );
  }));
test("invalid input fails without replacing presentation", () =>
  temporary((root) => {
    workspace(root);
    mkdirSync(join(root, "presentation"));
    writeFileSync(join(root, "presentation/keep.txt"), "keep");
    const evidence = JSON.parse(readFileSync(join(root, "records/evidence.json"), "utf8"));
    delete evidence[0].id;
    writeJson(join(root, "records/evidence.json"), evidence);
    const result = run(root);
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, /id/i);
    assert.equal(readFileSync(join(root, "presentation/keep.txt"), "utf8"), "keep");
  }));
test("invalid authority and unknown comment field are rejected", () =>
  temporary((root) => {
    workspace(root);
    const discovery = JSON.parse(readFileSync(join(root, "discovery.json"), "utf8"));
    discovery.review.authority = "whatever";
    writeJson(join(root, "discovery.json"), discovery);
    assert.match(run(root).stderr, /authority/i);
    discovery.review.authority = "risk-based";
    writeJson(join(root, "discovery.json"), discovery);
    const path = join(root, "comments/comment-001.json");
    const comment = JSON.parse(readFileSync(path, "utf8"));
    comment.target.field = "not-a-field";
    writeJson(path, comment);
    assert.match(run(root).stderr, /not-a-field/);
  }));
test("workspace CLI initializes, exports, and validates a new workspace", () =>
  temporary((root) => {
    const target = join(root, "customer-onboarding");
    const initialized = spawnSync(process.execPath, [BUNDLED_WORKSPACE_CLI, "init", target], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.equal(initialized.status, 0, initialized.stderr);
    assert.ok(readFileSync(join(target, "discovery.json"), "utf8").includes("customer-onboarding"));
    assert.equal(
      spawnSync(process.execPath, [BUNDLED_WORKSPACE_CLI, "export", target], {
        cwd: ROOT,
        encoding: "utf8",
      }).status,
      0,
    );
    assert.ok(
      readFileSync(join(target, "presentation/index.html"), "utf8").includes("Customer onboarding"),
    );
    const discovery = JSON.parse(readFileSync(join(target, "discovery.json"), "utf8"));
    discovery.recommendation = "Changed after the optional export";
    writeJson(join(target, "discovery.json"), discovery);
    assert.equal(
      spawnSync(process.execPath, [BUNDLED_WORKSPACE_CLI, "check", target], {
        cwd: ROOT,
        encoding: "utf8",
      }).status,
      0,
      "check validates canonical data without requiring a fresh static export",
    );
    const hypothesesPath = join(target, "records/hypotheses.json");
    writeJson(hypothesesPath, [
      {
        id: "problem-001",
        supporting_evidence_ids: ["missing-evidence"],
        contradicting_evidence_ids: [],
        unknowns: [],
      },
    ]);
    const dangling = spawnSync(process.execPath, [BUNDLED_WORKSPACE_CLI, "check", target], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.notEqual(dangling.status, 0);
    assert.match(dangling.stderr, /missing-evidence/);
    const removedRender = spawnSync(process.execPath, [BUNDLED_WORKSPACE_CLI, "render", target], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.notEqual(removedRender.status, 0);
  }));

test("bundled renderer remains a self-contained TypeScript entrypoint", () =>
  temporary((root) => {
    workspace(root);
    const result = spawnSync(process.execPath, [BUNDLED_RENDERER, root], {
      cwd: ROOT,
      encoding: "utf8",
    });
    assert.equal(result.status, 0, result.stderr);
    assert.ok(readFileSync(join(root, "presentation/artifact.css"), "utf8").includes(":root"));
  }));
