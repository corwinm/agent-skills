---
name: discovery-comment-resolution
description: Use when a reviewer has commented on a structured discovery artifact or its GitHub pull request. Resolve hybrid record, field, and text-selection comments under a configurable risk-based authority policy while preserving evidence, dissent, decisions, and revision history.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Discovery comment resolution

## Purpose

Consume review comments as structured inputs to discovery revision. Apply safe corrections, propose material changes, and leave an auditable explanation for every comment.

Read [`references/discovery-workspace.md`](references/discovery-workspace.md) before processing comments.

## Workflow

1. **Collect open comments.** Read unresolved GitHub review threads and files under `comments/`. Preserve GitHub identity, timestamp, URL where available, selected text, and semantic target.
2. **Resolve the target.** Locate the canonical record using `target.record_id` and `target.field`. Treat selected text as context, not identity. If the record or field no longer exists, mark the comment `needs-clarification` rather than guessing.
3. **Retrieve provenance.** Read the targeted record, linked evidence, source excerpts, contradictory evidence, relevant decisions, and later revisions before interpreting the feedback.
4. **Classify the request.** Choose correction, clarification, evidence challenge, interpretation challenge, problem-frame change, decision change, experiment change, or presentation-only change.
5. **Apply the authority policy.** Follow `discovery.review.authority`. Under the default `risk-based` policy, apply meaning-preserving corrections automatically and propose material discovery changes.
6. **Update canonical records.** Make the smallest supported change. Never alter source material or direct quotes to satisfy feedback.
7. **Record resolution.** Set the action, explanation, changed record IDs, resolver, and timestamp. Append a revision entry triggered by the comment.
8. **Regenerate presentation.** Run the artifact renderer and freshness check. Source records, comment resolution, revision ledger, and HTML must agree.
9. **Respond on GitHub.** Explain what changed, what was proposed, or which evidence is still needed. Resolve the thread only after the committed artifact reflects the response.

## Risk-based policy

Automatically apply:

- Formatting and presentation fixes
- Broken links or malformed metadata
- Meaning-preserving wording corrections
- Source locators and citations verified against the source

Propose first:

- Adding, removing, or reclassifying evidence
- Materially changing a problem hypothesis
- Changing a decision, recommendation, experiment, or decision rule
- Removing limitations, contradiction, dissent, or uncertainty

When uncertain, choose `needs-clarification` or `needs-evidence`; do not silently convert a comment into a fact.

## Resolution format

```json
{
  "status": "resolved",
  "resolution": {
    "action": "revised",
    "summary": "Narrowed the difficulty to the observed situation.",
    "changed_records": ["problem-001"],
    "resolved_at": "2026-07-11T19:10:00Z",
    "resolved_by": "discovery-agent"
  }
}
```

Allowed actions are `revised`, `accepted-no-change`, `needs-clarification`, `needs-evidence`, and `superseded`.

## Guardrails

- Do not accept every comment as fact or instruction.
- Do not fabricate evidence to resolve a disagreement.
- Do not modify direct quotes except to correct transcription against the source.
- Do not resolve a GitHub thread before the artifact and response are updated.
- Do not silently remove evidence, dissent, decisions, comments, or revision history.
- Do not combine unrelated comments into an opaque rewrite.

## Completion checklist

- [ ] Every open comment was accounted for
- [ ] Stable record and field target was resolved
- [ ] Relevant sources and contradictions were read
- [ ] Authority policy was applied explicitly
- [ ] Material changes are proposals unless approved
- [ ] Comment contains a resolution or a named blocker
- [ ] Revision ledger links the triggering comment and changed records
- [ ] Generated HTML is current
- [ ] GitHub response matches the committed change
