# `/wiki rebuild`

Reconstruct a proposed wiki from registered sources when the schema or accumulated context is no longer trustworthy.

1. Require explicit confirmation before beginning because rebuilds are expensive and broad.
2. Inspect uncommitted changes affecting the wiki, manifest, and registered sources. Abort unless the user explicitly approves how those changes will be included and preserved. Record baseline content identities for every current wiki and manifest path that a replacement could change.
3. Build the replacement under `.wiki/rebuild/` without modifying the current `wiki/` or `.wiki/manifest.json`.
4. Process existing registered sources in chronological or dependency-aware order. Stop and report missing sources rather than claiming source completeness.
5. Generate a replacement manifest alongside the proposed wiki using the normative manifest shape.
6. Run the equivalent of `/wiki check` against the proposal.
7. Present an exact create, update, and delete inventory plus a diff against the current wiki and manifest.
8. Immediately before replacement, recompute the current content identities and compare them with the baseline. Abort and regenerate the diff if any target drifted. Replace current files only after a second explicit approval against the unchanged baseline. Rely on Git for committed history; preserve any explicitly approved uncommitted baseline in the rebuild staging area until replacement and validation succeed.
9. Record the replacement identities, then run `/wiki check` again. If validation fails, restore the preserved baseline only when every target still matches the replacement identities. If any target drifted after replacement, do not overwrite it; preserve the staging data and report the paths requiring manual reconciliation.

Completion condition: the proposed replacement and manifest are source-complete, checked, diffable, and have not replaced canonical context without approval.
