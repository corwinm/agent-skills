---
name: cross-repository-change-coordination
description: Use when one logical change spans multiple repositories and needs coordinated scope, review, validation, merge ordering, or recovery. Track repository-specific evidence against one canonical change identifier without assuming a host, workflow system, or implementation language.
license: MIT
metadata:
  author: corwinm
  version: "0.1.0"
---

# Cross-repository change coordination

Coordinate a distributed change as one delivery while keeping each repository independently reviewable and verifiable. Maintain a small coordination record in the user's chosen durable location; use repository and review-provider state as evidence, not memory.

The workflow is provider-neutral. “Review surface” means a pull request, merge request, patch series, change list, or equivalent. “Merge” means the host's integration action, including landing a patch or submitting a change.

## When to use

Use this skill when a feature, migration, protocol change, release, or fix requires coordinated changes in two or more repositories.

Do not use it merely because one repository consumes a released dependency with no coordinated source change. For a single-repository change, use that repository's normal workflow.

## Authority boundaries

- Treat the user's requested repositories and outcome as the authorized scope. Discover adjacent repositories, generated artifacts, release steps, and downstream consumers, but do not add them to delivery scope without approval.
- Do not force-push, rewrite shared history, retarget a review, merge, close, or abandon work unless authorized by the user or by explicit repository policy already in force.
- Do not resolve an ambiguous merge decision by choosing the apparently easiest order. Present the evidence, safe options, and consequences to the user.
- Follow each repository's local instructions. Where instructions conflict, stop at the affected boundary and ask; one repository's conventions do not override another's.
- Never claim cross-repository completion from local code alone. Host state, exact revisions, validation results, and post-merge state are separate evidence.

## Coordination record

Create or adopt one durable record before implementation. It may be an issue, change document, tracking review, ticket, or versioned file. Assign one canonical change identifier, such as `CHANGE-142`, and put it in every repository's branch metadata and review description where conventions allow. Do not invent multiple competing identifiers.

Record at least:

| Field                | Required evidence                                                                         |
| -------------------- | ----------------------------------------------------------------------------------------- |
| Outcome              | One sentence defining externally observable success                                       |
| Authority            | Authorized repositories, prohibited actions, and who decides merges                       |
| Repositories         | Canonical repository identity and working location for each participant                   |
| Relationship         | Parent/child or producer/consumer edges and why they exist                                |
| Per-repository state | Scope, base branch/revision, working branch, expected head, review surface, owner, status |
| Gates                | Required checks, approvals, compatibility conditions, release/deploy requirements         |
| Order                | Implementation, review, merge, release, and cleanup order                                 |
| Recovery             | Rollback, roll-forward, or containment path for each merged unit                          |
| Evidence             | Commands or provider readbacks, timestamps when material, and unresolved uncertainty      |

Use explicit states such as `planned`, `in progress`, `ready`, `blocked`, `merged`, `superseded`, `rolled back`, or `not delivered`. Never infer `merged` from an approved review or `ready` from a green run on an older revision.

**Completion condition:** one identifier names the whole change; every authorized repository has a row; every dependency edge, gate, authority boundary, and unknown is visible.

## Workflow

### 1. Preflight the repositories

For each candidate repository:

1. Confirm its canonical identity, remotes or submission target, local path, active worktree, cleanliness, current branch, and current revision.
2. Read repository-local instructions and identify validation, review, merge, release, and generated-file rules.
3. Check authentication and permissions needed to read reviews and checks. Separately identify whether write, push, and merge actions are authorized; capability is not consent.
4. Inspect existing branches, reviews, issues, or change lists for the same logical work. Reuse a clearly matching active effort; never silently duplicate or replace it.
5. Classify the repository as required, optional, discovered-but-out-of-scope, or uncertain. Ask before promoting the last two into scope.

If a repository or provider cannot be inspected, record the blind spot and do not present assumptions as inventory.

**Completion condition:** the record distinguishes confirmed repositories from candidates, captures local rules and permissions, and has no silent scope expansion.

