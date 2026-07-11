#!/usr/bin/env python3
"""Render a portable discovery workspace into deterministic committed HTML."""

from __future__ import annotations

import argparse
import hashlib
import html
import json
from pathlib import Path
import shutil
import sys
import tempfile
from typing import Any
import uuid

VERSION = "0.1.0"
SOURCE_FILES = (
    "discovery.json",
    "records/evidence.json",
    "records/hypotheses.json",
    "records/decisions.json",
    "records/experiments.json",
    "history/revisions.json",
)
PAGES = (
    "index.html",
    "evidence.html",
    "hypotheses.html",
    "decisions.html",
    "experiment.html",
    "review.html",
)


class WorkspaceError(ValueError):
    pass


def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists() and default is not None:
        return default
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as error:
        raise WorkspaceError(f"Required file not found: {path}") from error
    except json.JSONDecodeError as error:
        raise WorkspaceError(f"Invalid JSON in {path}: {error}") from error


def require_mapping(value: Any, label: str) -> dict[str, Any]:
    if not isinstance(value, dict):
        raise WorkspaceError(f"{label} must be a JSON object")
    return value


def require_records(value: Any, label: str) -> list[dict[str, Any]]:
    if not isinstance(value, list):
        raise WorkspaceError(f"{label} must be a JSON array")
    records: list[dict[str, Any]] = []
    for index, record in enumerate(value):
        if not isinstance(record, dict):
            raise WorkspaceError(f"{label}[{index}] must be a JSON object")
        record_id = record.get("id")
        if not isinstance(record_id, str) or not record_id.strip():
            raise WorkspaceError(f"{label}[{index}] requires a non-empty id")
        records.append(record)
    return records


def require_string_list(record: dict[str, Any], field: str, label: str) -> None:
    value = record.get(field, [])
    if not isinstance(value, list) or not all(isinstance(item, str) for item in value):
        raise WorkspaceError(f"{label}.{field} must be an array of strings")


def load_workspace(root: Path) -> dict[str, Any]:
    discovery = require_mapping(read_json(root / "discovery.json"), "discovery.json")
    for field in ("id", "title", "updated_at", "request"):
        if field not in discovery:
            raise WorkspaceError(f"discovery.json requires {field}")
    request = require_mapping(discovery["request"], "discovery.request")
    if not request.get("id"):
        raise WorkspaceError("discovery.request requires id")
    review = require_mapping(discovery.get("review", {}), "discovery.review")
    authority = review.get("authority", "risk-based")
    if authority not in {"automatic", "proposal-only", "risk-based"}:
        raise WorkspaceError(f"Unknown review authority: {authority}")

    evidence = require_records(
        read_json(root / "records" / "evidence.json", []), "records/evidence.json"
    )
    hypotheses = require_records(
        read_json(root / "records" / "hypotheses.json", []),
        "records/hypotheses.json",
    )
    decisions = require_records(
        read_json(root / "records" / "decisions.json", []),
        "records/decisions.json",
    )
    experiments = require_records(
        read_json(root / "records" / "experiments.json", []),
        "records/experiments.json",
    )
    revisions = require_records(
        read_json(root / "history" / "revisions.json", []),
        "history/revisions.json",
    )
    for record in evidence:
        require_string_list(record, "limitations", record["id"])
    for record in hypotheses:
        for name in ("supporting_evidence_ids", "contradicting_evidence_ids", "unknowns"):
            require_string_list(record, name, record["id"])
    for record in decisions:
        for name in ("alternatives", "unresolved_dissent"):
            require_string_list(record, name, record["id"])
    for record in experiments:
        require_string_list(record, "signals", record["id"])

    comments: list[dict[str, Any]] = []
    comments_directory = root / "comments"
    if comments_directory.exists():
        for path in sorted(comments_directory.glob("*.json")):
            comment = require_mapping(read_json(path), str(path.relative_to(root)))
            if not comment.get("id"):
                raise WorkspaceError(f"{path.relative_to(root)} requires id")
            target = require_mapping(comment.get("target"), f"{path.name}.target")
            if not target.get("record_id") or not target.get("field"):
                raise WorkspaceError(
                    f"{path.relative_to(root)} target requires record_id and field"
                )
            comments.append(comment)

    all_ids = [request["id"]]
    for collection in (evidence, hypotheses, decisions, experiments, revisions):
        all_ids.extend(record["id"] for record in collection)
    duplicates = sorted({value for value in all_ids if all_ids.count(value) > 1})
    if duplicates:
        raise WorkspaceError(f"Duplicate record ids: {', '.join(duplicates)}")

    records_by_id = {
        record["id"]: record
        for collection in (evidence, hypotheses, decisions, experiments)
        for record in collection
    }
    records_by_id[request["id"]] = request
    for comment in comments:
        target_id = comment["target"]["record_id"]
        if target_id not in records_by_id:
            raise WorkspaceError(
                f"Comment {comment['id']} targets unknown record {target_id}"
            )
        field_name = comment["target"]["field"]
        if field_name not in records_by_id[target_id]:
            raise WorkspaceError(
                f"Comment {comment['id']} targets unknown field {field_name} on {target_id}"
            )
    comment_ids = [comment["id"] for comment in comments]
    duplicate_comments = sorted(
        {value for value in comment_ids if comment_ids.count(value) > 1}
    )
    if duplicate_comments:
        raise WorkspaceError(f"Duplicate comment ids: {', '.join(duplicate_comments)}")

    return {
        "discovery": discovery,
        "request": request,
        "evidence": evidence,
        "hypotheses": hypotheses,
        "decisions": decisions,
        "experiments": experiments,
        "comments": comments,
        "revisions": revisions,
        "records_by_id": records_by_id,
    }


