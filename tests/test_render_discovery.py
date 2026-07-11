import json
import importlib.util
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest import mock

ROOT = Path(__file__).resolve().parents[1]
RENDERER = ROOT / "scripts" / "render_discovery.py"
SPEC = importlib.util.spec_from_file_location("render_discovery", RENDERER)
assert SPEC is not None and SPEC.loader is not None
render_discovery = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(render_discovery)


def write_json(path: Path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2) + "\n", encoding="utf-8")


def create_workspace(root: Path):
    write_json(
        root / "discovery.json",
        {
            "version": "0.1",
            "id": "deployment-visibility",
            "title": "Deployment visibility",
            "stage": "problem-framing",
            "updated_at": "2026-07-11T18:00:00Z",
            "review": {
                "mode": "github-pull-request",
                "authority": "risk-based",
                "repository": "corwinm/example",
                "pull_request": 12,
            },
            "request": {
                "id": "request-001",
                "verbatim": "Build <all> the dashboards",
                "requester": "Engineering leadership",
                "proposed_solution": "Central dashboard",
            },
            "decision_needed": "Choose the next experiment",
            "recommendation": "Test a plain-language status response",
        },
    )
    write_json(
        root / "records" / "evidence.json",
        [
            {
                "id": "evidence-001",
                "type": "reported-experience",
                "statement": "Support asks engineering whether a fix is live.",
                "source_id": "source-001",
                "limitations": ["Frequency is not established"],
            }
        ],
    )
    write_json(
        root / "records" / "hypotheses.json",
        [
            {
                "id": "problem-001",
                "affected_group": "Support representatives",
                "situation": "Responding to customers waiting for a fix",
                "goal": "Determine whether the fix is available",
                "difficulty": "Deployment state requires interpretation",
                "consequence": "Responses are delayed",
                "supporting_evidence_ids": ["evidence-001"],
                "contradicting_evidence_ids": [],
                "unknowns": ["Request frequency"],
                "status": "leading",
            }
        ],
    )
    write_json(
        root / "records" / "decisions.json",
        [
            {
                "id": "decision-001",
                "decision": "Run a reversible experiment",
                "owner": "Director of Engineering",
                "rationale": "The critical assumption can be tested manually.",
                "unresolved_dissent": [],
            }
        ],
    )
    write_json(
        root / "records" / "experiments.json",
        [
            {
                "id": "experiment-001",
                "problem_hypothesis_id": "problem-001",
                "critical_assumption": "A plain-language response avoids interruptions",
                "intervention": "Manually assisted status response",
                "signals": ["Requests answered without a developer"],
                "decision_rule": "Automate after seven of ten successful requests",
            }
        ],
    )
    write_json(
        root / "comments" / "comment-001.json",
        {
            "id": "comment-001",
            "target": {
                "record_id": "problem-001",
                "record_type": "problem-hypothesis",
                "field": "difficulty",
            },
            "selection": {
                "exact": "Deployment state requires interpretation",
                "prefix": "",
                "suffix": "",
            },
            "body": "Narrow this to cases where CI and runtime disagree.",
            "author": {"github": "corwinm"},
            "created_at": "2026-07-11T18:42:00Z",
            "status": "open",
        },
    )
    write_json(
        root / "history" / "revisions.json",
        [
            {
                "id": "revision-001",
                "created_at": "2026-07-11T18:00:00Z",
                "triggered_by": [],
                "changed_records": ["problem-001"],
                "summary": "Added initial problem hypothesis",
            }
        ],
    )


