/**
 * Assembles the compatibility Agent Skill from `skills/forma/SKILL.md` and
 * `skills-src/_shared/`, then syncs it to the Codex and Claude Code skill
 * directories. We copy + checksum rather than symlink, so the
 * copies survive on Windows and when the repo is shared without symlink
 * support; CI re-runs `verify-skills` to catch drift.
 */
import { createHash } from "node:crypto";
import { cp, mkdir, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

export const CANONICAL_SKILL_DIR = "skills/forma";
export const SHARED_SKILL_DIR = "skills-src/_shared";
export const INSTALL_TARGETS = [".agents/skills/forma", ".claude/skills/forma"];
export const SKILL_TARGETS_FILE = ".agents/skill-targets.json";
export const SKILL_NAME = "forma";
const DO_NOT_EDIT_HEADER =
  "<!-- GENERATED COPY — do not edit directly. Sources: skills/forma/SKILL.md + skills-src/_shared/. Run `pnpm forma install-skills` after editing either source. -->\n";
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

async function hashSkillSources(cwd: string): Promise<string> {
  const canonicalSkill = path.join(cwd, CANONICAL_SKILL_DIR, "SKILL.md");
  const sharedDir = path.join(cwd, SHARED_SKILL_DIR);
  const files = [canonicalSkill, ...(await listFilesRecursive(sharedDir))];
  const hash = createHash("sha256");
  for (const file of files) {
    hash.update(path.relative(cwd, file));
    hash.update(await readFile(file));
  }
  return hash.digest("hex");
}

/**
 * The machine-wide list of directories every agent on this box reads skills
 * from. It is deliberately not hardcoded here: the file is the single place
 * the list is edited, and duplicating it in source would mean a path added
 * there silently stops being synced.
 *
 * Absent file means "no machine-wide targets configured", which is the case
 * in CI. That is not an error — the repo-local copies are the CI contract.
 */
export async function readGlobalSkillTargets(home: string = homedir()): Promise<string[]> {
  const raw = await readFile(path.join(home, SKILL_TARGETS_FILE), "utf-8").catch(() => null);
  if (raw === null) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new Error(`forma: could not parse ~/${SKILL_TARGETS_FILE} — ${(error as Error).message}`);
  }
  const targets = (parsed as { targets?: unknown }).targets;
  if (!Array.isArray(targets) || targets.some((entry) => typeof entry !== "string")) {
    throw new Error(`forma: ~/${SKILL_TARGETS_FILE} must have a "targets" array of strings`);
  }
  return (targets as string[]).map((entry) => expandHome(entry, home));
}

function expandHome(target: string, home: string): string {
  if (target === "~") return home;
  if (target.startsWith("~/")) return path.join(home, target.slice(2));
  return target;
}

export interface InstallResult {
  targets: string[];
  /** Machine-wide copies, absolute. Empty when no targets file is configured. */
  globalTargets: string[];
  checksum: string;
}

export interface SyncOptions {
  /** Override the home directory the targets file is read from. */
  home?: string;
  /**
   * Write to the machine-wide targets too. Off by default, and deliberately:
   * with it defaulted on, a unit test that built a throwaway skill in a temp
   * directory and called `installSkills(cwd)` reached into the real home and
   * replaced the user's installed skill with its fixture. A function that can
   * overwrite five directories outside the repo has to be asked to.
   */
  includeGlobalTargets?: boolean;
}

