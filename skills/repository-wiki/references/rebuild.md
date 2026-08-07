# `/wiki rebuild`

Reconstruct a proposed wiki from registered sources when the schema or accumulated context is no longer trustworthy.

1. Require explicit confirmation before beginning because rebuilds are expensive and broad.
2. Inspect uncommitted changes affecting the wiki, manifest, and registered sources. Abort unless the user explicitly approves how those changes will be included and preserved. Record the initial Git status and unfiltered content identities of existing wiki and manifest paths so drift while the proposal is built remains detectable.
3. Build the replacement under `.wiki/rebuild/` without modifying the current `wiki/` or `.wiki/manifest.json`.
4. Process existing registered sources in chronological or dependency-aware order. Stop and report missing sources rather than claiming source completeness.
5. Generate a replacement manifest alongside the proposed wiki using the normative manifest shape.
6. Run the equivalent of `/wiki check` against the proposal.
7. Compare the current checkout with the initial snapshot. If it drifted, stop and refresh the proposal and review. Otherwise, create an exact create, update, and delete inventory. From that complete target set, record a final baseline for every target: its unfiltered content identity when present or an explicit `absent` sentinel when missing. Preserve the current bytes of every present target in the rebuild staging area, and present the inventory and diff for approval.
8. Immediately before replacement, verify both existence and content of every target against the final baseline, including paths recorded as `absent`. Abort and regenerate the inventory and diff if any target drifted. Replace current files only after a second explicit approval against the unchanged baseline. Rely on Git for committed history; retain the staged baseline until replacement and validation succeed.
9. Record replacement identities or `absent` sentinels for deleted paths, then run `/wiki check` again. If validation fails, restore the preserved baseline only when every target still matches the replacement state. If any target drifted after replacement, do not overwrite it; preserve the staging data and report the paths requiring manual reconciliation.

Completion condition: the proposed replacement and manifest are source-complete, checked, diffable, and have not replaced canonical context or concurrently created paths without approval.
