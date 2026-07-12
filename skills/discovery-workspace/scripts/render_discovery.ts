#!/usr/bin/env node
/** Render a portable discovery workspace into deterministic committed HTML. */
import { createHash, randomUUID } from "node:crypto";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  realpathSync,
  renameSync,
  rmSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

export const VERSION = "0.2.0";
const SOURCE_FILES = [
  "discovery.json",
  "records/evidence.json",
  "records/hypotheses.json",
  "records/decisions.json",
  "records/experiments.json",
  "history/revisions.json",
];
const PAGES = [
  "index.html",
  "evidence.html",
  "hypotheses.html",
  "decisions.html",
  "experiment.html",
  "sources.html",
  "review.html",
];
type RecordValue = Record<string, unknown>;
type Workspace = Record<string, any>;
type Rename = (oldPath: string, newPath: string) => void;

export class WorkspaceError extends Error {
  override name = "WorkspaceError";
}

function posix(path: string): string {
  return path.split(sep).join("/");
}
function readJson(path: string, fallback?: unknown): unknown {
  if (!existsSync(path) && arguments.length > 1) return fallback;
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT")
      throw new WorkspaceError(`Required file not found: ${path}`);
    throw new WorkspaceError(`Invalid JSON in ${path}: ${(error as Error).message}`);
  }
}
function mapping(value: unknown, label: string): RecordValue {
  if (typeof value !== "object" || value === null || Array.isArray(value))
    throw new WorkspaceError(`${label} must be a JSON object`);
  return value as RecordValue;
}
function records(value: unknown, label: string): RecordValue[] {
  if (!Array.isArray(value)) throw new WorkspaceError(`${label} must be a JSON array`);
  return value.map((item, index) => {
    const record = mapping(item, `${label}[${index}]`);
    if (typeof record.id !== "string" || !record.id.trim())
      throw new WorkspaceError(`${label}[${index}] requires a non-empty id`);
    return record;
  });
}
function stringList(record: RecordValue, field: string, label: string): string[] {
  const value = record[field] ?? [];
  if (!Array.isArray(value) || !value.every((item) => typeof item === "string"))
    throw new WorkspaceError(`${label}.${field} must be an array of strings`);
  return value;
}
function filesRecursively(root: string): string[] {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true }).flatMap((entry) => {
    const path = join(root, entry.name);
    if (entry.isSymbolicLink())
      throw new WorkspaceError(`Symbolic links are not allowed in discovery sources: ${path}`);
    return entry.isDirectory() ? [path, ...filesRecursively(path)] : [path];
  });
}
export function loadWorkspace(root: string): Workspace {
  const discovery = mapping(readJson(join(root, "discovery.json")), "discovery.json");
  for (const field of ["id", "title", "updated_at", "request"])
    if (!(field in discovery)) throw new WorkspaceError(`discovery.json requires ${field}`);
  const request = mapping(discovery.request, "discovery.request");
  if (!request.id) throw new WorkspaceError("discovery.request requires id");
  const review = mapping(discovery.review ?? {}, "discovery.review");
  const authority = review.authority ?? "risk-based";
  if (!["automatic", "proposal-only", "risk-based"].includes(String(authority)))
    throw new WorkspaceError(`Unknown review authority: ${authority}`);
  const evidence = records(
    readJson(join(root, "records/evidence.json"), []),
    "records/evidence.json",
  );
  const hypotheses = records(
    readJson(join(root, "records/hypotheses.json"), []),
    "records/hypotheses.json",
  );
  const decisions = records(
    readJson(join(root, "records/decisions.json"), []),
    "records/decisions.json",
  );
  const experiments = records(
    readJson(join(root, "records/experiments.json"), []),
    "records/experiments.json",
  );
  const revisions = records(
    readJson(join(root, "history/revisions.json"), []),
    "history/revisions.json",
  );
  const sourcesRoot = join(root, "sources");
  if (existsSync(sourcesRoot) && lstatSync(sourcesRoot).isSymbolicLink())
    throw new WorkspaceError("The sources directory must not be a symbolic link");
  const meetings = existsSync(sourcesRoot)
    ? readdirSync(sourcesRoot, { withFileTypes: true })
        .filter(
          (entry) =>
            entry.isDirectory() && existsSync(join(sourcesRoot, entry.name, "meeting.json")),
        )
        .sort((left, right) => left.name.localeCompare(right.name))
        .map((entry) => {
          const bundle = join(sourcesRoot, entry.name);
          const meeting = mapping(
            readJson(join(bundle, "meeting.json")),
            `sources/${entry.name}/meeting.json`,
          );
          for (const field of [
            "id",
            "kind",
            "status",
            "title",
            "learning_questions",
            "participants",
            "consent",
            "privacy",
            "artifacts",
            "ingestion",
          ])
            if (!(field in meeting))
              throw new WorkspaceError(`${meeting.id ?? entry.name} requires ${field}`);
          const artifacts = mapping(meeting.artifacts, `${meeting.id}.artifacts`);
          const readArtifact = (field: string): string => {
            const value = artifacts[field];
            if (!value) return "";
            const path = resolve(bundle, String(value));
            if (!path.startsWith(bundle + sep))
              throw new WorkspaceError(
                `${meeting.id}.artifacts.${field} must stay inside its meeting bundle`,
              );
            if (!existsSync(path))
              throw new WorkspaceError(`${meeting.id}.artifacts.${field} not found: ${value}`);
            if (
              lstatSync(path).isSymbolicLink() ||
              !realpathSync(path).startsWith(realpathSync(bundle) + sep)
            )
              throw new WorkspaceError(
                `${meeting.id}.artifacts.${field} must not use symbolic links`,
              );
            return readFileSync(path, "utf8");
          };
          const guide = readArtifact("guide");
          const transcript = readArtifact("transcript");
          const segmentIds = [...transcript.matchAll(/^##\s+(seg-[A-Za-z0-9_-]+)/gm)].map(
            (match) => match[1]!,
          );
          const segmentSpeakers = Object.fromEntries(
            [
              ...transcript.matchAll(/^##\s+(seg-[A-Za-z0-9_-]+)\s*\|\s*[^|\n]+\|\s*(.+?)\s*$/gm),
            ].map((match) => [match[1]!, match[2]!]),
          );
          if (new Set(segmentIds).size !== segmentIds.length)
            throw new WorkspaceError(`${meeting.id} has duplicate transcript segment ids`);
          const consent = mapping(meeting.consent, `${meeting.id}.consent`);
          const consentStates = new Set([
            "granted",
            "granted-with-anonymization",
            "not-granted",
            "withdrawn",
            "unknown",
            "not-applicable",
          ]);
          for (const [field, value] of Object.entries(consent))
            if (!consentStates.has(String(value)))
              throw new WorkspaceError(`${meeting.id}.consent.${field} has unknown state ${value}`);
          if (!Array.isArray(meeting.participants))
            throw new WorkspaceError(`${meeting.id}.participants must be an array`);
          const participants = meeting.participants.map((value, index) =>
            mapping(value, `${meeting.id}.participants[${index}]`),
          );
          const participantPseudonyms = new Set<string>();
          for (const participant of participants) {
            if (typeof participant.pseudonym !== "string" || !participant.pseudonym.trim())
              throw new WorkspaceError(`${meeting.id} participant requires a pseudonym`);
            participantPseudonyms.add(participant.pseudonym);
            if (String(participant.role).toLowerCase() === "facilitator") continue;
            const participantConsent = mapping(
              participant.consent,
              `${meeting.id}.${participant.pseudonym}.consent`,
            );
            for (const field of ["discovery_use", "direct_quote_use", "external_sharing"])
              if (!consentStates.has(String(participantConsent[field])))
                throw new WorkspaceError(
                  `${meeting.id}.${participant.pseudonym}.consent.${field} has unknown state`,
                );
          }
          for (const speaker of Object.values(segmentSpeakers))
            if (!participantPseudonyms.has(speaker))
              throw new WorkspaceError(
                `${meeting.id} transcript speaker ${speaker} is not a declared participant`,
              );
          return {
            ...meeting,
            bundle: `sources/${entry.name}`,
            guide,
            transcript,
            transcriptPath: artifacts.transcript
              ? posix(relative(root, resolve(bundle, String(artifacts.transcript))))
              : null,
            segmentIds,
            segmentSpeakers,
          } as RecordValue;
        })
    : [];
  for (const record of evidence) stringList(record, "limitations", String(record.id));
  for (const record of hypotheses)
    for (const field of ["supporting_evidence_ids", "contradicting_evidence_ids", "unknowns"])
      stringList(record, field, String(record.id));
  for (const record of decisions)
    for (const field of ["alternatives", "unresolved_dissent"])
      stringList(record, field, String(record.id));
  for (const record of experiments) stringList(record, "signals", String(record.id));
  const commentsDir = join(root, "comments");
  const comments = existsSync(commentsDir)
    ? readdirSync(commentsDir)
        .filter((name) => name.endsWith(".json"))
        .sort()
        .map((name) => {
          const comment = mapping(
            readJson(join(commentsDir, name)),
            posix(relative(root, join(commentsDir, name))),
          );
          if (!comment.id)
            throw new WorkspaceError(
              `${posix(relative(root, join(commentsDir, name)))} requires id`,
            );
          const target = mapping(comment.target, `${name}.target`);
          if (!target.record_id || !target.field)
            throw new WorkspaceError(
              `${posix(relative(root, join(commentsDir, name)))} target requires record_id and field`,
            );
          return comment;
        })
    : [];
  const collections = [evidence, hypotheses, decisions, experiments, meetings, revisions];
  const ids = [String(request.id), ...collections.flat().map((record) => String(record.id))];
  const duplicates = [...new Set(ids.filter((id, index) => ids.indexOf(id) !== index))].sort();
  if (duplicates.length) throw new WorkspaceError(`Duplicate record ids: ${duplicates.join(", ")}`);
  const recordsById = Object.fromEntries(
    [request, evidence, hypotheses, decisions, experiments, meetings]
      .flat(2)
      .map((record: RecordValue) => [String(record.id), record]),
  );
  for (const comment of comments) {
    const target = comment.target as RecordValue;
    const record = recordsById[String(target.record_id)];
    if (!record)
      throw new WorkspaceError(`Comment ${comment.id} targets unknown record ${target.record_id}`);
    if (!(String(target.field) in record))
      throw new WorkspaceError(
        `Comment ${comment.id} targets unknown field ${target.field} on ${target.record_id}`,
      );
  }
  const commentIds = comments.map((comment) => String(comment.id));
  const duplicateComments = [
    ...new Set(commentIds.filter((id, index) => commentIds.indexOf(id) !== index)),
  ].sort();
  if (duplicateComments.length)
    throw new WorkspaceError(`Duplicate comment ids: ${duplicateComments.join(", ")}`);
  const evidenceIds = new Set(evidence.map((record) => String(record.id)));
  const meetingsById = Object.fromEntries(meetings.map((meeting) => [String(meeting.id), meeting]));
  for (const item of evidence) {
    const meeting = meetingsById[String(item.source_id ?? "")];
    if (!meeting) continue;
    const consent = meeting.consent as RecordValue;
    if (!["granted", "granted-with-anonymization"].includes(String(consent.transcription)))
      throw new WorkspaceError(`${item.id} cannot use a transcript without transcription consent`);
    const locator = mapping(item.source_locator, `${item.id}.source_locator`);
    const participant = (meeting.participants as RecordValue[]).find(
      (value) => value.pseudonym === locator.speaker,
    );
    if (!participant)
      throw new WorkspaceError(`${item.id}.source_locator.speaker is not a meeting participant`);
    const participantConsent = mapping(
      participant.consent,
      `${meeting.id}.${participant.pseudonym}.consent`,
    );
    if (
      !["granted", "granted-with-anonymization"].includes(String(participantConsent.discovery_use))
    )
      throw new WorkspaceError(`${item.id} cannot be used without participant discovery consent`);
    if (
      item.type === "direct-quote" &&
      !["granted", "granted-with-anonymization"].includes(
        String(participantConsent.direct_quote_use),
      )
    )
      throw new WorkspaceError(
        `${item.id} is a direct quote but ${participant.pseudonym} direct_quote_use is ${participantConsent.direct_quote_use}`,
      );
    const locatorPath = posix(String(locator.path ?? ""));
    if (locatorPath !== meeting.transcriptPath)
      throw new WorkspaceError(
        `${item.id}.source_locator.path ${locatorPath} does not match ${meeting.transcriptPath}`,
      );
    const segmentId = String(locator.segment_id ?? "");
    if (!(meeting.segmentIds as string[]).includes(segmentId))
      throw new WorkspaceError(`${item.id}.source_locator references unknown segment ${segmentId}`);
    if ((meeting.segmentSpeakers as Record<string, string>)[segmentId] !== locator.speaker)
      throw new WorkspaceError(
        `${item.id}.source_locator.speaker does not match transcript segment ${segmentId}`,
      );
  }
  for (const meeting of meetings) {
    const ingestion = mapping(meeting.ingestion, `${meeting.id}.ingestion`);
    for (const id of stringList(ingestion, "evidence_ids", String(meeting.id))) {
      const item = evidence.find((record) => record.id === id);
      if (!item || item.source_id !== meeting.id)
        throw new WorkspaceError(`${meeting.id}.ingestion.evidence_ids has invalid evidence ${id}`);
    }
  }
  for (const hypothesis of hypotheses)
    for (const field of ["supporting_evidence_ids", "contradicting_evidence_ids"])
      for (const id of stringList(hypothesis, field, String(hypothesis.id)))
        if (!evidenceIds.has(id))
          throw new WorkspaceError(`${hypothesis.id}.${field} references unknown evidence ${id}`);
  const hypothesisIds = new Set(hypotheses.map((record) => String(record.id)));
  for (const experiment of experiments) {
    const hypothesisId = experiment.problem_hypothesis_id;
    if (hypothesisId && !hypothesisIds.has(String(hypothesisId)))
      throw new WorkspaceError(
        `${experiment.id}.problem_hypothesis_id references unknown hypothesis ${hypothesisId}`,
      );
  }
  const canonicalIds = new Set(Object.keys(recordsById));
  for (const revision of revisions) {
    for (const id of stringList(revision, "changed_records", String(revision.id)))
      if (!canonicalIds.has(id))
        throw new WorkspaceError(`${revision.id}.changed_records references unknown record ${id}`);
    stringList(revision, "triggered_by", String(revision.id));
  }
  return {
    discovery,
    request,
    evidence,
    hypotheses,
    decisions,
    experiments,
    meetings,
    comments,
    revisions,
    recordsById,
  };
}
function sourcePaths(root: string): string[] {
  const paths = SOURCE_FILES.map((name) => join(root, name)).filter(existsSync);
  const comments = join(root, "comments");
  if (existsSync(comments))
    paths.push(
      ...readdirSync(comments)
        .filter((name) => name.endsWith(".json"))
        .map((name) => join(comments, name)),
    );
  const sources = join(root, "sources");
  if (existsSync(sources))
    paths.push(...filesRecursively(sources).filter((path) => statSync(path).isFile()));
  return paths.sort((a, b) => {
    const left = posix(relative(root, a));
    const right = posix(relative(root, b));
    return left < right ? -1 : left > right ? 1 : 0;
  });
}
export function sourceDigest(root: string): string {
  const hash = createHash("sha256");
  for (const path of sourcePaths(root)) {
    const name = Buffer.from(posix(relative(root, path)));
    const content = readFileSync(path);
    const length = Buffer.alloc(8);
    length.writeBigUInt64BE(BigInt(name.length));
    hash.update(length);
    hash.update(name);
    length.writeBigUInt64BE(BigInt(content.length));
    hash.update(length);
    hash.update(content);
  }
  return `sha256:${hash.digest("hex")}`;
}
function e(value: unknown): string {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#x27;");
}
function listItems(values: unknown, empty = "None recorded"): string {
  return !Array.isArray(values) || !values.length
    ? `<p class="empty">${e(empty)}</p>`
    : `<ul>${values.map((value) => `<li>${e(value)}</li>`).join("")}</ul>`;
}
function attrs(id: unknown, field?: string): string {
  return `data-record-id="${e(id)}"${field ? ` data-field="${e(field)}"` : ""}`;
}
function field(label: string, value: unknown, id: unknown, name: string): string {
  return `<div class="field" ${attrs(id, name)}><span class="field-label">${e(label)}</span><p>${e(value) || "<span class=empty>Not recorded</span>"}</p></div>`;
}
function nav(active: string): string {
  return `<nav aria-label="Artifact views">${[
    ["Overview", "index.html"],
    ["Evidence", "evidence.html"],
    ["Hypotheses", "hypotheses.html"],
    ["Decisions", "decisions.html"],
    ["Experiment", "experiment.html"],
    ["Meetings", "sources.html"],
    ["Review", "review.html"],
  ]
    .map(
      ([label, href]) =>
        `<a href="${href}"${href === active ? " aria-current=page" : ""}>${label}</a>`,
    )
    .join("")}</nav>`;
}
function page(title: string, active: string, w: Workspace, body: string): string {
  const d = w.discovery;
  const count = w.comments.filter((c: RecordValue) => c.status === "open").length;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="agent-skills discovery renderer ${VERSION}">
  <title>${e(title)} · ${e(d.title)}</title>
  <link rel="stylesheet" href="artifact.css">
  <script src="artifact.js" defer></script>
</head>
<body data-workspace-id="${e(d.id)}" data-page="${e(active)}">
  <!-- Generated from discovery records. Do not edit directly. -->
  <header class="app-header">
    <div>
      <a class="eyebrow" href="index.html">Discovery artifact</a>
      <h1>${e(d.title)}</h1>
    </div>
    <div class="header-meta">
      <span class="status">${e(d.stage ?? "Unstaged")}</span>
      <a class="comment-count" href="review.html">${count} open comment${count === 1 ? "" : "s"}</a>
    </div>
  </header>
  ${nav(active)}
  <main><button class="page-comment review-trigger" type="button" data-page-target="${e(active)}" aria-label="Comment on this page">✎ <span>Comment on page</span></button>${body}</main>
  <dialog id="review-drawer" aria-labelledby="review-title"><form method="dialog" class="drawer-close"><button aria-label="Close comments">×</button></form><h2 id="review-title">Review thread</h2><p id="review-target"></p><form id="review-form"><label for="review-body">Comment</label><textarea id="review-body" name="body" required></textarea><button type="submit">Add comment</button></form><div id="review-threads" aria-live="polite"></div></dialog>
  <footer>Updated ${e(d.updated_at)} · Workspace ${e(d.id)}</footer>
</body>
</html>
`;
}
function renderIndex(w: Workspace): string {
  const d = w.discovery,
    r = w.request,
    hs = w.hypotheses;
  const leading = hs.find((x: RecordValue) => x.status === "leading") ?? hs[0];
  const hypothesis = leading
    ? `
        <article class="hypothesis" ${attrs(leading.id)}>
          <span class="record-id">${e(leading.id)}</span>
          <h3>${e(leading.affected_group ?? "Problem hypothesis")}</h3>
          ${field("Situation", leading.situation, leading.id, "situation")}
          ${field("Difficulty", leading.difficulty, leading.id, "difficulty")}
          ${field("Consequence", leading.consequence, leading.id, "consequence")}
          <a class="text-link" href="hypotheses.html#${e(leading.id)}">Inspect hypothesis →</a>
        </article>`
    : '<p class="empty">No problem hypothesis recorded.</p>';
  const evidence =
    w.evidence
      .slice(0, 2)
      .map(
        (x: RecordValue) => `<article class="evidence-summary" ${attrs(x.id)}>
          <span class="record-id">${e(x.id)}</span>
          <p ${attrs(x.id, "statement")}>${e(x.statement ?? "")}</p>
          <div><strong>Limitations</strong>${listItems(x.limitations, "No limitations recorded")}</div>
        </article>`,
      )
      .join("") || '<p class="empty">No evidence recorded.</p>';
  return page(
    "Overview",
    "index.html",
    w,
    `
    <section class="decision-banner">
      <span class="eyebrow">Decision needed</span>
      <h2>${e(d.decision_needed ?? "No decision recorded")}</h2>
      <p>${e(d.recommendation ?? "No recommendation recorded")}</p>
      <a class="decision-action" href="experiment.html">Review proposed experiment →</a>
    </section>
    <div class="overview-grid">
      <section class="panel" ${attrs(r.id)}>
        <span class="eyebrow">Original request</span>
        <blockquote ${attrs(r.id, "verbatim")}>${e(r.verbatim ?? "")}</blockquote>
        <dl>
          <div><dt>Requester</dt><dd>${e(r.requester ?? "Unknown")}</dd></div>
          <div><dt>Proposed solution</dt><dd>${e(r.proposed_solution ?? "Not recorded")}</dd></div>
        </dl>
      </section>
      <section class="panel">
        <span class="eyebrow">Current problem frame</span>
        ${hypothesis}
      </section>
    </div>
    <section class="panel key-evidence">
      <div class="section-heading"><div><span class="eyebrow">Key evidence</span><h2>What currently supports the frame</h2></div><a class="text-link" href="evidence.html">Inspect all evidence →</a></div>
      <div class="evidence-summary-grid">${evidence}</div>
    </section>
    <section class="metrics" aria-label="Artifact contents">
      <a href="evidence.html"><strong>${w.evidence.length}</strong><span>Evidence records</span></a>
      <a href="hypotheses.html"><strong>${hs.length}</strong><span>Problem hypotheses</span></a>
      <a href="decisions.html"><strong>${w.decisions.length}</strong><span>Decisions</span></a>
      <a href="review.html"><strong>${w.comments.filter((c: RecordValue) => c.status === "open").length}</strong><span>Open comments</span></a>
    </section>
    `,
  );
}
function renderEvidence(w: Workspace): string {
  const cards = w.evidence
    .map(
      (r: RecordValue) => `
        <article class="record" id="${e(r.id)}" ${attrs(r.id)}>
          <div class="record-heading"><span class="record-id">${e(r.id)}</span><span class="tag">${e(r.type ?? "evidence")}</span></div>
          <h2 ${attrs(r.id, "statement")}>${e(r.statement ?? "")}</h2>
          <dl><div><dt>Source</dt><dd>${e(r.source_id ?? "Unknown")}</dd></div></dl>
          <h3>Limitations</h3>${listItems(r.limitations, "No limitations recorded")}
        </article>`,
    )
    .join("");
  return page(
    "Evidence",
    "evidence.html",
    w,
    '<header class="page-intro"><span class="eyebrow">Inspect</span><h2>Evidence</h2><p>Source-linked observations and statements. Limitations remain visible.</p></header>' +
      (cards || '<p class="empty">No evidence recorded.</p>'),
  );
}
function renderHypotheses(w: Workspace): string {
  const cards = w.hypotheses
    .map(
      (r: RecordValue) => `
        <article class="record hypothesis-detail" id="${e(r.id)}" ${attrs(r.id)}>
          <div class="record-heading"><span class="record-id">${e(r.id)}</span><span class="tag">${e(r.status ?? "candidate")}</span></div>
          <h2>${e(r.affected_group ?? "Problem hypothesis")}</h2>
          ${field("Situation", r.situation, r.id, "situation")}
          ${field("Goal", r.goal, r.id, "goal")}
          ${field("Difficulty", r.difficulty, r.id, "difficulty")}
          ${field("Consequence", r.consequence, r.id, "consequence")}
          <div class="evidence-columns">
            <div><h3>Supporting evidence</h3>${listItems(r.supporting_evidence_ids)}</div>
            <div><h3>Contradicting evidence</h3>${listItems(r.contradicting_evidence_ids)}</div>
          </div>
          <h3>Unknowns</h3>${listItems(r.unknowns)}
        </article>`,
    )
    .join("");
  return page(
    "Hypotheses",
    "hypotheses.html",
    w,
    '<header class="page-intro"><span class="eyebrow">Compare</span><h2>Problem hypotheses</h2><p>Competing frames retain support, contradiction, and uncertainty.</p></header><div class="record-grid">' +
      (cards || '<p class="empty">No hypotheses recorded.</p>') +
      "</div>",
  );
}
function renderDecisions(w: Workspace): string {
  const cards = w.decisions
    .map(
      (r: RecordValue) => `
        <article class="record" id="${e(r.id)}" ${attrs(r.id)}>
          <span class="record-id">${e(r.id)}</span>
          <h2 ${attrs(r.id, "decision")}>${e(r.decision ?? "")}</h2>
          ${field("Owner", r.owner, r.id, "owner")}
          ${field("Rationale", r.rationale, r.id, "rationale")}
          <h3>Alternatives considered</h3>${listItems(r.alternatives)}
          <h3>Unresolved dissent</h3>${listItems(r.unresolved_dissent)}
        </article>`,
    )
    .join("");
  const revisions = [...w.revisions]
    .reverse()
    .map(
      (r: RecordValue) =>
        `<li><span>${e(r.created_at ?? "")}</span><strong>${e(r.summary ?? "")}</strong><code>${e(r.id)}</code></li>`,
    )
    .join("");
  return page(
    "Decisions",
    "decisions.html",
    w,
    '<header class="page-intro"><span class="eyebrow">Audit</span><h2>Decisions and revisions</h2><p>Choices, rationale, dissent, and changes remain reviewable.</p></header>' +
      (cards || '<p class="empty">No decisions recorded.</p>') +
      `<section class="panel revision-panel"><h2>Revision history</h2><ol class="timeline">${revisions || "<li>No revisions recorded.</li>"}</ol></section>`,
  );
}
function renderExperiment(w: Workspace): string {
  const cards = w.experiments
    .map(
      (r: RecordValue) => `
        <article class="record" id="${e(r.id)}" ${attrs(r.id)}>
          <span class="record-id">${e(r.id)}</span>
          <h2>${e(r.intervention ?? "Experiment")}</h2>
          ${field("Critical assumption", r.critical_assumption, r.id, "critical_assumption")}
          <h3>Signals</h3>${listItems(r.signals)}
          ${field("Decision rule", r.decision_rule, r.id, "decision_rule")}
          <p class="linked-record">Tests <a href="hypotheses.html#${e(r.problem_hypothesis_id ?? "")}">${e(r.problem_hypothesis_id ?? "Unknown hypothesis")}</a></p>
        </article>`,
    )
    .join("");
  return page(
    "Experiment",
    "experiment.html",
    w,
    '<header class="page-intro"><span class="eyebrow">Act and learn</span><h2>Experiment or increment</h2><p>The next action is tied to an assumption and a decision rule.</p></header>' +
      (cards || '<p class="empty">No experiment recorded.</p>'),
  );
}
function renderSources(w: Workspace, includePrivate: boolean): string {
  const cards = w.meetings
    .map((meeting: RecordValue) => {
      const questions = Array.isArray(meeting.learning_questions)
        ? meeting.learning_questions
            .map((value) => {
              const question = value as RecordValue;
              return `<li><code>${e(question.id)}</code> ${e(question.question)}</li>`;
            })
            .join("")
        : "";
      const ingestion = (meeting.ingestion ?? {}) as RecordValue;
      const consent = (meeting.consent ?? {}) as RecordValue;
      const participantsPermitDiscovery = (meeting.participants as RecordValue[])
        .filter((participant) => String(participant.role).toLowerCase() !== "facilitator")
        .every((participant) =>
          ["granted", "granted-with-anonymization"].includes(
            String((participant.consent as RecordValue).discovery_use),
          ),
        );
      const mayShowTranscript =
        includePrivate &&
        meeting.status !== "withdrawn" &&
        (meeting.privacy as RecordValue)?.transcript_redacted === true &&
        ["granted", "granted-with-anonymization"].includes(String(consent.transcription)) &&
        participantsPermitDiscovery;
      return `<article class="record meeting" id="${e(meeting.id)}" ${attrs(meeting.id)}>
        <div class="record-heading"><span class="record-id">${e(meeting.id)}</span><span class="tag">${e(meeting.status)}</span></div>
        <h2>${e(meeting.title)}</h2>
        <p>${e(meeting.kind)} · ingestion ${e(ingestion.status ?? "not-ingested")}</p>
        <h3>Learning questions</h3><ul>${questions || "<li>None recorded.</li>"}</ul>
        <details open><summary>Facilitator guide</summary>${includePrivate && meeting.status !== "withdrawn" ? `<pre class="source-text">${e(meeting.guide)}</pre>` : '<p class="empty">Guide withheld from static export.</p>'}</details>
        <details><summary>Redacted transcript</summary>${mayShowTranscript ? `<pre class="source-text">${e(meeting.transcript)}</pre>` : '<p class="empty">Transcript withheld by consent or privacy policy.</p>'}</details>
      </article>`;
    })
    .join("");
  return page(
    "Meetings",
    "sources.html",
    w,
    '<header class="page-intro"><span class="eyebrow">Prepare and learn</span><h2>Discovery meetings</h2><p>Facilitator guides, consent-aware transcript bundles, and ingestion status connect meetings to evidence.</p></header>' +
      (cards || '<p class="empty">No meeting bundles recorded.</p>'),
  );
}
function renderReview(w: Workspace): string {
  const review = w.discovery.review ?? {};
  const url =
    review.repository && review.pull_request
      ? `https://github.com/${review.repository}/pull/${review.pull_request}`
      : undefined;
  const cards = w.comments
    .map((c: RecordValue) => {
      const t = c.target as RecordValue,
        s = (c.selection ?? {}) as RecordValue,
        a = (c.author ?? {}) as RecordValue,
        status = c.status ?? "open";
      return `
        <article class="comment ${e(status)}" id="${e(c.id)}" ${attrs(t.record_id, String(t.field))}>
          <div class="record-heading"><span class="record-id">${e(c.id)}</span><span class="tag">${e(status)}</span></div>
          <p class="comment-target">${e(t.record_type ?? "record")} · ${e(t.record_id)} · ${e(t.field)}</p>
          <blockquote>${e(s.exact ?? "No text selection recorded")}</blockquote>
          <p class="comment-body">${e(c.body ?? "")}</p>
          <div class="comment-meta"><span>@${e(a.github ?? "Unknown")}</span><time>${e(c.created_at ?? "")}</time>${url ? `<a class="button" href="${e(url)}">Open pull request</a>` : ""}</div>
        </article>`;
    })
    .join("");
  const authority = review.authority ?? "risk-based";
  const policy: { [key: string]: string } = {
    automatic: "The agent may apply review-driven changes and must record every revision.",
    "proposal-only": "The agent proposes all review-driven changes for human approval.",
    "risk-based":
      "Meaning-preserving corrections may be applied; material discovery changes require a proposal.",
  };
  return page(
    "Review",
    "review.html",
    w,
    `
    <header class="page-intro"><span class="eyebrow">Review</span><h2>Comments and agent revisions</h2><p>Comments keep stable record and field anchors plus selected-text context.</p></header>
    <section class="policy"><strong>Agent authority:</strong> ${e(authority)}. ${e(policy[String(authority)])}</section>
    ${cards || '<p class="empty">No comments recorded.</p>'}
    `,
  );
}
const CSS = String.raw`:root { --paper: #f4f1ea; --surface: #fffdf8; --ink: #18201d; --muted: #66706b; --line: #d8d5cc; --accent: #176b55; --accent-soft: #dcece5; --warning: #8a5b12; --serif: Georgia, "Times New Roman", serif; --sans: ui-sans-serif, system-ui, sans-serif; }
* { box-sizing: border-box; }
html { color-scheme: light; background: var(--paper); }
body { margin: 0; color: var(--ink); font: 16px/1.55 var(--sans); }
a { color: inherit; }
.app-header, nav, main, footer { width: min(1180px, calc(100% - 40px)); margin-inline: auto; }
.app-header { display: flex; justify-content: space-between; align-items: end; padding: 42px 0 20px; gap: 24px; }
h1, h2, h3, p { margin-top: 0; }
h1 { margin-bottom: 0; font: 700 clamp(2rem, 4vw, 3.3rem)/1 var(--serif); letter-spacing: -.035em; }
h2 { font: 700 1.55rem/1.15 var(--serif); }
h3 { font-size: .84rem; text-transform: uppercase; letter-spacing: .08em; }
.eyebrow, .field-label, dt { color: var(--muted); font-size: .72rem; font-weight: 750; letter-spacing: .11em; text-transform: uppercase; }
.header-meta { display: flex; align-items: center; gap: 10px; }
.status, .comment-count, .tag { border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; font-size: .78rem; text-decoration: none; }
.status { background: var(--accent-soft); border-color: transparent; color: #0c4b3b; }
nav { display: flex; gap: 3px; border-block: 1px solid var(--line); overflow-x: auto; }
nav a { padding: 13px 15px; color: var(--muted); text-decoration: none; white-space: nowrap; }
nav a[aria-current="page"] { color: var(--ink); box-shadow: inset 0 -2px var(--accent); }
main { padding-block: 36px 70px; }
footer { border-top: 1px solid var(--line); padding: 20px 0 36px; color: var(--muted); font-size: .8rem; }
.decision-banner { background: var(--ink); color: white; padding: clamp(28px, 5vw, 58px); margin-bottom: 24px; }
.decision-banner .eyebrow { color: #9fc3b8; }
.decision-banner h2 { max-width: 800px; font-size: clamp(2rem, 5vw, 4.6rem); letter-spacing: -.045em; margin: 14px 0 18px; }
.decision-banner p { max-width: 700px; color: #dce4e0; font-size: 1.08rem; }
.decision-action { display: inline-block; margin-top: 8px; color: white; font-weight: 750; text-underline-offset: 4px; }
.overview-grid, .record-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.panel, .record, .comment { background: var(--surface); border: 1px solid var(--line); padding: 28px; margin-bottom: 24px; }
blockquote { margin: 18px 0; padding-left: 18px; border-left: 3px solid var(--accent); font: 1.25rem/1.4 var(--serif); }
dl { margin-bottom: 0; } dl div { border-top: 1px solid var(--line); padding: 12px 0; } dd { margin: 3px 0 0; }
.record-id { color: var(--muted); font: .75rem ui-monospace, monospace; }
.hypothesis { margin-top: 18px; } .hypothesis h3 { font: 700 1.3rem/1.2 var(--serif); text-transform: none; letter-spacing: 0; margin-top: 8px; }
.field { border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px; } .field p { margin: 5px 0 0; }
.text-link { display: inline-block; margin-top: 14px; color: var(--accent); font-weight: 700; text-decoration: none; }
.section-heading { display: flex; justify-content: space-between; align-items: start; gap: 24px; } .section-heading h2 { margin-top: 6px; }
.evidence-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.evidence-summary { border-top: 1px solid var(--line); padding-top: 16px; } .evidence-summary p { font: 1.1rem/1.4 var(--serif); margin: 8px 0 12px; } .evidence-summary strong { font-size: .76rem; text-transform: uppercase; letter-spacing: .08em; }
.metrics { display: grid; grid-template-columns: repeat(4, 1fr); background: var(--surface); border: 1px solid var(--line); margin-top: 24px; }
.metrics a { padding: 22px; border-right: 1px solid var(--line); text-decoration: none; } .metrics a:last-child { border-right: 0; } .metrics strong, .metrics span { display: block; } .metrics strong { font: 700 2rem var(--serif); } .metrics span { color: var(--muted); font-size: .78rem; }
.page-intro { max-width: 700px; margin-bottom: 30px; } .page-intro h2 { font-size: clamp(2.4rem, 5vw, 4.8rem); margin: 8px 0 12px; }
.record { max-width: 900px; } .record-grid .record { margin: 0; max-width: none; } .record-heading, .comment-meta { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
.record > h2 { margin-top: 12px; } .record li { margin-bottom: 6px; }
.evidence-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; border-top: 1px solid var(--line); margin-top: 18px; padding-top: 18px; }
.revision-panel { margin-top: 36px; max-width: 900px; } .timeline { list-style: none; padding: 0; } .timeline li { display: grid; grid-template-columns: 170px 1fr auto; gap: 20px; border-top: 1px solid var(--line); padding: 14px 0; } .timeline span, .timeline code { color: var(--muted); font-size: .78rem; }
.linked-record { margin-top: 24px; color: var(--muted); }
.policy { border: 1px solid #d6c8a9; background: #f7efd9; color: #66480f; padding: 16px 18px; margin-bottom: 24px; }
.comment { max-width: 820px; } .comment.open { border-left: 4px solid var(--warning); } .comment-target { color: var(--muted); font: .78rem ui-monospace, monospace; margin-top: 16px; } .comment-body { font-size: 1.08rem; } .comment-meta { color: var(--muted); font-size: .8rem; justify-content: flex-start; }
.button { margin-left: auto; padding: 7px 11px; border: 1px solid var(--line); text-decoration: none; color: var(--ink); }
.review-trigger { border: 1px solid var(--line); background: var(--surface); color: var(--accent); cursor: pointer; padding: 5px 8px; }
[data-record-id][data-field] { position: relative; }
[data-record-id][data-field] > .review-trigger { position: absolute; right: 4px; top: 4px; }
.page-comment { float: right; margin-bottom: 12px; } #review-drawer { width: min(520px, 94vw); margin: 0 0 0 auto; height: 100%; max-height: none; border: 0; border-left: 1px solid var(--line); padding: 28px; }
#review-drawer::backdrop { background: #18201d88; } .drawer-close { text-align: right; } .drawer-close button { font-size: 1.5rem; border: 0; background: none; } #review-form label, #review-form textarea { display: block; width: 100%; } #review-form textarea { min-height: 100px; margin: 6px 0 10px; } .live-thread { border-top: 1px solid var(--line); padding: 14px 0; } .live-thread .tag { display: inline-block; } .proposal { white-space: pre-wrap; background: var(--paper); padding: 10px; overflow-wrap: anywhere; }
@media (max-width: 760px) { .app-header { align-items: start; flex-direction: column; } .overview-grid, .record-grid, .evidence-columns { grid-template-columns: 1fr; } .metrics { grid-template-columns: repeat(2, 1fr); } .metrics a:nth-child(2) { border-right: 0; } .metrics a { border-bottom: 1px solid var(--line); } .timeline li { grid-template-columns: 1fr; gap: 4px; } }
@media (prefers-reduced-motion: no-preference) { a { transition: color .15s ease, background .15s ease; } }
`;
const JS = String.raw`(() => {
  const drawer = document.querySelector('#review-drawer');
  const form = document.querySelector('#review-form');
  const threads = document.querySelector('#review-threads');
  const targetLabel = document.querySelector('#review-target');
  let target = null;
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  async function api(path, options) { const response = await fetch(path, { headers: {'content-type':'application/json'}, ...options }); const value = await response.json(); if (!response.ok) throw new Error(value.error || response.statusText); return value; }
  async function refresh() {
    const all = await api('/api/comments');
    const matching = all.filter((item) => item.target.record_id === target.record_id && (item.target.field || '') === (target.field || '') && (item.target.page || '') === (target.page || ''));
    threads.innerHTML = matching.map((item) => '<article class="live-thread"><span class="tag">' + esc(item.status) + '</span><p>' + esc(item.body) + '</p>' + (item.replies || []).map((reply) => '<p><strong>' + esc(reply.author) + ':</strong> ' + esc(reply.body) + '</p>').join('') + (item.status === 'open' ? '<form class="reply-form" data-reply="' + esc(item.id) + '"><label>Reply <input name="body" required></label><button type="submit">Reply</button></form><button data-agent="' + esc(item.id) + '">Request agent</button><button data-resolve="' + esc(item.id) + '">Resolve</button><div data-job-for="' + esc(item.id) + '"></div>' : '') + '</article>').join('') || '<p>No comments on this target.</p>';
  }
  function open(button) { const host = button.closest('[data-record-id][data-field]'); target = host ? {record_id: host.dataset.recordId, field: host.dataset.field} : {record_id: document.body.dataset.workspaceId, page: button.dataset.pageTarget}; targetLabel.textContent = target.record_id + ' · ' + (target.field || target.page); drawer.showModal(); refresh().catch(showError); }
  function showError(error) { threads.textContent = String(error); }
  document.querySelectorAll('[data-record-id][data-field]').forEach((host) => { if (host.querySelector(':scope > .review-trigger')) return; const button = document.createElement('button'); button.type='button'; button.className='review-trigger'; button.setAttribute('aria-label', 'Comment on ' + host.dataset.recordId + ' ' + host.dataset.field); button.textContent='✎'; host.append(button); });
  document.addEventListener('click', async (event) => { const button = event.target.closest('button'); if (!button) return; if (button.classList.contains('review-trigger')) return open(button); try { if (button.dataset.agent) { const job = await api('/api/comments/' + encodeURIComponent(button.dataset.agent) + '/agent', {method:'POST'}); const slot = document.querySelector('[data-job-for="' + button.dataset.agent + '"]'); slot.textContent='Agent queued…'; const poll = async () => { const current = await api('/api/jobs/' + encodeURIComponent(job.id)); if (current.status === 'queued') return setTimeout(poll, 100); slot.innerHTML = current.status === 'failed' ? esc(current.error) : '<p>' + esc(current.response.message) + '</p>' + (current.response.proposal ? '<pre class="proposal">' + esc(JSON.stringify(current.response.proposal, null, 2)) + '</pre><button data-apply="' + esc(job.id) + '">Apply proposal</button>' : ''); }; poll(); } if (button.dataset.resolve) { await api('/api/comments/' + encodeURIComponent(button.dataset.resolve) + '/resolve', {method:'POST', body:JSON.stringify({resolution:'accepted-no-change'})}); await refresh(); } if (button.dataset.apply) { await api('/api/jobs/' + encodeURIComponent(button.dataset.apply) + '/apply', {method:'POST'}); await refresh(); location.reload(); } } catch (error) { showError(error); } });
  document.addEventListener('submit', async (event) => { const reply = event.target.closest('.reply-form'); if (!reply) return; event.preventDefault(); try { const body = new FormData(reply).get('body'); await api('/api/comments/' + encodeURIComponent(reply.dataset.reply) + '/replies', {method:'POST', body:JSON.stringify({body, author:'browser reviewer'})}); await refresh(); } catch (error) { showError(error); } });
  form.addEventListener('submit', async (event) => { event.preventDefault(); try { const body = new FormData(form).get('body'); await api('/api/comments', {method:'POST', body:JSON.stringify({target, body, author:'browser reviewer'})}); form.reset(); await refresh(); } catch (error) { showError(error); } });
})();
`;
function isEvidenceShareable(record: RecordValue, workspace: Workspace): boolean {
  const meeting = workspace.meetings.find((value: RecordValue) => value.id === record.source_id);
  if (!meeting) return true;
  if (meeting.status === "withdrawn") return false;
  const locator = record.source_locator as RecordValue;
  const participant = (meeting.participants as RecordValue[]).find(
    (value) => value.pseudonym === locator.speaker,
  );
  if (!participant) return false;
  const consent = participant.consent as RecordValue;
  return ["granted", "granted-with-anonymization"].includes(String(consent.external_sharing));
}
function staticPresentationWorkspace(workspace: Workspace): Workspace {
  const evidence = workspace.evidence.filter((record: RecordValue) =>
    isEvidenceShareable(record, workspace),
  );
  const visibleEvidenceIds = new Set(evidence.map((record: RecordValue) => String(record.id)));
  const hiddenEvidence = evidence.length !== workspace.evidence.length;
  const hypotheses = workspace.hypotheses.filter((record: RecordValue) =>
    [
      ...(record.supporting_evidence_ids as string[]),
      ...(record.contradicting_evidence_ids as string[]),
    ].every((id) => visibleEvidenceIds.has(id)),
  );
  const visibleHypothesisIds = new Set(hypotheses.map((record: RecordValue) => String(record.id)));
  const experiments = workspace.experiments.filter((record: RecordValue) =>
    visibleHypothesisIds.has(String(record.problem_hypothesis_id)),
  );
  const decisions = hiddenEvidence ? [] : workspace.decisions;
  const revisions = hiddenEvidence ? [] : workspace.revisions;
  const visibleRecordIds = new Set([
    String(workspace.request.id),
    ...evidence.map((record: RecordValue) => String(record.id)),
    ...hypotheses.map((record: RecordValue) => String(record.id)),
    ...decisions.map((record: RecordValue) => String(record.id)),
    ...experiments.map((record: RecordValue) => String(record.id)),
    ...workspace.meetings.map((record: RecordValue) => String(record.id)),
  ]);
  const comments = workspace.comments.filter((record: RecordValue) =>
    visibleRecordIds.has(String((record.target as RecordValue).record_id)),
  );
  return {
    ...workspace,
    discovery: hiddenEvidence
      ? {
          ...workspace.discovery,
          recommendation:
            "Withheld from static export because supporting evidence is not shareable.",
        }
      : workspace.discovery,
    evidence,
    hypotheses,
    decisions,
    experiments,
    comments,
    revisions,
  };
}
export function renderFiles(
  workspace: Workspace,
  digest: string,
  options: { includePrivateMeetingArtifacts?: boolean } = {},
): Map<string, Buffer> {
  const includePrivate = options.includePrivateMeetingArtifacts === true;
  const presentedWorkspace = includePrivate ? workspace : staticPresentationWorkspace(workspace);
  const d = presentedWorkspace.discovery;
  const manifest = {
    workspace_id: d.id,
    renderer_version: VERSION,
    generated_at: d.updated_at,
    source_digest: digest,
    pages: PAGES,
    generated_files: [...PAGES, "artifact.css", "artifact.js", "manifest.json"],
  };
  const values: Record<string, string> = {
    "index.html": renderIndex(presentedWorkspace),
    "evidence.html": renderEvidence(presentedWorkspace),
    "hypotheses.html": renderHypotheses(presentedWorkspace),
    "decisions.html": renderDecisions(presentedWorkspace),
    "experiment.html": renderExperiment(presentedWorkspace),
    "sources.html": renderSources(presentedWorkspace, includePrivate),
    "review.html": renderReview(presentedWorkspace),
    "artifact.css": CSS,
    "artifact.js": JS,
    "manifest.json": JSON.stringify(manifest, Object.keys(manifest).sort(), 2) + "\n",
  };
  return new Map(Object.entries(values).map(([name, value]) => [name, Buffer.from(value)]));
}
export function checkCurrent(root: string, workspace: Workspace, digest: string): void {
  const presentation = join(root, "presentation");
  if (!existsSync(presentation))
    throw new WorkspaceError("Presentation is missing or stale; run the renderer");
  const expected = renderFiles(workspace, digest);
  const actual = new Set(
    filesRecursively(presentation).map((path) => posix(relative(presentation, path))),
  );
  const missing = [...expected.keys()].filter((name) => !actual.has(name)).sort();
  const unexpected = [...actual].filter((name) => !expected.has(name)).sort();
  const changed = [...expected]
    .filter(
      ([name, content]) =>
        existsSync(join(presentation, name)) &&
        !readFileSync(join(presentation, name)).equals(content),
    )
    .map(([name]) => name)
    .sort();
  const problems = [];
  if (missing.length) problems.push(`missing files: ${missing.join(", ")}`);
  if (unexpected.length) problems.push(`unexpected files: ${unexpected.join(", ")}`);
  if (changed.length) problems.push(`changed files: ${changed.join(", ")}`);
  if (problems.length) throw new WorkspaceError(`Presentation is stale; ${problems.join("; ")}`);
}
export function replacePresentation(
  root: string,
  files: Map<string, Buffer>,
  rename: Rename = renameSync,
): void {
  const destination = join(root, "presentation");
  mkdirSync(root, { recursive: true });
  const temporaryRoot = join(root, `.discovery-render-${randomUUID()}`);
  const temporary = join(temporaryRoot, "presentation");
  const backup = join(root, `.presentation-backup-${randomUUID().replaceAll("-", "")}`);
  let moved = false;
  let installed = false;
  try {
    mkdirSync(temporary, { recursive: true });
    for (const [name, content] of files) writeFileSync(join(temporary, name), content);
    if (existsSync(destination)) {
      rename(destination, backup);
      moved = true;
    }
    rename(temporary, destination);
    installed = true;
  } catch (error) {
    if (moved) {
      if (existsSync(destination)) rmSync(destination, { recursive: true, force: true });
      if (existsSync(backup)) rename(backup, destination);
    }
    throw error;
  } finally {
    rmSync(temporaryRoot, { recursive: true, force: true });
    if (installed && existsSync(backup)) rmSync(backup, { recursive: true, force: true });
  }
}
export function main(argv = process.argv.slice(2)): number {
  const args = [...argv];
  const checkIndex = args.indexOf("--check");
  const check = checkIndex >= 0;
  if (check) args.splice(checkIndex, 1);
  if (args.length !== 1) {
    console.error("usage: render_discovery.ts workspace [--check]");
    return 2;
  }
  const root = resolve(args[0]!);
  try {
    const workspace = loadWorkspace(root),
      digest = sourceDigest(root);
    if (check) checkCurrent(root, workspace, digest);
    else replacePresentation(root, renderFiles(workspace, digest));
    console.log(
      `${check ? "Presentation is current" : "Rendered presentation"}: ${join(root, "presentation")}`,
    );
    return 0;
  } catch (error) {
    console.error(`error: ${(error as Error).message}`);
    return 1;
  }
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = main();
