#!/usr/bin/env -S npx tsx
export * from "../skills/discovery-artifact-presentation/scripts/render_discovery.js";
import { main } from "../skills/discovery-artifact-presentation/scripts/render_discovery.js";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exitCode = main();
