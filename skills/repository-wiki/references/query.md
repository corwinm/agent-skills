# `/wiki query <question> [--save <path>]`

Answer a question from maintained context without changing the wiki by default.

1. Read `wiki/index.md` first.
2. Select the smallest relevant set of canonical pages.
3. Answer with inline citations to original sources, not citations only to generated wiki pages.
4. Separate confirmed findings, interpretations, assumptions, proposals, decisions, contradictions, and unknowns when relevant. Do not present source statements as independently verified facts.
5. If the wiki is insufficient, say so. Search raw sources only when necessary and identify that fallback explicitly.
6. With `--save`, write the answer to the requested safe path under the wiki root, defaulting to `wiki/analysis/`. Include the question, actual operation date, original sources, and pages consulted. Do not save without the flag or an explicit request.

Completion condition: the answer addresses the question, fits the available evidence, cites original sources, and discloses material uncertainty.
