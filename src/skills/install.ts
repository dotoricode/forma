/**
 * Agent Skill installation Module.
 *
 * Callers choose a host and scope. This Module owns package generation,
 * runtime discovery metadata, safe replacement, host installation, and
 * verification. Host-specific behavior lives behind the Codex filesystem and
 * Claude plugin Adapters rather than leaking into the CLI or README.
 */
import { execFile } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { buildSkills, DEFAULT_SKILLS_OUT } from "./build.js";

export type InstallHost = "codex" | "claude";
export type InstallScope = "user" | "project" | "local";
export type CommandRunner = (command: string, args: string[]) => Promise<void>;

export const SKILL_TARGETS_FILE = ".agents/skill-targets.json";
export const RUNTIME_FILE = ".forma-runtime.json";
export const CHECKSUM_FILE = ".forma-skill-checksum.json";
export const SKILL_NAMES = [
  "forma-advanced",
  "forma-dashboard",
  "forma-manual",
  "forma-report",
] as const;
/**
 * Checksums emitted by compatibility-router releases that are safe to remove.
 * Unknown checksums are always preserved and reported.
 */
const LEGACY_GENERATED_CHECKSUMS = new Set([
  "d6bf9b6261df73127f2a8d0d186aaf0c14d5e2fae4ba063fd6c627f79efab68e",
]);

export interface InstallOptions {
  host: InstallHost;
  scope?: InstallScope;
  home?: string;
  outDir?: string;
  /** Codex skill roots. Supplying this also makes filesystem tests hermetic. */
  targetRoots?: string[];
  /** Repo-local generated copies can discover the checkout by walking upward. */
  includeRuntimeMetadata?: boolean;
  /** Injected at the Claude command seam. */
  runCommand?: CommandRunner;
}

export interface InstalledSkill {
  name: string;
  invocation: string;
  path: string;
}

export interface InstallResult {
  host: InstallHost;
  scope: InstallScope;
  runtimeDir: string;
  skills: InstalledSkill[];
  removedLegacy: string[];
  preservedLegacy: string[];
}

export interface SyncOptions {
  home?: string;
  outDir?: string;
}

export interface SyncResult extends InstallResult {
  targetRoots: string[];
}

export async function installAgentSkills(
  cwd: string,
  options: InstallOptions,
): Promise<InstallResult> {
  const runtimeDir = path.resolve(cwd);
  const scope = options.scope ?? "user";
  const outDir = options.outDir ?? DEFAULT_SKILLS_OUT;
  const built = await buildSkills(runtimeDir, outDir);
  const buildRoot = path.resolve(runtimeDir, outDir);

  if (options.host === "claude") {
    const pluginRoot = path.join(buildRoot, "claude", "forma");
    await writeRuntimeMetadata(pluginRoot, runtimeDir);
    const runCommand = options.runCommand ?? runExternalCommand;
    const marketplaceRoot = path.join(buildRoot, "claude");
    await runCommand("claude", ["plugin", "validate", marketplaceRoot]);
    await runCommand("claude", [
      "plugin",
      "marketplace",
      "add",
      marketplaceRoot,
      "--scope",
      scope,
    ]);
    await runCommand("claude", [
      "plugin",
      "install",
      "forma@forma",
      "--scope",
      scope,
    ]);
    return {
      host: "claude",
      scope,
      runtimeDir,
      skills: built.skills
        .filter((skill) => skill.host === "claude")
        .map((skill) => ({
          name: skill.name,
          invocation: skill.invocation,
          path: path.join(pluginRoot, "skills", skill.name),
        })),
      removedLegacy: [],
      preservedLegacy: [],
    };
  }

  const targetRoots =
    options.targetRoots ?? [defaultCodexTarget(runtimeDir, options.home ?? homedir(), scope)];
  if (targetRoots.length === 0) {
    throw new Error("forma: Codex installation needs at least one skill target");
  }

  const sourceRoot = path.join(buildRoot, "codex");
  const prepared = await prepareCodexPackages(
    sourceRoot,
    options.includeRuntimeMetadata === false ? null : runtimeDir,
  );
  await assertSafeToReplace(targetRoots, prepared);
  const legacy = await inspectLegacyRouters(runtimeDir, targetRoots);

  for (const targetRoot of targetRoots) {
    await mkdir(targetRoot, { recursive: true });
    for (const skill of prepared) {
      const target = path.join(targetRoot, skill.name);
      await rm(target, { recursive: true, force: true });
      await cp(skill.sourceDir, target, { recursive: true });
    }
  }
  await Promise.all(legacy.removed.map((dir) => rm(dir, { recursive: true, force: true })));

  const issues = await verifyPreparedPackages(targetRoots, prepared);
  if (issues.length > 0) {
    throw new Error(`forma: installed skill verification failed:\n  ${issues.join("\n  ")}`);
  }

  return {
    host: "codex",
    scope,
    runtimeDir,
    skills: built.skills
      .filter((skill) => skill.host === "codex")
      .map((skill) => ({
        name: skill.name,
        invocation: skill.invocation,
        path: path.join(targetRoots[0]!, skill.name),
      })),
    removedLegacy: legacy.removed,
    preservedLegacy: legacy.preserved,
  };
}

