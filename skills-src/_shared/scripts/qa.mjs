#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const targets = process.argv.slice(2);
const command = targets.length > 0 ? ["forma", "qa", ...targets] : ["qa"];
const result = spawnSync("pnpm", command, {
  cwd: repoRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
