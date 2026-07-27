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

  describe("centered-width-cap", () => {
    it("flags a block that caps its width and centres itself", () => {
      const css = `.blk-finding { max-width: 42rem; margin-inline: auto; }`;
      expect(lintCss(css).some((f) => f.rule === "centered-width-cap")).toBe(true);
    });

    it("does not flag a width cap without centering", () => {
      const css = `.measure { max-width: 42rem; margin-inline: 0; }`;
      expect(lintCss(css).some((f) => f.rule === "centered-width-cap")).toBe(false);
    });

    it("allows the shared page column to centre itself", () => {
      const css = `.doc { max-width: 64rem; margin-inline: auto; }
        .layout { max-width: 64rem; margin-inline: auto; }
        :root[data-design="editorial-magazine"] .doc { max-width: 52rem; margin-inline: auto; }`;
      expect(lintCss(css).some((f) => f.rule === "centered-width-cap")).toBe(false);
    });

    it("does not mistake an at-rule prelude for a centering selector", () => {
      const css = `@layer layout { .doc { max-width: 64rem; margin-inline: auto; } }`;
      expect(lintCss(css).some((f) => f.rule === "centered-width-cap")).toBe(false);
    });

    it("does not mistake a preceding comment for the rule's selector", () => {
      const css = `/* the shared page column */ .doc { max-width: 64rem; margin-inline: auto; }`;
      expect(lintCss(css).some((f) => f.rule === "centered-width-cap")).toBe(false);
    });
  });

  describe("ch-measure", () => {
    it("flags a reading measure sized in ch", () => {
      expect(lintCss(`.measure { max-width: 70ch; }`).some((f) => f.rule === "ch-measure")).toBe(true);
    });

    it("accepts a reading measure sized in rem", () => {
      expect(lintCss(`.measure { max-width: 42rem; }`).some((f) => f.rule === "ch-measure")).toBe(false);
    });
  });

  describe("oklch-color-mix-hue-shift", () => {
    it("flags color-mix in oklch, which interpolates hue toward the neutral's hue 0", () => {
      const css = `.tint { background: color-mix(in oklch, var(--color-accent) 6%, var(--color-surface)); }`;
      expect(lintCss(css).some((f) => f.rule === "oklch-color-mix-hue-shift")).toBe(true);
    });

    it("accepts color-mix in oklab", () => {
      const css = `.tint { background: color-mix(in oklab, var(--color-accent) 6%, var(--color-surface)); }`;
      expect(lintCss(css).some((f) => f.rule === "oklch-color-mix-hue-shift")).toBe(false);
    });
  });
});
