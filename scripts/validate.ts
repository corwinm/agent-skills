#!/usr/bin/env -S npx tsx
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const SKILLS = join(ROOT, "skills");
const NAME_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function scalar(frontmatter: string, key: string): string | undefined {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = frontmatter.match(new RegExp(`^${escaped}:\\s*(.+?)\\s*$`, "m"));
  return match?.[1]?.trim().replace(/^(["'])(.*)\1$/, "$2");
}

export function validate(path: string): string[] {
  const errors: string[] = [];
  const text = readFileSync(path, "utf8");
  if (!text.startsWith("---\n")) return ["frontmatter must begin at byte 0"];
  const end = text.indexOf("\n---\n", 4);
  if (end < 0) return ["frontmatter closing delimiter not found"];
  const frontmatter = text.slice(4, end);
  const body = text.slice(end + 5).trim();
  const name = scalar(frontmatter, "name");
  const description = scalar(frontmatter, "description");
  if (!name) errors.push("name is required");
  else if (!NAME_RE.test(name) || name.length > 64) errors.push("name must be <=64 lowercase alphanumeric/hyphen characters");
  else if (name !== dirname(path).split("/").at(-1)) errors.push(`name '${name}' must match directory '${dirname(path).split("/").at(-1)}'`);
  if (!description) errors.push("description is required");
  else if (description.length > 1024) errors.push("description exceeds 1024 characters");
  if (!body) errors.push("body is required");
  if (text.split(/\r?\n/).length - (text.endsWith("\n") ? 1 : 0) > 500) errors.push("SKILL.md exceeds the recommended 500 lines");
  return errors;
}

export function main(): number {
  const paths = readdirSync(SKILLS, { withFileTypes: true }).filter((entry) => entry.isDirectory()).map((entry) => join(SKILLS, entry.name, "SKILL.md")).sort();
  if (paths.length === 0) { console.error("No skills found"); return 1; }
  let failed = false;
  for (const path of paths) {
    const errors = validate(path);
    if (errors.length) {
      failed = true;
      for (const error of errors) console.log(`FAIL ${relative(ROOT, path)}: ${error}`);
    } else console.log(`OK   ${relative(ROOT, path)}`);
  }
  console.log(`Validated ${paths.length} skill(s)`);
  return Number(failed);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) process.exitCode = main();