### 2. Model dependencies and delivery slices

Draw a directed graph. Use `producer -> consumer` for contract, API, schema, package, artifact, or deployment dependencies; use `parent -> child` when one review intentionally owns or gates another. Label each edge with the compatibility requirement.

For every edge, decide:

- whether the producer must land or release first;
- whether the consumer can be made backward- and forward-compatible;
- whether a temporary adapter, feature flag, dual-read/write period, or pinned artifact permits independent merging;
- what proves the consumer tested the intended producer revision;
- what rollback remains possible after either side lands.

Prefer independently safe slices. If atomicity is impossible across repositories, state the exposure window and containment plan rather than calling the change atomic.

**Completion condition:** the graph is acyclic or its compatibility strategy breaks every merge-time cycle; implementation and merge order are explicit.

### 3. Establish per-repository evidence

Before editing, capture for each repository:

- in-scope paths and expected behavior;
- base branch name and observed base revision;
- work branch or equivalent change handle;
- current head revision;
- parent, child, producer, and consumer links;
- required local and remote gates;
- review surface URL or identifier once created.

Use repository-native commands to collect this evidence. With Git, examples include `git status --short --branch`, `git rev-parse HEAD`, `git rev-parse <base>`, and `git remote -v`. On another VCS or host, use the equivalent immutable revision and canonical target identifiers.

A branch name is not head evidence. Store immutable commit, patch-set, or change revision identifiers.

**Completion condition:** every active repository has a defined scope plus immutable base and head evidence.

### 4. Open review surfaces early

Publish the smallest coherent branch or change permitted by local policy, then open a draft review surface before dependent work diverges. If drafts are unsupported, use the provider's work-in-progress marker or create a tracking record with a stable patch link.

Each review description should include:

- the canonical change identifier and coordination-record link;
- this repository's bounded role;
- linked parent/child or producer/consumer reviews;
- required order and compatibility assumptions;
- exact producer artifact or revision used for validation when applicable;
- incomplete gates and known rollback limits.

Opening early is for linkage and review, not permission to merge unfinished work.

**Completion condition:** every implemented unit has a discoverable review surface, or the record explains the host-neutral substitute and how reviewers obtain the patch.

### 5. Implement and validate exact heads

Work in dependency-aware slices. After each material update:

1. Run the repository's required formatter, tests, build, static checks, and generated-output checks.
2. For an integration edge, validate the consumer against the exact producer revision or immutable artifact recorded for that edge—not merely a branch name or a similarly versioned local build.
3. Push or submit only when authorized, then read back the remote review head.
4. Bind every check result and approval to the immutable head that received it. A check without revision identity is incomplete evidence.
5. Update the coordination record with the observed head and result.

Provider examples: GitHub users may compare `git rev-parse HEAD` with `gh pr view --json headRefOid`; GitLab, Gerrit, email patch series, and other systems need their equivalent review-head or patch-set readback. When no API exists, capture the provider UI's immutable revision or obtain reviewer confirmation and label the weaker provenance.

**Completion condition:** each ready unit's local head, remote review head, and validated head are identical, and each dependency edge names the exact counterpart tested.

### 6. Detect drift and superseded work

Re-read base heads, review heads, statuses, approvals, and dependencies before announcing readiness and again immediately before integration.

When state differs:

- **Base drift:** assess conflict and behavioral impact; update or retest according to repository policy.
- **Review-head drift:** stop. Fetch and inspect the unexpected revision before trusting prior checks or approvals.
- **Dependency drift:** rerun edge validation against the new exact producer or consumer head.
- **Parallel solution:** compare authority, intent, and state. Mark work `superseded` only with evidence that another change delivers the same scope.
- **History rewrite needed:** explain why and request authorization before force-pushing. Prefer a new branch or patch set when policy allows.

Never delete, close, or overwrite superseded work until its unique commits, discussion, and unresolved scope have been accounted for. Link the successor in both directions when possible.

