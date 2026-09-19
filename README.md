# Agent Skills

A collection of reusable skills that extend AI agents with focused workflows, domain knowledge, and practical guidance.

Each skill is independently installable and designed for agents that support the open [Agent Skills specification](https://agentskills.io/).

## Install

Install the complete collection with the [skills CLI](https://skills.sh/):

```bash
npx skills add corwinm/agent-skills
```

Install one skill:

```bash
npx skills add corwinm/agent-skills --skill repository-wiki
```

## Available skills

### Knowledge management

- [`repository-wiki`](skills/repository-wiki/SKILL.md) — Build and maintain a cited, Git-backed project wiki from documents, notes, and transcripts.

`repository-wiki` provides six operations: `init`, `ingest`, `query`, `context`, `check`, and `rebuild`. It stores immutable source material, maintained Markdown context, and a small ingestion manifest directly in the project repository without requiring a database, service, plugin, or custom CLI.

## Development

```bash
npm run format
npm run check
```

Contributions should include a concrete scenario showing how the change improves agent behavior. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
