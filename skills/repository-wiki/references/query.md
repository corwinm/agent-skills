# `/wiki query <question> [--save <path>]`

Answer a question from maintained context without changing the wiki by default.

1. Read `wiki/index.md` first.
2. Select the smallest relevant set of canonical pages.
3. Inventory the original sources needed to support the answer. For every registered source, reject unsafe paths using the shared symlink and canonical-root rules, require the file to exist, and compare its unfiltered identity with the manifest. Immediately before returning or saving the answer, recheck every source actually cited. If verification fails, identify the affected claims and provenance gap; do not present the stale wiki claim as supported by that source.
4. Answer with inline citations to verified original sources, not citations only to generated wiki pages.
5. Separate requests, confirmed findings, interpretations, assumptions, problem hypotheses, proposals, decisions, contradictions, and unknowns when relevant. Preserve a request's original wording and requested solution before discussing any reframing. Keep every problem hypothesis falsifiable with supporting and contradicting evidence listed separately. Do not present source statements as independently verified facts.
6. If the wiki is insufficient, say so. Search raw sources only when necessary and identify that fallback explicitly.
7. With `--save`, write the answer to the requested safe path under the wiki root, defaulting to `wiki/analysis/`. Include the question, actual operation date, original sources, and pages consulted. Do not save without the flag or an explicit request.

Completion condition: the answer addresses the question, fits the available evidence, cites verified original sources, reports provenance gaps, and discloses material uncertainty.
