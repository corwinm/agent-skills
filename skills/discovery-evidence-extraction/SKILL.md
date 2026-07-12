---
name: discovery-evidence-extraction
description: Use when analyzing interview transcripts, notes, support tickets, documents, behavioral data, or observations for product discovery. Extract source-linked evidence while keeping quotes, paraphrases, interpretations, assumptions, and proposed solutions distinct.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Discovery evidence extraction

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records. For meeting preparation or transcript processing, also use [`references/discovery-meeting-workflow.md`](references/discovery-meeting-workflow.md).

Convert source material into traceable discovery records without manufacturing certainty or stripping statements from context.

## Workflow

1. **Register sources.** For a meeting transcript, read `sources/meeting-<id>/meeting.json` before extraction. Verify that consent and privacy fields permit the intended use; `unknown` is not consent. Assign each other source an ID, type, creator or participant where appropriate, date, collection method, scope, and known limitations.
2. **Extract evidence atoms.** Capture one meaningful statement or observation per record. Transcript evidence uses the meeting ID as `source_id` and a locator containing workspace-relative `path`, immutable `segment_id`, timestamps when available, and speaker pseudonym.
3. **Classify faithfully.** Mark each as direct quote, observation, reported experience, behavioral data, or document evidence. Proposed solutions remain proposed solutions.
4. **Add context.** Record affected group, situation, timeframe, frequency only when supported, and relevant surrounding context.
5. **Separate inference.** Put inferred meaning in an interpretation record linked to evidence IDs. Include plausible alternative interpretations.
6. **Identify relationships.** Mark corroboration, tension, duplication, and dependency without treating repeated hearsay as independent confirmation.
7. **Record limitations.** Note sampling limitations, missing context, ambiguous wording, incentives, stale data, and claims made on behalf of others.
8. **Quality review.** Verify quotes against sources and ensure every consequential synthesis claim can trace backward.
9. **Complete ingestion.** After successful extraction, update the meeting manifest's `ingestion.status`, `ingested_at`, `evidence_ids`, reviewer, and transcript-level limitations. Do not mark ingestion complete until every locator can be revisited.

## Extraction rules

- Keep direct quotes verbatim; use ellipses only when meaning is unchanged.
- Mark paraphrases as paraphrases.
- Never infer emotion, intent, identity, frequency, or severity unless supported.
- Preserve `[unclear]`, `[inaudible]`, overlap, redaction, and low-confidence markers; do not silently clean direct quotes.
- Use workspace pseudonyms and keep identity mappings outside the portable workspace.
- If direct quotation is not permitted, create only an allowed paraphrase or no evidence record.
- A participant’s proposed feature is evidence of their preference, not evidence that the feature solves a problem.
- Repeated statements from sources copying one another are not independent corroboration.
- “No one mentioned it” is not evidence that a problem does not exist.

## Output fields

For each evidence item include: ID, statement, type, source ID, source excerpt, source locator, situation, affected group, timeframe, collection date, corroboration, tensions, and limitations.

For each interpretation include: statement, contributing evidence IDs, author, alternatives, and unresolved questions.

## Completion checklist

- [ ] Every evidence record has a source and locator
- [ ] Quotes and paraphrases are visibly distinct
- [ ] Interpretations are stored separately
- [ ] Claims made on behalf of others are marked
- [ ] Contradictions and limitations are preserved
- [ ] Source material can be revisited to audit important claims
