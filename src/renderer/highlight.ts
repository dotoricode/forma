/**
 * Build-time syntax highlighting via Shiki, with dual light/dark theming
 * driven by CSS variables (no client-side theme switch logic needed for
 * code blocks — see the `.shiki-themes` rules in design/css.ts).
 */
import { codeToHtml } from "shiki";

export interface HighlightedLine {
  html: string;
}

const LANG_ALIASES: Record<string, string> = {
  kt: "kotlin",
  yml: "yaml",
  sh: "bash",
  shell: "bash",
  js: "javascript",
  ts: "typescript",
  cpp: "cpp",
  "c++": "cpp",
  c: "c",
};

function resolveLang(language: string): string {
  const normalized = language.trim().toLowerCase();
  return LANG_ALIASES[normalized] ?? normalized;
}

/**
 * Highlights `code` and returns one HTML fragment per source line (already
 * tokenized with dual-theme inline styles). Falls back to a single escaped
 * plain-text line per input line if the language is unknown to Shiki.
 */
export async function highlightLines(code: string, language: string): Promise<HighlightedLine[]> {
  const lang = resolveLang(language);
  let html: string;
  try {
    html = await codeToHtml(code, {
      lang,
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
  } catch {
    html = await codeToHtml(code, {
      lang: "text",
      themes: { light: "github-light", dark: "github-dark" },
      defaultColor: false,
    });
  }

  const match = html.match(/<code>([\s\S]*)<\/code>/);
  const inner = match?.[1] ?? "";
  const segments = inner.split('<span class="line">').slice(1);
  return segments.map((segment) => ({
    html: segment.replace(/<\/span>\n?$/, ""),
  }));
}
