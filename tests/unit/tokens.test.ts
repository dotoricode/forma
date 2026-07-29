import { describe, expect, it } from "vitest";
import { vscodeDark, vscodeLight } from "../../src/design/tokens.js";

describe("VS Code color sources", () => {
  it("uses the built-in Light+ workbench and syntax palette", () => {
    expect(vscodeLight).toMatchObject({
      canvas: "#FFFFFF",
      surface: "#F3F3F3",
      text: "#333333",
      accent: "#007ACC",
      chartBlue: "#0070C1",
      chartCyan: "#267F99",
      chartPurple: "#AF00DB",
    });
  });

  it("uses the built-in Dark+ workbench and syntax palette", () => {
    expect(vscodeDark).toMatchObject({
      canvas: "#1E1E1E",
      surface: "#252526",
      text: "#CCCCCC",
      accent: "#3794FF",
      chartBlue: "#4FC1FF",
      chartCyan: "#4EC9B0",
      chartPurple: "#C586C0",
    });
  });
});
