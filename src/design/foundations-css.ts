import { artifactCss } from "./artifact-css.js";
import { blockCss } from "./block-css.js";
import {
  vscodeDark,
  vscodeLight,
  spacing,
  radius,
  breakpoint,
  motion,
  measure,
  type FormaColorPalette,
} from "./tokens.js";

function colorTokens(palette: FormaColorPalette): string {
  return `
    --color-canvas: ${palette.canvas};
    --color-surface: ${palette.surface};
    --color-surface-raised: ${palette.surfaceRaised};
    --color-text: ${palette.text};
    --color-text-muted: ${palette.textMuted};
    --color-border: ${palette.border};
    --color-border-strong: ${palette.borderStrong};
    --color-accent: ${palette.accent};
    --color-accent-strong: ${palette.accentStrong};
    --color-on-accent: ${palette.onAccent};
    --color-success: ${palette.success};
    --color-warning: ${palette.warning};
    --color-danger: ${palette.danger};
    --color-info: ${palette.info};
    --color-success-text: ${palette.successText};
    --color-warning-text: ${palette.warningText};
    --color-danger-text: ${palette.dangerText};
    --color-info-text: ${palette.infoText};
    --color-chart-1: ${palette.chartBlue};
    --color-chart-2: ${palette.chartCyan};
    --color-chart-3: ${palette.chartYellow};
    --color-chart-4: ${palette.chartPurple};
    --color-chart-5: ${palette.chartOrange};
    --color-chart-6: ${palette.chartGreen};`;
}

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
${colorTokens(vscodeLight)}

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
${colorTokens(vscodeDark)}
    color-scheme: dark;
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) {
${colorTokens(vscodeDark)}
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
  /* Korean allows a line break between any two characters by default, so
     "백그라운드" was being split as "백그라운 / 드" in headings and body
     alike. keep-all restricts breaks to spaces, which is how Korean is
     actually set; break-word is the escape hatch for a long unbroken
     token (a URL, an identifier) that would otherwise overflow. */
  html {
    word-break: keep-all;
    overflow-wrap: break-word;
  }
  /* Code is the exception: it has no word boundaries to respect and is
     already handled by its own horizontal scroll. */
  pre, code, kbd, samp {
    word-break: normal;
  }
  h1, h2, h3, h4 {
    font-weight: 700;
    text-wrap: balance;
    line-height: 1.2;
  }
  /* Display sizes need negative tracking. At 44px the default spacing that
     is correct for body text reads as gappy, and the heading stops looking
     set and starts looking typed. The correction scales with size, so it is
     applied per level rather than once on the group. */
  h1 { letter-spacing: -0.032em; line-height: 1.08; }
  h2 { letter-spacing: -0.018em; }
  h3 { letter-spacing: -0.01em; }
  p { text-wrap: pretty; }

  /* Prose wants more leading than the 1.6 the whole document inherits;
     tables, labels, and metric rows want less. Scoping the increase to the
     reading measure gives long text air without stretching dense blocks. */
  .measure p, .measure li { line-height: 1.72; }

  /* Default discs sit large and dark enough to compete with the text they
     introduce. A smaller muted marker still separates items without
     drawing the eye first. */
  .measure ul > li::marker {
    color: var(--color-text-muted);
    font-size: 0.8em;
  }
  code, pre, kbd, samp { font-family: var(--font-mono); }
  a { color: var(--color-accent); }
  a:focus-visible, button:focus-visible, summary:focus-visible, [tabindex]:focus-visible {
    outline: 2px solid var(--color-accent);
    outline-offset: 2px;
  }
  ::selection { background: color-mix(in oklab, var(--color-accent) 25%, transparent); }

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
  .doc[data-measure="narrow"] { --measure-prose: 36rem; }
  .doc[data-measure="wide"] { --measure-prose: 48rem; }
  .doc[data-type-scale="compact"] :is(h1, h2, h3, h4) { zoom: 0.92; }
  .doc[data-type-scale="generous"] :is(h1, h2, h3, h4) { zoom: 1.08; }
  .doc[data-density="compact"] .section { padding-block: var(--space-5); }
  .doc[data-density="comfortable"] .section { padding-block: var(--space-7); }

  /* A document bar rather than a bare button floating in the corner.
     The old header was a single unlabelled control against the page
     background, which read as an unstyled artifact: nothing said what the
     document was, and the control had no surface to belong to.

     It also keeps the confidentiality label visible while scrolling. That
     label matters most on exactly the internal material Forma is for, and
     in the footer it was only visible to someone who reached the end.

     The theme toggle ships with [hidden] and is revealed by the init
     script, so the bar reserves its row up front. Before that it grew from
     0 to the button's height after paint and shoved the whole document
     down, which was the only measured layout shift on the page. */
  .doc-bar {
    position: sticky;
    inset-block-start: 0;
    z-index: 15;
    background: color-mix(in oklab, var(--color-canvas) 88%, transparent);
    backdrop-filter: saturate(1.4) blur(8px);
    border-block-end: 1px solid var(--color-border);
  }
  .doc-bar__inner {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding: var(--space-3) var(--space-5);
    min-block-size: 3rem;
  }
  .doc-bar__identity {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin: 0;
    min-width: 0;
  }
  .doc-bar__mark {
    inline-size: 0.9rem;
    block-size: 0.9rem;
    border-radius: 3px;
    background: var(--color-accent);
    flex: none;
  }
  .doc-bar__brand {
    font-size: 0.875rem;
    font-weight: 700;
    letter-spacing: -0.015em;
  }
  .doc-bar__direction {
    font-family: var(--font-mono);
    font-size: 0.6875rem;
    color: var(--color-accent-strong);
    border-inline-start: 1px solid var(--color-border);
    padding-inline-start: var(--space-2);
    white-space: nowrap;
  }
  .doc-bar__title {
    font-size: 0.875rem;
    font-weight: 450;
    color: var(--color-text-muted);
    letter-spacing: -0.01em;
    /* One line. A long title must not push the bar into two rows and move
       the document under it. */
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .doc-bar__actions {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    flex: none;
  }
  .doc-bar__tag {
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: 999px;
    padding: 0.25em 0.6em;
    white-space: nowrap;
  }
  @media (max-width: ${breakpoint.mobile}) {
    .doc-bar__inner { padding-inline: var(--space-4); }
    .doc-bar__tag, .doc-bar__direction, .doc-bar__title { display: none; }
  }

  main { display: block; }

  .section {
    padding-block: var(--space-7);
    border-block-end: 1px solid var(--color-border);
    /* Establishes the containment context the @container queries below
       (comparison two-column grid, code note rail) actually measure against. */
    container-type: inline-size;
  }
  .section:last-of-type { border-block-end: none; }

  /* Width constraints only — never centering. Coupling "cap the width" to
     "center the result" meant the few blocks that cap (narrative, finding,
     source-note) started 100-240px further right than every block around
     them, reading as a random centered fragment. All content shares one
     left baseline; only long prose ends earlier on the right. */
  .measure {
    max-width: var(--measure-prose);
    margin-inline: 0;
  }
  .breakout {
    max-width: min(100%, 58rem);
    margin-inline: 0;
  }

  .toc {
    display: flex;
    flex-wrap: nowrap;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-4);
    font-size: 0.875rem;
    overflow-x: auto;
    scrollbar-width: thin;
    min-width: 0;
    max-width: 100%;
  }
  .toc a {
    color: var(--color-text-muted);
    text-decoration: none;
    /* Active state changes color, not glyph width. Changing font weight only
       after IntersectionObserver runs can rewrap the mobile TOC and shift the
       entire document after first paint. Nav is orientation, not content, so
       it sits at body weight and never competes with section headings. */
    font-weight: 400;
    white-space: nowrap;
  }
  /* Report blocks contribute their claim sentence, which is the honest
     label but can run three lines in a narrow rail. Clamping keeps the
     text intact for assistive tech while the rail stays scannable. */
  @supports (-webkit-line-clamp: 2) {
    :root[data-artifact="report"] .side-toc .toc a {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
  /* Hidden by default: the narrow-screen TOC is a single horizontally
     scrolling row with no room for a heading. The vertical rails opt in. */
  .toc__label {
    display: none;
    margin: 0;
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .toc a:hover { color: var(--color-accent); }
  .toc a[aria-current="true"] {
    color: var(--color-accent);
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
    min-width: 0;
    max-width: 100%;
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
      overflow-x: visible;
    }
    .side-toc .toc a {
      white-space: normal;
    }
    /* The rail is vertical from here up, so it has room for its heading. */
    .side-toc .toc__label { display: block; margin-block-end: var(--space-2); }
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
${blockCss()}
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

  /* Icon-only affordance in the doc bar: it shows the state you can switch
     TO (moon while light, sun while dark), so one glyph carries both the
     current theme and the action. Square and quiet — it must not read as a
     primary action next to the document title. */
  .theme-toggle {
    display: grid;
    place-items: center;
    inline-size: 2rem;
    block-size: 2rem;
    padding: 0;
    background: var(--color-surface);
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .theme-toggle:hover {
    border-color: var(--color-border-strong);
    color: var(--color-text);
  }
  .theme-toggle svg {
    inline-size: 1rem;
    block-size: 1rem;
  }
  /* Light is the default rendering, so the moon (switch to dark) shows. */
  .theme-toggle__icon--moon { display: block; }
  .theme-toggle__icon--sun { display: none; }
  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]) .theme-toggle__icon--sun { display: block; }
    :root:not([data-theme="light"]) .theme-toggle__icon--moon { display: none; }
  }
  :root[data-theme="dark"] .theme-toggle__icon--sun { display: block; }
  :root[data-theme="dark"] .theme-toggle__icon--moon { display: none; }
  :root[data-theme="light"] .theme-toggle__icon--sun { display: none; }
  :root[data-theme="light"] .theme-toggle__icon--moon { display: block; }

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

${artifactCss()}
}
`;
}
