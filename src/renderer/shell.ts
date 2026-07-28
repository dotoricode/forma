import type { FormaSpec } from "../spec/schema.js";
import { escapeHtml } from "../security/sanitize.js";
import { buildStylesheet } from "../design/foundations-css.js";
import { buildFontFaceCss } from "../design/fonts.js";
import { buildInteractiveScript } from "./interactive.js";
import { composeDocument } from "./compose.js";
import { DEFAULT_VARIANT } from "../spec/artifact.js";

const THEME_LABEL: Record<"ko" | "en", string> = { en: "Toggle dark mode", ko: "다크 모드 전환" };
const SKIP_LABEL: Record<"ko" | "en", string> = {
  en: "Skip to main content",
  ko: "본문으로 건너뛰기",
};
const GENERATOR = "Forma 0.1.0";

export interface RenderResult {
  html: string;
}

export async function renderSpecToHtml(spec: FormaSpec): Promise<RenderResult> {
  const composed = await composeDocument(spec);
  const fontFaceCss = await buildFontFaceCss({
    sansText: composed.sansText,
    monoText: composed.monoText,
  });
  const stylesheet = buildStylesheet(fontFaceCss);
  const script = buildInteractiveScript();
  const lang = spec.meta.language;
  const htmlLangAttr = lang === "ko" ? "ko" : "en";
  const themeAttr =
    spec.meta.colorMode === "light" || spec.meta.colorMode === "dark"
      ? ` data-theme="${spec.meta.colorMode}"`
      : "";
  // Artifact and variant are separate hooks so a stylesheet can address
  // "every report" without repeating itself once per variant.
  const variant = spec.meta.variant ?? DEFAULT_VARIANT[spec.meta.artifact];
  const designAttr = ` data-artifact="${spec.meta.artifact}" data-variant="${variant}"`;

  const html = `<!doctype html>
<html lang="${htmlLangAttr}"${themeAttr}${designAttr}>
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${escapeHtml(spec.meta.title)} · Forma</title>
<meta name="generator" content="${GENERATOR}" />
<meta name="description" content="${escapeHtml(spec.narrative.summary)}" />
<meta name="color-scheme" content="light dark" />
<meta name="robots" content="noindex" />
<link rel="icon" href="data:," />
<style>${stylesheet}</style>
</head>
<body>
<a class="skip-link" href="#main">${escapeHtml(SKIP_LABEL[htmlLangAttr])}</a>
<header class="doc no-print">
  <button type="button" class="theme-toggle" data-forma-theme-toggle hidden>${escapeHtml(THEME_LABEL[htmlLangAttr])}</button>
</header>
<div class="layout">
  <main class="doc" id="main" data-density="${spec.meta.density}">
${composed.bodyHtml}
  </main>
  ${composed.tocHtml ? `<aside class="side-toc no-print">${composed.tocHtml}</aside>` : ""}
</div>
<footer class="doc no-print">
  <p class="blk-source-note">${escapeHtml(GENERATOR)} · ${escapeHtml(spec.meta.confidentiality)}</p>
</footer>
<script type="module">${script}</script>
</body>
</html>
`;

  return { html };
}
