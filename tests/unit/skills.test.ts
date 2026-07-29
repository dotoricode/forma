import { mkdtemp, readFile, rm, stat, writeFile, mkdir } from "node:fs/promises";
import { execFile } from "node:child_process";
import { tmpdir } from "node:os";
import { promisify } from "node:util";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import {
  installAgentSkills,
  syncConfiguredSkills,
  verifyInstalledSkills,
  type CommandRunner,
} from "../../src/skills/install.js";

const CWD = process.cwd();
const tempDirs: string[] = [];
const execFileAsync = promisify(execFile);

async function tempDir(prefix: string): Promise<string> {
  const dir = await mkdtemp(path.join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("installAgentSkills", () => {
  it("installs all four standalone skills into every Codex target", async () => {
    const root = await tempDir("forma-install-");
    const first = path.join(root, "codex");
    const second = path.join(root, "shared");
    const outDir = path.join(root, "build");

    const result = await installAgentSkills(CWD, {
      host: "codex",
      targetRoots: [first, second],
      outDir,
    });

    expect(result.skills.map((skill) => skill.invocation).sort()).toEqual([
      "$forma-advanced",
      "$forma-dashboard",
      "$forma-manual",
      "$forma-report",
    ]);
    for (const name of ["forma-advanced", "forma-dashboard", "forma-manual", "forma-report"]) {
      for (const target of [first, second]) {
        const skillDir = path.join(target, name);
        const skillMd = await readFile(path.join(skillDir, "SKILL.md"), "utf-8");
        expect(skillMd).toMatch(new RegExp(`^name: "${name}"$`, "m"));
        expect(
          JSON.parse(await readFile(path.join(skillDir, ".forma-runtime.json"), "utf-8")),
        ).toEqual({ version: 1, repo: CWD });
        expect((await stat(path.join(skillDir, "SKILL.md"))).isSymbolicLink()).toBe(false);
      }
    }

    expect(
      await verifyInstalledSkills(CWD, {
        targetRoots: [first, second],
        outDir,
      }),
    ).toEqual([]);
  }, 60_000);

  it("writes identical package checksums to every configured target", async () => {
    const root = await tempDir("forma-checksum-");
    const targets = [path.join(root, "one"), path.join(root, "two")];
    const outDir = path.join(root, "build");
    await installAgentSkills(CWD, { host: "codex", targetRoots: targets, outDir });

    for (const name of ["forma-advanced", "forma-dashboard", "forma-manual", "forma-report"]) {
      const checksums = await Promise.all(
        targets.map(async (target) =>
          JSON.parse(
            await readFile(path.join(target, name, ".forma-skill-checksum.json"), "utf-8"),
          ).checksum,
        ),
      );
      expect(new Set(checksums).size).toBe(1);
    }
  }, 60_000);

  it("removes only a checksum-verified generated compatibility router", async () => {
    const root = await tempDir("forma-legacy-");
    const target = path.join(root, "codex");
    const legacy = path.join(target, "forma");
    await mkdir(legacy, { recursive: true });
    await writeFile(
      path.join(legacy, ".forma-skill-checksum.json"),
      JSON.stringify({
        checksum: "d6bf9b6261df73127f2a8d0d186aaf0c14d5e2fae4ba063fd6c627f79efab68e",
      }),
      "utf-8",
    );

    const result = await installAgentSkills(CWD, {
      host: "codex",
      targetRoots: [target],
      outDir: path.join(root, "build"),
    });

    expect(result.removedLegacy).toEqual([legacy]);
    await expect(stat(legacy)).rejects.toThrow();
  }, 60_000);

  it("runs from another project using the installed runtime metadata", async () => {
    const root = await tempDir("forma-runtime-");
    const target = path.join(root, "codex");
    const workDir = path.join(root, "project");
    await mkdir(workDir, { recursive: true });
    await installAgentSkills(CWD, {
      host: "codex",
      targetRoots: [target],
      outDir: path.join(root, "build"),
    });

    const wrapper = path.join(target, "forma-report/scripts/validate.mjs");
    const fixture = path.join(CWD, "fixtures/report/technical/forma.spec.json");
    const { stdout } = await execFileAsync(process.execPath, [wrapper, fixture], {
      cwd: workDir,
    });
    expect(stdout).toContain("is valid");
  }, 60_000);

  it("does not overwrite an installed skill that was edited after installation", async () => {
    const root = await tempDir("forma-conflict-");
    const target = path.join(root, "codex");
    const outDir = path.join(root, "build");
    await installAgentSkills(CWD, { host: "codex", targetRoots: [target], outDir });

    const changed = path.join(target, "forma-report", "SKILL.md");
    await writeFile(changed, `${await readFile(changed, "utf-8")}\nlocal edit\n`, "utf-8");

    await expect(
      installAgentSkills(CWD, { host: "codex", targetRoots: [target], outDir }),
    ).rejects.toThrow(/modified[\s\S]*forma-report/i);
  }, 60_000);

  it("installs the Claude plugin through its local marketplace Adapter", async () => {
    const root = await tempDir("forma-claude-");
    const outDir = path.join(root, "build");
    const calls: Array<{ command: string; args: string[] }> = [];
    const runCommand: CommandRunner = async (command, args) => {
      calls.push({ command, args });
    };

    const result = await installAgentSkills(CWD, {
      host: "claude",
      scope: "user",
      outDir,
      runCommand,
    });

    expect(result.skills.map((skill) => skill.invocation).sort()).toEqual([
      "/forma:advanced",
      "/forma:dashboard",
      "/forma:manual",
      "/forma:report",
    ]);
    expect(calls).toEqual([
      {
        command: "claude",
        args: ["plugin", "validate", path.join(outDir, "claude")],
      },
      {
        command: "claude",
        args: ["plugin", "marketplace", "add", path.join(outDir, "claude"), "--scope", "user"],
      },
      {
        command: "claude",
        args: ["plugin", "install", "forma@forma", "--scope", "user"],
      },
    ]);

    const marketplace = JSON.parse(
      await readFile(path.join(outDir, "claude/.claude-plugin/marketplace.json"), "utf-8"),
    );
    expect(marketplace.name).toBe("forma");
    expect(marketplace.plugins[0].source).toBe("./forma");
    expect(
      JSON.parse(
        await readFile(path.join(outDir, "claude/forma/.forma-runtime.json"), "utf-8"),
      ),
    ).toEqual({ version: 1, repo: CWD });
  }, 60_000);
});

describe("syncConfiguredSkills", () => {
  it("uses the target list as skill roots and installs all four skills under each one", async () => {
    const root = await tempDir("forma-configured-");
    const home = path.join(root, "home");
    const outDir = path.join(root, "build");
    await mkdir(path.join(home, ".agents"), { recursive: true });
    await writeFile(
      path.join(home, ".agents", "skill-targets.json"),
      JSON.stringify({
        version: 1,
        targets: ["~/.agents/skills", "~/.claude/skills"],
      }),
      "utf-8",
    );

    const result = await syncConfiguredSkills(CWD, {
      home,
      outDir,
    });

    expect(result.targetRoots).toEqual([
      path.join(home, ".agents/skills"),
      path.join(home, ".claude/skills"),
    ]);
    for (const target of result.targetRoots) {
      await expect(stat(path.join(target, "forma-dashboard/SKILL.md"))).resolves.toBeDefined();
      await expect(stat(path.join(target, "forma-report/SKILL.md"))).resolves.toBeDefined();
      await expect(stat(path.join(target, "forma-manual/SKILL.md"))).resolves.toBeDefined();
      await expect(stat(path.join(target, "forma-advanced/SKILL.md"))).resolves.toBeDefined();
    }
  }, 60_000);

  it("rejects an invalid configured target list", async () => {
    const root = await tempDir("forma-config-invalid-");
    const home = path.join(root, "home");
    await mkdir(path.join(home, ".agents"), { recursive: true });
    await writeFile(
      path.join(home, ".agents", "skill-targets.json"),
      JSON.stringify({ version: 1, targets: { nope: true } }),
      "utf-8",
    );

    await expect(
      syncConfiguredSkills(CWD, {
        home,
        outDir: path.join(root, "build"),
      }),
    ).rejects.toThrow(/targets/);
  });
});