class RendererTests(unittest.TestCase):
    def run_renderer(self, workspace: Path, *args):
        return subprocess.run(
            [sys.executable, str(RENDERER), str(workspace), *args],
            cwd=ROOT,
            text=True,
            capture_output=True,
        )

    def test_render_creates_hybrid_workspace_pages_and_manifest(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            create_workspace(workspace)

            result = self.run_renderer(workspace)

            self.assertEqual(result.returncode, 0, result.stderr)
            presentation = workspace / "presentation"
            expected = {
                "index.html",
                "evidence.html",
                "hypotheses.html",
                "decisions.html",
                "experiment.html",
                "review.html",
                "artifact.css",
                "artifact.js",
                "manifest.json",
            }
            self.assertEqual({p.name for p in presentation.iterdir()}, expected)
            index = (presentation / "index.html").read_text(encoding="utf-8")
            self.assertIn("Choose the next experiment", index)
            self.assertIn("Test a plain-language status response", index)
            self.assertIn('href="experiment.html"', index)
            self.assertIn("Review proposed experiment", index)
            self.assertIn("problem-001", index)
            self.assertIn("Support asks engineering whether a fix is live.", index)
            self.assertIn("Frequency is not established", index)
            self.assertIn("1 open comment", index)
            self.assertIn("Build &lt;all&gt; the dashboards", index)
            self.assertNotIn("Build <all> the dashboards", index)
            manifest = json.loads((presentation / "manifest.json").read_text())
            self.assertEqual(manifest["workspace_id"], "deployment-visibility")
            self.assertEqual(manifest["renderer_version"], "0.1.0")
            self.assertRegex(manifest["source_digest"], r"^sha256:[0-9a-f]{64}$")

    def test_render_is_deterministic_and_check_detects_stale_output(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            create_workspace(workspace)
            first = self.run_renderer(workspace)
            self.assertEqual(first.returncode, 0, first.stderr)
            before = {
                p.name: p.read_bytes()
                for p in (workspace / "presentation").iterdir()
            }

            second = self.run_renderer(workspace)
            self.assertEqual(second.returncode, 0, second.stderr)
            after = {
                p.name: p.read_bytes()
                for p in (workspace / "presentation").iterdir()
            }
            self.assertEqual(before, after)
            current = self.run_renderer(workspace, "--check")
            self.assertEqual(current.returncode, 0, current.stderr)

            discovery = json.loads((workspace / "discovery.json").read_text())
            discovery["recommendation"] = "Changed without rendering"
            write_json(workspace / "discovery.json", discovery)
            stale = self.run_renderer(workspace, "--check")
            self.assertNotEqual(stale.returncode, 0)
            self.assertIn("stale", stale.stderr.lower())

    def test_check_detects_tampered_and_unexpected_generated_files(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            create_workspace(workspace)
            self.assertEqual(self.run_renderer(workspace).returncode, 0)
            index = workspace / "presentation" / "index.html"
            index.write_text(index.read_text() + "<!-- hand edit -->")
            tampered = self.run_renderer(workspace, "--check")
            self.assertNotEqual(tampered.returncode, 0)
            self.assertIn("changed", tampered.stderr.lower())
            self.assertEqual(self.run_renderer(workspace).returncode, 0)
            (workspace / "presentation" / "obsolete.html").write_text("old")
            unexpected = self.run_renderer(workspace, "--check")
            self.assertNotEqual(unexpected.returncode, 0)
            self.assertIn("unexpected", unexpected.stderr.lower())

            self.assertEqual(self.run_renderer(workspace).returncode, 0)
            nested = workspace / "presentation" / "unexpected"
            nested.mkdir()
            (nested / "file.txt").write_text("unverified")
            nested_unexpected = self.run_renderer(workspace, "--check")
            self.assertNotEqual(nested_unexpected.returncode, 0)
            self.assertIn("unexpected", nested_unexpected.stderr.lower())

    def test_failed_directory_swap_restores_original_and_preserves_unrelated_backup(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            presentation = workspace / "presentation"
            presentation.mkdir()
            original = presentation / "index.html"
            original.write_text("original")
            unrelated = workspace / ".presentation-backup"
            unrelated.mkdir()
            (unrelated / "user-data.txt").write_text("preserve")
            real_rename = Path.rename
            calls = 0

            def fail_install(path, target):
                nonlocal calls
                calls += 1
                if calls == 2:
                    raise OSError("simulated install failure")
                return real_rename(path, target)

            with mock.patch.object(Path, "rename", fail_install):
                with self.assertRaises(OSError):
                    render_discovery.replace_presentation(
                        workspace, {"index.html": b"replacement"}
                    )
            self.assertEqual(original.read_text(), "original")
            self.assertEqual((unrelated / "user-data.txt").read_text(), "preserve")

    def test_review_page_preserves_stable_comment_target_and_github_context(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            create_workspace(workspace)

            result = self.run_renderer(workspace)

            self.assertEqual(result.returncode, 0, result.stderr)
            review = (workspace / "presentation" / "review.html").read_text()
            self.assertIn('data-record-id="problem-001"', review)
            self.assertIn('data-field="difficulty"', review)
            self.assertIn("Narrow this to cases where CI and runtime disagree.", review)
            self.assertIn("corwinm/example/pull/12", review)
            self.assertIn("comment-001", review)

    def test_missing_record_id_fails_without_replacing_existing_presentation(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            create_workspace(workspace)
            presentation = workspace / "presentation"
            presentation.mkdir()
            sentinel = presentation / "keep.txt"
            sentinel.write_text("keep", encoding="utf-8")
            evidence = json.loads((workspace / "records" / "evidence.json").read_text())
            evidence[0].pop("id")
            write_json(workspace / "records" / "evidence.json", evidence)

            result = self.run_renderer(workspace)

            self.assertNotEqual(result.returncode, 0)
            self.assertIn("id", result.stderr.lower())
            self.assertEqual(sentinel.read_text(), "keep")

    def test_invalid_authority_and_unknown_comment_field_are_rejected(self):
        with tempfile.TemporaryDirectory() as directory:
            workspace = Path(directory)
            create_workspace(workspace)
            discovery = json.loads((workspace / "discovery.json").read_text())
            discovery["review"]["authority"] = "whatever"
            write_json(workspace / "discovery.json", discovery)
            invalid = self.run_renderer(workspace)
            self.assertNotEqual(invalid.returncode, 0)
            self.assertIn("authority", invalid.stderr.lower())
            discovery["review"]["authority"] = "risk-based"
            write_json(workspace / "discovery.json", discovery)
            path = workspace / "comments" / "comment-001.json"
            comment = json.loads(path.read_text())
            comment["target"]["field"] = "not-a-field"
            write_json(path, comment)
            unknown = self.run_renderer(workspace)
            self.assertNotEqual(unknown.returncode, 0)
            self.assertIn("not-a-field", unknown.stderr)


if __name__ == "__main__":
    unittest.main()
