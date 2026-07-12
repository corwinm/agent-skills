# Discovery meeting guide

Meeting: `meeting-001`

## Decision this meeting informs

Replace with the pending decision.

## Learning questions

- `lq-001` — Replace with the highest-priority learning question.

## What we currently think — not established fact

- List assumptions and tentative hypotheses.

## Perspectives and contradictions to seek

- A recent concrete episode
- A counterexample where the current workflow worked
- Evidence that could challenge the initial request

## Opening and consent

1. Explain the purpose and intended use.
2. Confirm recording and transcription consent separately.
3. Confirm whether anonymized direct quotes may be retained.
4. Explain how consent can be withdrawn.
5. Stop capture if consent is absent or unclear.

## Neutral prompts

- Tell me about the most recent time this occurred.
- What happened immediately before that?
- What did you do next?
- Where, if anywhere, did the process become difficult?
- Can you recall a time it worked smoothly?
- What have I misunderstood or omitted?

## Agenda and stopping conditions

- 5 min — purpose, consent, and context
- 35 min — recent episodes, workflow, consequences, and counterexamples
- 10 min — corrections, missing perspectives, and useful follow-up sources
- Stop early if consent changes, the participant is not an appropriate source, or the decision can no longer be affected by this meeting.

## Post-meeting handoff

1. Save a redacted transcript as `transcript.md` with immutable segment IDs, timestamps, and pseudonyms.
2. Update `meeting.json` capture metadata and status to `transcribed`.
3. Run evidence extraction; verify every quote against its segment.
4. Update ingestion status, timestamp, evidence IDs, reviewer, and limitations.
5. Review evidence before synthesis and derive the next guide from unresolved uncertainty.

## Capture plan

- Use participant pseudonyms from `meeting.json`.
- Preserve timestamps and stable transcript segment IDs.
- Mark transcription uncertainty and redactions explicitly.
- Keep real-name/pseudonym mappings outside the portable workspace.
