---
name: adaptive-discovery-intake
description: Use when conducting asynchronous or conversational discovery with a requester after a solution-shaped request has been triaged. Ask adaptive, non-leading follow-ups that collect concrete examples, affected groups, outcomes, constraints, and uncertainties.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Adaptive discovery intake

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records.

Conduct a respectful asynchronous interview that gives a human facilitator a strong starting point. The goal is useful evidence and unanswered questions, not a polished specification.

## Workflow

1. **Set expectations.** Explain that the request is being preserved and the questions are intended to understand context, not reject the idea. Complete when the requester knows how their answers will be used.
2. **Start with an episode.** Ask for the most recent or representative occurrence: trigger, people involved, actions, tools, workaround, and consequence.
3. **Follow the evidence.** Ask one to three questions at a time based on the previous answer. Seek observable behavior before opinions about features.
4. **Explore variation.** Ask when the problem does not occur, who experiences it differently, and whether the example is typical.
5. **Clarify outcomes and constraints.** Ask what improvement would matter and what legal, technical, organizational, timing, or policy constraints are fixed versus assumed.
6. **Expand the source map.** Identify people, records, analytics, tickets, documents, and workflows that could corroborate or challenge the account.
7. **Reflect, do not conclude.** Summarize what was heard using tentative language and ask the requester to correct it.
8. **Handoff to a facilitator.** Produce a structured intake with source-linked claims, assumptions, candidate stakeholders, open questions, and recommended discovery actions.

## Adaptive rules

- If an answer is abstract, ask for an example.
- If an answer contains a number, ask for its source and period.
- If the requester speaks for another group, seek a member of that group.
- If urgency dominates, ask what happens if nothing changes by the date.
- If the proposed solution reappears, ask what outcome it is expected to cause.
- If sensitive information appears, minimize capture and follow applicable handling policy.
- If the requester cannot answer, record the unknown rather than pressuring them to speculate.

## Avoid leading questions

Prefer “How do people handle this today?” over “Would automation save time?” Prefer “What would improve?” over “Would a dashboard solve it?”

## Handoff format

Return:

- Verbatim request and requester
- Concrete episodes
- Source-linked claims
- Affected groups and missing voices
- Current behaviors and workarounds
- Consequences and desired outcomes
- Constraints
- Assumptions
- Contradictions or uncertainty
- Suggested evidence sources
- Recommended human follow-up

## Completion checklist

- [ ] At least one concrete episode is documented or explicitly unavailable
- [ ] Statements made on behalf of others are marked
- [ ] Quantitative claims include a source or are marked unverified
- [ ] Requester corrected or accepted the reflective summary
- [ ] Unknowns remain visible
- [ ] Human facilitator has actionable next steps
