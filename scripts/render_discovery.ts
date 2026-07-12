#!/usr/bin/env node
export * from "../skills/discovery-workspace/scripts/render_discovery.ts";
import { main } from "../skills/discovery-workspace/scripts/render_discovery.ts";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url))
  process.exitCode = main();
