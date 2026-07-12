# Discovery meeting workflow

Use a portable meeting bundle under `sources/meeting-<stable-id>/`:

```text
meeting.json
 guide.md
 transcript.md
```

`meeting.json` preserves the decision, learning questions, participant pseudonyms, separate consent scopes, privacy handling, artifact paths, ingestion state, and prior records/meetings that shaped the guide. Start with `status: planned`; use `planned -> completed -> transcribed -> ingested -> reviewed`, with `cancelled` and `withdrawn` when needed.

Consent states are `granted`, `granted-with-anonymization`, `not-granted`, `withdrawn`, `unknown`, and `not-applicable`. Unknown never means granted. Recording, transcription, discovery use, direct quotation, and external sharing are separate scopes. Recording and transcription are meeting-level capture permissions. Discovery use, direct quotation, and external sharing are also recorded per participant; participant-specific permission governs evidence attributed to that speaker.

A guide includes the decision, learning questions, current assumptions labeled as tentative, participant perspectives, recent-episode prompts, counterexamples, contradiction-seeking prompts, agenda, opening consent script, capture plan, and stopping conditions. Later guides cite prior meeting and record IDs and target unresolved uncertainty rather than repeating generic questions.

A transcript uses immutable segment headings:

```markdown
## seg-0001 | 00:00:04–00:00:19 | F1

Facilitator text.
```

Use pseudonyms and explicit `[unclear]`, `[inaudible]`, overlap, translation, and redaction markers. Keep identity maps outside the portable workspace.

Transcript evidence uses the meeting ID as `source_id` and a locator with `path`, `segment_id`, timestamps when available, and speaker pseudonym. After verified extraction, update `ingestion.status`, `ingested_at`, `evidence_ids`, reviewer, and limitations. Do not mark ingestion complete when locators cannot be revisited or consent does not permit the use.

Local loopback review may show a redacted transcript only when every non-facilitator participant permits discovery use. Static export withholds guide and transcript bodies. It also withholds meeting-derived evidence when participant sharing consent is absent and conservatively removes dependent hypotheses, experiments, decisions, comments, and revision summaries so the export neither leaks conclusions nor leaves dangling provenance.
