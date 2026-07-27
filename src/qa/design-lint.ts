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

export function lintCss(css: string): DesignLintFinding[] {
  return [...findBracketBorders(css), ...findDecorativeContent(css), ...findExcessiveGradients(css)];
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
