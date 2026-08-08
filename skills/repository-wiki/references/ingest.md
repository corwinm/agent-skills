# `/wiki ingest <path...>`

Integrate new evidence, versioned revisions, moves, or removals into the maintained wiki. Ingestion is reconciliation, not a standalone summary.

## 1. Select and verify sources

- Discover the configured layout first and derive its source root, wiki root, index path, and manifest path. Use those derived paths throughout this workflow; do not assume `sources/`, `wiki/`, or `.wiki/manifest.json` is at the repository root.
- Inspect Git status first. Identify existing changes to the wiki or manifest and preserve unrelated work; do not silently overwrite another contributor's edits.
- Apply the shared maintained-path safety checks to the configured manifest path, then record its initial existence state and unfiltered content identity, or an explicit `absent` sentinel when it does not exist.
- Resolve the configured source root and each requested path without reading file contents. Reject a symlinked source root and any source path with a symlink in any path component, even when its target would remain inside the root; committed symlinks preserve the link text, not the bytes that ingestion would otherwise read.
- After that symlink check, require every canonical source path to remain inside the canonical source root. Reject escaping paths, missing unregistered files, and unsupported binary content the agent cannot inspect.
- For a directory, enumerate relevant documents without following symlinks while excluding `.git`, generated output, dependencies, secrets, and ignored files. Reject symlink entries rather than traversing or hashing their targets. Record the exact included repository-relative path set and each entry's file type.
- Record the initial existence state and, for every present source path participating in the operation, compute the unfiltered byte identity with `git hash-object --no-filters -- <path>`.
- Compare it with the configured manifest and skip unchanged sources unless the user requests a full re-ingest.
- If the bytes at a registered path have a different identity, stop before editing the wiki or manifest. Do not replace the prior identity. Ask the user to restore the registered version from Git or another trusted copy and place the revision at a new, version-distinguishing path under the source root.
- If the registered bytes cannot be recovered, report a provenance gap and the affected pages from the manifest. Do not claim that historical citations remain verifiable.
- For a missing registered source, search the source root for the same identity before treating it as removed. A matching identity is a proposed move, not proof of intent.

## 2. Read existing context first

Before reading any maintained page that may inform an edit, apply the shared path-safety checks and record its existence and unfiltered identity or an explicit `absent` sentinel. Then read the configured wiki index, relevant canonical pages, prior affected pages from the manifest, and prior citations to the source from exactly those baselined bytes before proposing changes. Search titles, headings, IDs, and citations before opening unrelated page bodies. If another target becomes relevant later, baseline it before reading it.

When a new source is an explicit revision of an earlier registered source, read both versions and inventory claims previously supported by the earlier one. Classify each as retained, revised, contradicted, or no longer supported. Keep citations to the version that supports each historical statement; do not leave stale claims active merely because the new version omits them.

## 3. Extract candidate knowledge

Identify only supported:

- requests and requested solutions, preserving the requester's original wording, source, requester, date, urgency, and stated rationale when available before any reframing;
- cited evidence and current-state changes;
- verbatim, visibly marked direct quotations when exact wording matters, and clearly non-quoted paraphrases otherwise; never silently rewrite a quote;
- interpretations, with their contributing evidence and material alternatives;
- assumptions, proposals, and open questions without promoting them to facts;
- falsifiable problem hypotheses with affected group, situation or trigger, goal, difficulty, consequence, supporting evidence, contradicting evidence, unknowns, and a worded confidence rationale kept distinct;
- explicit decisions and their rationale;
- confirmed, proposed, rejected, or unresolved requirements;
- risks, issues, mitigations, and dependencies;
- explicit actions, owners, due dates, and status;
- stakeholder roles and expressed concerns;
- contradictions with existing context.

For a transcript, create or update a concise page under `wiki/meetings/` containing available meeting metadata, summary, decisions, actions, risks, and unresolved questions. Do not treat discussion, suggestion, or silence as approval.

## 4. Plan and reconcile

List pages to create or update and explain why. For each candidate or prior claim:

- merge corroborating evidence into the existing claim;
- label interpretations, assumptions, and proposals explicitly;
- preserve both sides of unresolved disagreement;
- when a later decision explicitly replaces an earlier one, mark the earlier decision `Superseded` and link both entries;
- when support disappears, preserve historical records that remain historically accurate, but mark current claims withdrawn, stale, or unresolved as the evidence warrants;
- remove a claim only when it has no continuing historical value, and never remove citations from claims still supported by them;
- when evidence is insufficient, add an open question rather than guessing.

