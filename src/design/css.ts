import { primitiveColor, spacing, radius, breakpoint, motion, measure } from "./tokens.js";

/**
 * Builds the complete Forma stylesheet. `fontFaceCss` is injected from the
 * font subsetting pipeline (base64 WOFF2 @font-face rules) so this module
 * stays offline and has no knowledge of the filesystem.
 */
export function buildStylesheet(fontFaceCss: string): string {
  return `
@layer reset, tokens, base, layout, components, utilities, overrides;

${fontFaceCss}

@layer reset {
  *, *::before, *::after { box-sizing: border-box; }
  html { -webkit-text-size-adjust: 100%; }
  body { margin: 0; }
  img, svg, table { max-width: 100%; }
  h1, h2, h3, h4, p, figure, dl, dd { margin: 0; }
  ul, ol { margin: 0; padding: 0; }
}

@layer tokens {
  :root {
    --color-canvas: ${primitiveColor.neutral50};
    --color-surface: ${primitiveColor.neutral0};
    --color-surface-raised: ${primitiveColor.neutral100};
    --color-text: ${primitiveColor.neutral900};
    --color-text-muted: ${primitiveColor.neutral600};
    --color-border: ${primitiveColor.neutral200};
    --color-border-strong: ${primitiveColor.neutral300};
    --color-accent: ${primitiveColor.accent500};
    --color-accent-strong: ${primitiveColor.accent600};
    --color-on-accent: ${primitiveColor.neutral0};
    --color-success: ${primitiveColor.success500};
    --color-warning: ${primitiveColor.warning500};
    --color-danger: ${primitiveColor.danger500};
    --color-info: ${primitiveColor.info500};

    --font-sans: "Geist", "IBM Plex Sans KR", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas, "Liberation Mono", monospace;

    --measure-prose: ${measure.prose};
    --measure-wide: ${measure.wide};

    --space-1: ${spacing[1]}; --space-2: ${spacing[2]}; --space-3: ${spacing[3]};
    --space-4: ${spacing[4]}; --space-5: ${spacing[5]}; --space-6: ${spacing[6]};
    --space-7: ${spacing[7]}; --space-8: ${spacing[8]}; --space-9: ${spacing[9]};

    --radius-sm: ${radius.sm}; --radius-md: ${radius.md}; --radius-lg: ${radius.lg};

    --motion-fast: ${motion.durationFast};
    --motion-base: ${motion.durationBase};
    --motion-slow: ${motion.durationSlow};
    --ease-standard: ${motion.easeStandard};

    color-scheme: light;
  }

  [data-theme="dark"] {
    --color-canvas: ${primitiveColor.neutral950};
    --color-surface: ${primitiveColor.neutral900};
    --color-surface-raised: ${primitiveColor.neutral800};
    --color-text: ${primitiveColor.neutral100};
    --color-text-muted: ${primitiveColor.neutral400};
    --color-border: ${primitiveColor.neutral700};
    --color-border-strong: ${primitiveColor.neutral600};
    --color-accent: ${primitiveColor.accent400};
    --color-accent-strong: ${primitiveColor.accent500};
    --color-on-accent: ${primitiveColor.neutral950};
    color-scheme: dark;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
      --color-canvas: ${primitiveColor.neutral950};
      --color-surface: ${primitiveColor.neutral900};
      --color-surface-raised: ${primitiveColor.neutral800};
      --color-text: ${primitiveColor.neutral100};
      --color-text-muted: ${primitiveColor.neutral400};
      --color-border: ${primitiveColor.neutral700};
      --color-border-strong: ${primitiveColor.neutral600};
      --color-accent: ${primitiveColor.accent400};
      --color-accent-strong: ${primitiveColor.accent500};
      --color-on-accent: ${primitiveColor.neutral950};
      color-scheme: dark;
    }
  }
}

@layer base {
  html {
    font-family: var(--font-sans);
    background: var(--color-canvas);
    color: var(--color-text);
    font-size: 100%;
    line-height: 1.6;
  }
  body {
    font-variant-numeric: tabular-nums;
  }
  h1, h2, h3, h4 {
    font-weight: 700;
    text-wrap: balance;
    line-height: 1.2;
  }
  p { text-wrap: pretty; }
  code, pre, kbd, samp { font-family: var(--font-mono); }
  a { color: var(--color-accent); }
  a:focus-visible, button:focus-visible, summary:focus-visible, [tabindex]:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  ::selection { background: color-mix(in oklch, var(--color-accent) 25%, transparent); }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
}

@layer layout {
  .doc {
    max-width: var(--measure-wide);
    margin-inline: auto;
    padding-inline: var(--space-5);
  }
  .doc[data-density="compact"] .section { padding-block: var(--space-5); }
  .doc[data-density="comfortable"] .section { padding-block: var(--space-7); }

  main { display: block; }

  .section {
    padding-block: var(--space-7);
    border-block-end: 1px solid var(--color-border);
    /* Establishes the containment context the @container queries below
       (comparison two-column grid, code note rail) actually measure against. */
    container-type: inline-size;
  }
  .section:last-of-type { border-block-end: none; }

  .measure {
    max-width: var(--measure-prose);
    margin-inline: auto;
  }
  .breakout {
    max-width: min(100%, 92ch);
    margin-inline: auto;
  }

  .toc {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4);
    font-size: 0.875rem;
  }
  .toc a { color: var(--color-text-muted); text-decoration: none; }
  .toc a:hover { color: var(--color-accent); }
  .toc a[aria-current="true"] {
    color: var(--color-accent);
    font-weight: 600;
  }

  /* Main content + table-of-contents rail. Single column with the TOC
     stacked on top at narrow widths (order: -1); a real right-hand rail
     once there's room for it, using CSS Grid column placement rather than
     duplicating the nav markup per breakpoint. */
  .layout {
    max-width: var(--measure-wide);
    margin-inline: auto;
    padding-inline: var(--space-5);
    display: grid;
    grid-template-columns: 1fr;
    gap: var(--space-5);
    align-items: start;
  }
  .layout > .doc {
    max-width: none;
    margin-inline: 0;
    padding-inline: 0;
  }
  .layout > .side-toc {
    order: -1;
    border-block-end: 1px solid var(--color-border);
    padding-block-end: var(--space-4);
  }

  @media (min-width: 1280px) {
    .layout {
      grid-template-columns: minmax(0, 1fr) 240px;
      max-width: calc(var(--measure-wide) + 240px + var(--space-6));
      gap: var(--space-6);
    }
    .layout > .side-toc {
      order: 1;
      position: sticky;
      top: var(--space-5);
      max-height: calc(100vh - var(--space-6));
      overflow-y: auto;
      border-block-end: none;
      padding-block-end: 0;
    }
    .side-toc .toc {
      flex-direction: column;
      flex-wrap: nowrap;
    }
  }

  @container (min-width: 720px) {
    .comparison__grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--space-6);
    }
  }

  @supports (grid-template-rows: subgrid) {
    .test-matrix__table { grid-template-rows: subgrid; }
  }
}

@layer components {
${componentCss()}
}

@layer utilities {
  .visually-hidden {
    position: absolute;
    width: 1px; height: 1px;
    padding: 0; margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
  .skip-link {
    position: absolute;
    inset-inline-start: var(--space-3);
    inset-block-start: -3rem;
    background: var(--color-accent);
    color: var(--color-on-accent);
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius-sm);
    z-index: 10;
    transition: inset-block-start var(--motion-base) var(--ease-standard);
  }
  .skip-link:focus { inset-block-start: var(--space-3); }

  .theme-toggle {
    font: inherit;
    font-size: 0.8125rem;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.35em 0.75em;
    cursor: pointer;
  }
  .theme-toggle:hover { border-color: var(--color-border-strong); }

  .code-copy {
    font: inherit;
    font-size: 0.75rem;
    position: absolute;
    inset-block-start: var(--space-2);
    inset-inline-end: var(--space-2);
    z-index: 1;
    background: var(--color-surface);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    padding: 0.25em 0.6em;
    cursor: pointer;
  }
  .code-copy:hover { color: var(--color-text); border-color: var(--color-border-strong); }

  @media print {
    :root, [data-theme] { color-scheme: light; }
    body { background: white; color: black; }
    .no-print { display: none !important; }
    .section { break-inside: avoid; border-block-end-color: #ccc; }
    a { color: black; text-decoration: underline; }
  }
}

@layer overrides {
  @media (max-width: ${breakpoint.mobile}) {
    .doc { padding-inline: var(--space-4); }
    .section { padding-block: var(--space-6); }
  }

${designSystemCss()}
}
`;
}

