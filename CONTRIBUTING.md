# Contributing

## Skill requirements

Each skill lives at `skills/<skill-name>/SKILL.md` and follows the [Agent Skills specification](https://agentskills.io/).

- The directory and frontmatter `name` must match.
- The description must state what the skill does and when it should activate.
- Keep the main file focused; place optional detail in `references/` or `assets/`.
- Give each workflow stage a checkable completion condition.
- Distinguish evidence from interpretation and assumptions.
- Never instruct an agent to fabricate evidence, consensus, confidence, or citations.

## Validation

```bash
npm run format
npm run check
```

If discovery workspace behavior changes, regenerate the example and verify it is current:

```bash
npm run render:example
npm run check:example
```

## Behavioral changes

For material workflow changes, include an example in the pull request containing:

1. The incoming request and available evidence.
2. The incorrect or weak behavior being prevented.
3. The expected skill output or decision.