export async function syncConfiguredSkills(
  cwd: string,
  options: SyncOptions = {},
): Promise<SyncResult> {
  const home = options.home ?? homedir();
  const configured = await readConfiguredSkillTargets(home);
  if (configured.length === 0) {
    return {
      host: "codex",
      scope: "user",
      runtimeDir: path.resolve(cwd),
      skills: [],
      targetRoots: [],
      removedLegacy: [],
      preservedLegacy: [],
    };
  }
  const result = await installAgentSkills(cwd, {
    host: "codex",
    scope: "user",
    home,
    targetRoots: configured,
    ...(options.outDir ? { outDir: options.outDir } : {}),
  });
  return { ...result, targetRoots: configured };
}

export async function verifyInstalledSkills(
  cwd: string,
  options: { targetRoots: string[]; outDir?: string; includeRuntimeMetadata?: boolean },
): Promise<string[]> {
  const outDir = options.outDir ?? DEFAULT_SKILLS_OUT;
  await buildSkills(cwd, outDir);
  const sourceRoot = path.join(path.resolve(cwd, outDir), "codex");
  const prepared = await prepareCodexPackages(
    sourceRoot,
    options.includeRuntimeMetadata === false ? null : path.resolve(cwd),
  );
  return verifyPreparedPackages(options.targetRoots, prepared);
}

export async function readConfiguredSkillTargets(home: string = homedir()): Promise<string[]> {
  const configPath = path.join(home, SKILL_TARGETS_FILE);
  const raw = await readFile(configPath, "utf-8").catch(() => null);
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
  return unique((targets as string[]).map((target) => expandHome(target, home)));
}

interface PreparedPackage {
  name: string;
  sourceDir: string;
  checksum: string;
}

async function prepareCodexPackages(
  sourceRoot: string,
  runtimeDir: string | null,
): Promise<PreparedPackage[]> {
  const prepared: PreparedPackage[] = [];
  for (const name of SKILL_NAMES) {
    const sourceDir = path.join(sourceRoot, name);
    if (runtimeDir !== null) await writeRuntimeMetadata(sourceDir, runtimeDir);
    const checksum = await hashDirectory(sourceDir);
    await writeFile(
      path.join(sourceDir, CHECKSUM_FILE),
      `${JSON.stringify(
        {
          version: 1,
          checksum,
          source: `skills-src/${name.replace(/^forma-/, "")}`,
          ...(runtimeDir === null ? {} : { runtime: runtimeDir }),
        },
        null,
        2,
      )}\n`,
      "utf-8",
    );
    prepared.push({ name, sourceDir, checksum });
  }
  return prepared;
}

async function assertSafeToReplace(
  targetRoots: string[],
  prepared: PreparedPackage[],
): Promise<void> {
  const conflicts: string[] = [];
  for (const targetRoot of targetRoots) {
    for (const skill of prepared) {
      const target = path.join(targetRoot, skill.name);
      if (!(await exists(target))) continue;
      const recorded = await readRecordedChecksum(target);
      const actual = await hashDirectory(target);
      if (recorded === null || recorded !== actual) conflicts.push(target);
    }
  }
  if (conflicts.length > 0) {
    throw new Error(
      `forma: modified installed skill(s) were preserved; move or remove them before retrying:\n  ${conflicts.join(
        "\n  ",
      )}`,
    );
  }
}

