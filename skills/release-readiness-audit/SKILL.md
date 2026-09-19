---
name: release-readiness-audit
description: Use when deciding whether a specific change is ready to merge, deploy, or release. Derive applicable gates from repository policy and change risk, then issue an evidence-backed verdict instead of applying a generic checklist.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Release readiness audit

Decide whether one exact candidate is ready for one exact transition. Treat readiness as a claim that must be supported by current, attributable evidence—not as a summary of whichever checks happen to be visible.

## When to use

Use this skill for requests such as:

- “Is this pull request ready to merge?”
- “Can this revision go to staging or production?”
- “Are we ready to publish version 2.4.0?”
- “What still blocks this release?”
- “Audit the release after a failed or interrupted publication.”

Do not use it as a substitute for implementing fixes, performing a full code review, or operating a deployment. Those may supply evidence to this audit, but each has its own workflow and authority boundary.

## Core rules

1. **Fix the identity first.** A green result for a different commit, tag, branch, artifact, environment, or release target is not evidence for the candidate.
2. **Derive gates; do not invent a universal checklist.** Repository policy, branch protection, release automation, deployment configuration, ownership rules, and the change’s risk define what is required.
3. **Check completeness before success.** “All observed checks passed” is weaker than “every required check is present and passed.”
4. **Respect the audit boundary.** Default to existing authoritative evidence. Do not build, install, start, deploy, publish, or run candidate code or migrations merely to complete an audit. Execute only with explicit authorization for that action and an isolated, disposable environment appropriate to its risk.
5. **Prefer exercised outputs.** A source build alone does not prove that the package, image, archive, migration, or deployment users receive works. Missing evidence or permission to produce it remains missing; never silently downgrade or bypass the gate.
6. **Keep facts, inferences, blockers, and waivers distinct.** Missing evidence is not passing evidence. A waiver is not the same as a fixed blocker.
7. **Time-box the verdict.** Readiness expires when the candidate, target, policy, dependencies, environment, approvals, or relevant evidence changes.

## Audit workflow

### 1. Pin the candidate and transition

Record the audit subject before collecting status:

- transition: **merge**, **deploy**, or **release**;
- repository and target branch, environment, registry, channel, or release destination;
- candidate commit SHA and, when relevant, tag, version, build ID, artifact digest, or deployment revision;
- local branch/head and authoritative remote head;
- audit time and evidence retrieval time;
- requested scope, such as one service, package, workspace, or coordinated release.

Resolve symbolic names to immutable identities where possible. Compare local and remote state explicitly; fetch or query the authoritative remote before trusting a local branch. If the local head, remote branch head, reviewed head, tested head, and artifact source revision differ, stop treating their evidence as interchangeable.

Record source-worktree state separately from commit identity. Uncommitted or untracked files can affect a local build even when `HEAD` matches the candidate. Never attribute an artifact produced from a dirty primary checkout to the pinned `HEAD`. For any audit-authorized local build, require either (a) a clean isolated checkout or worktree at the exact candidate or (b) verifiable proof that the build context excludes every local change and contains exactly the candidate inputs. Record that source-state proof with the resulting artifact identity.

Optional command examples (adapt to the available provider and tools):

```sh
git rev-parse HEAD
git rev-parse <remote>/<branch>
git status --short --branch
git log -1 --format='%H %cI %s' <candidate>
```

**Complete when:** the candidate and destination are immutable or precisely resolved, the working-source state is known, and every later evidence item can be tied to the exact candidate rather than merely the current `HEAD` label.

### 2. Derive the applicable gates

Inspect the repository rather than assuming its process. Sources may include:

- contribution and release documentation;
- branch protection or merge rules;
- ownership and review policies;
- CI/CD and packaging workflows;
- deployment manifests and environment promotion rules;
- versioning, changelog, migration, and compatibility conventions;
- security, dependency, provenance, signing, and license policy;
- prior releases only as supporting convention, never as stronger authority than current policy.

Then add risk-derived gates proportional to the actual diff. Examples: a schema change may require migration and rollback evidence; a dependency update may require advisory and license review; an authentication change may require security review; a documentation-only change normally should not inherit production soak requirements.

Build a small gate register:

| Gate                         | Why applicable              | Required evidence                         | Authority/source  | State   |
| ---------------------------- | --------------------------- | ----------------------------------------- | ----------------- | ------- |
| Example: migration rehearsal | schema changes in candidate | successful rehearsal plus rollback result | deployment policy | missing |

Use these distinct gate families:

| Transition | Primary question                                             | Typical evidence                                                                                           |
| ---------- | ------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------- |
| Merge      | May this exact revision enter the target branch?             | required checks, review decisions, conversations, branch rules, mergeability                               |
| Deploy     | May this built revision enter the target environment?        | artifact identity, environment approvals, config/migration readiness, rollout and acceptance evidence      |
| Release    | May this version/artifact be published or promoted to users? | version/tag alignment, releasable artifacts, notes/docs, provenance, publication state, channel acceptance |

