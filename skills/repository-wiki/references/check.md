# `/wiki check [--fix]`

Audit structure, traceability, freshness, internal consistency, and collaboration conflicts. Use this command after merging or rebasing concurrent wiki work; do not add a separate conflict-resolution command.

## Audit

Check for:

- unresolved Git conflict markers in wiki pages or `.wiki/manifest.json`;
- new sources absent from the manifest;
- a symlinked source root or registered source path with a symlink in any component; do not follow it while auditing, even if its target appears to remain inside the source root;
- registered paths whose bytes no longer match their recorded identity; treat these as immutability violations, not sources to re-ingest in place;
- manifest entries whose sources moved or no longer exist, distinguishing recoverable moves from unresolved tombstones;
- the same source entry changed independently across merge stages;
- material claims without original-source citations;
- broken Markdown links, resolving each destination from the containing page;
- missing or invalid source locators;
- requests whose original wording or available source, requester, date, urgency, stated rationale, or requested solution was lost or overwritten by reframing;
- unlabeled interpretations, assumptions, or proposals presented as confirmed;
- problem hypotheses that are not falsifiable or do not list supporting evidence, contradicting evidence, and unknowns separately;
- duplicate or conflicting active decisions and requirements;
- stale `current-state.md` claims contradicted by newer evidence;
- answered questions still marked open;
- actions without an explicit owner or explicitly recorded `Unassigned`;
- missing IDs, one ID assigned to different records, or one record created under different IDs;
- conflicting changes to a record's decision, status, owner, due date, or knowledge category;
- canonical pages absent from `wiki/index.md`;
- invalid, unsorted, or internally inconsistent manifest entries.

Inspect Git's base, ours, and theirs stages when available. Treat the diff and source citations as evidence, not as authority to choose one contributor's semantic change.

## Repair

Without `--fix`, report findings only.

With `--fix`:

1. After identifying the exact repair target set, apply the shared maintained-path safety checks and record each target's existence and unfiltered identity or an explicit `absent` sentinel. If a later repair adds a target, check and baseline it before preparing the edit. Immediately before every repair write, repeat the safety check and verify that target against its baseline; if it drifted, stop before overwriting it and re-audit and reconcile the concurrent change.
2. Automatically repair only unambiguous mechanical issues such as index entries, link syntax, metadata normalization, sorting, manifest formatting, and reference updates after an approved ID choice.
3. Classify apparent duplicate records by comparing original-source citations and meaning, not ID equality alone.
4. For the same record under different IDs, preserve the ID present in the merge base. If neither ID is established, propose one ID to retain and update every reference only after approval.
5. For different records sharing an ID, preserve any merge-base assignment; otherwise propose a new collision-resistant ID for one record and update every reference only after approval.
6. Never automatically choose between conflicting decisions, interpretations, statuses, owners, due dates, or claims. Preserve both sides in the report and request a human decision.
7. When both branches changed one manifest source entry and all available base, ours, and theirs identities match, reconcile the wiki pages first, then perform a full `/wiki ingest <source>` and write its manifest metadata last. If any identity differs, do not edit the wiki or manifest; follow the identity-mismatch rule instead.
8. Never repair an identity mismatch by replacing the manifest identity. Restore the registered bytes and add revised content at a new source path; if restoration is impossible, report the provenance gap for human resolution.
9. For a missing source still supporting a wiki claim, historical record, or citation, require the user to place a trusted byte-identical copy under the source root and handle it as a move. If recovery is impossible, retain the manifest entry and affected pages as an unresolved tombstone and report every broken citation.
10. Apply approved source moves or removals through `/wiki ingest`; remove a registration only when no wiki claim, historical record, or citation depends on it.

After repairs, scan the entire wiki for old IDs and conflict markers, validate the manifest, and show the resulting Git diff.

Completion condition: findings identify exact files and records, distinguish mechanical from semantic issues, preserve unrelated contributor work, and name the evidence or human decision needed for every unresolved conflict.
