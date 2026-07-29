import { access, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { QA_VIEWPORTS, runBrowserQa } from "../../src/qa/browser-qa.js";

describe("browser QA visual clipping", () => {
  it("checks the 2048px desktop viewport and rejects clipped text", async () => {
    expect(QA_VIEWPORTS).toContainEqual({
      name: "desktop-2048",
      width: 2048,
      height: 1272,
    });

    const fixtureDir = await mkdtemp(path.join(tmpdir(), "forma-browser-qa-"));
    try {
      await writeFile(
        path.join(fixtureDir, "index.html"),
        `<!doctype html><html lang="en"><head><title>clip</title></head><body>
          <main><h1>Clipping fixture</h1>
          <p style="width: 40px; height: 12px; overflow: hidden">
            This deliberately clipped sentence is long enough for the JavaScript-disabled readability check.
          </p></main>
        </body></html>`,
        "utf-8",
      );

      const result = await runBrowserQa({
        target: fixtureDir,
        qaDir: path.join(fixtureDir, "qa"),
      });

      expect(result.clippedTextElements).toBeGreaterThan(0);
      expect(result.passed).toBe(false);
    } finally {
      await rm(fixtureDir, { recursive: true, force: true });
    }
  }, 20_000);

  it("can probe tournament candidates without writing six screenshots each", async () => {
    const fixtureDir = await mkdtemp(path.join(tmpdir(), "forma-browser-probe-"));
    try {
      await writeFile(
        path.join(fixtureDir, "index.html"),
        "<!doctype html><html lang=\"en\"><head><title>probe</title></head><body><main><h1>Readable candidate</h1><p>This candidate has enough text for the JavaScript-disabled check to consider it readable.</p></main></body></html>",
        "utf-8",
      );
      const qaDir = path.join(fixtureDir, "qa");
      const result = await runBrowserQa({
        target: fixtureDir,
        qaDir,
        captureScreenshots: false,
      });

      expect(result.passed).toBe(true);
      await expect(access(path.join(qaDir, "desktop-2048.png"))).rejects.toThrow();
      await expect(access(path.join(qaDir, "accessibility.json"))).resolves.toBeUndefined();
    } finally {
      await rm(fixtureDir, { recursive: true, force: true });
    }
  }, 20_000);
});
