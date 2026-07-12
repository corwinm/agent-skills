---
name: discovery-plan-design
description: Use when a software team needs to plan interviews, observations, document review, or data collection after initial intake. Prioritize learning around risky assumptions and contested problem hypotheses.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Discovery plan design

## Purpose

Use [`references/discovery-artifact.md`](references/discovery-artifact.md) when creating or exchanging structured discovery records. For meeting preparation or transcript processing, also use [`references/discovery-meeting-workflow.md`](references/discovery-meeting-workflow.md).

Design the smallest credible research plan that can change a decision. Do not default to a fixed number of interviews or a broad research program.

## Workflow

1. **Name the decision.** State what choice discovery must inform, who owns it, and when it must be made. If no decision exists, clarify before designing research.
2. **Inventory current knowledge.** List evidence, interpretations, assumptions, candidate hypotheses, contradictions, and constraints separately.
3. **Rank uncertainty.** Prioritize unknowns by consequence if wrong, current uncertainty, and cost of learning. Explain rankings qualitatively.
4. **Choose methods.** Match each priority question to a method: interview for experience and meaning, observation for actual workflow, records for history, analytics for behavior at scale, prototype for response to an intervention.
5. **Sample perspectives.** Include directly affected people, edge cases, operators, downstream groups, decision makers, and dissenting or underserved groups. Explain why each perspective matters.
6. **Prepare a meeting bundle.** Create `sources/meeting-<id>/meeting.json` plus `guide.md` using the bundled assets in this skill. Link learning questions to the pending decision and existing record IDs. Include a neutral episode-based guide, counterexample prompts, agenda, opening consent script, capture plan, privacy handling, and post-meeting transcript instructions. Avoid presenting the proposed solution unless evaluating it is explicitly part of the study.
7. **Set stopping conditions.** Define what finding would change the decision, what evidence is sufficient for the next reversible step, and when to extend research.
8. **Plan synthesis and review.** Assign capture format, provenance, privacy handling, synthesis owner, stakeholder review, and decision date.

## Output

Produce a compact plan containing:

- Decision and owner
- Deadline and constraints
- Priority learning questions
- Existing evidence and gaps
- Participant/source map
- Method per question
- Interview or observation guide
- Portable meeting manifest and capture contract
- Capture and consent considerations
- Contradiction-seeking strategy
- Stopping conditions
- Synthesis and decision checkpoints

For later meetings, populate `adapted_from` and derive questions from unresolved contradictions, weak assumptions, missing perspectives, and evidence that would change the decision. Do not repeat a generic guide when prior evidence exists.

## Guardrails

- Do not confuse stakeholder seniority with evidentiary weight.
- Do not seek only people likely to validate the request.
- Do not promise statistical representativeness from qualitative work.
- Do not collect personal or sensitive data without a clear need and handling plan.
- Do not research indefinitely when a cheap reversible action can answer the question.

## Completion checklist

- [ ] Every activity maps to a learning question and decision
- [ ] High-risk assumptions receive attention first
- [ ] Missing and dissenting perspectives are intentionally sampled
- [ ] Methods fit the type of question
- [ ] Stopping conditions are explicit
- [ ] Evidence capture preserves provenance
