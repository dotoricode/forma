import { mkdtemp, readFile, rm, writeFile, mkdir } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { installSkills } from "../../src/cli/skills.js";

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
