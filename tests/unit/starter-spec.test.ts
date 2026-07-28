import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeStarterSpecFile } from "../../src/cli/starter-spec.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("writeStarterSpecFile", () => {
  it("refuses to overwrite an existing spec", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "forma-init-"));
    tempDirs.push(cwd);
    const out = path.join(cwd, "forma.spec.json");
    await writeFile(out, "keep me", "utf-8");

    await expect(writeStarterSpecFile(out)).rejects.toThrow("output already exists");
    expect(await readFile(out, "utf-8")).toBe("keep me");
  });
});
