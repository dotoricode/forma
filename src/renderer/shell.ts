import type { FormaSpec } from "../spec/schema.js";
import { escapeHtml } from "../security/sanitize.js";
import { buildStylesheet } from "../design/foundations-css.js";
import { buildFontFaceCss } from "../design/fonts.js";
import { buildInteractiveScript } from "./interactive.js";
import { composeDocument } from "./compose.js";
import { DEFAULT_VARIANT } from "../spec/artifact.js";

/* The button is icon-only, so its accessible name has to cover both
   directions — CSS swaps the glyph, but it cannot rewrite a label. */
const THEME_LABEL: Record<"ko" | "en", string> = { en: "Switch theme", ko: "테마 전환" };
const THEME_ICONS = `<svg class="theme-toggle__icon theme-toggle__icon--moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a7 7 0 1 0 10.5 10.5Z" /></svg><svg class="theme-toggle__icon theme-toggle__icon--sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4" /><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6 17 7M7 17l-1.4 1.4" /></svg>`;
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
<header class="doc-bar no-print">
  <div class="doc-bar__inner">
    <p class="doc-bar__identity">
      <span class="doc-bar__mark" aria-hidden="true"></span>
      <span class="doc-bar__title">${escapeHtml(spec.meta.title)}</span>
    </p>
    <div class="doc-bar__actions">
      <span class="doc-bar__tag">${escapeHtml(spec.meta.confidentiality)}</span>
      <button type="button" class="theme-toggle" data-forma-theme-toggle hidden aria-label="${escapeHtml(THEME_LABEL[htmlLangAttr])}" title="${escapeHtml(THEME_LABEL[htmlLangAttr])}">${THEME_ICONS}</button>
    </div>
  </div>
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
