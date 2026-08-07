# `/wiki ingest <path...>`

Integrate new evidence, versioned revisions, moves, or removals into the maintained wiki. Ingestion is reconciliation, not a standalone summary.

## 1. Select and verify sources

- Discover the configured layout first and derive its source root, wiki root, index path, and manifest path. Use those derived paths throughout this workflow; do not assume `sources/`, `wiki/`, or `.wiki/manifest.json` is at the repository root.
- Inspect Git status first. Identify existing changes to the wiki or manifest and preserve unrelated work; do not silently overwrite another contributor's edits.
- Record the configured manifest path's initial existence state and unfiltered content identity, or an explicit `absent` sentinel when it does not exist.
- Resolve the configured source root and each requested path without reading file contents. Reject a symlinked source root and any source path with a symlink in any path component, even when its target would remain inside the root; committed symlinks preserve the link text, not the bytes that ingestion would otherwise read.
- After that symlink check, require every canonical source path to remain inside the canonical source root. Reject escaping paths, missing unregistered files, and unsupported binary content the agent cannot inspect.
- For a directory, enumerate relevant documents without following symlinks while excluding `.git`, generated output, dependencies, secrets, and ignored files. Reject symlink entries rather than traversing or hashing their targets.
- Record the initial existence state and, for every present source path participating in the operation, compute the unfiltered byte identity with `git hash-object --no-filters -- <path>`.
- Compare it with the configured manifest and skip unchanged sources unless the user requests a full re-ingest.
- If the bytes at a registered path have a different identity, stop before editing the wiki or manifest. Do not replace the prior identity. Ask the user to restore the registered version from Git or another trusted copy and place the revision at a new, version-distinguishing path under the source root.
- If the registered bytes cannot be recovered, report a provenance gap and the affected pages from the manifest. Do not claim that historical citations remain verifiable.
- For a missing registered source, search the source root for the same identity before treating it as removed. A matching identity is a proposed move, not proof of intent.

## 2. Read existing context first

Read the configured wiki index, relevant canonical pages, prior affected pages from the manifest, and prior citations to the source before proposing changes. Search titles, headings, IDs, and citations before opening unrelated page bodies.

When a new source is an explicit revision of an earlier registered source, read both versions and inventory claims previously supported by the earlier one. Classify each as retained, revised, contradicted, or no longer supported. Keep citations to the version that supports each historical statement; do not leave stale claims active merely because the new version omits them.

## 3. Extract candidate knowledge

Identify only supported:

- cited evidence and current-state changes;
- interpretations, with their contributing evidence and material alternatives;
- assumptions, proposals, and open questions without promoting them to facts;
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

After the plan identifies the exact wiki target set, record every target's existence and unfiltered content identity or an explicit `absent` sentinel. If the plan adds a target later, baseline it before preparing an edit.

For a moved or removed registered source, show a semantic reconciliation plan and require explicit approval before changing dependent claims or the manifest. Audit every previously affected page and every current citation. Do not infer that a same-content file move was intentional without approval.

If a missing source still supports any claim, historical record, or citation, require the user to place a trusted copy whose unfiltered byte identity matches the manifest under a versioned or archive path within the source root; handle that preservation as a move and update links. If the bytes cannot be recovered, keep the manifest entry and affected-page mapping unchanged as an unresolved tombstone, identify every broken citation, and report a provenance gap. Do not imply that the manifest hash makes the evidence retrievable.

## 5. Write, validate, and register

- Immediately before writing each planned wiki target, verify its existence and identity against the target baseline. If it drifted, stop before overwriting it and re-read and reconcile the concurrent change. Apply approved or low-risk wiki-page edits without changing the manifest yet.
- Refresh the configured current-state page only for material current changes.
- Update the configured wiki index summaries and navigation.
- Validate changed pages for working links, original-source citations, unique IDs, visible knowledge categories, and index coverage.
- If validation fails, report the partial wiki edits and leave the prior manifest entries unchanged so a later ingestion cannot mistake the operation for success.
- Record the validated identity of every edited wiki target. Immediately before any manifest update, verify that the exact target set still has those validated identities and that the configured manifest still matches its initial existence and identity baseline. Also repeat the symlink and canonical-root checks and recheck the existence state and unfiltered identity of every source path participating in the operation. If a wiki target, the manifest, or any source path appeared, disappeared, became a symlink, escaped the source root, or changed identity, stop, report the partial wiki edits, and leave the current manifest unchanged. Re-read and reconcile concurrent wiki or manifest changes, or restart reconciliation from changed source state, rather than overwriting either with stale results.
- Only after page validation succeeds, update the manifest using the normative shape in `repository-contract.md`.
- For a new source or versioned revision, add its manifest entry. Never replace the identity of an existing source key.
- A full re-ingest may update an existing source's ingestion timestamp and affected pages only when its identity still matches.
- For an approved move, change the manifest key and update source links on affected pages.
- For an approved removal, delete the manifest entry only when no wiki claim, historical record, or citation depends on that source. Otherwise require a user-provided byte-identical archived copy and handle it as an approved move, or retain the missing entry as an unresolved tombstone.
- Validate the final manifest and show the resulting diff summary and unresolved conflicts.

Completion condition: every integrated material claim is traceable to the immutable regular-file source version that supports it, no source symlink was followed, every processed source still matches its reconciled existence and identity state at finalization, prior claims from revised or missing sources are reconciled, unchanged sources were skipped, in-place source changes were rejected, contradictions remain visible, the manifest reflects the operation, and the index can find every changed canonical page.
