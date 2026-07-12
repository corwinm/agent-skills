---
name: experiment-increment-design
description: Use when an evidence-backed problem hypothesis is ready for action but important assumptions remain. Generate non-software options, design the cheapest useful experiment or smallest valuable increment, and define what observed result would change the decision.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Experiment and increment design

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records.

Choose the smallest ethical action that produces useful evidence or user value. Do not equate action with building software.

## Workflow

1. **Anchor on the problem.** Restate the reviewed hypothesis, affected group, desired outcome, evidence, contradictions, and decision constraints.
2. **List assumptions.** Cover desirability, behavior, usability, feasibility, viability, operations, policy, adoption, and measurement.
3. **Select the critical uncertainty.** Choose the assumption whose failure would most change the decision and that can be learned about now.
4. **Generate varied interventions.** Include process, communication, training, policy, service, manual, configuration, integration, and software options.
5. **Choose experiment or increment.** Use an experiment when learning dominates; use an increment when evidence supports delivering a narrow useful outcome. State which it is.
6. **Define exposure and safeguards.** Identify participants, consent, blast radius, reversibility, stop conditions, operational owner, and unintended harms.
7. **Define observations.** State expected behavior, qualitative signals, quantitative measures with data sources, observation period, and evidence that would support, challenge, or leave the hypothesis unresolved.
8. **Commit to a decision rule.** Before running, state how results will lead to expand, revise, stop, or gather more evidence.

## Output

Include: problem hypothesis, critical assumption, candidate interventions, selected approach, rationale, participants, procedure, safeguards, signals, data sources, timeframe, decision rule, owner, and follow-up date.

## Thin increment test

A valid increment delivers an observable outcome to a real affected group, can be accepted independently, and does not merely complete an architectural layer. “Create database schema” is usually a task; “allow one pilot team to recover a failed import without support” can be an increment.

## Guardrails

- Do not run deceptive or harmful experiments.
- Do not invent baselines or measurable targets.
- Do not optimize only for adoption when the intended outcome is different.
- Do not make success criteria so broad that every result appears positive.
- Do not build instrumentation that collects more data than needed.

## Completion checklist

- [ ] Action traces to a reviewed problem hypothesis
- [ ] Critical assumption is explicit
- [ ] Non-software options were considered
- [ ] Scope is reversible or appropriately governed
- [ ] Observations use identified data sources
- [ ] Support, challenge, and inconclusive outcomes are defined
- [ ] Owner and decision date are assigned
