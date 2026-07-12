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

Active browser-review threads and agent jobs live in `.review/review.sqlite`, outside the
canonical presentation. Resolved threads are exported to `comments/`; applied proposals append
the revision ledger. The SQLite implementation satisfies the hosted-compatible `ReviewStorage`
boundary, while agent integrations satisfy `AgentAdapter`.

## Interactive local review

Requires Node.js 24 or newer. Each independently installable review skill bundles the renderer and complete review server runtime. From either installed skill directory, run:

```bash
node scripts/render_discovery.ts /absolute/path/to/workspace
node scripts/review_server.ts /absolute/path/to/workspace
```

An agent with background-process support should launch the server, verify its HTTP endpoint, report the URL, and keep the process tracked. No repository clone or npm installation is required for an installed skill.

For this repository's example, the equivalent convenience commands are:

```bash
npm install
npm run render:example
npm run review:example
```

Open <http://127.0.0.1:4173>. Use the pencil beside a stable record/field, or **Comment on
page**, to open the review drawer. Threads can receive replies, be resolved, or be sent to the
deterministic mock agent. Agent proposals show their structured before/after values and require
an explicit **Apply proposal** action. Set `PORT` or pass a numeric second argument to choose a
port: `node scripts/review_server.ts path/to/workspace 8080`.

The HTTP surface is deliberately portable: JSON resources under `/api/comments` and `/api/jobs`,
the `ReviewStorage` interface for hosted persistence, and `AgentAdapter` for hosted queues. The
default CLI adapter writes one versioned JSON request to stdin, closes stdin, and accepts exactly
one versioned JSON response from stdout; diagnostics belong on stderr. The local process binds
only to `127.0.0.1`, serves only single-level generated presentation files, and is not an
authenticated multi-user service.

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
- `review.mode`: normally `interactive-browser`; other channels attach through adapters
- `review.authority`: `automatic`, `proposal-only`, or `risk-based`
- `review.repository` and `review.pull_request` when GitHub context is useful

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

## Browser review workflow

1. Create or update canonical records.
2. Run the renderer to create the browser presentation.
3. Start the interactive review service for the workspace.
4. Reviewers comment on pages or stable record/field targets in the browser.
5. Active threads and agent jobs persist in the review database.
6. A reviewer sends a thread to the configured agent adapter.
7. The agent replies with an explanation and an optional structured proposal.
8. Apply meaning-preserving changes under policy or require explicit approval for material changes.
9. Update canonical records, append the revision ledger, and regenerate the presentation.
10. Resolve and export the thread only after the browser artifact reflects the response.
11. Commit canonical records, exported resolutions, revision history, and generated presentation together when Git history is desired.

The self-contained reference renderer reads JSON and uses only Node.js built-ins. Node.js 24 or newer runs its erasable TypeScript syntax directly without a loader or transpilation step:

```bash
node scripts/render_discovery.ts path/to/workspace
node scripts/render_discovery.ts path/to/workspace --check
```

`--check` rerenders in memory and compares the exact expected filename set and file bytes. It fails when presentation files are missing, unexpected, hand-edited, or stale relative to canonical sources or renderer behavior. Rendering validates before replacement and restores the previous presentation if the directory swap fails.
