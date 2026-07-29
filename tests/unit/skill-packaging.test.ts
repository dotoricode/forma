import { cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  emitClaudeMarketplaceManifest,
  emitClaudePluginManifest,
  emitClaudeSkill,
  emitCodexSkill,
} from "../../src/skills/adapters.js";
import {
  MAX_DESCRIPTION,
  MAX_LISTING_CHARS,
  SKILL_NAME_PATTERN,
  readSkillSources,
} from "../../src/skills/source.js";
import { buildSkills, verifyBuiltSkills } from "../../src/skills/build.js";

const CWD = process.cwd();
const sources = await readSkillSources(CWD);
const execFileAsync = promisify(execFile);

/**
 * The rules below come from the Agent Skills specification and the two hosts'
 * own docs, checked against the primary sources on 2026-07-28. They are
 * asserted rather than trusted because the plan this work came from got two of
 * them wrong: it missed that `name` must equal the parent directory, and it
 * quoted a context budget that does not exist.
 */
describe("skill sources", () => {
  it("ships the four logical skills", () => {
    expect(sources.map((source) => source.meta.id).sort()).toEqual([
      "advanced",
      "dashboard",
      "manual",
      "report",
    ]);
  });

  it("keeps every description inside the spec's 1024-character cap", () => {
    for (const source of sources) {
      expect(source.meta.description.length).toBeLessThanOrEqual(MAX_DESCRIPTION);
    }
  });

  it("keeps description plus whenToUse under Claude Code's listing truncation", () => {
    for (const source of sources) {
      const listing = source.meta.description.length + (source.meta.whenToUse?.length ?? 0);
      expect(listing).toBeLessThanOrEqual(MAX_LISTING_CHARS);
    }
  });

  it("carries no frontmatter in the authored body", () => {
    // Frontmatter is the part that differs per host, so authoring it once
    // would make it wrong for at least one of them.
    for (const source of sources) {
      expect(source.instructions.trimStart().startsWith("---")).toBe(false);
    }
  });

  it("marks only advanced as explicit-invocation only", () => {
    const explicit = sources.filter((source) => source.meta.explicitOnly).map((s) => s.meta.id);
    expect(explicit).toEqual(["advanced"]);
  });

  it("gives every skill the shared references and scripts", () => {
    for (const source of sources) {
      const paths = source.files.map((file) => file.relativePath.split(path.sep).join("/"));
      expect(paths).toContain("references/artifacts.md");
      expect(paths).toContain("references/spec-reference.md");
      expect(paths).toContain("scripts/validate.mjs");
      expect(paths).toContain("assets/starter-spec.json");
    }
  });
});

