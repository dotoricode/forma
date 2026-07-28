import { describe, expect, it } from "vitest";
import { lintCss } from "../../src/qa/design-lint.js";
import { buildStylesheet } from "../../src/design/foundations-css.js";

describe("lintCss", () => {
  it("limits key-point counters to direct items so source locators do not collapse", () => {
    const css = buildStylesheet("");
    expect(css).toContain(".blk-key-points > ol > li {");
    expect(css).not.toMatch(/\.blk-key-points li\s*\{/);
  });

  it("contains the mobile TOC in one non-wrapping scroll row", () => {
    const css = buildStylesheet("");
    expect(css).toMatch(/\.toc\s*\{[\s\S]*?flex-wrap:\s*nowrap;/);
    expect(css).toMatch(/\.toc\s*\{[\s\S]*?overflow-x:\s*auto;/);
    expect(css).toMatch(/\.layout > \.side-toc\s*\{[\s\S]*?min-width:\s*0;/);
  });

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
        :root[data-design="magazine"] .doc { max-width: 52rem; margin-inline: auto; }`;
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

  describe("hardcoded-paint-color", () => {
    it("flags a literal background that cannot follow the theme", () => {
      const css = `.side-toc { background: oklch(13% 0.004 90); }`;
      expect(lintCss(css).some((f) => f.rule === "hardcoded-paint-color")).toBe(true);
    });

    it("flags a hex literal on a border colour", () => {
      const css = `.card { border-block-end-color: #ccc; }`;
      expect(lintCss(css).some((f) => f.rule === "hardcoded-paint-color")).toBe(true);
    });

    it("accepts a var() reference", () => {
      const css = `.side-toc { background: var(--wb-rail); color: var(--wb-rail-text); }`;
      expect(lintCss(css).some((f) => f.rule === "hardcoded-paint-color")).toBe(false);
    });

    it("accepts literals inside the token block, which is where they belong", () => {
      const css = `:root { --color-canvas: oklch(96.5% 0.003 90); --wb-rail: oklch(13% 0.004 90); }`;
      expect(lintCss(css).some((f) => f.rule === "hardcoded-paint-color")).toBe(false);
    });

    it("exempts @media print, which pins ink on purpose", () => {
      const css = `@media print { body { background: white; } .section { border-block-end-color: #ccc; } }`;
      expect(lintCss(css).some((f) => f.rule === "hardcoded-paint-color")).toBe(false);
    });

    it("does not flag keyword or currentColor values", () => {
      const css = `.a { color: currentColor; } .b { background: transparent; } .c { color: inherit; }`;
      expect(lintCss(css).some((f) => f.rule === "hardcoded-paint-color")).toBe(false);
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
