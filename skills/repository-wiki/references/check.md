# `/wiki check [--fix]`

Audit structure, traceability, freshness, internal consistency, and collaboration conflicts. Use this command after merging or rebasing concurrent wiki work; do not add a separate conflict-resolution command.

## Audit

Check for:

- unresolved Git conflict markers in wiki pages or `.wiki/manifest.json`;
- new sources absent from the manifest;
- registered paths whose bytes no longer match their recorded identity; treat these as immutability violations, not sources to re-ingest in place;
- manifest entries whose sources moved or no longer exist;
- the same source entry changed independently across merge stages;
- material claims without original-source citations;
- broken Markdown links, resolving each destination from the containing page;
- missing or invalid source locators;
- unlabeled interpretations, assumptions, or proposals presented as confirmed;
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

1. Automatically repair only unambiguous mechanical issues such as index entries, link syntax, metadata normalization, sorting, manifest formatting, and reference updates after an approved ID choice.
2. Classify apparent duplicate records by comparing original-source citations and meaning, not ID equality alone.
3. For the same record under different IDs, preserve the ID present in the merge base. If neither ID is established, propose one ID to retain and update every reference only after approval.
4. For different records sharing an ID, preserve any merge-base assignment; otherwise propose a new collision-resistant ID for one record and update every reference only after approval.
5. Never automatically choose between conflicting decisions, interpretations, statuses, owners, due dates, or claims. Preserve both sides in the report and request a human decision.
6. When both branches changed one manifest source entry and all available base, ours, and theirs identities match, reconcile the wiki pages first, then perform a full `/wiki ingest <source>` and write its manifest metadata last. If any identity differs, do not edit the wiki or manifest; follow the identity-mismatch rule instead.
7. Never repair an identity mismatch by replacing the manifest identity. Restore the registered bytes and add revised content at a new source path; if restoration is impossible, report the provenance gap for human resolution.
8. Apply approved source moves or removals through `/wiki ingest`.

After repairs, scan the entire wiki for old IDs and conflict markers, validate the manifest, and show the resulting Git diff.

Completion condition: findings identify exact files and records, distinguish mechanical from semantic issues, preserve unrelated contributor work, and name the evidence or human decision needed for every unresolved conflict.
