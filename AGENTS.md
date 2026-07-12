# Repository guidance

This repository contains portable Agent Skills for product discovery.

- Skills live in `skills/<name>/SKILL.md`.
- Follow https://agentskills.io/ and run `npm run check` after edits.
- Run `npm run format` before committing; oxfmt is the repository formatter.
- Preserve the separation between evidence, interpretation, assumptions, hypotheses, and decisions.
- Skills must assist human judgment, not claim autonomous certainty about user problems.
- Prefer concrete completion criteria over generic advice.
- Keep cross-skill terminology aligned with `docs/discovery-artifact.md`.
