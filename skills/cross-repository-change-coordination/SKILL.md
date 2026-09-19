---
name: cross-repository-change-coordination
description: Use when one logical change spans multiple repositories and needs coordinated scope, review, validation, merge ordering, or recovery. Track repository-specific evidence against one canonical change identifier without assuming a host, workflow system, or implementation language.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Cross-repository change coordination

Coordinate one delivery while keeping each repository reviewable. Keep a durable record; provider readbacks—not memory—are evidence. Use any provider-neutral review mechanism.

## When to use

Use when coordinated source changes span two or more repositories. Do not use for a single-repository change or ordinary consumption of an already released dependency.

## Authority boundaries

- The requested outcome and repositories define scope. Discover adjacent work, but ask before adding it.
- Capability is not consent. Do not push, rewrite history, retarget, merge, close, abandon, or clean up without user authorization or explicit repository policy.
- Follow each repository's rules. Stop at conflicts or ambiguous merge/recovery choices; present evidence, options, and consequences.
- Never infer completion from local code, approval, or checks on another revision.

## Workflow

### 1. Create one canonical record

Create or adopt an issue, document, ticket, review, or versioned file. Assign one canonical change ID; reuse it in branches and reviews. Record:

- observable outcome, authorized scope, prohibited actions, and merge decision-maker;
- a dependency/order map with compatibility-labeled `producer -> consumer` and `parent -> child` edges;
- per repository: identity, local path, bounded paths/behavior, immutable base/head, work handle, review, owner, state, and gates;
- implementation, validation, merge, release, recovery, and cleanup order; unresolved unknowns.

Use explicit states: `planned`, `ready`, `blocked`, `merged`, `superseded`, `rolled back`, or `not delivered`. For each edge, decide whether compatibility, a flag, adapter, dual-read/write, or pinned artifact allows independent landing. Otherwise record exposure and containment; never claim false atomicity.

**Gate:** one ID covers every authorized repository; all edges, order constraints, authority, and unknowns are visible.

### 2. Establish exact evidence

For each repository, read local instructions and inspect targets, worktree, branch, immutable base/head, validation/release rules, permissions, and existing matching work. Classify candidates as required, optional, out of scope, or uncertain; expanding scope requires approval.

A branch name is not revision evidence: record immutable commit, patch-set, change, or artifact IDs. Record inaccessible repositories or providers as blind spots, not assumed inventory.

**Gate:** every active repository has exact base/head evidence, bounded scope, local gates, and confirmed authority.

### 3. Open review surfaces early

When authorized, publish the smallest coherent change and open a draft review before dependents diverge. Otherwise link a stable patch. Include the canonical ID, bounded role, related reviews, order, compatibility assumptions, exact dependency revision, incomplete gates, and rollback limits.

**Gate:** every implemented unit is discoverable and reviewable; early visibility is not merge readiness.

### 4. Validate exact heads; control drift

Run required formatting, tests, build, static, and generated-output checks. Validate consumers against the exact recorded producer revision or artifact. After authorized submission, read back the review head; bind checks and approvals to it.

Re-read bases, review heads, gates, approvals, and dependencies before readiness and immediately before integration. On drift:

- **Base:** assess impact; update and retest per policy.
- **Review head:** stop, fetch, inspect, and invalidate stale evidence.
- **Dependency:** rerun edge validation against the new exact revision.
- **Parallel work:** mark `superseded` only with evidence of equivalent scope; preserve unique commits/discussion and link successor both ways.
- **History rewrite:** obtain authorization; prefer a new branch or patch set where allowed.

**Gate:** local, remote, and validated heads match; each edge names the exact counterpart tested; stale evidence is renewed or invalidated.

### 5. Integrate in order

Before each integration require exact-head equality, green checks, head-valid approvals, satisfied edges, executable containment/rollback, and authorized approval. Integrate one unit at a time in graph order. Read back provider state, resulting revision, target, and sequence/time; re-evaluate remaining gates. Pause on ambiguity.

**Gate:** each unit passed gates at its exact head and provider readback proves authorized order.

### 6. Recover partial delivery

On failure, stop dependents and mark exact delivered/undelivered states. Preserve revisions, logs, and errors. Use only pre-authorized containment, rollback, or roll-forward; ask before changing scope, discarding work, rewriting history, or choosing ambiguous consequences. Treat rollback as a new auditable, exact-head-validated change. For accepted partial delivery, record exposure, duration, owner, follow-up, and continuation conditions. A reduced outcome requires explicit acceptance and revision.

**Gate:** the system is contained safely or has an authorized recovery path with owners and exact evidence.

### 7. Verify and clean up

Read back every target and confirm its revision contains the change. Verify releases, artifacts, deployments, availability, and end-to-end behavior from delivered revisions. Record final states, exclusions, risks, and follow-ups. Remove temporary state only when authorized, unnecessary for recovery, and policy permits; otherwise assign owner and expiry.

## Completion criteria

Report complete only when every required repository is integrated at a recorded revision; checks and approvals match those heads; edges were validated and integrated in order; provider state and outcome were read back; and partial delivery, rollback, supersession, risk, and cleanup are resolved or owned. Separate delivered work, excluded scope, and unresolved items without implying atomicity.