def source_paths(root: Path) -> list[Path]:
    paths = [root / relative for relative in SOURCE_FILES if (root / relative).exists()]
    comments = root / "comments"
    if comments.exists():
        paths.extend(sorted(comments.glob("*.json")))
    sources = root / "sources"
    if sources.exists():
        paths.extend(sorted(path for path in sources.rglob("*") if path.is_file()))
    return sorted(paths, key=lambda path: path.relative_to(root).as_posix())


def source_digest(root: Path) -> str:
    digest = hashlib.sha256()
    for path in source_paths(root):
        relative = path.relative_to(root).as_posix().encode()
        digest.update(len(relative).to_bytes(8, "big"))
        digest.update(relative)
        content = path.read_bytes()
        digest.update(len(content).to_bytes(8, "big"))
        digest.update(content)
    return f"sha256:{digest.hexdigest()}"


def e(value: Any) -> str:
    return html.escape(str(value if value is not None else ""), quote=True)


def list_items(values: Any, empty: str = "None recorded") -> str:
    if not values:
        return f'<p class="empty">{e(empty)}</p>'
    return "<ul>" + "".join(f"<li>{e(value)}</li>" for value in values) + "</ul>"


def record_attributes(record_id: str, field: str | None = None) -> str:
    result = f'data-record-id="{e(record_id)}"'
    if field:
        result += f' data-field="{e(field)}"'
    return result


def field(label: str, value: Any, record_id: str, name: str) -> str:
    return (
        f'<div class="field" {record_attributes(record_id, name)}>'
        f'<span class="field-label">{e(label)}</span>'
        f'<p>{e(value) or "<span class=empty>Not recorded</span>"}</p>'
        "</div>"
    )


def nav(active: str) -> str:
    links = (
        ("Overview", "index.html"),
        ("Evidence", "evidence.html"),
        ("Hypotheses", "hypotheses.html"),
        ("Decisions", "decisions.html"),
        ("Experiment", "experiment.html"),
        ("Review", "review.html"),
    )
    return '<nav aria-label="Artifact views">' + "".join(
        f'<a href="{href}"{(" aria-current=page" if href == active else "")}>{label}</a>'
        for label, href in links
    ) + "</nav>"


def page(title: str, active: str, workspace: dict[str, Any], body: str) -> str:
    discovery = workspace["discovery"]
    open_count = sum(
        1 for comment in workspace["comments"] if comment.get("status") == "open"
    )
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generator" content="agent-skills discovery renderer {VERSION}">
  <title>{e(title)} · {e(discovery["title"])}</title>
  <link rel="stylesheet" href="artifact.css">
  <script src="artifact.js" defer></script>
