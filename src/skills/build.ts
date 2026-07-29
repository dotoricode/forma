/**
 * Writes the adapter output to disk and checks it against the spec.
 *
 * The check runs on the *emitted* files, not on the source. A rule that only
 * ever inspects the input cannot catch an adapter that derives a bad name,
 * which is the one mistake this layer exists to prevent.
 */
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import {
  emitClaudeMarketplaceManifest,
  emitClaudePluginManifest,
  emitForHost,
  type EmittedSkill,
  type Host,
} from "./adapters.js";
import {
  MAX_DESCRIPTION,
  MAX_NAME,
  SKILL_NAME_PATTERN,
  readSkillSources,
  type SkillSource,
} from "./source.js";

// Keep generated packages away from `dist/skills/*.js`, which is where tsc
// emits this Module. Removing the package output must never remove the code
// that performs the build.
export const DEFAULT_SKILLS_OUT = "dist/agent-skills";
export const HOSTS: Host[] = ["claude", "codex"];

export interface BuildResult {
  outDir: string;
  skills: Array<{ host: Host; name: string; invocation: string; dir: string }>;
  fileCount: number;
}

export async function buildSkills(cwd: string, outDir = DEFAULT_SKILLS_OUT): Promise<BuildResult> {
  const sources = await readSkillSources(cwd);
  const root = path.resolve(cwd, outDir);
  await rm(root, { recursive: true, force: true });

  const skills: BuildResult["skills"] = [];
  let fileCount = 0;

  for (const host of HOSTS) {
    // Claude gets one plugin directory containing every skill; Codex gets one
    // directory per skill at the top level.
    const hostRoot = host === "claude" ? path.join(root, host, "forma") : path.join(root, host);
    await mkdir(hostRoot, { recursive: true });

    if (host === "claude") {
      const manifest = emitClaudePluginManifest(sources);
      await writeOne(hostRoot, manifest.path, manifest.contents);
      fileCount += 1;
      const marketplace = emitClaudeMarketplaceManifest();
      await writeOne(path.join(root, host), marketplace.path, marketplace.contents);
      fileCount += 1;
    }

    for (const source of sources) {
      const emitted = emitForHost(host, source);
      assertEmittedIsValid(emitted, source);
      for (const file of emitted.files) {
        const target = path.join(hostRoot, file.path);
        await mkdir(path.dirname(target), { recursive: true });
        if (file.copyFrom) await cp(file.copyFrom, target);
        else await writeFile(target, file.contents, "utf-8");
        fileCount += 1;
      }
      skills.push({
        host,
        name: emitted.name,
        invocation: emitted.invocation,
        dir: path.relative(cwd, path.join(hostRoot, emitted.files[0]!.path, "..")),
      });
    }
  }

  return { outDir, skills, fileCount };
}

async function writeOne(root: string, relativePath: string, contents: string): Promise<void> {
  const target = path.join(root, relativePath);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, contents, "utf-8");
}

export class SkillBuildError extends Error {}

/**
 * Every rule the Agent Skills spec states, asserted on what we are about to
 * ship. The name/directory rule is the one that bit the plan: the spec
 * requires `name` to equal the parent directory, which is why the two hosts
 * cannot share one frontmatter.
 */
function assertEmittedIsValid(emitted: EmittedSkill, source: SkillSource): void {
  const skillMd = emitted.files.find((file) => file.path.endsWith("SKILL.md"));
  if (!skillMd) throw new SkillBuildError(`forma: ${emitted.name} emitted no SKILL.md`);

  const nameMatch = /^name:\s*"(.*)"$/m.exec(skillMd.contents);
  if (!nameMatch) throw new SkillBuildError(`forma: ${emitted.name} SKILL.md has no name field`);
  const name = nameMatch[1]!;

  if (name.length > MAX_NAME || !SKILL_NAME_PATTERN.test(name)) {
    throw new SkillBuildError(`forma: emitted name '${name}' breaks the Agent Skills naming rule`);
  }
  const parent = path.basename(path.dirname(skillMd.path));
  if (parent !== name) {
    throw new SkillBuildError(
      `forma: emitted name '${name}' does not match its directory '${parent}'. ` +
        "The Agent Skills spec requires them to be equal.",
    );
  }
  if (source.meta.description.length > MAX_DESCRIPTION) {
    throw new SkillBuildError(
      `forma: ${name} description is ${source.meta.description.length} chars, over ${MAX_DESCRIPTION}`,
    );
  }
  if (source.meta.explicitOnly) {
    const guarded =
      /^disable-model-invocation:\s*true$/m.test(skillMd.contents) ||
      emitted.files.some((file) => file.path.endsWith("agents/openai.yaml"));
    if (!guarded) {
      throw new SkillBuildError(
        `forma: ${name} is explicitOnly but the ${emitted.host} output carries no invocation guard`,
      );
    }
  }
}

/** Re-reads the built tree and returns problems, for a cheap post-build gate. */
export async function verifyBuiltSkills(cwd: string, outDir = DEFAULT_SKILLS_OUT): Promise<string[]> {
  const sources = await readSkillSources(cwd);
  const issues: string[] = [];
  const root = path.resolve(cwd, outDir);
  for (const host of HOSTS) {
    const hostRoot = host === "claude" ? path.join(root, host, "forma") : path.join(root, host);
    for (const source of sources) {
      const emitted = emitForHost(host, source);
      const skillMd = emitted.files.find((file) => file.path.endsWith("SKILL.md"))!;
      const onDisk = await readFile(path.join(hostRoot, skillMd.path), "utf-8").catch(() => null);
      if (onDisk === null) {
        issues.push(`${host}: ${skillMd.path} is missing — run \`pnpm forma build-skills\``);
        continue;
      }
      if (onDisk !== skillMd.contents) {
        issues.push(`${host}: ${skillMd.path} differs from skills-src — re-run build-skills`);
      }
    }
  }
  const marketplace = emitClaudeMarketplaceManifest();
  const marketplaceOnDisk = await readFile(
    path.join(root, "claude", marketplace.path),
    "utf-8",
  ).catch(() => null);
  if (marketplaceOnDisk !== marketplace.contents) {
    issues.push("claude: marketplace manifest is missing or differs from skills-src");
  }
  return issues;
}