async function verifyPreparedPackages(
  targetRoots: string[],
  prepared: PreparedPackage[],
): Promise<string[]> {
  const issues: string[] = [];
  for (const targetRoot of targetRoots) {
    for (const skill of prepared) {
      const target = path.join(targetRoot, skill.name);
      if (!(await exists(target))) {
        issues.push(`${target} is missing`);
        continue;
      }
      const recorded = await readRecordedChecksum(target);
      const actual = await hashDirectory(target);
      if (recorded !== skill.checksum || actual !== skill.checksum) {
        issues.push(`${target} differs from skills-src`);
      }
    }
  }
  return issues;
}

async function writeRuntimeMetadata(targetDir: string, runtimeDir: string): Promise<void> {
  await mkdir(targetDir, { recursive: true });
  await writeFile(
    path.join(targetDir, RUNTIME_FILE),
    `${JSON.stringify({ version: 1, repo: runtimeDir }, null, 2)}\n`,
    "utf-8",
  );
}

async function readRecordedChecksum(targetDir: string): Promise<string | null> {
  const raw = await readFile(path.join(targetDir, CHECKSUM_FILE), "utf-8").catch(() => null);
  if (raw === null) return null;
  try {
    return (JSON.parse(raw) as { checksum?: string }).checksum ?? null;
  } catch {
    return null;
  }
}

async function hashDirectory(dir: string): Promise<string> {
  const hash = createHash("sha256");
  const files = await listFiles(dir);
  for (const file of files) {
    const relative = path.relative(dir, file).split(path.sep).join("/");
    if (relative === CHECKSUM_FILE) continue;
    hash.update(relative);
    hash.update(await readFile(file));
  }
  return hash.digest("hex");
}

async function listFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const walk = async (current: string): Promise<void> => {
    for (const entry of await readdir(current, { withFileTypes: true }).catch(() => [])) {
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) await walk(absolute);
      else files.push(absolute);
    }
  };
  await walk(dir);
  return files.sort();
}

async function inspectLegacyRouters(
  cwd: string,
  targetRoots: string[],
): Promise<{ removed: string[]; preserved: string[] }> {
  const expected = await legacySourceChecksum(cwd);
  const removed: string[] = [];
  const preserved: string[] = [];
  for (const targetRoot of targetRoots) {
    const legacy = path.join(targetRoot, "forma");
    if (!(await exists(legacy))) continue;
    const recorded = await readRecordedChecksum(legacy);
    if (
      recorded !== null &&
      (recorded === expected || LEGACY_GENERATED_CHECKSUMS.has(recorded))
    ) {
      removed.push(legacy);
    } else {
      preserved.push(legacy);
    }
  }
  return { removed, preserved };
}

async function legacySourceChecksum(cwd: string): Promise<string | null> {
  const router = path.join(cwd, "skills/forma/SKILL.md");
  const shared = path.join(cwd, "skills-src/_shared");
  if (!(await exists(router)) || !(await exists(shared))) return null;
  const hash = createHash("sha256");
  for (const file of [router, ...(await listFiles(shared))]) {
    hash.update(path.relative(cwd, file));
    hash.update(await readFile(file));
  }
  return hash.digest("hex");
}

function defaultCodexTarget(cwd: string, home: string, scope: InstallScope): string {
  return scope === "user" ? path.join(home, ".codex/skills") : path.join(cwd, ".agents/skills");
}

function expandHome(target: string, home: string): string {
  if (target === "~") return home;
  if (target.startsWith("~/")) return path.join(home, target.slice(2));
  return path.resolve(target);
}

function unique(values: string[]): string[] {
  return [...new Set(values.map((value) => path.resolve(value)))];
}

async function exists(target: string): Promise<boolean> {
  return stat(target).then(
    () => true,
    () => false,
  );
}

const runExternalCommand: CommandRunner = async (command, args) => {
  await new Promise<void>((resolve, reject) => {
    execFile(command, args, (error, stdout, stderr) => {
      if (!error) {
        resolve();
        return;
      }
      const detail = stderr.trim() || stdout.trim() || error.message;
      reject(new Error(`forma: ${command} ${args.join(" ")} failed — ${detail}`));
    });
  });
};
