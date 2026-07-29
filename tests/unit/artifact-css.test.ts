import { describe, expect, it } from "vitest";
import { artifactCss } from "../../src/design/artifact-css.js";

describe("artifact layout grammar", () => {
  it("gives Signal Grid a real 12-column workspace", () => {
    const css = artifactCss();
    expect(css).toContain('data-artifact="dashboard"] .doc');
    expect(css).toContain("grid-template-columns: repeat(12, minmax(0, 1fr))");
    expect(css).toContain(".doc > .blk-anomaly");
    expect(css).toContain(".doc > .blk-action-plan");
  });

  it("uses artifact vocabulary rather than the retired theme names", () => {
    const css = artifactCss();
    expect(css).not.toMatch(/\b(Simple|Workspace|Guide|Magazine)\b/);
    expect(css).not.toContain("--workspace-");
  });

  it("lets Decision Room evidence use a wide review canvas", () => {
    expect(artifactCss()).toContain('data-artifact="advanced"] .layout');
  });
});