/**
 * Alternate design systems. Each one renders the identical block markup
 * from blocks.ts/compose.ts — only the shell's `data-design` attribute
 * (set in shell.ts) changes, and these selectors key off it. No parallel
 * renderer, no parallel DOM: a theme is a CSS variant, not a new component
 * tree.
 */
function designSystemCss(): string {
  return `
  /* Precision Workbench — dark sidebar nav (reusing .side-toc/.toc), each
     .section becomes a raised card instead of a full-bleed divided band. */
  :root[data-design="precision-workbench"] {
    --shadow: 0 1px 2px oklch(0% 0 0 / 0.05), 0 4px 16px oklch(0% 0 0 / 0.08);
  }
  :root[data-design="precision-workbench"] body { background: ${primitiveColor.neutral100}; }
  :root[data-design="precision-workbench"] .layout {
    grid-template-columns: 240px 1fr;
    max-width: none;
    align-items: stretch;
  }
  :root[data-design="precision-workbench"] .layout > .side-toc {
    order: -1;
    position: sticky;
    inset-block-start: 0;
    align-self: start;
    height: 100vh;
    overflow-y: auto;
    background: ${primitiveColor.neutral900};
    border-block-end: none;
    padding: var(--space-6) var(--space-4);
    margin-inline-start: calc(-1 * var(--space-5));
  }
  :root[data-design="precision-workbench"] .side-toc .toc {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: var(--space-1);
  }
  :root[data-design="precision-workbench"] .side-toc .toc a {
    color: ${primitiveColor.neutral400};
    padding: 0.5em 0.75em;
    border-radius: var(--radius-sm);
  }
  :root[data-design="precision-workbench"] .side-toc .toc a:hover { color: ${primitiveColor.neutral0}; }
  :root[data-design="precision-workbench"] .side-toc .toc a[aria-current="true"] {
    background: ${primitiveColor.neutral800};
    color: ${primitiveColor.neutral0};
  }
  :root[data-design="precision-workbench"] .layout > .doc { padding-block: var(--space-6); }
  :root[data-design="precision-workbench"] .section {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: var(--space-6);
    margin-block-end: var(--space-5);
  }
  :root[data-design="precision-workbench"] .section:last-of-type { border-block-end: 1px solid var(--color-border); }

  /* Developer Docs — light left nav rail, callout-style finding/decision
     blocks, tighter reading measure like a docs site's center column. */
  :root[data-design="developer-docs"] .layout {
    grid-template-columns: 220px 1fr;
    max-width: none;
  }
  :root[data-design="developer-docs"] .layout > .side-toc {
    order: -1;
    position: sticky;
    inset-block-start: var(--space-5);
    align-self: start;
    border-inline-end: 1px solid var(--color-border);
    border-block-end: none;
    padding-inline-end: var(--space-4);
  }
  :root[data-design="developer-docs"] .side-toc .toc {
    flex-direction: column;
    flex-wrap: nowrap;
  }
  :root[data-design="developer-docs"] .side-toc .toc a[aria-current="true"] {
    border-inline-start: 2px solid var(--color-accent);
    padding-inline-start: var(--space-3);
    margin-inline-start: calc(-1 * var(--space-3) - 2px);
  }
  :root[data-design="developer-docs"] .measure { max-width: 62ch; }
  :root[data-design="developer-docs"] .blk-finding,
  :root[data-design="developer-docs"] .blk-decision .decision-strip {
    background: color-mix(in oklch, var(--color-accent) 6%, var(--color-surface));
    border-radius: var(--radius-md);
    padding: var(--space-4) var(--space-5);
  }
  :root[data-design="developer-docs"] .blk-decision .decision-strip { border-inline-start-width: 3px; }

  /* Editorial Magazine — serif display type, narrower measure, drop cap on
     the opening paragraph. System serif stack only: no subsetting needed
     since it never leaves the local font fallback chain. */
  :root[data-design="editorial-magazine"] {
    --font-serif: Georgia, "Nanum Myeongjo", serif;
  }
  :root[data-design="editorial-magazine"] .doc { max-width: 44rem; }
  :root[data-design="editorial-magazine"] h1,
  :root[data-design="editorial-magazine"] h2,
  :root[data-design="editorial-magazine"] .blk-cover__title,
  :root[data-design="editorial-magazine"] .blk-narrative__question {
    font-family: var(--font-serif);
    font-weight: 400;
  }
  :root[data-design="editorial-magazine"] .blk-cover__title { font-size: clamp(2rem, 1.3rem + 3vw, 3.5rem); }
  :root[data-design="editorial-magazine"] .blk-narrative__question { font-style: italic; }
  :root[data-design="editorial-magazine"] .blk-narrative__summary p:first-of-type::first-letter {
    font-family: var(--font-serif);
    font-size: 3.4em;
    font-weight: 700;
    float: inline-start;
    line-height: 0.8;
    padding-inline-end: var(--space-2);
  }
  :root[data-design="editorial-magazine"] .blk-takeaways {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    font-style: italic;
    border-block: 1px solid var(--color-text);
    padding-block: var(--space-4);
  }
  `;
}

