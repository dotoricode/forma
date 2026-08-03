import { cp, mkdtemp, readFile, readdir, rm } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
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
  it("ships exactly one skill", () => {
    // One skill. The artifact choice moved inside it as a proposal the user
    // agrees to, so there is nothing for a per-artifact skill list to decide.
    expect(sources.map((source) => source.meta.id)).toEqual(["forma"]);
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

  it("leaves the single skill implicitly invocable", () => {
    // advanced used to be explicit-only. That guard moved into the skill body:
    // it offers the Decision Room rather than routing to it unasked.
    expect(sources.filter((source) => source.meta.explicitOnly)).toEqual([]);
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
  const forma = sources.find((source) => source.meta.id === "forma")!;

  it("derives the same name for both hosts now that there is one skill", () => {
    // The spec ties `name` to the parent directory. That forced a per-host
    // name while four skills shared a Claude plugin namespace; with a single
    // skill the namespace is gone and the two names converge.
    // With one skill both hosts want the same directory and the same name.
    expect(emitClaudeSkill(forma).name).toBe("forma");
    expect(emitCodexSkill(forma).name).toBe("forma");
  });

  it("produces the invocation each host actually uses", () => {
    expect(emitClaudeSkill(forma).invocation).toBe("/forma");
    expect(emitCodexSkill(forma).invocation).toBe("$forma");
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

  /**
   * No shipped skill is explicit-only today, so these build a synthetic source.
   * The mechanism still has to work: it is the one place the two hosts really
   * diverge, and a test that silently covers nothing would hide a regression
   * the day a skill needs the guard again.
   */
  const explicitOnly = { ...forma, meta: { ...forma.meta, explicitOnly: true } };

  it("blocks implicit invocation through frontmatter on Claude", () => {
    const skillMd = emitClaudeSkill(explicitOnly).files.find((f) =>
      f.path.endsWith("SKILL.md"),
    )!;
    expect(skillMd.contents).toMatch(/^disable-model-invocation: true$/m);
  });

  it("blocks implicit invocation through a policy file on Codex", () => {
    // Codex reads only name and description from frontmatter, so the same
    // source flag has to land in a different file entirely.
    const emitted = emitCodexSkill(explicitOnly);
    const policy = emitted.files.find((file) => file.path.endsWith("agents/openai.yaml"));
    expect(policy?.contents).toContain("allow_implicit_invocation: false");
    const skillMd = emitted.files.find((file) => file.path.endsWith("SKILL.md"))!;
    expect(skillMd.contents).not.toContain("disable-model-invocation");
  });

  it("adds no invocation guard to a skill that allows implicit use", () => {
    const claude = emitClaudeSkill(forma).files.find((f) => f.path.endsWith("SKILL.md"))!;
    expect(claude.contents).not.toContain("disable-model-invocation");
    expect(emitCodexSkill(forma).files.some((f) => f.path.includes("openai.yaml"))).toBe(false);
  });

  it("quotes the description so a colon in it cannot break the YAML", () => {
    // Every description here contains a colon, which is the one character
    // that silently changes meaning in a bare YAML scalar.
    const skillMd = emitClaudeSkill(forma).files.find((f) => f.path.endsWith("SKILL.md"))!;
    expect(forma.meta.description).toContain(":");
    expect(skillMd.contents).toContain(`description: "${forma.meta.description}"`);
  });


});

describe("built output", () => {
  it("writes both hosts and verifies clean straight after a build", async () => {
    const result = await buildSkills(CWD, "dist/skills-test");
    expect(result.skills).toHaveLength(2);
    expect(await verifyBuiltSkills(CWD, "dist/skills-test")).toEqual([]);

    const claude = await readFile(
      path.join(CWD, "dist/skills-test/claude/forma/SKILL.md"),
      "utf-8",
    );
    expect(claude).toMatch(/^name: "forma"$/m);
    const codex = await readFile(
      path.join(CWD, "dist/skills-test/codex/forma/SKILL.md"),
      "utf-8",
    );
    expect(codex).toMatch(/^name: "forma"$/m);
  }, 60_000);

  it("runs a generated wrapper from its emitted package location", async () => {
    await buildSkills(CWD, "dist/skills-test");
    const installedRoot = await mkdtemp(path.join(tmpdir(), "forma-installed-skill-"));
    try {
      await cp(
        path.join(CWD, "dist/skills-test/codex/forma"),
        path.join(installedRoot, "forma"),
        { recursive: true },
      );
      const wrapper = path.join(installedRoot, "forma/scripts/validate.mjs");
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