A request can involve more than one family. Passing merge gates does not imply deploy or release readiness.

**Complete when:** every gate has a policy or risk rationale, an evidence requirement, and an authority. Remove gates that have no defensible applicability.

### 3. Establish gate completeness and current status

For each applicable gate, answer in this order:

1. Is the required check, approval, or evidence present?
2. Does it apply to the exact candidate and target?
3. Is it final, successful, and still current?
4. Is the reported set complete according to policy?

Account for expected checks that never started, were skipped, were renamed, are stuck, or disappeared due to path filters or workflow configuration. A passing subset is not a complete required set. Treat neutral, skipped, cancelled, stale, or “not reported” states according to explicit policy, not as success by convenience.

For review state, inspect more than approval counts:

- required reviewer or owner approvals;
- approvals dismissed or made stale by newer commits;
- change requests;
- unresolved review threads or requested follow-ups;
- merge queue state and conflicts;
- policy-required acknowledgements for generated files, migrations, security-sensitive areas, or release notes.

Do not infer that a resolved thread means the concern was correctly addressed; tie resolution to the candidate diff or an explicit reviewer decision.

**Complete when:** the register includes every required gate, each state is normalized, and no result belongs to another revision or target.

### 4. Verify the built and exercised deliverable

Identify what crosses the boundary: merge commit, package, container, binary, archive, migration bundle, documentation site, mobile build, infrastructure plan, or another artifact.

First seek authoritative CI, registry, provenance, attestation, or prior acceptance evidence for the exact candidate and target. An audit is observational by default: do not run build, package, install, start, import, render, migration, deployment, or publication commands without explicit user or policy authorization for the specific action. Candidate code and migrations may execute only in an isolated, disposable environment with no production credentials or unintended external side effects and with cleanup or rollback defined. If authorization, isolation, or required existing evidence is absent, mark the applicable gate `missing` or `blocked`; do not execute anyway and do not recast the gate as optional.

When an artifact exists:

1. Identify the authoritative CI-produced artifact, or, only when the execution conditions above are met, build it through the intended release path from a clean isolated checkout/worktree of the exact candidate. A build from another context is acceptable only with verifiable proof that its input boundary excludes all local changes and exactly matches the candidate.
2. Record the artifact's immutable identity (such as a digest), source revision, source-tree cleanliness or exclusion proof, build context, and provenance. Bind these records together; a matching `HEAD` alone is insufficient attribution.
3. Inspect package contents and metadata where relevant.
4. Using authoritative existing results or explicitly authorized execution in the isolated disposable environment, install, start, import, unpack, render, migrate, or otherwise exercise the artifact in a representative clean context.
5. Use existing evidence or authorized execution to establish a focused smoke or acceptance path against the built output, not only the source tree.
6. Confirm the artifact promoted or proposed is the one exercised; rebuilding later creates a new candidate unless reproducibility is established.

Scale this to the change. A prose-only merge may need no artifact. A library release should normally test the packed package rather than only workspace imports. A deployment should identify the image digest or equivalent, not merely a mutable tag.

**Complete when:** either authoritative evidence shows that the actual deliverable was built and exercised with its identity bound to the exact clean source state, or the audit records the missing evidence or authorization as an unmet gate, or the audit explains why no artifact gate applies.

### 5. Check cross-surface alignment

Compare the candidate across all affected release surfaces:

- declared version, tag, package metadata, lockfiles, and release channel;
- changelog or release notes and the actual diff;
- user, operator, API, and configuration documentation;
- migrations, rollback instructions, compatibility windows, and sequencing;
- generated files, schemas, examples, and manifests;
- dependency changes, known advisories, integrity/provenance, and licenses.

Apply dependency, security, and license scrutiny in proportion to scope and exposure. Record which scanners, advisory sources, policy checks, or manual analyses were used and their coverage. Do not claim “secure” or “license compliant” merely because one tool returned no findings. New runtime dependencies, redistributed assets, privileged code, external inputs, or changed trust boundaries justify deeper evidence than an internal typo fix.

**Complete when:** every changed public or operational surface is aligned, or each mismatch is recorded as a blocker or authorized waiver.

### 6. Inspect destination and partial state

For deployment or publication, inspect the destination directly. Determine whether a prior attempt created partial state, for example:

- some workspace packages published while others failed;
- a tag or release object created without all assets;
- an image pushed under one tag but not promoted;
- a migration applied before application rollout failed;
- a canary or subset of regions running the candidate;
- documentation or metadata published ahead of binaries;
- mutable channels pointing at mixed revisions.

Do not retry blindly. Establish what is already externally visible, whether the operation is safely repeatable, and whether recovery requires completing, rolling back, deprecating, or issuing a new version. Treat irreversible or ambiguous partial publication as a blocker until an authorized recovery path exists.