**Completion condition:** stale evidence has been invalidated or renewed, and superseded work remains traceable.

### 7. Apply merge gates and order

Build a gate table per repository and for the graph as a whole. At minimum require:

- review head still equals the exact validated head;
- required local and provider checks are green for that head;
- required approvals apply to that head and remain valid;
- dependency and compatibility conditions are satisfied;
- rollback or containment remains executable;
- the authorized merge decision-maker has approved the action.

Integrate in the recorded order. Typical producer/consumer ordering is: land backward-compatible producer, release or deploy it if required, verify availability, then land consumer. A parent review may instead land last as an integration point. The graph and compatibility evidence—not labels alone—determine order.

After each integration, read back the provider's merged/submitted state, resulting immutable revision, target branch, and merge time or sequence. Re-evaluate remaining gates; do not batch-assume later merges are still safe. If the correct next merge is ambiguous, pause for the user.

**Completion condition:** every integrated unit passed gates at its exact head, landed in authorized order, and has provider readback evidence.

### 8. Handle failure and partial delivery

On any failed gate or integration:

1. Stop dependent merges and label the exact delivered and undelivered states.
2. Preserve logs, revisions, and provider errors; distinguish product failure from infrastructure failure.
3. Choose only among pre-authorized containment, rollback, or roll-forward paths. Ask the user when the choice changes scope, discards work, rewrites history, or has ambiguous operational consequences.
4. If rollback is selected, treat it as a new auditable change, validate its exact head, and read back its integration.
5. If partial delivery is accepted, document the exposed behavior, duration, owner, follow-up, and conditions for safe continuation.

Do not call the logical change complete while required repositories are rolled back, blocked, or merely planned. A deliberately reduced outcome requires explicit user acceptance and an updated outcome statement.

**Completion condition:** the system is either contained at a known safe state or has an authorized recovery path with owners and exact evidence.

### 9. Verify and clean up

After all intended integrations:

1. Read back each target branch or provider record and confirm the resulting immutable revision contains the intended change.
2. Verify releases, packages, generated artifacts, deployments, or downstream availability that are part of the stated outcome.
3. Run the cross-repository acceptance check against delivered revisions, not deleted worktrees or stale branches.
4. Update links and statuses in the coordination record; record exclusions, residual risks, and follow-ups.
5. Remove temporary branches, worktrees, pins, flags, or adapters only when authorized and no longer needed for rollback. Follow each repository's retention policy.

**Completion condition:** the delivered system satisfies the outcome; every repository and edge has post-merge evidence; temporary state is removed or has an owner and expiry.

## Completion criteria

Report the logical change complete only when all are true:

- The authorized scope and canonical identifier are unchanged or the user approved each change.
- Every required repository is merged/submitted at a recorded immutable revision.
- Every required check and approval applies to the exact integrated head.
- Producer/consumer and parent/child edges were validated and integrated in the recorded order.
- Provider state and target branches were read back after integration.
- The end-to-end outcome was verified from delivered artifacts or revisions.
- Partial delivery, rollback, superseded work, residual risk, and cleanup are explicitly resolved or owned.
- The final report separates completed work, excluded scope, and unresolved items without implying unsupported atomicity.

## Common pitfalls

1. **One branch name as evidence.** Branches move. Record immutable base, review, validated, and integrated revisions.
2. **Green checks on the wrong patch set.** Match checks and approvals to the exact current head.
3. **Hidden downstream scope.** Discover broadly, but ask before adding repositories or release work.
4. **Draft means mergeable.** Draft reviews create visibility; only explicit gates create readiness.
5. **Provider coupling.** Use APIs and CLIs when available, but preserve the same concepts with patch series, UI readback, or manual attestations.
6. **Pretend atomicity.** Cross-repository merges usually have an exposure window. Make compatibility and containment explicit.
7. **Cleanup before verification.** Keep recovery inputs until delivered revisions and end-to-end behavior are confirmed.
