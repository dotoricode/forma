#!/usr/bin/env node
/**
 * Final naming gate: fails if "Sensemark" (or any case variant, or its
 * derived identifiers) appears anywhere in the repo outside the two
 * legacy planning documents that are deliberately preserved unchanged.
 * See docs/plan/README.md.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";

const REPO_ROOT = path.resolve(import.meta.dirname, "..");

const IGNORED_DIRS = new Set([
  "node_modules",
  ".git",
  "dist",
  ".pnpm-store",
  ".forma-cache",
]);

// Files allowed to mention "Sensemark" because they deliberately document
// the rename as historical fact — not because the rename was missed there.
const ALLOWED_FILES = new Set([
  "docs/plan/sensemark-mvp-agent-build-instructions-v2.md",
  "docs/plan/sensemark-agent-start-prompt-v2.md",
  "docs/plan/README.md",
  "docs/decisions.md",
  "README.md",
  "CHANGELOG.md",
  "scripts/check-naming.mjs", // this file's own patterns/strings
]);

const PATTERNS = [/sensemark/i, /\$sensemark/i, /\/sensemark\b/i];

async function walk(dir, files) {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (IGNORED_DIRS.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await walk(full, files);
    } else {
      files.push(full);
    }
  }
  return files;
}

async function main() {
  const files = await walk(REPO_ROOT, []);
  const violations = [];

  for (const file of files) {
    const rel = path.relative(REPO_ROOT, file);
    if (ALLOWED_FILES.has(rel)) continue;
    let content;
    try {
      content = await readFile(file, "utf-8");
    } catch {
      continue; // binary or unreadable — skip
    }
    for (const pattern of PATTERNS) {
      if (pattern.test(content)) {
        violations.push(rel);
        break;
      }
    }
  }

  if (violations.length > 0) {
    console.error(`check-naming: found "Sensemark" outside the allowed legacy files in ${violations.length} file(s):`);
    for (const v of violations) console.error(`  - ${v}`);
    process.exit(1);
  }

  console.log("check-naming: clean — no stray Sensemark references");
}

await main();
