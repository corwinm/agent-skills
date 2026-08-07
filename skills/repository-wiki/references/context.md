# `/wiki context <purpose> [--budget <tokens>] [--save <path>]`

Create a focused context pack for a downstream task. This command is read-only unless `--save` is present.

1. Translate the purpose into information needs.
2. Use the index to select relevant current state, evidence, interpretations, decisions, requirements, risks, stakeholders, actions, assumptions, proposals, and questions.
3. Prefer concise summaries and short source excerpts over complete documents.
4. Respect the requested approximate token budget; default to 8,000 tokens.
5. Include repository-relative paths and working Markdown links to original sources.
6. Clearly label uncertainty and omissions caused by budget or missing evidence.
7. With `--save`, write only to the requested safe path under the wiki root, defaulting to `wiki/analysis/`.

Use this shape when applicable:

```markdown
# Context: <purpose>

## Current state

## Evidence and interpretations

## Confirmed decisions

## Requirements and constraints

## Assumptions and proposals

## Risks and dependencies

## Stakeholders and commitments

## Open questions

## Relevant sources
```

Completion condition: the pack is purpose-specific, within the approximate budget, source-linked, preserves knowledge categories, and does not silently become canonical wiki content.
