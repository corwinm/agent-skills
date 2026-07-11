#!/usr/bin/env python3
"""Validate this repository's Agent Skills without external dependencies."""
from pathlib import Path
import re
import sys

ROOT = Path(__file__).resolve().parents[1]
SKILLS = ROOT / "skills"
NAME_RE = re.compile(r"^[a-z0-9]+(?:-[a-z0-9]+)*$")

def scalar(frontmatter: str, key: str):
    match = re.search(rf"(?m)^{re.escape(key)}:\s*(.+?)\s*$", frontmatter)
    if not match:
        return None
    return match.group(1).strip().strip('"').strip("'")

def validate(path: Path):
    errors = []
    text = path.read_text(encoding="utf-8")
    if not text.startswith("---\n"):
        return ["frontmatter must begin at byte 0"]
    end = text.find("\n---\n", 4)
    if end < 0:
        return ["frontmatter closing delimiter not found"]
    fm = text[4:end]
    body = text[end + 5:].strip()
    name = scalar(fm, "name")
    description = scalar(fm, "description")
    if not name:
        errors.append("name is required")
    elif not NAME_RE.fullmatch(name) or len(name) > 64:
        errors.append("name must be <=64 lowercase alphanumeric/hyphen characters")
    elif name != path.parent.name:
        errors.append(f"name {name!r} must match directory {path.parent.name!r}")
    if not description:
        errors.append("description is required")
    elif len(description) > 1024:
        errors.append("description exceeds 1024 characters")
    if not body:
        errors.append("body is required")
    if len(text.splitlines()) > 500:
        errors.append("SKILL.md exceeds the recommended 500 lines")
    return errors

def main():
    paths = sorted(SKILLS.glob("*/SKILL.md"))
    if not paths:
        print("No skills found", file=sys.stderr)
        return 1
    failed = False
    for path in paths:
        errors = validate(path)
        if errors:
            failed = True
            for error in errors:
                print(f"FAIL {path.relative_to(ROOT)}: {error}")
        else:
            print(f"OK   {path.relative_to(ROOT)}")
    print(f"Validated {len(paths)} skill(s)")
    return int(failed)

if __name__ == "__main__":
    raise SystemExit(main())
