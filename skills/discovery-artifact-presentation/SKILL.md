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

Read [`references/discovery-workspace.md`](references/discovery-workspace.md) before creating the workspace. Use the self-contained `scripts/render_discovery.ts` for deterministic JSON-based rendering directly with Node.js 24 or newer.

## Workflow

1. **Locate the workspace root.** Find `discovery.json` or choose a new folder that can remain portable as a repository root or subfolder. Complete when all internal paths can be relative to that root.
2. **Preserve canonical records.** Store the original request, evidence, hypotheses, decisions, experiments, comments, sources, and revisions outside `presentation/`. Never treat generated HTML as canonical.
3. **Assign stable IDs.** Give every request, evidence item, hypothesis, decision, experiment, comment, and revision a unique ID. Use IDs for relationships and comment targets.
4. **Validate provenance.** Ensure evidence links to sources, interpretations are not presented as evidence, hypotheses retain contradiction and uncertainty, and unknown fields remain unknown.
5. **Configure review.** Record GitHub repository and pull-request context when available. Set `review.authority`; default to `risk-based`.
6. **Render the hybrid presentation.** Generate the executive overview plus evidence, hypotheses, decisions, experiment, and review views. Do not hand-edit generated files.
7. **Check freshness.** Run the renderer with `--check`. Complete only when the manifest digest matches the canonical workspace.
8. **Prepare GitHub review.** Commit source records and generated presentation together. Explain where reviewers should comment and which records remain uncertain.

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

## Rendering commands

From an installed skill directory, invoke the bundled renderer:

```bash
node scripts/render_discovery.ts path/to/workspace
node scripts/render_discovery.ts path/to/workspace --check
```

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
- [ ] Source and presentation changes are committed together
