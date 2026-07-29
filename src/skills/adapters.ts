/**
 * Host adapters: one source, two layouts.
 *
 * Each adapter returns a plain list of files to write. Nothing here touches
 * the filesystem, so the layout each host gets is a pure function of the
 * source and can be asserted directly in tests.
 *
 * The layouts are not cosmetic variations. Claude Code namespaces plugin
 * skills as `plugin-name:skill-name`, taking the last segment from the
 * frontmatter `name`; Codex has no namespace and reads the skill's directory
 * name, so the prefix has to be baked into both. That is why `name` differs
 * per host and why a straight copy of one SKILL.md cannot serve both.
 */
import {
  MAX_DESCRIPTION,
  MAX_NAME,
  SKILL_NAMESPACE,
  SKILL_NAME_PATTERN,
  type SkillSource,
} from "./source.js";

export type Host = "claude" | "codex";

export interface EmittedFile {
  /** Path relative to the host's output root. */
  path: string;
  contents: string;
  /** Set when the file is copied verbatim from the source instead of generated. */
  copyFrom?: string;
}

export interface EmittedSkill {
  host: Host;
  /** The name a user types, for documentation and for the CLI to print. */
  invocation: string;
  /** The value written into frontmatter `name`. */
  name: string;
  files: EmittedFile[];
}

const GENERATED_NOTE =
  "<!-- GENERATED — do not edit. Source of truth: skills-src/. Run `pnpm forma build-skills`. -->";

/**
 * A double-quoted YAML scalar. Descriptions are long single-line prose that
 * routinely contains a colon, which is the one character that silently
 * changes meaning in a bare scalar.
 */
function yamlString(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, " ");
  return `"${escaped}"`;
}

function assertName(name: string): void {
  if (name.length > MAX_NAME || !SKILL_NAME_PATTERN.test(name)) {
    throw new Error(
      `forma: derived skill name '${name}' breaks the Agent Skills naming rule ` +
        "(1-64 chars, lowercase alphanumeric and single hyphens)",
    );
  }
}

function frontmatter(lines: Array<[string, string]>): string {
  return ["---", ...lines.map(([key, value]) => `${key}: ${value}`), "---"].join("\n");
}

function skillMarkdown(name: string, source: SkillSource, extra: Array<[string, string]>): string {
  const lines: Array<[string, string]> = [
    ["name", yamlString(name)],
    ["description", yamlString(source.meta.description)],
  ];
  if (source.meta.whenToUse) lines.push(["when_to_use", yamlString(source.meta.whenToUse)]);
  if (source.meta.license) lines.push(["license", yamlString(source.meta.license)]);
  lines.push(...extra);
  const body = source.instructions.startsWith("\n")
    ? source.instructions
    : `\n${source.instructions}`;
  return `${frontmatter(lines)}\n${GENERATED_NOTE}\n${body}`;
}

function copies(source: SkillSource, prefix: string): EmittedFile[] {
  return source.files.map((file) => ({
    path: `${prefix}${file.relativePath.split("\\").join("/")}`,
    contents: "",
    copyFrom: file.absolutePath,
  }));
}

/**
 * Claude Code: one plugin directory whose skills live under `skills/<id>/`.
 * The frontmatter `name` is the bare id, and the plugin name supplies the
 * prefix, so the command is `/forma:<id>`.
 */
export function emitClaudeSkill(source: SkillSource): EmittedSkill {
  const name = source.meta.id;
  assertName(name);
  const dir = `skills/${name}/`;
  const extra: Array<[string, string]> = [];
  if (source.meta.explicitOnly) {
    // Claude puts invocation control in the frontmatter. Codex does not.
    extra.push(["disable-model-invocation", "true"]);
  }
  return {
    host: "claude",
    invocation: `/${SKILL_NAMESPACE}:${name}`,
    name,
    files: [
      { path: `${dir}SKILL.md`, contents: skillMarkdown(name, source, extra) },
      ...copies(source, dir),
    ],
  };
}

/**
 * Codex: one directory per skill, no namespace of its own, so the prefix
 * lives in both the directory name and `name`. Invocation control goes in
 * `agents/openai.yaml` inside the skill, because Codex reads only `name` and
 * `description` from the frontmatter.
 */
export function emitCodexSkill(source: SkillSource): EmittedSkill {
  const name = `${SKILL_NAMESPACE}-${source.meta.id}`;
  assertName(name);
  const dir = `${name}/`;
  const files: EmittedFile[] = [
    { path: `${dir}SKILL.md`, contents: skillMarkdown(name, source, []) },
    ...copies(source, dir),
  ];
  if (source.meta.explicitOnly) {
    files.push({
      path: `${dir}agents/openai.yaml`,
      contents: [
        "# GENERATED — do not edit. Source of truth: skills-src/.",
        "# Codex reads only name and description from SKILL.md frontmatter, so",
        "# invocation control lives here rather than alongside it.",
        "policy:",
        "  allow_implicit_invocation: false",
        "",
      ].join("\n"),
    });
  }
  return { host: "codex", invocation: `$${name}`, name, files };
}

/** The plugin manifest Claude Code needs to load the directory as a plugin. */
export function emitClaudePluginManifest(sources: SkillSource[]): EmittedFile {
  const manifest = {
    name: SKILL_NAMESPACE,
    description:
      "Turn complex work into clear form: spec-first, self-contained HTML artifacts that make no network requests.",
    version: "0.1.0",
    author: { name: "Forma contributors" },
    // Claude treats these entries as paths relative to the plugin root, not
    // as skill names. Keeping the `./skills/` prefix is therefore part of the
    // runtime contract, not presentation.
    skills: sources.map((source) => `./skills/${source.meta.id}`),
  };
  return {
    path: ".claude-plugin/plugin.json",
    contents: `${JSON.stringify(manifest, null, 2)}\n`,
  };
}

export function emitForHost(host: Host, source: SkillSource): EmittedSkill {
  return host === "claude" ? emitClaudeSkill(source) : emitCodexSkill(source);
}

export { MAX_DESCRIPTION };
