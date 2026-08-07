# `/wiki init`

Initialize the smallest usable wiki.

1. Locate the repository root and inspect existing source, documentation, wiki, and manifest directories.
2. Ask only for missing consequential choices: project name, nonstandard paths, or whether existing documentation should be adopted rather than replaced.
3. Create the repository-contract directories and canonical files that do not already exist.
4. If `.wiki/manifest.json` is absent, initialize it with the empty manifest from `repository-contract.md`. If it exists, validate and preserve its version, source entries, identities, timestamps, and affected pages. Stop and report an invalid manifest rather than replacing it.
5. Add a short purpose and navigation section to `wiki/index.md` without replacing existing content.
6. Put explicit placeholders such as `Unknown` or `No confirmed decisions recorded` only in newly created canonical pages; never seed plausible project facts.
7. Report created, adopted, preserved, and untouched paths.

Completion condition: the wiki has one discoverable index, canonical context pages, a valid preserved or newly empty manifest, and no invented project content.