Use the collision-resistant durable ID rules in `repository-contract.md` for new records. Preserve existing IDs. Before adding a record, search both its cited evidence and normalized statement so concurrent work does not create a duplicate under another ID.

After the plan identifies the exact wiki target set, verify that every target was baselined before the read that informed its proposed edit. For any target that was not, apply the shared maintained-path safety checks, baseline and reread it, then redo the affected reconciliation before staging. If the plan adds a target later, follow the same baseline-before-read rule.

For a moved or removed registered source, show a semantic reconciliation plan and require explicit approval before changing dependent claims or the manifest. Audit every previously affected page and every current citation. Do not infer that a same-content file move was intentional without approval.

If a missing source still supports any claim, historical record, or citation, require the user to place a trusted copy whose unfiltered byte identity matches the manifest under a versioned or archive path within the source root; handle that preservation as a move and update links. If the bytes cannot be recovered, keep the manifest entry and affected-page mapping unchanged as an unresolved tombstone, identify every broken citation, and report a provenance gap. Do not imply that the manifest hash makes the evidence retrievable.

## 5. Stage, validate, and publish

1. Build the complete proposed wiki targets and proposed manifest under a unique operation-specific staging directory without modifying canonical files. Refresh the configured current-state content only for material current changes and include configured index updates in the proposal.
2. Validate the staged proposal as an overlay on the unchanged canonical wiki. Check working links, original-source citations, unique IDs, visible knowledge categories, index coverage, and the final manifest shape. If validation fails, leave every canonical file and the current manifest unchanged, report the staged failures, and remove only this operation's staging directory after review.
3. Preserve operation-specific rollback copies of every present canonical target and the manifest, and record an explicit `absent` rollback sentinel for every missing target or manifest path. Record the exact relative path set and unfiltered identity of every proposed file, controlling inventory artifact, and present rollback copy. Do not publish a proposal whose staging or rollback snapshot is incomplete.
4. Immediately before the first canonical write, repeat all path-safety, target-baseline, manifest-baseline, participating-source identity, and requested-directory membership/type checks. Verify that the exact staging and rollback path sets and identities still match step 3. If anything drifted, publish nothing; re-read and reconcile concurrent wiki or manifest changes, or rebuild the proposal from changed source state.
5. Publish staged wiki targets one at a time, leaving the manifest until last. Immediately before each write, repeat the source, directory, manifest, path-safety, staging, and rollback checks; verify every already-published target still matches its staged identity and every remaining target still matches its original baseline. If any check fails or a write errors, stop and restore only this operation's published targets. Restore a prior file only when the target still matches the operation's staged identity and its rollback copy still matches the recorded rollback identity; for a path whose rollback sentinel is `absent`, delete the operation-created file only when it still matches the staged identity and its parent remains safe. Leave drifted targets untouched and report them for manual reconciliation.
6. Immediately before publishing the proposed manifest, repeat the same checks against all sources, directory snapshots, canonical targets, staging files, rollback copies, and the original manifest baseline. Then publish the manifest using the normative shape in `repository-contract.md`:
   - For a new source or versioned revision, add its manifest entry. Never replace the identity of an existing source key.
   - A full re-ingest may update an existing source's ingestion timestamp and affected pages only when its identity still matches.
   - For an approved move, change the manifest key and update source links on affected pages.
   - For an approved removal, delete the manifest entry only when no wiki claim, historical record, or citation depends on that source. Otherwise require a user-provided byte-identical archived copy and handle it as an approved move, or retain the missing entry as an unresolved tombstone.
7. Validate the published wiki and manifest and show the resulting diff summary and unresolved conflicts. If post-publish validation fails, use the guarded rollback rule from step 5 for both wiki targets and the manifest; never overwrite concurrent drift. Remove only this operation's staging directory after publication and validation succeed or a complete guarded rollback succeeds.

Completion condition: every integrated material claim is traceable to the immutable regular-file source version that supports it, no source symlink was followed, every processed source still matches its reconciled existence and identity state at finalization, the complete proposal passed validation before canonical publication, failed publication did not leave known invalid canonical output, prior claims from revised or missing sources are reconciled, unchanged sources were skipped, in-place source changes were rejected, contradictions remain visible, the manifest reflects the operation, and the index can find every changed canonical page.
