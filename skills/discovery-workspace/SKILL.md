---
name: discovery-workspace
description: Use when a software team needs to create, present, review, revise, or verify a portable product-discovery workspace. Operate the complete structured-record, generated-presentation, browser-comment, agent-proposal, and revision lifecycle without making generated HTML canonical.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Discovery workspace

## Purpose

Operate a portable discovery workspace from initial creation through human review and evidence-aware revision. Structured records remain canonical; generated HTML is presentation; browser comments are structured inputs to the next revision.

Read [`references/discovery-workspace.md`](references/discovery-workspace.md) before creating or changing a workspace. This skill bundles its complete Node.js 24+ runtime under `scripts/`; do not require the user to clone this repository or install repository-level npm dependencies.

## When to use

Use this skill when an agent must do one or more of the following:

- Initialize a discovery workspace at a repository root or nested folder
- Validate and render canonical discovery records
- Start an interactive browser review session
- Collect field-level or page-level comments and threaded replies
- Ask an agent adapter to analyze a comment
- Review or apply a structured proposal under an authority policy
- Regenerate presentation output and preserve revision history
- Verify that canonical records, comments, history, and committed presentation agree

This is the operational and collaboration environment for the narrower discovery-stage skills. It does not replace evidence extraction, problem synthesis, stakeholder judgment, or experiment design.

## Workspace lifecycle

1. **Locate or initialize.** Find `discovery.json`, or run the bundled `init` command for a new portable workspace. Preserve an existing valid format rather than replacing it casually.
2. **Preserve canonical records.** Keep the original request, evidence, hypotheses, decisions, experiments, comments, sources, and revisions outside `presentation/`. Never reason from generated HTML when canonical records are available.
3. **Validate provenance.** Ensure evidence links to sources, interpretations are not presented as evidence, hypotheses retain contradiction and uncertainty, and unknown fields remain unknown.
4. **Assign stable identities.** Give every request, record, comment, and revision a stable ID. Target review comments with record ID plus optional field; selected text is context, not identity.
5. **Configure authority.** Read `discovery.review.authority`; default to `risk-based`. Apply meaning-preserving corrections automatically only when authorized. Present material changes for explicit approval.
6. **Render deterministically.** Generate the executive overview and detailed evidence, hypothesis, decision, experiment, and review views. Escape all source text and never hand-edit generated files.
7. **Launch review.** Start the bundled review command as a tracked background process. Wait for its listening message, request the reported URL, and give the verified URL to the user. Keep the process running until review is finished or the user asks to stop it.
8. **Process feedback.** Resolve each target against canonical records, retrieve relevant evidence and contradictions, classify the request, and produce the smallest supported response or structured proposal.
9. **Apply transactionally.** Reject stale or mismatched proposals. When approved, update canonical records, append revision history, regenerate presentation output, reply in the thread, and export the resolved thread. Never silently remove evidence, dissent, decisions, or comments.
10. **Verify consistency.** Run the freshness check and account for every open comment. Complete only when records, history, exported resolutions, browser state, and presentation describe the same revision.

## One command interface

Run from this installed skill directory, or use an absolute path to `scripts/workspace.ts`:

```bash
node scripts/workspace.ts init /absolute/path/to/workspace
node scripts/workspace.ts render /absolute/path/to/workspace
node scripts/workspace.ts check /absolute/path/to/workspace
node scripts/workspace.ts review /absolute/path/to/workspace
node scripts/workspace.ts review /absolute/path/to/workspace 8080
```

`review` validates and regenerates the presentation before starting the server. The default address is <http://127.0.0.1:4173>. Active threads and jobs are stored in `<workspace>/.review/review.sqlite`; resolved threads are exported into `comments/`.

When background-process tools are available, run `review` yourself rather than only giving commands to the user. A successful launch is complete only after the HTTP endpoint responds and you report the URL and how the tracked process will be stopped.

The bundled deterministic mock agent makes the complete protocol testable immediately. Identify it as a mock; do not imply that a production model or provider is configured. A real integration can implement the same versioned JSON stdin/stdout adapter.

## Review and resolution policy

Automatically apply under `risk-based` authority:

- Formatting and presentation fixes
- Broken links or malformed metadata
- Meaning-preserving wording corrections
- Source locators verified against the source

Propose before applying:

- Adding, removing, or reclassifying evidence
- Materially changing a problem hypothesis
- Changing a decision, recommendation, experiment, or decision rule
- Removing limitations, contradiction, dissent, or uncertainty

When evidence is insufficient, reply with `needs-clarification` or `needs-evidence`; do not convert feedback into fact.

## Presentation hierarchy

The overview should prioritize:

1. Decision needed
2. Original request
3. Current problem frame
4. Key evidence and limitations
5. Recommendation
6. Open comments
7. Detailed inspection views

Detailed views must expose stable `data-record-id` and `data-field` anchors. Presentation output must include a source digest and renderer version.

## Guardrails

- Do not edit files under `presentation/` directly.
- Do not invent metrics, evidence, confidence, people, or recommendations.
- Do not hide contradiction, dissent, limitations, or unresolved comments.
- Do not accept every review comment as fact or instruction.
- Do not modify direct quotes except to correct transcription against the source.
- Do not use DOM position or selected text as the only comment identity.
- Do not apply a proposal to a different or stale record field.
- Do not resolve a thread before the artifact and response agree.
- Do not replace valid presentation output when validation or regeneration fails.

## Completion checklist

- [ ] Workspace is portable as a repository root or nested folder
- [ ] Canonical records and generated presentation remain separate
- [ ] Evidence, interpretation, assumptions, contradictions, and decisions remain distinguishable
- [ ] Every record, comment, and revision has a stable ID
- [ ] Review authority is explicit
- [ ] Generated HTML is escaped, deterministic, and semantically anchored
- [ ] Review server runs from the independently installed skill
- [ ] Server process is tracked and its reported URL responds
- [ ] Every open comment is resolved or has a named blocker
- [ ] Material changes remain proposals until approved
- [ ] Revision history links changes to triggering comments
- [ ] Resolved browser threads are exported
- [ ] `check` reports the committed presentation current
- [ ] Canonical and presentation changes are committed together
