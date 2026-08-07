# `/wiki init`

Initialize the smallest usable wiki.

1. Locate the repository root and inspect existing source, documentation, wiki, and manifest directories.
2. Ask only for missing consequential choices: project name, nonstandard paths, or whether existing documentation should be adopted rather than replaced.
3. Create the repository-contract directories and canonical files that do not already exist.
4. Initialize `.wiki/manifest.json` with the empty manifest from `repository-contract.md`.
5. Add a short purpose and navigation section to `wiki/index.md`.
6. Put explicit placeholders such as `Unknown` or `No confirmed decisions recorded` in canonical pages; never seed plausible project facts.
7. Report created, adopted, and untouched paths.

Completion condition: the wiki has one discoverable index, canonical context pages, an empty valid manifest, and no invented project content.
