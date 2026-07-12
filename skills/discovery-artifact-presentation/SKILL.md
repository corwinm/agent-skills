---
name: discovery-artifact-presentation
description: Use when a software team needs to create, organize, render, or update a portable product-discovery workspace with structured records and committed HTML presentation. Build a hybrid executive overview and inspectable evidence workspace without making generated HTML the source of truth.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Discovery artifact presentation

## Purpose

Create or update a portable discovery workspace whose structured records remain canonical and whose committed HTML helps humans understand and review the work.

Read [`references/discovery-workspace.md`](references/discovery-workspace.md) before creating the workspace. This installed skill bundles both the deterministic renderer and the interactive review server under `scripts/`; Node.js 24 or newer is the only runtime prerequisite. Do not require the user to clone this repository or install repository-level npm dependencies.

## Workflow

1. **Locate the workspace root.** Find `discovery.json` or choose a new folder that can remain portable as a repository root or subfolder. Complete when all internal paths can be relative to that root.
2. **Preserve canonical records.** Store the original request, evidence, hypotheses, decisions, experiments, comments, sources, and revisions outside `presentation/`. Never treat generated HTML as canonical.
3. **Assign stable IDs.** Give every request, evidence item, hypothesis, decision, experiment, comment, and revision a unique ID. Use IDs for relationships and comment targets.
4. **Validate provenance.** Ensure evidence links to sources, interpretations are not presented as evidence, hypotheses retain contradiction and uncertainty, and unknown fields remain unknown.
5. **Configure review.** Use interactive browser review by default, record GitHub context when available, and set `review.authority`; default to `risk-based`.
6. **Render the hybrid presentation.** Generate the executive overview plus evidence, hypotheses, decisions, experiment, and review views with stable browser comment targets. Do not hand-edit generated files.
7. **Check freshness.** Run the renderer with `--check`. Complete only when the manifest digest matches the canonical workspace.
8. **Run interactive review.** Locate this installed skill directory and launch its bundled `scripts/review_server.ts` as a tracked background process. Wait for the listening message, request the reported URL to verify it responds, and give the URL to the user. Keep the process running for review until the user asks to stop it. Verify page and field pencils open persisted threads and that an agent proposal can be reviewed without silently changing canonical records.

## Presentation hierarchy

The overview should prioritize:

1. Decision needed
2. Original request
3. Current problem frame
4. Key evidence and limitations
5. Recommendation
6. Open comments
7. Links to detailed inspection views

Detailed views must expose stable `data-record-id` and `data-field` anchors. Escape all source text before rendering HTML.

## Bundled commands

From an installed skill directory, invoke the bundled renderer:

```bash
node scripts/render_discovery.ts path/to/workspace
node scripts/render_discovery.ts path/to/workspace --check
node scripts/review_server.ts path/to/workspace
node scripts/review_server.ts path/to/workspace 8080
```

Run these from the installed `discovery-artifact-presentation` skill directory, or use absolute paths to its scripts. The server defaults to <http://127.0.0.1:4173>, stores active state at `<workspace>/.review/review.sqlite`, and includes a deterministic mock adapter so the complete review flow works immediately. The mock demonstrates the portable protocol; describe it as a mock rather than implying that a production agent is configured.

When an agent has a background-process tool, it should start the server itself rather than asking the user to copy commands. A successful launch is complete only after the agent verifies the HTTP endpoint and reports both the URL and how the process will be stopped.

If a project already has an equivalent renderer, preserve its stack and verify the same invariants rather than replacing it automatically.

## Guardrails

- Do not edit files under `presentation/` directly.
- Do not add invented metrics, evidence, confidence, people, or recommendations to improve the presentation.
- Do not hide contradiction, dissent, limitations, or open comments.
- Do not use DOM location or selected text as the only comment identity.
- Do not replace a valid existing presentation when workspace validation fails.
- Do not generate timestamps from the current clock; use the canonical revision timestamp so output remains deterministic.

## Completion checklist

- [ ] Workspace is portable as a root or subfolder
- [ ] Canonical records and generated HTML are separate
- [ ] Every record and comment has a stable ID
- [ ] HTML escapes source content and exposes semantic anchors
- [ ] Overview and detailed inspection pages are generated
- [ ] Open comments and authority policy are visible
- [ ] Manifest records renderer version and source digest
- [ ] `--check` reports the committed presentation current
- [ ] Bundled review server is running and its HTTP endpoint was verified
- [ ] Source and presentation changes are committed together
