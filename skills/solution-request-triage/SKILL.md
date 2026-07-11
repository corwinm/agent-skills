---
name: solution-request-triage
description: Use when someone requests a specific product, feature, platform, automation, migration, dashboard, or other solution and the underlying user problem is unclear. Preserve the request, expose embedded assumptions, and decide the appropriate discovery response.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Solution request triage

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records.


Turn a solution-shaped request into a transparent assessment without pretending the agent already knows the underlying problem. Do not rewrite or discard the original request.

## Workflow

1. **Capture verbatim.** Record the exact request, requester, source, urgency, stated rationale, and proposed solution. Complete when another person can distinguish what was actually requested from later interpretation.
2. **Find the trigger.** Ask what happened recently, who encountered it, and what consequence prompted the request. Prefer a concrete episode over a general claim.
3. **Unpack the solution.** Identify the capabilities and assumptions embedded in the request. Ask what the requester expects to become easier or different.
4. **Map affected groups.** List direct users, people performing work today, downstream recipients, operators, approvers, and groups bearing risk. Mark unconsulted groups.
5. **Separate records.** Classify each statement as evidence, interpretation, assumption, constraint, desired outcome, or proposed solution. Do not promote an assertion to evidence without a source.
6. **Assess readiness.** Choose one recommendation: clarify immediately, conduct lightweight discovery, investigate deeply, run a reversible experiment, fulfill as specified because the problem is already evidenced, or decline/defer.
7. **Return an assessment.** Include the verbatim request, possible problem hypotheses labeled as tentative, evidence available, assumptions, missing perspectives, open questions, and recommended next action.

## Question order

Ask only the next question that can materially change the recommendation. Good early questions include:

- “Tell me about the most recent time this happened.”
- “Who was trying to accomplish what?”
- “What did they do instead?”
- “What consequence did that create?”
- “Why does this need attention now?”
- “What makes this proposed solution seem appropriate?”

Do not make the requester complete a long generic questionnaire when an adaptive conversation is possible.

## Guardrails

- Do not use “the real problem is” without sufficient evidence.
- Do not imply that a solution request is invalid merely because it is solution-shaped.
- Do not invent frequency, severity, cost, affected users, or consensus.
- Treat deadlines, regulations, and contractual commitments as constraints that can legitimately narrow discovery.
- Keep multiple plausible problem hypotheses when evidence does not distinguish them.

## Completion checklist

- [ ] Original request remains verbatim and identifiable
- [ ] At least one concrete triggering example was requested
- [ ] Evidence and assumptions are separate
- [ ] Missing stakeholder perspectives are explicit
- [ ] Recommendation matches the uncertainty and reversibility involved
- [ ] No implementation backlog was generated without a decision

