# `/wiki init`

Initialize the smallest usable wiki.

1. Locate the repository root and inspect existing source, documentation, wiki, and manifest directories.
2. Ask only for missing consequential choices: project name, nonstandard paths, or whether existing documentation should be adopted rather than replaced.
3. Determine the exact directory and file target set before writing. Apply the shared maintained-path safety checks and record each target's type and existence, plus each present regular file's unfiltered identity or an explicit `absent` sentinel for a missing target. Immediately before every creation or edit, repeat the safety check and verify the target against its baseline; if it drifted or an absent path appeared, stop before writing and re-inspect and adopt or reconcile the concurrent change.
4. Create only repository-contract directories and canonical files whose verified baseline is still `absent`.
5. If the configured manifest is absent, initialize it with the empty manifest from `repository-contract.md`. If it exists, validate and preserve its version, source entries, identities, timestamps, and affected pages. Stop and report an invalid manifest rather than replacing it.
6. Inspect the configured wiki index for an existing purpose and navigation section. Add the short section only when no equivalent section exists and the index still matches its recorded baseline immediately before the edit; otherwise preserve it unchanged. Never duplicate the section or its links on reruns.
7. Put explicit placeholders such as `Unknown` or `No confirmed decisions recorded` only in newly created canonical pages; never seed plausible project facts.
8. Report created, adopted, preserved, and untouched paths.

Completion condition: the wiki has one discoverable index, canonical context pages, a valid preserved or newly empty manifest, and no invented project content.
