/**
 * The canonical skill sources, and the rules every emitted copy must obey.
 *
 * Metadata lives in `skill.json` rather than in SKILL.md frontmatter, because
 * the frontmatter is exactly the part that differs per host. The Agent Skills
 * spec requires `name` to match the parent directory, and the two hosts put a
 * skill in differently-named directories:
 *
 *   Claude Code   forma/skills/dashboard/SKILL.md   name: dashboard
 *   Codex         forma-dashboard/SKILL.md          name: forma-dashboard
 *
 * So a single authored frontmatter would be wrong for one host no matter what
 * it said. The source holds a host-neutral `id` and the adapters derive the
 * name. Same for explicit-invocation control, which Claude puts in
 * frontmatter and Codex puts in a separate `agents/openai.yaml`.
 *
 * Verified against the Agent Skills specification, the Claude Code skills and
 * plugin references, and the Codex skill docs on 2026-07-28.
 */
import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { z } from "zod";

export const SKILLS_SRC_DIR = "skills-src";
export const SHARED_DIR = "_shared";
/** Prefix that namespaces the Codex directory and the Claude plugin. */
export const SKILL_NAMESPACE = "forma";

/** Agent Skills spec: 1-64 chars, lowercase alphanumeric and hyphens, no
 *  leading/trailing hyphen, no consecutive hyphens. */
export const SKILL_NAME_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const MAX_NAME = 64;
/** Agent Skills spec caps `description` at 1024 characters. */
export const MAX_DESCRIPTION = 1024;
/**
 * Claude Code truncates a listing entry's combined description and
 * when_to_use at 1,536 characters. Staying under it means no host silently
 * drops the keywords that make the skill discoverable.
 */
export const MAX_LISTING_CHARS = 1536;

export const SkillMetaSchema = z.object({
  /** Host-neutral identifier. Adapters derive every host name from this. */
  id: z.string().min(1).max(MAX_NAME).regex(SKILL_NAME_PATTERN),
  description: z.string().min(1).max(MAX_DESCRIPTION),
  whenToUse: z.string().min(1).optional(),
  /**
   * True for skills that must never fire on their own. One flag, two very
   * different emissions: Claude frontmatter versus a Codex policy file.
   */
  explicitOnly: z.boolean().default(false),
  license: z.string().min(1).optional(),
});

export type SkillMeta = z.infer<typeof SkillMetaSchema>;

export interface SkillSource {
  meta: SkillMeta;
  /** SKILL.md body with no frontmatter. Adapters prepend their own. */
  instructions: string;
  /** Paths relative to the skill root, resolved for copying. */
  files: Array<{ relativePath: string; absolutePath: string }>;
}

export class SkillSourceError extends Error {}

/** Reads every skill under `skills-src/`, ignoring the shared directory. */
export async function readSkillSources(cwd: string): Promise<SkillSource[]> {
  const root = path.join(cwd, SKILLS_SRC_DIR);
  const entries = await readdir(root, { withFileTypes: true }).catch(() => {
    throw new SkillSourceError(`forma: no ${SKILLS_SRC_DIR}/ directory in ${cwd}`);
  });
  const shared = await collectFiles(path.join(root, SHARED_DIR));

  const ids = entries
    .filter((entry) => entry.isDirectory() && entry.name !== SHARED_DIR)
    .map((entry) => entry.name)
    .sort();

  const sources: SkillSource[] = [];
  for (const id of ids) {
    const dir = path.join(root, id);
    const meta = await readMeta(dir, id);
    const instructions = await readInstructions(dir);
    const own = await collectFiles(dir, new Set(["skill.json", "instructions.md"]));
    // A skill's own file wins over the shared one at the same path, so a
    // skill can override a reference without copying all of them.
    const merged = new Map(shared.map((file) => [file.relativePath, file]));
    for (const file of own) merged.set(file.relativePath, file);
    sources.push({ meta, instructions, files: [...merged.values()] });
  }
  if (sources.length === 0) {
    throw new SkillSourceError(`forma: ${SKILLS_SRC_DIR}/ has no skill directories`);
  }
  return sources;
}

async function readMeta(dir: string, id: string): Promise<SkillMeta> {
  const metaPath = path.join(dir, "skill.json");
  const raw = await readFile(metaPath, "utf-8").catch(() => {
    throw new SkillSourceError(`forma: ${metaPath} is missing`);
  });
  let json: unknown;
  try {
    json = JSON.parse(raw);
  } catch (error) {
    throw new SkillSourceError(`forma: ${metaPath} is not JSON — ${(error as Error).message}`);
  }
  const result = SkillMetaSchema.safeParse(json);
  if (!result.success) {
    const first = result.error.issues[0];
    throw new SkillSourceError(
      `forma: ${metaPath} — ${first?.path.join(".") ?? ""} ${first?.message ?? "invalid"}`,
    );
  }
  // The directory name is the id everywhere else, so a mismatch would make
  // every derived name wrong in a way that is hard to see.
  if (result.data.id !== id) {
    throw new SkillSourceError(
      `forma: ${metaPath} declares id '${result.data.id}' but lives in '${id}/'`,
    );
  }
  const listing = result.data.description.length + (result.data.whenToUse?.length ?? 0);
  if (listing > MAX_LISTING_CHARS) {
    throw new SkillSourceError(
      `forma: ${metaPath} — description plus whenToUse is ${listing} chars; ` +
        `Claude Code truncates a listing entry at ${MAX_LISTING_CHARS}`,
    );
  }
  return result.data;
}

async function readInstructions(dir: string): Promise<string> {
  const instructionsPath = path.join(dir, "instructions.md");
  const body = await readFile(instructionsPath, "utf-8").catch(() => {
    throw new SkillSourceError(`forma: ${instructionsPath} is missing`);
  });
  if (body.trimStart().startsWith("---")) {
    throw new SkillSourceError(
      `forma: ${instructionsPath} must not carry frontmatter. The adapters write it ` +
        "per host, because 'name' differs between them.",
    );
  }
  return body;
}

async function collectFiles(
  dir: string,
  skipTopLevel: Set<string> = new Set(),
): Promise<Array<{ relativePath: string; absolutePath: string }>> {
  const found: Array<{ relativePath: string; absolutePath: string }> = [];
  const walk = async (current: string): Promise<void> => {
    const entries = await readdir(current, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const absolutePath = path.join(current, entry.name);
      const relativePath = path.relative(dir, absolutePath);
      if (relativePath.split(path.sep).length === 1 && skipTopLevel.has(entry.name)) continue;
      if (entry.isDirectory()) await walk(absolutePath);
      else found.push({ relativePath, absolutePath });
    }
  };
  await walk(dir);
  return found.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
}
