import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { writeGeneratedSpec } from "../../src/cli/generate.js";

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(tempDirs.splice(0).map((dir) => rm(dir, { recursive: true, force: true })));
});

describe("writeGeneratedSpec", () => {
  it("preserves the input as a source and the selected artifact", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "forma-generate-"));
    tempDirs.push(cwd);
    const input = path.join(cwd, "results.junit.xml");
    const out = path.join(cwd, "result.forma.spec.json");
    await writeFile(input, "<testsuites />", "utf-8");

    const spec = await writeGeneratedSpec({ input, artifact: "report", purpose: "diagnose", out });

    expect(spec.meta.artifact).toBe("report");
    expect(spec.meta.purpose).toBe("diagnose");
    expect(spec.meta.variant).toBe("technical");
    expect(spec.sources[0]).toMatchObject({
      label: "results.junit.xml",
      path: input,
      kind: "junit",
    });
    expect(JSON.parse(await readFile(out, "utf-8")).meta.artifact).toBe("report");
  });

  it("does not overwrite an existing output", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "forma-generate-"));
    tempDirs.push(cwd);
    const input = path.join(cwd, "notes.md");
    const out = path.join(cwd, "notes.forma.spec.json");
    await writeFile(input, "# Notes", "utf-8");
    await writeFile(out, "keep me", "utf-8");

    await expect(writeGeneratedSpec({ input, artifact: "report", purpose: "explain", out })).rejects.toThrow(
      "output already exists",
    );
    expect(await readFile(out, "utf-8")).toBe("keep me");
  });

  it("rejects a missing input before writing", async () => {
    const cwd = await mkdtemp(path.join(tmpdir(), "forma-generate-"));
    tempDirs.push(cwd);
    await expect(
      writeGeneratedSpec({
        input: path.join(cwd, "missing.md"),
        artifact: "manual",
        purpose: "operate",
        out: path.join(cwd, "missing.forma.spec.json"),
      }),
    ).rejects.toThrow("input does not exist");
  });
});
