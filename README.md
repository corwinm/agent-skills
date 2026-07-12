# Agent Skills

A collection of reusable skills that extend AI agents with focused workflows, domain knowledge, and practical guidance.

The collection will grow across different areas over time. Each skill is independently installable and designed to work with agents that support the open [Agent Skills specification](https://agentskills.io/).

## Install

Install the complete collection with the [skills CLI](https://skills.sh/):

```bash
npx skills add corwinm/agent-skills
```

Install one skill:

```bash
npx skills add corwinm/agent-skills --skill solution-request-triage
```

Compatible agents and marketplaces can discover each directory containing a `SKILL.md` file.

## Available skills

### Product discovery

Skills for helping software teams turn requested solutions into traceable, evidence-backed problem decisions.

| Skill                           | Purpose                                                                                 |
| ------------------------------- | --------------------------------------------------------------------------------------- |
| `solution-request-triage`       | Separate a requested solution from the problem and decide whether discovery is needed.  |
| `adaptive-discovery-intake`     | Conduct an asynchronous, adaptive conversation with a requester.                        |
| `discovery-plan-design`         | Plan interviews, observations, document review, and data collection around uncertainty. |
| `discovery-evidence-extraction` | Extract traceable evidence from interviews, notes, tickets, and observations.           |
| `problem-synthesis`             | Form competing problem hypotheses without erasing contradictions.                       |
| `problem-framing-review`        | Facilitate stakeholder review, dissent, and readiness decisions.                        |
| `experiment-increment-design`   | Design the cheapest useful experiment or smallest valuable increment.                   |
| `evidence-backed-problem-brief` | Assemble a concise decision brief grounded in cited evidence.                           |
| `discovery-workspace`           | Create, present, review, revise, and verify a portable discovery workspace.             |

These skills support a mixed workflow: an agent can conduct initial asynchronous intake, then assist a human facilitator with research, synthesis, alignment, and experiment design. They do not replace product judgment or claim to discover the “real problem” automatically.

#### Shared discovery model

The discovery skills distinguish among:

- **Request:** what someone asked to have built, preserved verbatim.
- **Evidence:** source-linked observations or statements.
- **Interpretation:** meaning inferred from evidence, not evidence itself.
- **Assumption:** an unverified belief relevant to the decision.
- **Problem hypothesis:** a falsifiable account of who struggles, in what situation, and with what consequence.
- **Decision:** an explicit choice with rationale, owner, and date.

See [`docs/discovery-artifact.md`](docs/discovery-artifact.md) for the portable artifact schema and [`templates/discovery-artifact.yaml`](templates/discovery-artifact.yaml) for a starting file.

#### Reviewable discovery workspaces

Discovery artifacts can live at the root of their own repository or inside a larger repository. Canonical JSON records remain the source of truth. The review server builds the interactive UI directly from current JSON, while an optional deterministic export produces a static HTML snapshot for sharing or archival.

```bash
npm run export:example
npm run review:example
```

Open <http://127.0.0.1:4173>, then use the pencil beside any reviewable statement or the page-level comment button. Browser threads persist in SQLite, can be sent to a portable CLI agent, and are exported into the workspace when resolved. When `discovery-workspace` is installed independently, its `scripts/workspace.ts` command can initialize, export, check, or launch the complete review application without cloning this repository or installing npm dependencies.

See [`docs/discovery-workspace.md`](docs/discovery-workspace.md) and the committed [`examples/deployment-visibility`](examples/deployment-visibility) workspace.

#### Discovery principles

1. Preserve the original request before reframing it.
2. Ask for recent concrete examples before accepting generalizations.
3. Keep evidence, interpretation, assumptions, and decisions distinct.
4. Preserve disagreement and missing evidence.
5. Include non-software interventions.
6. Let humans review and edit every consequential inference.
7. Do not turn discovery directly into a backlog without a decision.

## Development

Validate all skills:

```bash
npm run validate
```

Run formatting, type-checking, tests, validation, and the generated presentation check:

```bash
npm run format
npm run check
```

Contributions should include a concrete scenario showing how the change improves agent behavior. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