</head>
<body>
  <!-- Generated from discovery records. Do not edit directly. -->
  <header class="app-header">
    <div>
      <a class="eyebrow" href="index.html">Discovery artifact</a>
      <h1>{e(discovery["title"])}</h1>
    </div>
    <div class="header-meta">
      <span class="status">{e(discovery.get("stage", "Unstaged"))}</span>
      <a class="comment-count" href="review.html">{open_count} open comment{'' if open_count == 1 else 's'}</a>
    </div>
  </header>
  {nav(active)}
  <main>{body}</main>
  <footer>Updated {e(discovery["updated_at"])} · Workspace {e(discovery["id"])}</footer>
</body>
</html>
'''


def render_index(workspace: dict[str, Any]) -> str:
    discovery = workspace["discovery"]
    request = workspace["request"]
    hypotheses = workspace["hypotheses"]
    leading = next(
        (item for item in hypotheses if item.get("status") == "leading"),
        hypotheses[0] if hypotheses else None,
    )
    hypothesis = '<p class="empty">No problem hypothesis recorded.</p>'
    if leading:
        hypothesis = f'''
        <article class="hypothesis" {record_attributes(leading["id"])}>
          <span class="record-id">{e(leading["id"])}</span>
          <h3>{e(leading.get("affected_group", "Problem hypothesis"))}</h3>
          {field("Situation", leading.get("situation"), leading["id"], "situation")}
          {field("Difficulty", leading.get("difficulty"), leading["id"], "difficulty")}
          {field("Consequence", leading.get("consequence"), leading["id"], "consequence")}
          <a class="text-link" href="hypotheses.html#{e(leading['id'])}">Inspect hypothesis →</a>
        </article>'''
    key_evidence = "".join(
        f'''<article class="evidence-summary" {record_attributes(record['id'])}>
          <span class="record-id">{e(record['id'])}</span>
          <p {record_attributes(record['id'], 'statement')}>{e(record.get('statement', ''))}</p>
          <div><strong>Limitations</strong>{list_items(record.get('limitations'), 'No limitations recorded')}</div>
        </article>'''
        for record in workspace["evidence"][:2]
    ) or '<p class="empty">No evidence recorded.</p>'
    body = f'''
    <section class="decision-banner">
      <span class="eyebrow">Decision needed</span>
      <h2>{e(discovery.get("decision_needed", "No decision recorded"))}</h2>
      <p>{e(discovery.get("recommendation", "No recommendation recorded"))}</p>
      <a class="decision-action" href="experiment.html">Review proposed experiment →</a>
    </section>
    <div class="overview-grid">
      <section class="panel" {record_attributes(request["id"])}>
        <span class="eyebrow">Original request</span>
        <blockquote {record_attributes(request["id"], "verbatim")}>{e(request.get("verbatim", ""))}</blockquote>
        <dl>
          <div><dt>Requester</dt><dd>{e(request.get("requester", "Unknown"))}</dd></div>
          <div><dt>Proposed solution</dt><dd>{e(request.get("proposed_solution", "Not recorded"))}</dd></div>
        </dl>
      </section>
      <section class="panel">
        <span class="eyebrow">Current problem frame</span>
        {hypothesis}
      </section>
    </div>
    <section class="panel key-evidence">
      <div class="section-heading"><div><span class="eyebrow">Key evidence</span><h2>What currently supports the frame</h2></div><a class="text-link" href="evidence.html">Inspect all evidence →</a></div>
      <div class="evidence-summary-grid">{key_evidence}</div>
    </section>
    <section class="metrics" aria-label="Artifact contents">
      <a href="evidence.html"><strong>{len(workspace['evidence'])}</strong><span>Evidence records</span></a>
      <a href="hypotheses.html"><strong>{len(hypotheses)}</strong><span>Problem hypotheses</span></a>
      <a href="decisions.html"><strong>{len(workspace['decisions'])}</strong><span>Decisions</span></a>
      <a href="review.html"><strong>{sum(1 for c in workspace['comments'] if c.get('status') == 'open')}</strong><span>Open comments</span></a>
    </section>
    '''
    return page("Overview", "index.html", workspace, body)


def render_evidence(workspace: dict[str, Any]) -> str:
    cards = []
    for record in workspace["evidence"]:
        limitations = list_items(record.get("limitations"), "No limitations recorded")
        cards.append(f'''
        <article class="record" id="{e(record['id'])}" {record_attributes(record['id'])}>
          <div class="record-heading"><span class="record-id">{e(record['id'])}</span><span class="tag">{e(record.get('type', 'evidence'))}</span></div>
          <h2 {record_attributes(record['id'], 'statement')}>{e(record.get('statement', ''))}</h2>
          <dl><div><dt>Source</dt><dd>{e(record.get('source_id', 'Unknown'))}</dd></div></dl>
          <h3>Limitations</h3>{limitations}
        </article>''')
    body = '<header class="page-intro"><span class="eyebrow">Inspect</span><h2>Evidence</h2><p>Source-linked observations and statements. Limitations remain visible.</p></header>' + ("".join(cards) or '<p class="empty">No evidence recorded.</p>')
    return page("Evidence", "evidence.html", workspace, body)


def render_hypotheses(workspace: dict[str, Any]) -> str:
    cards = []
    for record in workspace["hypotheses"]:
        cards.append(f'''
        <article class="record hypothesis-detail" id="{e(record['id'])}" {record_attributes(record['id'])}>
          <div class="record-heading"><span class="record-id">{e(record['id'])}</span><span class="tag">{e(record.get('status', 'candidate'))}</span></div>
          <h2>{e(record.get('affected_group', 'Problem hypothesis'))}</h2>
          {field('Situation', record.get('situation'), record['id'], 'situation')}
          {field('Goal', record.get('goal'), record['id'], 'goal')}
          {field('Difficulty', record.get('difficulty'), record['id'], 'difficulty')}
          {field('Consequence', record.get('consequence'), record['id'], 'consequence')}
          <div class="evidence-columns">
            <div><h3>Supporting evidence</h3>{list_items(record.get('supporting_evidence_ids'))}</div>
            <div><h3>Contradicting evidence</h3>{list_items(record.get('contradicting_evidence_ids'))}</div>
          </div>
          <h3>Unknowns</h3>{list_items(record.get('unknowns'))}
        </article>''')
    body = '<header class="page-intro"><span class="eyebrow">Compare</span><h2>Problem hypotheses</h2><p>Competing frames retain support, contradiction, and uncertainty.</p></header><div class="record-grid">' + ("".join(cards) or '<p class="empty">No hypotheses recorded.</p>') + '</div>'
    return page("Hypotheses", "hypotheses.html", workspace, body)


def render_decisions(workspace: dict[str, Any]) -> str:
    cards = []
    for record in workspace["decisions"]:
        cards.append(f'''
        <article class="record" id="{e(record['id'])}" {record_attributes(record['id'])}>
          <span class="record-id">{e(record['id'])}</span>
          <h2 {record_attributes(record['id'], 'decision')}>{e(record.get('decision', ''))}</h2>
          {field('Owner', record.get('owner'), record['id'], 'owner')}
          {field('Rationale', record.get('rationale'), record['id'], 'rationale')}
          <h3>Alternatives considered</h3>{list_items(record.get('alternatives'))}
          <h3>Unresolved dissent</h3>{list_items(record.get('unresolved_dissent'))}
        </article>''')
    revisions = "".join(
        f'<li><span>{e(revision.get("created_at", ""))}</span><strong>{e(revision.get("summary", ""))}</strong><code>{e(revision["id"])}</code></li>'
        for revision in reversed(workspace["revisions"])
    )
    body = '<header class="page-intro"><span class="eyebrow">Audit</span><h2>Decisions and revisions</h2><p>Choices, rationale, dissent, and changes remain reviewable.</p></header>' + ("".join(cards) or '<p class="empty">No decisions recorded.</p>') + f'<section class="panel revision-panel"><h2>Revision history</h2><ol class="timeline">{revisions or "<li>No revisions recorded.</li>"}</ol></section>'
    return page("Decisions", "decisions.html", workspace, body)


def render_experiment(workspace: dict[str, Any]) -> str:
    cards = []
    for record in workspace["experiments"]:
        cards.append(f'''
        <article class="record" id="{e(record['id'])}" {record_attributes(record['id'])}>
          <span class="record-id">{e(record['id'])}</span>
          <h2>{e(record.get('intervention', 'Experiment'))}</h2>
          {field('Critical assumption', record.get('critical_assumption'), record['id'], 'critical_assumption')}
          <h3>Signals</h3>{list_items(record.get('signals'))}
          {field('Decision rule', record.get('decision_rule'), record['id'], 'decision_rule')}
          <p class="linked-record">Tests <a href="hypotheses.html#{e(record.get('problem_hypothesis_id', ''))}">{e(record.get('problem_hypothesis_id', 'Unknown hypothesis'))}</a></p>
        </article>''')
    body = '<header class="page-intro"><span class="eyebrow">Act and learn</span><h2>Experiment or increment</h2><p>The next action is tied to an assumption and a decision rule.</p></header>' + ("".join(cards) or '<p class="empty">No experiment recorded.</p>')
    return page("Experiment", "experiment.html", workspace, body)


def github_pr_url(discovery: dict[str, Any]) -> str | None:
    review = discovery.get("review") or {}
    repository = review.get("repository")
    pull_request = review.get("pull_request")
    if repository and pull_request:
        return f"https://github.com/{repository}/pull/{pull_request}"
    return None


def render_review(workspace: dict[str, Any]) -> str:
    pr_url = github_pr_url(workspace["discovery"])
    cards = []
    for comment in workspace["comments"]:
        target = comment["target"]
        selection = comment.get("selection") or {}
        author = comment.get("author") or {}
        github = author.get("github", "Unknown")
        status = comment.get("status", "open")
        review_link = (
            f'<a class="button" href="{e(pr_url)}">Open pull request</a>' if pr_url else ""
        )
        cards.append(f'''
        <article class="comment {e(status)}" id="{e(comment['id'])}" {record_attributes(target['record_id'], target['field'])}>
          <div class="record-heading"><span class="record-id">{e(comment['id'])}</span><span class="tag">{e(status)}</span></div>
          <p class="comment-target">{e(target.get('record_type', 'record'))} · {e(target['record_id'])} · {e(target['field'])}</p>
          <blockquote>{e(selection.get('exact', 'No text selection recorded'))}</blockquote>
          <p class="comment-body">{e(comment.get('body', ''))}</p>
          <div class="comment-meta"><span>@{e(github)}</span><time>{e(comment.get('created_at', ''))}</time>{review_link}</div>
        </article>''')
    authority = (workspace["discovery"].get("review") or {}).get("authority", "risk-based")
    policy = {
        "automatic": "The agent may apply review-driven changes and must record every revision.",
        "proposal-only": "The agent proposes all review-driven changes for human approval.",
        "risk-based": "Meaning-preserving corrections may be applied; material discovery changes require a proposal.",
    }[authority]
    body = f'''
    <header class="page-intro"><span class="eyebrow">Review</span><h2>Comments and agent revisions</h2><p>Comments keep stable record and field anchors plus selected-text context.</p></header>
    <section class="policy"><strong>Agent authority:</strong> {e(authority)}. {e(policy)}</section>
    {''.join(cards) or '<p class="empty">No comments recorded.</p>'}
    '''
    return page("Review", "review.html", workspace, body)


CSS = r''':root {
  --paper: #f4f1ea; --surface: #fffdf8; --ink: #18201d; --muted: #66706b;
  --line: #d8d5cc; --accent: #176b55; --accent-soft: #dcece5; --warning: #8a5b12;
  --serif: Georgia, "Times New Roman", serif; --sans: ui-sans-serif, system-ui, sans-serif;
}
* { box-sizing: border-box; }
html { color-scheme: light; background: var(--paper); }
body { margin: 0; color: var(--ink); font: 16px/1.55 var(--sans); }
a { color: inherit; }
.app-header, nav, main, footer { width: min(1180px, calc(100% - 40px)); margin-inline: auto; }
.app-header { display: flex; justify-content: space-between; align-items: end; padding: 42px 0 20px; gap: 24px; }
h1, h2, h3, p { margin-top: 0; }
h1 { margin-bottom: 0; font: 700 clamp(2rem, 4vw, 3.3rem)/1 var(--serif); letter-spacing: -.035em; }
h2 { font: 700 1.55rem/1.15 var(--serif); }
h3 { font-size: .84rem; text-transform: uppercase; letter-spacing: .08em; }
.eyebrow, .field-label, dt { color: var(--muted); font-size: .72rem; font-weight: 750; letter-spacing: .11em; text-transform: uppercase; }
.header-meta { display: flex; align-items: center; gap: 10px; }
.status, .comment-count, .tag { border: 1px solid var(--line); border-radius: 999px; padding: 6px 10px; font-size: .78rem; text-decoration: none; }
.status { background: var(--accent-soft); border-color: transparent; color: #0c4b3b; }
nav { display: flex; gap: 3px; border-block: 1px solid var(--line); overflow-x: auto; }
nav a { padding: 13px 15px; color: var(--muted); text-decoration: none; white-space: nowrap; }
nav a[aria-current="page"] { color: var(--ink); box-shadow: inset 0 -2px var(--accent); }
main { padding-block: 36px 70px; }
footer { border-top: 1px solid var(--line); padding: 20px 0 36px; color: var(--muted); font-size: .8rem; }
.decision-banner { background: var(--ink); color: white; padding: clamp(28px, 5vw, 58px); margin-bottom: 24px; }
.decision-banner .eyebrow { color: #9fc3b8; }
.decision-banner h2 { max-width: 800px; font-size: clamp(2rem, 5vw, 4.6rem); letter-spacing: -.045em; margin: 14px 0 18px; }
.decision-banner p { max-width: 700px; color: #dce4e0; font-size: 1.08rem; }
.decision-action { display: inline-block; margin-top: 8px; color: white; font-weight: 750; text-underline-offset: 4px; }
.overview-grid, .record-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; }
.panel, .record, .comment { background: var(--surface); border: 1px solid var(--line); padding: 28px; margin-bottom: 24px; }
blockquote { margin: 18px 0; padding-left: 18px; border-left: 3px solid var(--accent); font: 1.25rem/1.4 var(--serif); }
dl { margin-bottom: 0; }
dl div { border-top: 1px solid var(--line); padding: 12px 0; }
dd { margin: 3px 0 0; }
.record-id { color: var(--muted); font: .75rem ui-monospace, monospace; }
.hypothesis { margin-top: 18px; }
.hypothesis h3 { font: 700 1.3rem/1.2 var(--serif); text-transform: none; letter-spacing: 0; margin-top: 8px; }
.field { border-top: 1px solid var(--line); padding-top: 12px; margin-top: 12px; }
.field p { margin: 5px 0 0; }
.text-link { display: inline-block; margin-top: 14px; color: var(--accent); font-weight: 700; text-decoration: none; }
.section-heading { display: flex; justify-content: space-between; align-items: start; gap: 24px; }
.section-heading h2 { margin-top: 6px; }
.evidence-summary-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
.evidence-summary { border-top: 1px solid var(--line); padding-top: 16px; }
.evidence-summary p { font: 1.1rem/1.4 var(--serif); margin: 8px 0 12px; }
.evidence-summary strong { font-size: .76rem; text-transform: uppercase; letter-spacing: .08em; }
.evidence-summary ul { color: var(--muted); margin-bottom: 0; }
.metrics { display: grid; grid-template-columns: repeat(4, 1fr); border: 1px solid var(--line); background: var(--surface); margin-top: 24px; }
.metrics a { display: flex; flex-direction: column; padding: 20px; text-decoration: none; border-right: 1px solid var(--line); }
.metrics a:last-child { border-right: 0; }
.metrics strong { font: 700 2rem var(--serif); }
.metrics span { color: var(--muted); font-size: .82rem; }
.page-intro { max-width: 720px; margin-bottom: 32px; }
.page-intro h2 { font-size: clamp(2.2rem, 5vw, 4rem); margin: 6px 0 10px; }
.page-intro p { color: var(--muted); font-size: 1.05rem; }
.record-heading, .comment-meta { display: flex; justify-content: space-between; align-items: center; gap: 10px; }
.record h2 { margin-top: 16px; }
.evidence-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; border-top: 1px solid var(--line); padding-top: 20px; margin-top: 20px; }
.empty { color: var(--muted); font-style: italic; }
.revision-panel { margin-top: 32px; }
.timeline { list-style: none; padding: 0; }
.timeline li { display: grid; grid-template-columns: 170px 1fr auto; gap: 20px; border-top: 1px solid var(--line); padding: 14px 0; }
.timeline span, .timeline code { color: var(--muted); font-size: .78rem; }
.linked-record { margin-top: 24px; color: var(--muted); }
.policy { border: 1px solid #d6c8a9; background: #f7efd9; color: #66480f; padding: 16px 18px; margin-bottom: 24px; }
.comment { max-width: 820px; }
.comment.open { border-left: 4px solid var(--warning); }
.comment-target { color: var(--muted); font: .78rem ui-monospace, monospace; margin-top: 16px; }
.comment-body { font-size: 1.08rem; }
.comment-meta { color: var(--muted); font-size: .8rem; justify-content: flex-start; }
.button { margin-left: auto; padding: 7px 11px; border: 1px solid var(--line); text-decoration: none; color: var(--ink); }
@media (max-width: 760px) {
  .app-header { align-items: start; flex-direction: column; }
  .overview-grid, .record-grid, .evidence-columns { grid-template-columns: 1fr; }
  .metrics { grid-template-columns: repeat(2, 1fr); }
  .metrics a:nth-child(2) { border-right: 0; }
  .metrics a { border-bottom: 1px solid var(--line); }
  .timeline li { grid-template-columns: 1fr; gap: 4px; }
}
@media (prefers-reduced-motion: no-preference) { a { transition: color .15s ease, background .15s ease; } }
'''

JS = r'''// Presentation behavior is intentionally limited to accessible native HTML controls.
'''


def render_files(workspace: dict[str, Any], digest: str) -> dict[str, bytes]:
    discovery = workspace["discovery"]
    manifest = {
        "workspace_id": discovery["id"],
        "renderer_version": VERSION,
        "generated_at": discovery["updated_at"],
        "source_digest": digest,
        "pages": list(PAGES),
        "generated_files": [*PAGES, "artifact.css", "artifact.js", "manifest.json"],
    }
    return {
        "index.html": render_index(workspace).encode(),
        "evidence.html": render_evidence(workspace).encode(),
        "hypotheses.html": render_hypotheses(workspace).encode(),
        "decisions.html": render_decisions(workspace).encode(),
        "experiment.html": render_experiment(workspace).encode(),
        "review.html": render_review(workspace).encode(),
        "artifact.css": CSS.encode(),
        "artifact.js": JS.encode(),
        "manifest.json": (json.dumps(manifest, indent=2, sort_keys=True) + "\n").encode(),
    }


def check_current(root: Path, workspace: dict[str, Any], digest: str) -> None:
    presentation = root / "presentation"
    if not presentation.exists():
        raise WorkspaceError("Presentation is missing or stale; run the renderer")
    expected = render_files(workspace, digest)
    actual_entries = {
        path.relative_to(presentation).as_posix()
        for path in presentation.rglob("*")
    }
    expected_names = set(expected)
    missing = sorted(expected_names - actual_entries)
    unexpected = sorted(actual_entries - expected_names)
    changed = sorted(
        name
        for name, content in expected.items()
        if (presentation / name).exists() and (presentation / name).read_bytes() != content
    )
    problems = []
    if missing:
        problems.append(f"missing files: {', '.join(missing)}")
    if unexpected:
        problems.append(f"unexpected files: {', '.join(unexpected)}")
    if changed:
        problems.append(f"changed files: {', '.join(changed)}")
    if problems:
        raise WorkspaceError(f"Presentation is stale; {'; '.join(problems)}")


def replace_presentation(root: Path, files: dict[str, bytes]) -> None:
    destination = root / "presentation"
    root.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="discovery-render-", dir=root) as directory:
        temporary = Path(directory) / "presentation"
        temporary.mkdir()
        for name, content in files.items():
            (temporary / name).write_bytes(content)
        backup = root / f".presentation-backup-{uuid.uuid4().hex}"
        moved_existing = False
        try:
            if destination.exists():
                destination.rename(backup)
                moved_existing = True
            temporary.rename(destination)
        except Exception:
            if destination.exists():
                shutil.rmtree(destination)
            if moved_existing and backup.exists():
                backup.rename(destination)
            raise
        else:
            if backup.exists():
                shutil.rmtree(backup)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("workspace", type=Path)
    parser.add_argument("--check", action="store_true", help="Fail if committed HTML is stale")
    args = parser.parse_args()
    root = args.workspace.resolve()
    try:
        workspace = load_workspace(root)
        digest = source_digest(root)
        if args.check:
            check_current(root, workspace, digest)
            print(f"Current presentation: {root / 'presentation'}")
            return 0
        replace_presentation(root, render_files(workspace, digest))
        print(f"Rendered presentation: {root / 'presentation'}")
        return 0
    except WorkspaceError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
