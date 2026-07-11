---
name: problem-synthesis
description: Use when combining discovery evidence from multiple stakeholders or sources into problem hypotheses. Cluster patterns, preserve contradictions, distinguish facts from interpretations, and produce competing falsifiable frames rather than declaring one “real problem.”
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Problem synthesis

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records.


Develop evidence-backed, falsifiable problem hypotheses. Synthesis reduces complexity; it must not erase provenance, disagreement, edge cases, or uncertainty.

## Workflow

1. **Check inputs.** Ensure evidence has source links and interpretations are separate. Stop and repair provenance before synthesizing unsupported summaries.
2. **Cluster by situation and goal.** Group evidence around triggering contexts, affected groups, goals, behaviors, workarounds, and consequences—not merely repeated keywords or requested features.
3. **Map tensions.** Identify contradictions, different experiences across groups, exceptions, and evidence that challenges the initial request.
4. **Draft competing hypotheses.** For each, state affected group, situation, goal, difficulty, consequence, supporting evidence, contradicting evidence, and unknowns.
5. **Test boundaries.** Ask when the hypothesis does not apply, whether it bundles several problems, and whether the affected group is too broad.
6. **Compare explanatory value.** Evaluate which hypothesis best accounts for available evidence with the fewest unsupported assumptions. Retain alternatives when evidence cannot distinguish them.
7. **Identify learning needs.** Specify the evidence or experiment most likely to separate competing hypotheses.
8. **Prepare review.** Produce a synthesis map that lets stakeholders inspect the evidence and challenge interpretations.

## Problem hypothesis template

> When **[affected group]** is **[situation/trigger]** and trying to **[goal]**, they experience **[difficulty]**, which leads to **[consequence]**. This is supported by **[evidence IDs]**, challenged by **[evidence IDs]**, and remains uncertain because **[unknowns]**.

## Guardrails

- Do not use frequency of mention as a proxy for severity.
- Do not let the original proposed solution determine the clusters.
- Do not merge materially different groups to create artificial consensus.
- Do not assign numeric confidence without a defined measurement basis.
- Do not convert a hypothesis into a requirement.
- Do not call one frame the root cause when causal evidence is absent.

## Completion checklist

- [ ] Every hypothesis is falsifiable and source-linked
- [ ] Supporting and contradicting evidence are both visible
- [ ] Group and situation boundaries are explicit
- [ ] Alternatives remain where evidence is inconclusive
- [ ] Unknowns and next discriminating questions are stated
- [ ] The original requested solution was evaluated rather than assumed