describe("host adapters diverge where the hosts do", () => {
  const dashboard = sources.find((source) => source.meta.id === "dashboard")!;
  const advanced = sources.find((source) => source.meta.id === "advanced")!;

  it("derives a different name per host from one source id", () => {
    // This is the constraint that rules out copying a single SKILL.md: the
    // spec ties `name` to the parent directory, and the directories differ.
    expect(emitClaudeSkill(dashboard).name).toBe("dashboard");
    expect(emitCodexSkill(dashboard).name).toBe("forma-dashboard");
  });

  it("produces the invocation each host actually uses", () => {
    expect(emitClaudeSkill(dashboard).invocation).toBe("/forma:dashboard");
    expect(emitCodexSkill(dashboard).invocation).toBe("$forma-dashboard");
  });

  it("puts every emitted SKILL.md in a directory matching its name", () => {
    for (const source of sources) {
      for (const emitted of [emitClaudeSkill(source), emitCodexSkill(source)]) {
        const skillMd = emitted.files.find((file) => file.path.endsWith("SKILL.md"))!;
        expect(path.basename(path.dirname(skillMd.path))).toBe(emitted.name);
        expect(SKILL_NAME_PATTERN.test(emitted.name)).toBe(true);
      }
    }
  });

  it("blocks implicit invocation through frontmatter on Claude", () => {
    const skillMd = emitClaudeSkill(advanced).files.find((f) => f.path.endsWith("SKILL.md"))!;
    expect(skillMd.contents).toMatch(/^disable-model-invocation: true$/m);
  });

  it("blocks implicit invocation through a policy file on Codex", () => {
    // Codex reads only name and description from frontmatter, so the same
    // source flag has to land in a different file entirely.
    const emitted = emitCodexSkill(advanced);
    const policy = emitted.files.find((file) => file.path.endsWith("agents/openai.yaml"));
    expect(policy?.contents).toContain("allow_implicit_invocation: false");
    const skillMd = emitted.files.find((file) => file.path.endsWith("SKILL.md"))!;
    expect(skillMd.contents).not.toContain("disable-model-invocation");
  });

  it("adds no invocation guard to a skill that allows implicit use", () => {
    const claude = emitClaudeSkill(dashboard).files.find((f) => f.path.endsWith("SKILL.md"))!;
    expect(claude.contents).not.toContain("disable-model-invocation");
    expect(emitCodexSkill(dashboard).files.some((f) => f.path.includes("openai.yaml"))).toBe(false);
  });

  it("quotes the description so a colon in it cannot break the YAML", () => {
    // Every description here contains a colon, which is the one character
    // that silently changes meaning in a bare YAML scalar.
    const skillMd = emitClaudeSkill(advanced).files.find((f) => f.path.endsWith("SKILL.md"))!;
    expect(advanced.meta.description).toContain(":");
    expect(skillMd.contents).toContain(`description: "${advanced.meta.description}"`);
  });

  it("points the plugin manifest at every emitted skill directory", () => {
    const manifest = JSON.parse(emitClaudePluginManifest(sources).contents);
    expect(manifest.name).toBe("forma");
    expect(manifest.author).toEqual({ name: "Forma contributors" });
    expect(manifest.skills.sort()).toEqual([
      "./skills/advanced",
      "./skills/dashboard",
      "./skills/manual",
      "./skills/report",
    ]);
  });

  it("publishes the generated plugin through a local marketplace", () => {
    const marketplace = JSON.parse(emitClaudeMarketplaceManifest().contents);
    expect(marketplace.name).toBe("forma");
    expect(marketplace.plugins).toEqual([
      expect.objectContaining({
        name: "forma",
        source: "./forma",
      }),
    ]);
  });
});

describe("built output", () => {
  it("writes both hosts and verifies clean straight after a build", async () => {
    const result = await buildSkills(CWD, "dist/skills-test");
    expect(result.skills).toHaveLength(8);
    expect(await verifyBuiltSkills(CWD, "dist/skills-test")).toEqual([]);

    const claude = await readFile(
      path.join(CWD, "dist/skills-test/claude/forma/skills/report/SKILL.md"),
      "utf-8",
    );
    expect(claude).toMatch(/^name: "report"$/m);
    const codex = await readFile(
      path.join(CWD, "dist/skills-test/codex/forma-report/SKILL.md"),
      "utf-8",
    );
    expect(codex).toMatch(/^name: "forma-report"$/m);
  }, 60_000);

  it("runs a generated wrapper from its emitted package location", async () => {
    await buildSkills(CWD, "dist/skills-test");
    const installedRoot = await mkdtemp(path.join(tmpdir(), "forma-installed-skill-"));
    try {
      await cp(
        path.join(CWD, "dist/skills-test/codex/forma-report"),
        path.join(installedRoot, "forma-report"),
        { recursive: true },
      );
      const wrapper = path.join(installedRoot, "forma-report/scripts/validate.mjs");
      const fixture = path.join(CWD, "fixtures/report/technical/forma.spec.json");
      const { stdout } = await execFileAsync(process.execPath, [wrapper, fixture], {
        cwd: CWD,
      });
      expect(stdout).toContain("is valid");
    } finally {
      await rm(installedRoot, { recursive: true, force: true });
    }
  }, 60_000);
});

describe("legacy router has no second copy of shared files", () => {
  it("authors only the router instructions under skills/forma", async () => {
    const authored = await readdir(path.join(CWD, "skills/forma"), { withFileTypes: true });
    expect(authored.filter((entry) => entry.isFile()).map((entry) => entry.name)).toEqual([
      "SKILL.md",
    ]);
    for (const entry of authored.filter((candidate) => candidate.isDirectory())) {
      expect(await readdir(path.join(CWD, "skills/forma", entry.name))).toEqual([]);
    }
    for (const dir of ["references", "scripts", "assets"]) {
      expect((await readdir(path.join(CWD, "skills-src/_shared", dir))).length).toBeGreaterThan(0);
    }
  });
});
