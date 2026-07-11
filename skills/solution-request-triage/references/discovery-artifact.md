# Discovery artifact reference

Use this record model when exchanging work with other discovery skills. YAML, JSON, Markdown, or an existing system may represent it; preserve the concepts and provenance rather than forcing one storage tool.

## Record types

### Request

- `id`, `verbatim`, `requester`, `source`, `received_at`
- `proposed_solution`, `stated_rationale`, `urgency`

Never overwrite `verbatim` when reframing the request.

### Source

- `id`, `type`, `title`, `participant_or_creator`, `collected_at`
- `source_locator`, `scope`, `limitations`

### Evidence

- `id`, `statement`, `type`
- `source_id`, `source_excerpt`, `source_locator`
- `affected_group`, `situation`, `timeframe`, `collected_at`
- `corroboration`, `tensions`, `limitations`

Allowed evidence types include `observation`, `direct-quote`, `behavioral-data`, `document`, and `reported-experience`.

### Interpretation

- `id`, `statement`, `evidence_ids`, `author`
- `alternative_interpretations`, `open_questions`

### Assumption

- `id`, `statement`, `owner`, `risk`, `consequence_if_wrong`
- `proposed_validation`, `status`

### Problem hypothesis

- `id`, `affected_group`, `situation`, `goal`, `difficulty`, `consequence`
- `supporting_evidence_ids`, `contradicting_evidence_ids`
- `unknowns`, `confidence_rationale`

### Decision

- `id`, `decision`, `owner`, `decided_at`
- `alternatives_considered`, `rationale`, `evidence_ids`
- `unresolved_dissent`, `assumptions_accepted`, `revisit_at`

### Experiment or increment

- `id`, `problem_hypothesis_id`, `critical_assumption_id`, `type`
- `intervention`, `participants`, `procedure`, `safeguards`
- `signals`, `data_sources`, `timeframe`, `decision_rule`, `owner`

## Provenance rules

1. Never create evidence without a source.
2. Keep direct quotes verbatim and visibly quoted.
3. Never present paraphrases as quotes.
4. Store inferred meaning as interpretation, not evidence.
5. List supporting and contradicting evidence separately.
6. Absence of contradiction is not corroboration.
7. Link synthetic summaries to contributing record IDs.
8. Keep unknown values unknown rather than filling gaps with plausible text.
