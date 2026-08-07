# `/wiki init`

Initialize the smallest usable wiki.

1. Locate the repository root and inspect existing source, documentation, wiki, and manifest directories.
2. Ask only for missing consequential choices: project name, nonstandard paths, or whether existing documentation should be adopted rather than replaced.
3. Create the repository-contract directories and canonical files that do not already exist.
4. If the configured manifest is absent, initialize it with the empty manifest from `repository-contract.md`. If it exists, validate and preserve its version, source entries, identities, timestamps, and affected pages. Stop and report an invalid manifest rather than replacing it.
5. Inspect the configured wiki index for an existing purpose and navigation section. Add the short section only when no equivalent section exists; otherwise preserve it unchanged. Never duplicate the section or its links on reruns.
6. Put explicit placeholders such as `Unknown` or `No confirmed decisions recorded` only in newly created canonical pages; never seed plausible project facts.
7. Report created, adopted, preserved, and untouched paths.

Completion condition: the wiki has one discoverable index, canonical context pages, a valid preserved or newly empty manifest, and no invented project content.