export async function installSkills(
  cwd: string,
  options: SyncOptions = {},
): Promise<InstallResult> {
  const checksum = await hashSkillSources(cwd);

  const local = INSTALL_TARGETS.map((relTarget) => path.join(cwd, relTarget));
  // Every path in the targets file gets a `forma` subdirectory, so the file
  // lists skill roots rather than one entry per skill.
  const globals = options.includeGlobalTargets
    ? (await readGlobalSkillTargets(options.home ?? homedir())).map((dir) =>
        path.join(dir, SKILL_NAME),
      )
    : [];

  for (const targetDir of [...local, ...globals]) {
    await writeSkillCopy(cwd, targetDir, checksum);
  }

  // The rule that produced the targets file asks for a post-copy check rather
  // than trust. A copy that silently half-failed is the failure mode where one
  // agent reads current instructions and another reads stale ones.
  const mismatched: string[] = [];
  for (const targetDir of [...local, ...globals]) {
    const recorded = await readRecordedChecksum(targetDir);
    if (recorded !== checksum) mismatched.push(targetDir);
  }
  if (mismatched.length > 0) {
    throw new Error(
      `forma: these copies did not land with the canonical checksum:\n  ${mismatched.join("\n  ")}`,
    );
  }

  return { targets: INSTALL_TARGETS, globalTargets: globals, checksum };
}

async function writeSkillCopy(
  cwd: string,
  targetDir: string,
  checksum: string,
): Promise<void> {
  await rm(targetDir, { recursive: true, force: true });
  await mkdir(targetDir, { recursive: true });
  // Real copies, not symlinks: skill discovery differs between agents and a
  // link that one resolves and another ignores is worse than two files.
  await cp(
    path.join(cwd, CANONICAL_SKILL_DIR, "SKILL.md"),
    path.join(targetDir, "SKILL.md"),
  );
  const sharedDir = path.join(cwd, SHARED_SKILL_DIR);
  for (const entry of await readdir(sharedDir, { withFileTypes: true })) {
    await cp(path.join(sharedDir, entry.name), path.join(targetDir, entry.name), {
      recursive: entry.isDirectory(),
    });
  }

  const skillMdPath = path.join(targetDir, "SKILL.md");
  const existing = await readFile(skillMdPath, "utf-8").catch(() => "");
  if (existing && !existing.startsWith(DO_NOT_EDIT_HEADER)) {
    await writeFile(skillMdPath, addDoNotEditHeader(existing), "utf-8");
  }
  await writeFile(
    path.join(targetDir, CHECKSUM_FILE),
    JSON.stringify(
      { checksum, sources: [`${CANONICAL_SKILL_DIR}/SKILL.md`, SHARED_SKILL_DIR] },
      null,
      2,
    ),
    "utf-8",
  );
}

async function readRecordedChecksum(targetDir: string): Promise<string | null> {
  const raw = await readFile(path.join(targetDir, CHECKSUM_FILE), "utf-8").catch(() => null);
  if (raw === null) return null;
  return (JSON.parse(raw) as { checksum?: string }).checksum ?? null;
}

export interface VerifyResult {
  ok: boolean;
  issues: string[];
}

export async function verifySkills(
  cwd: string,
  options: SyncOptions = {},
): Promise<VerifyResult> {
  const canonicalChecksum = await hashSkillSources(cwd);
  const issues: string[] = [];

  const checkable: Array<{ label: string; dir: string; required: boolean }> = [
    ...INSTALL_TARGETS.map((relTarget) => ({
      label: relTarget,
      dir: path.join(cwd, relTarget),
      required: true,
    })),
    // Machine-wide copies are checked when the box has them configured but are
    // not required: CI has no targets file and must still pass.
    ...(options.includeGlobalTargets
      ? (await readGlobalSkillTargets(options.home ?? homedir())).map((dir) => ({
          label: path.join(dir, SKILL_NAME),
          dir: path.join(dir, SKILL_NAME),
          required: false,
        }))
      : []),
  ];

  for (const target of checkable) {
    const exists = await stat(target.dir).then(
      () => true,
      () => false,
    );
    if (!exists) {
      issues.push(`${target.label} is missing — run \`pnpm forma install-skills\``);
      continue;
    }
    const recorded = await readRecordedChecksum(target.dir);
    if (!recorded) {
      issues.push(`${target.label} has no checksum file — run \`pnpm forma install-skills\``);
      continue;
    }
    if (recorded !== canonicalChecksum) {
      issues.push(
        `${target.label} is out of date with ${CANONICAL_SKILL_DIR} — re-run install-skills`,
      );
    }
  }

  return { ok: issues.length === 0, issues };
}
