import { describe, expect, it } from "vitest";
import { lintCss } from "../../src/qa/design-lint.js";

describe("lintCss", () => {
  it("flags a ::before rule combining left and top/bottom borders (bracket frame)", () => {
    const css = `.section::before { content: ""; border-left: 2px solid red; border-top: 2px solid red; }`;
    const findings = lintCss(css);
    expect(findings.some((f) => f.rule === "bracket-border")).toBe(true);
  });

  it("does not flag a ::before rule with only a left border (note rail)", () => {
    const css = `.note::before { content: ""; border-left: 1px solid gray; }`;
    const findings = lintCss(css);
    expect(findings.some((f) => f.rule === "bracket-border")).toBe(false);
  });

  it("flags decorative content using bracket/angle-bracket glyphs", () => {
    const css = `.deco::before { content: "</>"; }`;
    const findings = lintCss(css);
    expect(findings.some((f) => f.rule === "decorative-glyph-content")).toBe(true);
  });

  it("does not flag a counter() content rule", () => {
    const css = `.line::before { content: counter(line); }`;
    const findings = lintCss(css);
    expect(findings).toEqual([]);
  });

  it("flags more than two gradient() usages", () => {
    const css = `a{background:linear-gradient(a,b)} b{background:linear-gradient(a,b)} c{background:radial-gradient(a,b)}`;
    const findings = lintCss(css);
    expect(findings.some((f) => f.rule === "gradient-overuse")).toBe(true);
  });

  it("returns no findings for Forma's own generated stylesheet shape", () => {
    const css = `.blk-timeline__item::before { content: ""; position: absolute; border-radius: 50%; }`;
    expect(lintCss(css)).toEqual([]);
  });
});
