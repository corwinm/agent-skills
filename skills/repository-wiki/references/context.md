# `/wiki context <purpose> [--budget <tokens>] [--save <path>]`

Create a focused context pack for a downstream task. This command is read-only unless `--save` is present.

1. Translate the purpose into information needs.
2. Use the index to select relevant current state, requests, evidence, interpretations, assumptions, problem hypotheses, proposals, decisions, requirements, risks, stakeholders, actions, and questions.
3. Verify every registered source used by the pack against its manifest identity using the shared path-safety rules, then recheck cited sources immediately before returning or saving the pack. Report provenance gaps and do not present stale wiki claims as source-supported.
4. Prefer concise summaries and short source excerpts over complete documents.
5. Respect the requested approximate token budget; default to 8,000 tokens.
6. Include repository-relative paths and working Markdown links to verified original sources.
7. Clearly label uncertainty and omissions caused by budget, missing evidence, or provenance gaps.
8. With `--save`, write only to the requested safe path under the wiki root, defaulting to `wiki/analysis/`.

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
