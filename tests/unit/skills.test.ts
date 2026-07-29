import { lstat, mkdtemp, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installSkills, verifySkills } from "../../src/cli/skills.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("installSkills", () => {
  it("keeps YAML frontmatter at the start of installed SKILL.md files", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "forma-skills-"));
    tempDirs.push(cwd);
    const canonicalDir = path.join(cwd, "skills", "forma");
    await mkdir(canonicalDir, { recursive: true });
    await writeFile(
      path.join(canonicalDir, "SKILL.md"),
      "---\nname: forma\ndescription: Test skill.\n---\n\n# Forma\n",
      "utf-8",
    );

    await installSkills(cwd);

    for (const installedPath of [
      ".agents/skills/forma/SKILL.md",
      ".claude/skills/forma/SKILL.md",
    ]) {
      const installed = await readFile(path.join(cwd, installedPath), "utf-8");
      expect(installed).toMatch(/^---\r?\nname: forma\r?\n/);
      expect(installed).toContain(
        "<!-- GENERATED COPY — do not edit directly. Source of truth: skills/forma/.",
      );
    }
  });
});

/**
 * `~/.agents/skill-targets.json` is the machine-wide list of directories every
 * agent on the box reads skills from. It is read at runtime rather than
 * hardcoded, because a path added to that file has to start being synced
 * without a code change — a duplicated list is a list that goes stale.
 */
describe("machine-wide skill targets", () => {
  async function fixture(targets: unknown | undefined) {
    const cwd = await mkdtemp(path.join(tmpdir(), "forma-skills-cwd-"));
    const home = await mkdtemp(path.join(tmpdir(), "forma-skills-home-"));
    tempDirs.push(cwd, home);
    const canonicalDir = path.join(cwd, "skills", "forma");
    await mkdir(canonicalDir, { recursive: true });
    await writeFile(
      path.join(canonicalDir, "SKILL.md"),
      "---\nname: forma\ndescription: Test skill.\n---\n\n# Forma\n",
      "utf-8",
    );
    if (targets !== undefined) {
      await mkdir(path.join(home, ".agents"), { recursive: true });
      await writeFile(
        path.join(home, ".agents", "skill-targets.json"),
        JSON.stringify({ version: 1, targets }),
        "utf-8",
      );
    }
    return { cwd, home };
  }

  it("expands ~ and installs the skill under every listed directory", async () => {
    const { cwd, home } = await fixture(["~/.claude/skills", "~/.agents/skills"]);
    const result = await installSkills(cwd, { home, includeGlobalTargets: true });

    expect(result.globalTargets).toEqual([
      path.join(home, ".claude/skills/forma"),
      path.join(home, ".agents/skills/forma"),
    ]);
    for (const dir of result.globalTargets) {
      const skillMd = await readFile(path.join(dir, "SKILL.md"), "utf-8");
      expect(skillMd.startsWith("---")).toBe(true);
      expect(skillMd).toContain("name: forma");
    }
  });

  it("writes the identical canonical checksum to every copy, repo and machine-wide", async () => {
    const { cwd, home } = await fixture(["~/.claude/skills", "~/.claude-work/skills"]);
    const result = await installSkills(cwd, { home, includeGlobalTargets: true });

    const recorded = await Promise.all(
      [
        path.join(cwd, ".agents/skills/forma"),
        path.join(cwd, ".claude/skills/forma"),
        ...result.globalTargets,
      ].map(async (dir) =>
        JSON.parse(await readFile(path.join(dir, ".forma-skill-checksum.json"), "utf-8")).checksum,
      ),
    );
    expect(new Set(recorded).size).toBe(1);
    expect(recorded[0]).toBe(result.checksum);
  });

  it("uses real files rather than symlinks, so every agent resolves them the same way", async () => {
    const { cwd, home } = await fixture(["~/.claude/skills"]);
    const result = await installSkills(cwd, { home, includeGlobalTargets: true });
    const stats = await lstat(path.join(result.globalTargets[0]!, "SKILL.md"));
    expect(stats.isSymbolicLink()).toBe(false);
    expect(stats.isFile()).toBe(true);
  });

  it("syncs only the repo copies when the box has no targets file", async () => {
    const { cwd, home } = await fixture(undefined);
    const result = await installSkills(cwd, { home, includeGlobalTargets: true });
    // CI has no targets file and must still pass.
    expect(result.globalTargets).toEqual([]);
    expect(result.targets).toHaveLength(2);
  });

  it("reports drift in a machine-wide copy without requiring one to exist", async () => {
    const { cwd, home } = await fixture(["~/.claude/skills"]);
    await installSkills(cwd, { home, includeGlobalTargets: true });
    expect((await verifySkills(cwd, { home, includeGlobalTargets: true })).ok).toBe(true);

    // Editing the machine-wide copy is exactly the drift the checksum exists
    // to catch: one agent would read current instructions, another stale ones.
    await writeFile(
      path.join(home, ".claude/skills/forma/.forma-skill-checksum.json"),
      JSON.stringify({ checksum: "stale", source: "skills/forma" }),
      "utf-8",
    );
    const drifted = await verifySkills(cwd, { home, includeGlobalTargets: true });
    expect(drifted.ok).toBe(false);
    expect(drifted.issues.some((issue) => issue.includes(".claude/skills/forma"))).toBe(true);
  });

  it("rejects a targets file whose targets are not an array of strings", async () => {
    const { cwd, home } = await fixture({ nope: true });
    await expect(installSkills(cwd, { home, includeGlobalTargets: true })).rejects.toThrow(/targets/);
  });

  /**
   * This is the bug that made the flag necessary. When the machine-wide sync
   * was on by default, the pre-existing test above — a throwaway skill in a
   * temp directory calling installSkills(cwd) — wrote its fixture SKILL.md
   * into all five real directories and replaced the user's installed skill.
   */
  it("touches nothing outside the repo unless asked", async () => {
    const { cwd, home } = await fixture(["~/.claude/skills"]);
    const result = await installSkills(cwd);

    expect(result.globalTargets).toEqual([]);
    await expect(stat(path.join(home, ".claude/skills/forma"))).rejects.toThrow();
  });

  it("rejects a targets file that is not valid JSON", async () => {
    const { cwd, home } = await fixture(["~/.claude/skills"]);
    await writeFile(path.join(home, ".agents", "skill-targets.json"), "{ not json", "utf-8");
    await expect(installSkills(cwd, { home, includeGlobalTargets: true })).rejects.toThrow(/could not parse/);
  });
});
