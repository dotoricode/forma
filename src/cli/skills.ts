/**
 * Syncs the canonical Agent Skill (`skills/forma/`) to the Codex and Claude
 * Code skill directories. We copy + checksum rather than symlink, so the
 * copies survive on Windows and when the repo is shared without symlink
 * support; CI re-runs `verify-skills` to catch drift.
 */
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";

export const CANONICAL_SKILL_DIR = "skills/forma";
export const INSTALL_TARGETS = [".agents/skills/forma", ".claude/skills/forma"];
const DO_NOT_EDIT_HEADER =
  "<!-- GENERATED COPY — do not edit directly. Source of truth: skills/forma/. Run `pnpm forma install-skills` after editing the source. -->\n";
const CHECKSUM_FILE = ".forma-skill-checksum.json";

function addDoNotEditHeader(skillMd: string): string {
  const frontmatter = skillMd.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n/);
  if (!frontmatter) {
    throw new Error(`${CANONICAL_SKILL_DIR}/SKILL.md must start with YAML frontmatter`);
  }
  return `${frontmatter[0]}${DO_NOT_EDIT_HEADER}${skillMd.slice(frontmatter[0].length)}`;
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFilesRecursive(full)));
    } else {
      files.push(full);
    }
  }
  return files.sort();
}

async function hashDirectory(dir: string): Promise<string> {
  const files = await listFilesRecursive(dir);
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(dir, file));
    hash.update(await readFile(file));
  }
  return hash.digest("hex");
}

export interface InstallResult {
  targets: string[];
  checksum: string;
}

export async function installSkills(cwd: string): Promise<InstallResult> {
  const sourceDir = path.join(cwd, CANONICAL_SKILL_DIR);
  const checksum = await hashDirectory(sourceDir);
  const targets: string[] = [];

  for (const relTarget of INSTALL_TARGETS) {
    const targetDir = path.join(cwd, relTarget);
    await rm(targetDir, { recursive: true, force: true });
    await mkdir(path.dirname(targetDir), { recursive: true });
    await cp(sourceDir, targetDir, { recursive: true });

    const skillMdPath = path.join(targetDir, "SKILL.md");
    const existing = await readFile(skillMdPath, "utf-8").catch(() => "");
    if (existing && !existing.startsWith(DO_NOT_EDIT_HEADER)) {
      await writeFile(skillMdPath, addDoNotEditHeader(existing), "utf-8");
    }
    await writeFile(
      path.join(targetDir, CHECKSUM_FILE),
      JSON.stringify({ checksum, source: CANONICAL_SKILL_DIR }, null, 2),
      "utf-8",
    );
    targets.push(relTarget);
  }

  return { targets, checksum };
}

export interface VerifyResult {
  ok: boolean;
  issues: string[];
}

export async function verifySkills(cwd: string): Promise<VerifyResult> {
  const sourceDir = path.join(cwd, CANONICAL_SKILL_DIR);
  const canonicalChecksum = await hashDirectory(sourceDir);
  const issues: string[] = [];

  for (const relTarget of INSTALL_TARGETS) {
    const targetDir = path.join(cwd, relTarget);
    const checksumPath = path.join(targetDir, CHECKSUM_FILE);
    const exists = await stat(targetDir).then(
      () => true,
      () => false,
    );
    if (!exists) {
      issues.push(`${relTarget} is missing — run \`pnpm forma install-skills\``);
      continue;
    }
    const recorded = await readFile(checksumPath, "utf-8").catch(() => null);
    if (!recorded) {
      issues.push(`${relTarget} has no checksum file — run \`pnpm forma install-skills\``);
      continue;
    }
    const { checksum } = JSON.parse(recorded) as { checksum: string };
    if (checksum !== canonicalChecksum) {
      issues.push(`${relTarget} is out of date with ${CANONICAL_SKILL_DIR} — re-run install-skills`);
    }
  }

  return { ok: issues.length === 0, issues };
}
