# Agent Skills for Product Discovery

Open Agent Skills that help consultancies, platform teams, and internal service teams turn requested solutions into traceable, evidence-backed problem decisions.

The skills support a mixed workflow: an agent can conduct initial asynchronous intake, then assist a human facilitator with research, synthesis, alignment, and experiment design. They do not replace product judgment or claim to discover the “real problem” automatically.

## Install

Install the complete collection with the [skills CLI](https://skills.sh/):

```bash
npx skills add corwinm/agent-skills
```

Install one skill:

```bash
npx skills add corwinm/agent-skills --skill solution-request-triage
```

The repository follows the open [Agent Skills specification](https://agentskills.io/), so compatible agents and marketplaces can discover each directory containing a `SKILL.md` file.

## Skills

| Skill | Purpose |
| --- | --- |
| `solution-request-triage` | Separate a requested solution from the problem and decide whether discovery is needed. |
| `adaptive-discovery-intake` | Conduct an asynchronous, adaptive conversation with a requester. |
| `discovery-plan-design` | Plan interviews, observations, document review, and data collection around uncertainty. |
| `discovery-evidence-extraction` | Extract traceable evidence from interviews, notes, tickets, and observations. |
| `problem-synthesis` | Form competing problem hypotheses without erasing contradictions. |
| `problem-framing-review` | Facilitate stakeholder review, dissent, and readiness decisions. |
| `experiment-increment-design` | Design the cheapest useful experiment or smallest valuable increment. |
| `evidence-backed-problem-brief` | Assemble a concise decision brief grounded in cited evidence. |

## Shared discovery model

All skills use the same concepts:

- **Request:** what someone asked to have built, preserved verbatim.
- **Evidence:** source-linked observations or statements.
- **Interpretation:** meaning inferred from evidence, not evidence itself.
- **Assumption:** an unverified belief relevant to the decision.
- **Problem hypothesis:** a falsifiable account of who struggles, in what situation, and with what consequence.
- **Decision:** an explicit choice with rationale, owner, and date.

See [`docs/discovery-artifact.md`](docs/discovery-artifact.md) for the portable artifact schema and [`templates/discovery-artifact.yaml`](templates/discovery-artifact.yaml) for a starting file.

## Principles

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
python3 scripts/validate.py
```

Contributions should include a concrete scenario showing how the change improves agent behavior. See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT
