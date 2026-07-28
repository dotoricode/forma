#!/usr/bin/env node
// Thin wrapper: `forma validate <spec>`. Kept as a script so Agent Skills
// invoking this directory don't need to know the repo's package manager.
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const result = spawnSync("pnpm", ["forma", "validate", ...process.argv.slice(2)], {
  cwd: repoRoot,
  stdio: "inherit",
});
process.exit(result.status ?? 1);
