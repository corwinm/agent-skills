---
name: release-readiness-audit
description: Use when deciding whether a specific change is ready to merge, deploy, or release. Derive applicable gates from repository policy and change risk, then issue an evidence-backed verdict instead of applying a generic checklist.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Release readiness audit

Decide whether an exact candidate is ready for an exact transition using current, attributable evidence.

## Activation

Use for merge, deploy, publish, promote, or interrupted-release decisions. Do not use it to implement fixes, replace code review, or operate deployments; those workflows may supply evidence but retain separate authority and safety boundaries.

## Invariants

- Pin repository, commit, target branch/environment/registry/channel, transition (`merge`, `deploy`, or `release`), scope, and evidence time. Resolve symbolic source/artifact names to immutable identities.
- Compare authoritative remote, local, reviewed, tested, built, and proposed heads; record worktree state separately. Evidence for another source or target does not transfer.
- Derive gates from current policy, branch protection, ownership, CI/CD, release/deployment configuration, and candidate risk—not a universal checklist or historical convention.
- Prove the complete required set before calling checks green. Missing, skipped, neutral, cancelled, stale, filtered, renamed, stuck, or absent checks pass only under explicit policy.
- Separate facts, inferences, blockers, waivers, N/A gates, and advisories. Missing evidence is not passing evidence; waivers are not fixes.
- Treat every verdict as time-bounded. A changed candidate, target, policy, dependency, environment, approval, artifact, destination state, or relevant evidence invalidates it.

## Audit

### 1. Build the gate register

For each gate, record transition, rationale, authority, required evidence, candidate/target, state, and evidence location/time.

- **Merge:** full required-check set; mergeability/conflicts/queue; required owner/reviewer decisions; stale/dismissed approvals; change requests; unresolved threads/follow-ups; policy acknowledgements.
- **Deploy:** artifact identity; environment approval/config; migration/rollback readiness; rollout, target health, smoke/acceptance, telemetry, and required observation window.
- **Release:** version/tag/package/channel alignment; releasable artifact/provenance; notes/docs; approvals; destination state; channel acceptance.

A request may require several families; merge readiness never implies deploy or release readiness. Add proportional risk gates: schema changes need migration/rollback evidence; authentication or trust-boundary changes may need security review; dependency changes may need advisory, integrity, provenance, and license review. Remove gates without policy or risk rationale.

For every gate, determine whether evidence is present, exact-candidate/target, final, successful, current, and complete. A resolved thread is insufficient unless the candidate diff or explicit reviewer decision addresses it.

### 2. Verify source and deliverable identity safely

Prefer authoritative CI, registry, provenance, attestation, and acceptance evidence. Audits are observational by default: never build, install, start, import, render, migrate, deploy, publish, or execute candidate code merely to fill evidence gaps.

Execute only with explicit authorization for the exact action, in an isolated disposable environment without production credentials or unintended external effects, with cleanup/rollback defined. Use an exact clean candidate checkout/worktree; another context requires proof that it excludes local changes and exactly matches candidate inputs. Otherwise mark the gate missing or blocked.

When an artifact applies:

1. Identify the release-path artifact and immutable digest or equivalent.
2. Bind digest, source revision, clean-source/build-context proof, build inputs, and provenance.
3. Inspect relevant contents/metadata, then use existing evidence or authorized isolated execution to exercise shipped output—not just source—through a representative install/start/import/unpack/render/migrate and smoke/acceptance path.
4. Confirm the proposed/promoted artifact was exercised. Rebuilds are new candidates unless reproducible.

Scale to risk: prose merges may lack artifact gates; package releases should exercise packed output; deployments should identify digests, not mutable tags.

### 3. Check alignment, destination, and acceptance

Align every affected surface: version, tag, package metadata, lockfiles, channel, changelog/notes, user/operator/API/config docs, generated files, schemas, manifests, migrations, sequencing, rollback, and compatibility windows.

Scale dependency, security, provenance, integrity, and license checks to scope/exposure. Record tools, sources, and coverage; narrow clean output proves no broad assurance. Runtime dependencies, redistributed assets, privileged code, external inputs, or changed trust boundaries demand stronger evidence than prose changes.

For deploy/release, inspect the destination for partial or mixed state: package subsets, releases without assets, unpromoted images, applied migrations, split canaries/regions, early docs/metadata, or channels mixing artifacts. Never retry blindly. Establish visibility, repeatability, and an authorized complete/rollback/deprecate/new-version path; irreversible or ambiguous state blocks readiness.

CI success is not environment acceptance. Require derived rollout, health, smoke, telemetry, migration, and observation evidence from the target or approved equivalent.

### 4. Classify and decide

- **Blocker:** required evidence is missing, failed, stale, mismatched, contradicted, or partial state lacks authorized recovery.
- **Waiver:** authorized explicit acceptance of a defined unmet gate/risk for this candidate, target, and duration. Record evidence, authority, scope, expiry, and required compensating control/owner/date. Never infer consent, self-authorize, or call disabled protection resolution.
- **N/A:** policy or scoped risk analysis establishes that the gate does not apply.
- **Advisory:** useful follow-up that is not required for this transition.

Issue one verdict: **READY** when every gate passes unwaived; **READY WITH WAIVERS** when valid waivers cover every unmet gate and no blocker remains; **NOT READY** with any blocker; **INDETERMINATE** when authority or applicability is unknown (never readiness).

Report the exact candidate/artifact and target, evidence timestamp and links, each gate's state and attributable evidence, blockers, prominent waiver authority/scope/expiry, residual advisories, verdict invalidators or deadline, and exact actions/evidence needed to reach `READY`.

## Completion

Complete only when candidate, source, artifact, destination, and evidence agree; every derived gate, required check, and unresolved review is accounted for; execution stayed authorized and isolated; alignment, partial state, and acceptance were assessed; bypasses are valid waivers; and the verdict follows from evidence with exact expiry and completion criteria.
