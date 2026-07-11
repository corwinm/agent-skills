# Discovery artifact

The discovery artifact is a portable record shared by the skills. YAML is recommended, but the conceptual model can be represented in JSON, Markdown, a document system, or an issue tracker.

## Record types

### Request

Preserve the requester’s wording, proposed solution, source, requester, date, urgency, and stated rationale. Reframing must not overwrite the original.

### Evidence

Each evidence item includes:

- `id`
- `statement`
- `type`: `observation`, `direct-quote`, `behavioral-data`, `document`, or `reported-experience`
- `source_id`
- `source_excerpt` or locator
- `affected_group`
- `collected_at`
- `corroboration`
- `limitations`

Evidence is not automatically truth. A source can be mistaken, unrepresentative, or describing a proposed solution.

### Interpretation

An inference drawn from one or more evidence IDs. Record its author and plausible alternatives.

### Assumption

An unverified belief with an owner, consequence if wrong, risk, and proposed validation.

### Problem hypothesis

A falsifiable statement covering:

- affected group
- situation or trigger
- goal
- difficulty
- consequence
- supporting evidence
- contradicting evidence
- unknowns
- confidence rationale, expressed in words rather than invented precision

### Decision

Record the chosen action, alternatives considered, rationale, evidence used, unresolved dissent, owner, and date.

## Provenance rules

1. Never create an evidence item without a source.
2. Direct quotes must remain verbatim and visibly quoted.
3. Paraphrases must not be presented as direct quotes.
4. Every problem hypothesis must list supporting and contradicting evidence separately.
5. Absence of contradiction is not corroboration.
6. Synthetic summaries must link to their contributing record IDs.
7. Unknown values stay unknown; do not fill gaps with plausible text.

## Lifecycle

```text
request
  -> intake
  -> discovery plan
  -> evidence
  -> problem hypotheses
  -> stakeholder review
  -> decision
  -> experiment or increment
  -> observed result
```

Stages may loop. A later finding can revise a hypothesis, but history and previous decisions remain visible.

## Presentation and review

For a GitHub-first folder structure, committed HTML presentation, hybrid comments, risk-based agent authority, and revision ledger, see [`discovery-workspace.md`](discovery-workspace.md).
