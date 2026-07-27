#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const result = spawnSync("pnpm", ["tsx", "src/qa/run-lighthouse.ts", ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