For deployments, gather acceptance evidence from the target or a policy-approved equivalent: rollout status, health, smoke tests, telemetry, migration status, and required observation windows. CI success alone is not environment acceptance.

**Complete when:** the destination state is known, partial effects are accounted for, and environment acceptance evidence meets the derived gates.

### 7. Resolve blockers and waivers

Classify every unmet gate:

- **Blocker:** required evidence is missing, failed, stale, mismatched, or contradicted.
- **Waiver:** the gate remains unmet, but an identified authority explicitly accepts the defined risk for this candidate and target.
- **Not applicable:** a documented policy or scope reason removes the gate.
- **Advisory:** useful follow-up that is not a required gate.

A valid waiver records:

- the exact gate and risk being accepted;
- scope: candidate, target, and duration;
- named role or authority permitted to approve the bypass;
- explicit approval evidence;
- compensating controls and follow-up owner/date, if required.

Never self-authorize a risky bypass, infer approval from silence, or present a command that disables protection as the resolution. If authority cannot be established, the item remains a blocker.

**Complete when:** every unmet gate is either still a blocker or covered by a specific, authorized, unexpired waiver.

### 8. Issue the verdict

Use one verdict:

- **READY** — every applicable gate is satisfied for the exact candidate and target, with no waiver required.
- **NOT READY** — at least one blocker remains, evidence is incomplete, candidate identity is inconsistent, or partial state lacks an authorized recovery path.
- **READY WITH WAIVERS** — every otherwise-unmet gate has a valid waiver and no blocker remains. State the waivers prominently.
- **INDETERMINATE** — authoritative state cannot be obtained or gate applicability cannot be resolved. This is not readiness.

Report compactly:

```markdown
## Verdict: <READY | NOT READY | READY WITH WAIVERS | INDETERMINATE>

Candidate: <revision/artifact>
Target: <branch/environment/registry/channel>
Evidence current as of: <timestamp>
Verdict expires when: <specific invalidators or deadline>

### Gate evidence

- PASS — <gate>: <evidence and immutable identity>
- BLOCK — <gate>: <failure or missing evidence>
- WAIVED — <gate>: <authority, scope, expiry, evidence>
- N/A — <gate>: <reason>

### Completion criteria

- <actions and evidence required to reach READY, or “None”>

### Residual advisories

- <non-blocking follow-up, clearly separated>
```

Link or cite evidence where the medium permits. Include enough detail for another agent or reviewer to reproduce the decision. State explicit invalidators, such as a new commit, force-push, changed target, rerun with different inputs, new advisory, expired approval, rebuilt artifact, deployment drift, or elapsed observation window.

**Complete when:** the verdict follows mechanically from the gate register, blockers are not hidden among advisories, and the path from the present state to `READY` is explicit.

## Common failure modes

- **Checklist substitution:** applying every familiar gate instead of deriving applicable ones.
- **Green-subset fallacy:** reporting success without proving all required checks are present.
- **Revision drift:** combining review, CI, and artifact evidence from different heads.
- **Dirty-build misattribution:** labeling an artifact as the pinned `HEAD` even though a dirty checkout could have changed its inputs.
- **Source-only confidence:** testing a workspace but never the shipped artifact.
- **Audit-to-operation escalation:** running candidate code or migrations without explicit authorization and a safe isolated disposable environment instead of reporting missing evidence.
- **Transition collapse:** calling a mergeable change deployable or releasable without destination evidence.
- **Approval laundering:** treating an unresolved conversation, stale approval, or unauthorized waiver as consent.
- **Publication blindness:** assuming a failed release made no external changes.
- **Timeless verdict:** saying “ready” without an evidence time, expiry condition, or target.
- **Security overclaim:** translating narrow scanner output into a broad assurance claim.

## Final verification

Before returning the audit, confirm:

- [ ] Candidate revision, artifact identity, source state, and target are exact.
- [ ] Local, remote, reviewed, tested, built, and proposed identities agree or differences are blockers; every locally built artifact has clean-checkout or build-context exclusion proof bound to its digest.
- [ ] Merge, deploy, and release gates are distinguished.
- [ ] The full required gate set is present; passing checks are not merely a subset.
- [ ] Review decisions and unresolved threads are accounted for.
- [ ] Existing authoritative evidence is preferred; any audit-triggered execution had explicit authorization and used an isolated, disposable safe environment.
- [ ] The actual artifact is built and exercised when applicable, or missing evidence or execution permission is reported as an unmet gate.
- [ ] Version, notes, docs, migrations, dependencies, security, and licenses are aligned in proportion to scope.
- [ ] Partial publication or deployment state and environment acceptance are known.
- [ ] Every bypass has explicit authority, scope, evidence, and expiry.
- [ ] The verdict names blockers, waivers, staleness conditions, and exact completion criteria.
