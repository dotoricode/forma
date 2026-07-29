import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPages } from "../../src/pages/build.js";

describe("GitHub Pages gallery", () => {
  it("builds the gallery and four real artifacts without external assets", async () => {
    const root = await mkdtemp(path.join(tmpdir(), "forma-pages-"));
    const outDir = path.join(root, "site");

    await buildPages({ outDir });

    const gallery = await readFile(path.join(outDir, "index.html"), "utf-8");
    expect(gallery).toContain("./dashboard/index.html");
    expect(gallery).toContain("./report/index.html");
    expect(gallery).toContain("./manual/index.html");
    expect(gallery).toContain("./advanced/index.html");
    expect(gallery).not.toMatch(/(?:src|href)="https?:/);

    for (const artifact of ["dashboard", "report", "manual", "advanced"]) {
      const html = await readFile(path.join(outDir, artifact, "index.html"), "utf-8");
      expect(html).toContain(`data-artifact="${artifact}"`);
      expect(html).not.toMatch(/(?:src|href)="https?:/);
    }
  }, 30_000);
});