function componentCss(): string {
  return `
  /* cover */
  .blk-cover {
    padding-block: var(--space-8) var(--space-7);
  }
  .blk-cover__eyebrow {
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
    color: var(--color-text-muted);
    text-transform: uppercase;
  }
  .blk-cover__title {
    font-size: clamp(1.75rem, 1.3rem + 1.8vw, 2.75rem);
    margin-block-start: var(--space-3);
    /* No ch-based max-width here: "ch" is the width of the "0" glyph, so a
       22ch cap meant for Latin text only fits ~11 CJK characters before
       wrapping — every Korean title wrapped to two lines regardless of
       how much room the column actually had. The column width itself
       (measure-wide) is already the real constraint. */
    max-width: 100%;
  }
  .blk-cover__subtitle {
    margin-block-start: var(--space-3);
    color: var(--color-text-muted);
    font-size: 1.125rem;
    max-width: var(--measure-prose);
  }
  .blk-cover__meta {
    display: flex; flex-wrap: wrap; gap: var(--space-4);
    margin-block-start: var(--space-5);
    font-size: 0.875rem;
    color: var(--color-text-muted);
    list-style: none;
  }

  /* narrative (question + summary + takeaways, always first) */
  .blk-narrative { padding-block-start: 0; }
  .blk-narrative__question { font-size: 1.375rem; font-weight: 700; line-height: 1.3; }
  .blk-narrative__summary { margin-block-start: var(--space-3); color: var(--color-text-muted); max-width: var(--measure-prose); }

  /* summary / narrative */
  .blk-summary__title { font-size: 1.375rem; max-width: var(--measure-prose); }
  .blk-summary__body { margin-block-start: var(--space-3); max-width: var(--measure-prose); color: var(--color-text-muted); }
  .blk-takeaways { margin-block-start: var(--space-5); max-width: var(--measure-prose); list-style: none; }
  .blk-takeaways li { padding-block: var(--space-2); border-block-start: 1px solid var(--color-border); }
  .blk-takeaways li:first-child { border-block-start: none; }

  /* prose */
  .blk-prose__title { font-size: 1.25rem; margin-block-end: var(--space-3); }
  .blk-prose__body { max-width: var(--measure-prose); }
  .blk-prose__body p + p { margin-block-start: var(--space-4); }

  /* key-points */
  .blk-key-points__title { font-size: 1.125rem; margin-block-end: var(--space-3); }
  .blk-key-points ol { max-width: var(--measure-prose); counter-reset: kp; list-style: none; }
  .blk-key-points li {
    counter-increment: kp;
    display: grid;
    grid-template-columns: 2rem 1fr;
    gap: var(--space-3);
    padding-block: var(--space-2);
  }
  .blk-key-points li::before {
    content: counter(kp, decimal-leading-zero);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    padding-block-start: 0.15em;
  }

  /* annotated-code */
  .blk-code { max-width: var(--measure-wide); margin-inline: auto; }
  .blk-code__title { font-size: 1rem; margin-block-end: var(--space-3); color: var(--color-text-muted); }
  .blk-code__frame {
    display: grid;
    grid-template-columns: 1fr;
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow: hidden;
    position: relative;
  }
  @container (min-width: 900px) {
    .blk-code__frame[data-has-notes="true"] { grid-template-columns: 1fr 18rem; }
  }
  .blk-code__scroll { overflow-x: auto; background: var(--color-surface-raised); }
  .blk-code pre { margin: 0; padding: var(--space-4); font-size: 0.875rem; line-height: 1.65; }
  .blk-code__line { display: block; }
  .blk-code__line[data-highlight="true"] {
    background: color-mix(in oklch, var(--color-accent) 12%, transparent);
    margin-inline: calc(-1 * var(--space-4));
    padding-inline: var(--space-4);
  }
  .blk-code__notes {
    border-inline-start: 1px solid var(--color-border);
    padding: var(--space-4);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
  .blk-code__notes dt { font-family: var(--font-mono); color: var(--color-text); }
  .blk-code__notes dd { margin-inline-start: 0; margin-block: var(--space-1) var(--space-3); }
  .blk-code__lines { list-style: none; counter-reset: line; }
  .blk-code__lines > li {
    counter-increment: line;
    display: block;
  }
  .blk-code__lines > li::before {
    content: counter(line);
    display: inline-block;
    width: 2.25rem;
    margin-inline-end: var(--space-3);
    text-align: end;
    color: var(--color-text-muted);
    user-select: none;
  }
  .shiki-themes span[style] { color: var(--shiki-light); }
  [data-theme="dark"] .shiki-themes span[style] { color: var(--shiki-dark) !important; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .shiki-themes span[style] { color: var(--shiki-dark) !important; }
  }

  /* diff */
  .blk-diff { max-width: var(--measure-wide); margin-inline: auto; }
  .blk-diff__title { font-size: 1rem; margin-block-end: var(--space-3); color: var(--color-text-muted); }
  .blk-diff__frame {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: 0.8125rem;
  }
  .blk-diff__hunk-header {
    padding: var(--space-2) var(--space-4);
    background: var(--color-surface-raised);
    color: var(--color-text-muted);
  }
  .blk-diff__row { display: flex; }
  .blk-diff__ln { flex: 0 0 3rem; text-align: end; padding-inline-end: var(--space-2); color: var(--color-text-muted); user-select: none; }
  .blk-diff__code { flex: 1; white-space: pre; padding-inline-end: var(--space-4); }
  .blk-diff__row[data-op="add"] { background: color-mix(in oklch, var(--color-success) 12%, transparent); }
  .blk-diff__row[data-op="del"] { background: color-mix(in oklch, var(--color-danger) 10%, transparent); }

  /* diagram canvas (flow / sequence / timeline / architecture) */
  .blk-diagram { max-width: var(--measure-wide); margin-inline: auto; }
  .blk-diagram__title { font-size: 1rem; margin-block-end: var(--space-4); color: var(--color-text-muted); }
  .blk-diagram__canvas { width: 100%; overflow-x: auto; }
  /* max-width (not width): the SVG's intrinsic size (set via real width/
     height attributes matching its viewBox, see diagrams.ts) is the
     correct rendered scale. Forcing width:100% on a narrow-viewBox
     diagram (e.g. a single-lane flow chart) inside a wide content column
     blew text and nodes up to several times their intended size. */
  .blk-diagram__canvas svg { display: block; max-width: 100%; height: auto; }
  .blk-chart svg { display: block; max-width: 100%; height: auto; }
  .blk-diagram svg text { font-family: var(--font-sans); fill: var(--color-text); }
  .blk-diagram .diagram-muted { fill: var(--color-text-muted); }
  .blk-diagram .diagram-line { stroke: var(--color-border-strong); }
  .blk-diagram .diagram-node { fill: var(--color-surface); stroke: var(--color-border-strong); }
  .blk-diagram .diagram-node--decision { fill: var(--color-surface-raised); }
  .blk-diagram .diagram-node--terminal { fill: var(--color-text); }
  .blk-diagram .diagram-accent { stroke: var(--color-accent); fill: var(--color-accent); }
  /* Higher specificity than .blk-diagram svg text so terminal-node
     labels stay legible against the dark terminal-node fill above. */
  .blk-diagram svg text.diagram-node-label--invert { fill: var(--color-on-accent); }

  /* timeline */
  .blk-timeline__title { font-size: 1rem; margin-block-end: var(--space-4); color: var(--color-text-muted); }
  .blk-timeline__list { max-width: var(--measure-prose); border-inline-start: 1px solid var(--color-border); list-style: none; }
  .blk-timeline__item { padding-block: var(--space-3); padding-inline-start: var(--space-5); position: relative; }
  .blk-timeline__item::before {
    content: "";
    position: absolute;
    inset-inline-start: -0.28rem;
    inset-block-start: 1.35rem;
    width: 0.5rem; height: 0.5rem;
    border-radius: 50%;
    background: var(--color-border-strong);
  }
  .blk-timeline__item[data-status="current"]::before { background: var(--color-accent); }
  .blk-timeline__when { font-size: 0.8125rem; color: var(--color-text-muted); font-family: var(--font-mono); }
  .blk-timeline__label { font-weight: 600; margin-block-start: var(--space-1); }
  .blk-timeline__detail { color: var(--color-text-muted); margin-block-start: var(--space-1); }

  /* comparison */
  .blk-comparison__title { font-size: 1.125rem; margin-block-end: var(--space-4); }
  .comparison__col { border: 1px solid var(--color-border); border-radius: var(--radius-md); padding: var(--space-4); }
  .comparison__col h3 { font-size: 0.9375rem; color: var(--color-text-muted); margin-block-end: var(--space-3); }
  .comparison__col ul { display: grid; gap: var(--space-2); list-style: none; }
  .comparison__col li { padding-block-start: var(--space-2); border-block-start: 1px solid var(--color-border); }
  .comparison__col li:first-child { border-block-start: none; padding-block-start: 0; }

  /* test-summary */
  .blk-test-summary { max-width: var(--measure-wide); margin-inline: auto; }
  .test-band { display: flex; flex-wrap: wrap; gap: var(--space-6); align-items: baseline; padding-block: var(--space-2); }
  /* .test-band__stat and its tone variants are defined once, near the
     bottom of this function, using native CSS nesting. */

  /* test-matrix */
  .blk-test-matrix { max-width: var(--measure-wide); margin-inline: auto; }
  .test-matrix__scroll { overflow-x: auto; border: 1px solid var(--color-border); border-radius: var(--radius-md); }
  table.test-matrix__table { border-collapse: collapse; width: 100%; font-size: 0.875rem; }
  .test-matrix__table th, .test-matrix__table td { padding: var(--space-2) var(--space-3); border-block-end: 1px solid var(--color-border); text-align: start; white-space: nowrap; }
  .test-matrix__table th:first-child, .test-matrix__table td:first-child {
    position: sticky; inset-inline-start: 0; background: var(--color-surface); font-weight: 600;
  }
  .test-matrix__cell[data-status="pass"] { color: var(--color-success); }
  .test-matrix__cell[data-status="fail"] { color: var(--color-danger); font-weight: 600; }
  .test-matrix__cell[data-status="skip"] { color: var(--color-text-muted); }

  /* chart */
  .blk-chart { max-width: var(--measure-wide); margin-inline: auto; }
  .blk-chart__title { font-size: 1rem; margin-block-end: var(--space-4); color: var(--color-text-muted); }
  .blk-chart svg text { font-family: var(--font-sans); fill: var(--color-text-muted); font-size: 0.75rem; }
  .blk-chart .chart-bar { fill: var(--color-accent); }
  .blk-chart .chart-axis { stroke: var(--color-border); }

  /* finding / risk / decision */
  .blk-finding, .blk-risk, .blk-decision { max-width: var(--measure-prose); }
  .blk-finding__badge, .blk-risk__badge {
    font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em;
    color: var(--color-text-muted);
  }
  .blk-finding[data-severity="high"] .blk-finding__badge,
  .blk-finding[data-severity="critical"] .blk-finding__badge { color: var(--color-danger); }
  .blk-finding__title, .blk-risk__title { font-size: 1.0625rem; margin-block: var(--space-1) var(--space-2); }
  .blk-risk__grid { display: flex; gap: var(--space-6); margin-block: var(--space-2) var(--space-3); font-size: 0.875rem; }
  .blk-risk__grid dt { color: var(--color-text-muted); }
  .decision-strip {
    border-inline-start: 3px solid var(--color-accent);
    padding-inline-start: var(--space-4);
  }
  .decision-strip__status {
    font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.03em; color: var(--color-accent-strong);
  }
  .decision-strip__title { font-size: 1.125rem; margin-block: var(--space-1) var(--space-2); }

  /* actions */
  .blk-actions__title { font-size: 1.125rem; margin-block-end: var(--space-3); }
  .blk-actions__list { max-width: var(--measure-prose); display: grid; gap: var(--space-2); list-style: none; }
  .blk-actions__item {
    display: flex; justify-content: space-between; gap: var(--space-4);
    padding-block: var(--space-2); border-block-start: 1px solid var(--color-border);
  }
  .blk-actions__item:first-child { border-block-start: none; }
  .blk-actions__owner { color: var(--color-text-muted); font-size: 0.875rem; white-space: nowrap; }

  /* glossary */
  .blk-glossary__title { font-size: 1.125rem; margin-block-end: var(--space-3); }
  .blk-glossary dl { max-width: var(--measure-prose); display: grid; gap: var(--space-3); }
  .blk-glossary dt { font-weight: 600; }
  .blk-glossary dd { margin-inline-start: 0; color: var(--color-text-muted); }

  /* source-note */
  .blk-source-note { max-width: var(--measure-prose); font-size: 0.8125rem; color: var(--color-text-muted); }
  .blk-source-note ul { display: grid; gap: var(--space-1); list-style: none; }
  .blk-source-note__title { font-size: 1rem; color: var(--color-text); margin-block-end: var(--space-3); }

  /* confidence marker — shared across blocks. Native CSS nesting groups
     the base rule with its state variant instead of repeating the
     .confidence-tag selector. */
  .confidence-tag {
    font-size: 0.75rem; color: var(--color-text-muted);
    border: 1px solid var(--color-border); border-radius: var(--radius-sm);
    padding: 0.1em 0.5em; margin-inline-start: var(--space-2);

    &[data-confidence="unknown"] {
      color: var(--color-text);
      border-color: var(--color-warning);
      background: color-mix(in oklch, var(--color-warning) 18%, var(--color-surface));
    }
  }

  /* test-summary stat tones — same nesting pattern for the pass/fail states. */
  .test-band__stat {
    display: flex; flex-direction: column; gap: var(--space-1);

    & .test-band__value { font-size: 1.75rem; font-weight: 650; font-family: var(--font-mono); }
    & .test-band__label { font-size: 0.8125rem; color: var(--color-text-muted); }

    &[data-tone="fail"] .test-band__value { color: var(--color-danger); }
    &[data-tone="pass"] .test-band__value { color: var(--color-success); }
  }
  `;
}
