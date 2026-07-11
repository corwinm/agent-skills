# Discovery workspace specification

A discovery workspace is a portable folder that can be the root of its own repository or a subfolder inside another repository. `discovery.json` identifies the workspace root.

## Layout

```text
discovery-workspace/
├── discovery.json
├── records/
│   ├── evidence.json
│   ├── hypotheses.json
│   ├── decisions.json
│   └── experiments.json
├── sources/
├── comments/
│   └── comment-<id>.json
├── history/
│   └── revisions.json
└── presentation/
    ├── index.html
    ├── evidence.html
    ├── hypotheses.html
    ├── decisions.html
    ├── experiment.html
    ├── review.html
    ├── artifact.css
    ├── artifact.js
    └── manifest.json
```

Canonical records, source material, comments, and revision history are the source of truth. Files under `presentation/` are deterministic generated output and must not be edited directly.

## Root record

`discovery.json` contains:

- `version`: workspace schema version
- `id`: stable workspace ID
- `title`
- `stage`
- `updated_at`: timestamp of the latest canonical revision
- `request`: preserved original request
- `decision_needed`
- `recommendation`
- `review.mode`: normally `github-pull-request`
- `review.authority`: `automatic`, `proposal-only`, or `risk-based`
- `review.repository` and `review.pull_request` when known

The workspace can move without changing its IDs. Internal links and references must remain relative to the workspace root.

## Records

Every record requires a stable, unique `id`. Relationships use IDs rather than array positions, HTML locations, or prose matching.

- Evidence links to source IDs and retains limitations.
- Hypotheses list supporting and contradicting evidence separately.
- Decisions preserve owner, rationale, alternatives, and unresolved dissent.
- Experiments link to the hypothesis and critical assumption they test.

Unknown values remain unknown. Do not generate plausible filler to satisfy a field.

## Comments

Store one comment per JSON file. A hybrid comment combines a stable semantic target with selected-text context:

```json
{
  "id": "comment-014",
  "target": {
    "record_id": "problem-001",
    "record_type": "problem-hypothesis",
    "field": "difficulty"
  },
  "selection": {
    "exact": "Deployment state requires developer interpretation.",
    "prefix": "When support is responding to a customer,",
    "suffix": "This delays the response."
  },
  "body": "Narrow this to the situation supported by the evidence.",
  "author": { "github": "corwinm" },
  "created_at": "2026-07-11T18:42:00Z",
  "status": "open",
  "resolution": null
}
```

`record_id` and `field` are canonical anchors. The selected text helps reviewers and agents recover the original context after revisions; it is not the identity of the target.

Allowed resolution actions:

- `revised`
- `accepted-no-change`
- `needs-clarification`
- `needs-evidence`
- `superseded`

## Agent authority

Authority is configurable per workspace:

- `automatic`: the agent may apply review-driven changes, but must record every revision.
- `proposal-only`: every review-driven change requires human approval.
- `risk-based`: meaning-preserving corrections may be applied automatically; material discovery changes require a proposal. This is the default.

Under `risk-based`, automatically apply:

- Formatting and presentation corrections
- Broken links and malformed metadata
- Wording changes that preserve meaning
- Citation or source-locator corrections supported by the source

Propose before applying:

- Adding, removing, or reclassifying evidence
- Changing a problem hypothesis materially
- Changing a decision or recommendation
- Changing experiment scope or decision rules
- Removing dissent, uncertainty, or limitations

Never silently remove evidence, dissent, decisions, comments, or revision history.

## Revision ledger

Every agent revision appends an entry to `history/revisions.json`:

```json
{
  "id": "revision-007",
  "created_at": "2026-07-11T19:10:00Z",
  "triggered_by": ["comment-014"],
  "changed_records": ["problem-001"],
  "summary": "Narrowed the problem boundary to the observed situation."
}
```

A comment resolution links to changed records and explains what changed or why no change was made.

## GitHub review workflow

1. Create or update canonical records on a branch.
2. Run the renderer and commit `presentation/` with the source records.
3. Open or update a pull request.
4. Reviewers read the HTML and comment on linked canonical records.
5. Capture review comments in `comments/` with stable targets.
6. An agent classifies each comment under the authority policy.
7. The agent applies safe corrections or proposes material changes.
8. Update comment resolution and append the revision ledger.
9. Regenerate and commit the HTML.
10. Resolve the GitHub thread only after the record and presentation agree.

The self-contained reference renderer reads JSON and uses only Node.js built-ins after TypeScript loading. It requires Node.js 20 or newer and can be run with the repository-pinned `tsx` dependency (`npm run ...`) or directly through `npx tsx`:

```bash
npx tsx scripts/render_discovery.ts path/to/workspace
npx tsx scripts/render_discovery.ts path/to/workspace --check
```

`--check` rerenders in memory and compares the exact expected filename set and file bytes. It fails when presentation files are missing, unexpected, hand-edited, or stale relative to canonical sources or renderer behavior. Rendering validates before replacement and restores the previous presentation if the directory swap fails.
