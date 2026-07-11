---
name: evidence-backed-problem-brief
description: Use when decision makers need a concise product-discovery brief assembled from prior intake, evidence, synthesis, and stakeholder review. Produce a traceable problem brief without inventing certainty, consensus, requirements, or citations.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Evidence-backed problem brief

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records.


Assemble a decision-ready brief from existing discovery records. This skill does not repair missing discovery by writing plausible prose; it exposes gaps and recommends how to address them.

## Preconditions

Require a preserved original request, source-linked evidence, at least one problem hypothesis, known assumptions and contradictions, and a named decision. If these are missing, produce a gap report instead of a finished brief.

## Workflow

1. **Identify audience and decision.** State who will use the brief, what they must decide, decision owner, and deadline.
2. **Audit provenance.** Verify every consequential claim links to evidence or is labeled interpretation or assumption.
3. **Lead with the decision context.** Summarize the request, why it is being examined now, and what choice is required.
4. **Describe the problem frame.** Name affected group, situation, goal, difficulty, and consequence. Keep alternatives when unresolved.
5. **Present evidence and limits.** Use a small set of representative sources, include contradictory evidence, and describe sampling or data limitations.
6. **State desired outcome and constraints.** Distinguish user or organizational outcomes from delivery outputs.
7. **Show options.** Include non-software options and the original request where relevant. Explain trade-offs and assumptions rather than declaring a winner invisibly.
8. **Recommend the next action.** Propose more discovery, an experiment, a thin increment, defer, or decline. Include rationale, safeguards, owner, decision rule, and revisit point.
9. **Invite correction.** Provide links to source records and identify claims requiring stakeholder confirmation.

## Brief structure

1. Decision needed
2. Original request
3. Affected groups and situation
4. Problem hypothesis or competing frames
5. Evidence, contradictions, and limitations
6. Desired outcome and constraints
7. Assumptions and open questions
8. Options considered
9. Recommendation and next decision point
10. Sources and decision record

Keep the main brief short enough to read before a decision meeting. Move detailed evidence to linked appendices.

## Guardrails

- Never fabricate citations or quotes.
- Never convert stakeholder agreement into evidence that the hypothesis is true.
- Never omit material dissent to make the recommendation cleaner.
- Never hide a missing baseline behind an invented target.
- Never silently turn the recommended experiment into committed requirements.

## Completion checklist

- [ ] Decision and owner appear at the top
- [ ] Original request is preserved
- [ ] Claims trace to evidence or are labeled
- [ ] Contradictory evidence and limitations appear
- [ ] Desired outcomes are distinct from outputs
- [ ] Alternatives and trade-offs are visible
- [ ] Recommendation includes a decision or revisit condition
- [ ] Missing evidence produced a gap report rather than invented certainty

