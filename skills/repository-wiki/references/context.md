# `/wiki context <purpose> [--budget <tokens>] [--save <path>]`

Create a focused context pack for a downstream task. This command is read-only unless `--save` is present.

1. Translate the purpose into information needs. Apply maintained-path safety to the index, record its unfiltered identity before reading, then read it.
2. Use the index to select relevant current state, requests, evidence, interpretations, assumptions, problem hypotheses, proposals, decisions, requirements, risks, stakeholders, actions, and questions. Apply maintained-path safety and record each selected canonical page's unfiltered identity before reading it. Baseline the manifest before reading it as part of source inventory.
3. Verify every registered source used by the pack is a regular file and matches its manifest identity using the shared path-safety rules. For discovery-workspace transcript evidence, separately baseline the mutable meeting control manifest without registering it as an immutable source; require meeting-level transcription consent to be `granted` or `granted-with-anonymization`, enforce required anonymization, and verify speaker mapping, discovery-use consent, and direct-quotation consent before using or quoting evidence. Treat `unknown` as not granted. Immediately before returning or saving the pack, recheck path safety, regular-file type, and identity for the index, every selected canonical page, the manifest, every source, and every consent control actually used. If any maintained page, manifest, source, or consent state changed, discard the affected pack and restart from the current consistent state. Report provenance gaps and do not present stale, mixed-version, or unauthorized wiki claims as source-supported.
4. Prefer concise summaries and short source excerpts over complete documents.
5. Respect the requested approximate token budget; default to 8,000 tokens.
6. Include repository-relative paths and working Markdown links to verified original sources. For every synthesis across canonical records, also include links to each contributing record ID and page anchor; record links supplement rather than replace source citations.
7. Clearly label uncertainty and omissions caused by budget, missing evidence, consent restrictions, or provenance gaps. Preserve every included evidence record's type and limitations; every interpretation's author, contributing evidence or evidence IDs, and material alternatives; every assumption's owner, consequence if wrong, risk, and proposed validation; every problem hypothesis's affected group, situation or trigger, goal, difficulty, consequence, supporting evidence, contradicting evidence, unknowns, and worded confidence rationale; and every decision's chosen action, alternatives considered, rationale, evidence used, unresolved dissent, owner, and date. Use `Unknown` for unavailable values. When the budget requires dropping a problem-hypothesis field, identify the omitted field and reason explicitly rather than silently changing its scope or confidence.
8. With `--save`, resolve the exact output file under the configured wiki root, using `wiki/analysis/` as the default parent directory, and apply the shared path-safety checks. Before generating the pack, record the output file's unfiltered identity or an explicit `absent` sentinel. Immediately before writing, repeat the safety checks and verify that baseline; if the file drifted or an absent path appeared, stop without writing and reconcile the concurrent change.

Use this shape when applicable:

```markdown
# Context: <purpose>

## Current state

## Requests

## Evidence

## Interpretations

## Problem hypotheses

## Confirmed decisions

## Requirements and constraints

## Assumptions

## Proposals

## Risks and dependencies

## Stakeholders and commitments

## Open questions

## Relevant sources
```

Completion condition: the pack is purpose-specific, within the approximate budget, linked to verified sources, reports provenance gaps, preserves knowledge categories, and does not silently become canonical wiki content.
