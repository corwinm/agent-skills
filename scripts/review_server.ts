#!/usr/bin/env node
export * from "../skills/discovery-workspace/scripts/review_server.ts";
import { main } from "../skills/discovery-workspace/scripts/review_server.ts";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
