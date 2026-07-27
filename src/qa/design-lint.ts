#!/usr/bin/env tsx
/**
 * Static CSS lint for the "generic AI design" patterns Forma explicitly
 * bans (see docs/plan/forma-mvp-agent-build-instructions-v2.md §10 and
 * skills/forma/references/generic-ai-patterns.md). Operates on the raw
 * `<style>` text extracted from a rendered HTML file — no browser needed,
 * so this runs in `forma build` even when Playwright isn't available.
 */
import { readFile } from "node:fs/promises";

export interface DesignLintFinding {
  rule: string;
  message: string;
}

const BANNED_CONTENT_VALUES = ['content: "["', "content: '['", 'content: "{"', "content: '{'", 'content: "</>"', "content: '</>'"];

/** Detects `::before`/`::after` rules that combine border-left with a top/bottom
 * border or hook — the left-side bracket-border pattern this project bans. */
function findBracketBorders(css: string): DesignLintFinding[] {
  const findings: DesignLintFinding[] = [];
  const pseudoRuleRegex = /::(?:before|after)\s*\{([^}]*)\}/g;
  let match: RegExpExecArray | null;
  while ((match = pseudoRuleRegex.exec(css)) !== null) {
    const body = match[1] ?? "";
    const hasLeft = /border(-left|-inline-start)\s*:/.test(body);
    const hasTopOrBottom = /border(-top|-bottom|-block-start|-block-end)\s*:/.test(body);
    if (hasLeft && hasTopOrBottom) {
      findings.push({
        rule: "bracket-border",
        message: "::before/::after rule combines a left border with a top/bottom border — looks like a decorative bracket frame, which is banned.",
      });
    }
  }
  return findings;
}

function findDecorativeContent(css: string): DesignLintFinding[] {
  const findings: DesignLintFinding[] = [];
  for (const needle of BANNED_CONTENT_VALUES) {
    if (css.includes(needle)) {
      findings.push({
        rule: "decorative-glyph-content",
        message: `Found ${needle} — oversized bracket/angle-bracket glyphs used as decoration are banned.`,
      });
    }
  }
  return findings;
}

function findExcessiveGradients(css: string): DesignLintFinding[] {
  const gradientCount = (css.match(/linear-gradient|radial-gradient/g) ?? []).length;
  if (gradientCount > 2) {
    return [
      {
        rule: "gradient-overuse",
        message: `${gradientCount} gradient() usages found — Forma's Quiet Editorial language uses flat surfaces, not gradient hero treatments.`,
      },
    ];
  }
  return [];
}

/**
 * `margin-inline: auto` next to a width cap centres that block while every
 * uncapped block around it stays left — the "why is this one paragraph
 * randomly in the middle" defect. Width and alignment are separate
 * decisions; a shared page column belongs on `.doc`/`.layout`, not on the
 * handful of blocks that happen to cap their measure.
 */
function findCenteringWidthCaps(css: string): DesignLintFinding[] {
  const findings: DesignLintFinding[] = [];
  // Comments are stripped first: a comment sitting above a rule otherwise
  // gets captured as that rule's selector, so the page-column allowlist
  // below never matches and every documented rule reads as a violation.
  const source = css.replace(/\/\*[\s\S]*?\*\//g, "");
  const ruleRegex = /([^{}]+)\{([^}]*)\}/g;
  // The page column is *supposed* to be centred — it is the one shared
  // frame everything else aligns inside.
  const PAGE_COLUMN = /\.(doc|layout|shell)(\s|$|,|\.|:|\[)/;
  let match: RegExpExecArray | null;
  while ((match = ruleRegex.exec(source)) !== null) {
    const selector = (match[1] ?? "").trim();
    const body = match[2] ?? "";
    // At-rule preludes ("@layer layout", "@media ...") are not selectors;
    // the brace they open belongs to the rules nested inside them.
    if (selector.includes("@")) continue;
    if (PAGE_COLUMN.test(selector)) continue;
    const caps = /max-width\s*:\s*(?!none|100%)/.test(body);
    const centres = /margin(-inline)?\s*:\s*[^;]*\bauto\b/.test(body);
    if (caps && centres) {
      findings.push({
        rule: "centered-width-cap",
        message: `"${selector.slice(0, 60)}" caps max-width and centres with auto margins — capped blocks then start further right than the blocks around them. Cap the width, keep margin-inline: 0.`,
      });
    }
  }
  return findings;
}

/**
 * `ch` is the advance width of "0". It rescales with the element's own
 * font-size (so the same 70ch is a different pixel width in a smaller-typed
 * block) and CJK glyphs are about twice as wide, so a Latin-tuned measure
 * fits roughly half as much Korean. Reading widths belong in rem.
 */
function findChMeasures(css: string): DesignLintFinding[] {
  const hits = css.match(/(max-width|width|inline-size)\s*:[^;]*?\d+(?:\.\d+)?ch/g) ?? [];
  return hits.map((hit) => ({
    rule: "ch-measure",
    message: `"${hit.trim()}" sizes a reading measure in ch — use rem so the width is font-size independent and does not halve for Korean text.`,
  }));
}

/**
 * OKLCH interpolates hue on a colour wheel. The neutral tokens carry an
 * explicit hue of 0, so mixing a blue accent (hue 250) into white travelled
 * 250 -> 0 and landed on pink. oklab is rectangular and has no hue to
 * interpolate, which is what tinting actually wants.
 */
function findOklchColorMix(css: string): DesignLintFinding[] {
  const hits = css.match(/color-mix\(\s*in\s+oklch[^)]*\)/g) ?? [];
  return hits.map((hit) => ({
    rule: "oklch-color-mix-hue-shift",
    message: `"${hit.trim()}" mixes in oklch — hue interpolation against an achromatic token (hue 0) shifts the result off-hue. Mix in oklab instead.`,
  }));
}

export function lintCss(css: string): DesignLintFinding[] {
  return [
    ...findBracketBorders(css),
    ...findDecorativeContent(css),
    ...findExcessiveGradients(css),
    ...findCenteringWidthCaps(css),
    ...findChMeasures(css),
    ...findOklchColorMix(css),
  ];
}

export async function lintHtmlFile(htmlPath: string): Promise<DesignLintFinding[]> {
  const html = await readFile(htmlPath, "utf-8");
  const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/);
  const css = styleMatch?.[1] ?? "";
  return lintCss(css);
}

async function main() {
  const target = process.argv[2];
  if (!target) {
    console.error("usage: design-lint.ts <path-to-index.html>");
    process.exit(1);
  }
  const findings = await lintHtmlFile(target);
  if (findings.length === 0) {
    console.log(`forma design-lint: ${target} — no violations found`);
    return;
  }
  console.log(`forma design-lint: ${target} — ${findings.length} finding(s)`);
  for (const f of findings) console.log(`  - [${f.rule}] ${f.message}`);
  process.exitCode = 1;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
