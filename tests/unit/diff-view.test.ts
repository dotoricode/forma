import { describe, expect, it } from "vitest";
import { parseUnifiedDiff, renderDiffHunksHtml } from "../../src/renderer/diff-view.js";

const SAMPLE_DIFF = `--- a/file.kt
+++ b/file.kt
@@ -1,3 +1,3 @@
 fun foo() {
-    old()
+    new()
 }
`;

describe("parseUnifiedDiff", () => {
  it("assigns correct old/new line numbers per row", () => {
    const hunks = parseUnifiedDiff(SAMPLE_DIFF);
    expect(hunks).toHaveLength(1);
    const rows = hunks[0]!.rows;
    expect(rows).toEqual([
      { op: "context", oldLine: 1, newLine: 1, text: "fun foo() {" },
      { op: "del", oldLine: 2, newLine: null, text: "    old()" },
      { op: "add", oldLine: null, newLine: 2, text: "    new()" },
      { op: "context", oldLine: 3, newLine: 3, text: "}" },
    ]);
  });

  it("escapes HTML-significant characters in rendered rows", () => {
    const hunks = parseUnifiedDiff(SAMPLE_DIFF);
    const html = renderDiffHunksHtml(hunks);
    expect(html).toContain("old()");
    expect(html).not.toContain("<script>");
  });

  it("handles an empty diff without throwing", () => {
    expect(() => parseUnifiedDiff("")).not.toThrow();
    expect(parseUnifiedDiff("")).toEqual([]);
  });
});
