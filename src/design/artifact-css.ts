/**
 * Per-artifact overrides.
 *
 * Every artifact renders the same block components. What differs is
 * composition and rhythm, expressed against the `data-artifact` and
 * `data-variant` hooks the shell sets. Adding an artifact means adding CSS
 * under a new selector, never a parallel component tree.
 *
 * These rules land in `@layer overrides`, the last layer, so they must
 * explicitly reset anything `@layer layout` set inside a media query — a
 * property left alone there keeps the layout layer's value.
 */
export function artifactCss(): string {
  return `
  /* Technical report — an edited-memo treatment. A strong opening rule and
     tight display type create one leverage point without adding decoration. */
  :root[data-artifact="report"]:not([data-variant="editorial"]) .blk-cover {
    border-block-start: 3px solid var(--color-text);
    padding-block-start: var(--space-7);
  }
  :root[data-artifact="report"]:not([data-variant="editorial"]) .blk-cover__title {
    max-width: 48rem;
    letter-spacing: -0.025em;
  }
  :root[data-artifact="report"]:not([data-variant="editorial"]) .blk-summary__title {
    font-size: clamp(1.35rem, 1.1rem + 0.7vw, 1.75rem);
  }

  /* Signal Grid — tool-like navigation and a denser rhythm. Raised surfaces
     are reserved for visual evidence; ordinary prose stays on the canvas so
     the entire document does not collapse into a uniform card stack. */
  :root[data-artifact="dashboard"] {
    --shadow: 0 1px 2px oklch(0% 0 0 / 0.05), 0 4px 16px oklch(0% 0 0 / 0.08);
    --dashboard-rail: var(--color-canvas);
    --dashboard-rail-border: var(--color-border);
    --dashboard-rail-text: var(--color-text-muted);
    --dashboard-rail-text-strong: var(--color-text);
    --dashboard-rail-active: var(--color-surface);
  }
  :root[data-artifact="dashboard"] .layout {
    grid-template-columns: 224px minmax(0, 1fr);
    max-width: none;
    align-items: stretch;
  }
  :root[data-artifact="dashboard"] .layout > .side-toc {
    order: -1;
    align-self: stretch;
    position: static;
    max-height: none;
    overflow: visible;
    background: var(--dashboard-rail);
    border-inline-end: 1px solid var(--dashboard-rail-border);
    border-block-end: none;
    padding: var(--space-6) var(--space-4);
    margin-inline-start: calc(-1 * var(--space-5));
  }
  :root[data-artifact="dashboard"] .side-toc .toc {
    position: sticky;
    inset-block-start: var(--space-5);
    max-height: calc(100vh - var(--space-8));
    overflow-y: auto;
    flex-direction: column;
    flex-wrap: nowrap;
    gap: var(--space-1);
  }
  :root[data-artifact="dashboard"] .side-toc .toc a {
    color: var(--dashboard-rail-text);
    padding: 0.5em 0.75em;
    border-radius: var(--radius-sm);
  }
  :root[data-artifact="dashboard"] .side-toc .toc a:hover {
    color: var(--dashboard-rail-text-strong);
  }
  :root[data-artifact="dashboard"] .side-toc .toc a[aria-current="true"] {
    background: var(--dashboard-rail-active);
    box-shadow: var(--shadow);
  }
  :root[data-artifact="dashboard"] .layout > .doc { padding-block: var(--space-6); }
  :root[data-artifact="dashboard"] .breakout { max-width: 100%; }
  :root[data-artifact="dashboard"] .section {
    border-block-end: 1px solid var(--color-border);
    padding: var(--space-6) 0;
  }
  :root[data-artifact="dashboard"] .section:is(
    .blk-diagram,
    .blk-chart,
    .blk-test-matrix,
    .blk-comparison
  ) {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-lg);
    box-shadow: var(--shadow);
    padding: var(--space-6);
    margin-block-end: var(--space-5);
  }
  :root[data-artifact="dashboard"] :is(
    .blk-metric-group__title,
    .blk-segmented-table__title,
    .blk-breakdown__title,
    .blk-data-freshness__title
  ) {
    font-size: 1.25rem;
    line-height: 1.3;
    margin-block-end: var(--space-4);
  }

  /* Guided Path — DocPilot-informed navigation separates the guide's broad
     path on the left from the current page outline on the right. The centre
     remains a controlled procedure measure rather than becoming a portal. */
  :root[data-artifact="manual"] .layout {
    grid-template-columns: 232px minmax(0, 1fr);
    max-width: none;
    gap: var(--space-6);
  }
  :root[data-artifact="manual"] .layout > .guide-sidebar {
    order: -1;
    position: sticky;
    inset-block-start: var(--space-5);
    align-self: start;
    max-height: calc(100vh - var(--space-8));
    overflow-y: auto;
    padding-inline-end: var(--space-4);
    min-block-size: 100%;
    box-shadow: 1px 0 0 var(--color-border);
  }
  :root[data-artifact="manual"] .layout > .side-toc {
    order: 1;
    display: none;
    position: sticky;
    inset-block-start: var(--space-5);
    align-self: start;
    max-height: calc(100vh - var(--space-8));
    overflow-y: auto;
    border-block-end: none;
    padding-inline-start: var(--space-3);
  }
  :root[data-artifact="manual"] .guide-nav__label,
  :root[data-artifact="manual"] .guide-nav__group-label {
    margin: 0;
    color: var(--color-text-muted);
    font-size: 0.6875rem;
    font-weight: 600;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  :root[data-artifact="manual"] .guide-nav__label {
    color: var(--color-text);
    margin-block-end: var(--space-5);
  }
  :root[data-artifact="manual"] .guide-nav__group + .guide-nav__group {
    margin-block-start: var(--space-5);
  }
  :root[data-artifact="manual"] .guide-nav__group-label {
    margin-block-end: var(--space-2);
    padding-inline: 0.65em;
  }
  :root[data-artifact="manual"] .guide-nav a {
    display: block;
    padding: 0.4em 0.65em;
    color: var(--color-text-muted);
    text-decoration: none;
    border-radius: var(--radius-sm);
    font-size: 0.875rem;
    line-height: 1.45;
  }
  :root[data-artifact="manual"] .guide-nav a:hover {
    color: var(--color-text);
  }
  :root[data-artifact="manual"] .guide-nav a[aria-current="true"] {
    background: var(--color-surface-raised);
    color: var(--color-text);
    font-weight: 600;
  }
  :root[data-artifact="manual"] .side-toc .toc {
    flex-direction: column;
    flex-wrap: nowrap;
    gap: var(--space-1);
  }
  :root[data-artifact="manual"] .side-toc .toc a {
    border-radius: var(--radius-sm);
    padding: 0.4em 0.65em;
  }
  :root[data-artifact="manual"] .side-toc .toc a[aria-current="true"] {
    background: color-mix(in oklab, var(--color-accent) 10%, transparent);
    color: var(--color-text);
  }
  :root[data-artifact="manual"] .measure { max-width: 48rem; }

  /* A guide reads as a sequence of headed steps, so the separator belongs
     under the heading, grouping it with the content it introduces. The old
     rule sat at the *end* of each section, which put the line between a
     block and the next heading and left every heading floating unattached.
     Keeping both produced two lines a few pixels apart. */
  :root[data-artifact="manual"] .section {
    border-block-end: none;
    padding-block: var(--space-6);
  }
  :root[data-artifact="manual"] .section h2[class*="__title"] {
    padding-block-end: var(--space-2);
    border-block-end: 1px solid var(--color-border);
    margin-block-end: var(--space-4);
  }

  /* Numbered steps get a chip. The number was rendering as bare text run
     together with the title ("1저장소를 받고…"), which is both unreadable
     and the one affordance a procedure actually needs. */
  :root[data-artifact="manual"] .blk-step__title {
    display: flex;
    align-items: baseline;
    gap: var(--space-3);
  }
  :root[data-artifact="manual"] .blk-step__number {
    flex: none;
    display: inline-grid;
    place-items: center;
    inline-size: 1.75rem;
    block-size: 1.75rem;
    border-radius: 999px;
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    font-size: 0.8125rem;
    font-weight: 600;
    letter-spacing: 0;
    /* Baseline alignment on a grid box uses the box, not the digit, so the
       chip needs a nudge to sit level with the heading's first line. */
    transform: translateY(0.15em);
  }

  /* "What you will have when you finish" gets an editorial separator rather
     than another rounded callout card. */
  :root[data-artifact="manual"] .blk-task-map > .measure {
    border-block: 1px solid var(--color-border);
    padding-block: var(--space-5);
    max-width: 42rem;
  }
  /* The .section class is repeated here to outrank the generic heading-rule
     selector above. Without it the callout label kept the hairline meant for
     section headings, putting a line under a label that introduces a boxed
     list. (No backticks in these comments: the whole file is one TS template
     literal and a stray backtick silently ends it.) */
  :root[data-artifact="manual"] .section .blk-task-map__title {
    font-size: 0.75rem;
    font-weight: 600;
    letter-spacing: 0.07em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    border-block-end: none;
    padding-block-end: 0;
    margin-block-end: var(--space-3);
  }
  :root[data-artifact="manual"] .blk-task-map__outcomes {
    margin-block: 0;
    font-size: 1.0625rem;
  }
  :root[data-artifact="manual"] .blk-task-map__estimate {
    margin-block-end: 0;
    padding-block-start: var(--space-3);
    margin-block-start: var(--space-3);
    border-block-start: 1px solid var(--color-border);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  /* The success line is the reader's own verification, so it gets the one
     affirmative colour the guide uses. */
  :root[data-artifact="manual"] .blk-completion-check__expected > span:first-child::before {
    content: "";
    display: inline-block;
    inline-size: 0.45em;
    block-size: 0.8em;
    margin-inline-end: 0.5em;
    border-inline-end: 2px solid var(--color-success-text);
    border-block-end: 2px solid var(--color-success-text);
    transform: rotate(45deg) translateY(-0.15em);
  }

  /* Weight is the rail's only ranking signal, so spending it on every item
     spends it on nothing: fifteen entries at 600 all shout equally. Regular
     weight for the list, and the active item keeps the pill it already had. */
  :root[data-artifact="manual"] .side-toc .toc a { font-weight: 450; }
  :root[data-artifact="manual"] .side-toc .toc a[aria-current="true"] { font-weight: 600; }

  /* Capping the grid stops the guide hugging the left edge with a third of
     a wide viewport left empty on the right, which read as an unfinished
     page rather than a deliberate column. */
  :root[data-artifact="manual"] .layout {
    max-width: calc(232px + var(--space-6) + 66rem);
    margin-inline: auto;
  }
  /* The rail's divider stopped where its list ended, leaving a vertical line
     hanging in the middle of the page. A full-height divider on the grid
     column reads as structure; a partial one reads as a stray border. */
  :root[data-artifact="manual"] .layout > .side-toc { border-inline-end: none; }

  /* The deck sat *below* the body size, so the document opened with its
     hierarchy inverted: the sentence explaining the title was quieter than
     the paragraphs further down. */
  :root[data-artifact="manual"] .blk-narrative__subtitle {
    font-size: 1.25rem;
    line-height: 1.6;
    color: var(--color-text-muted);
    margin-block: var(--space-3) var(--space-6);
    max-width: 34rem;
  }
  /* The deck and the body copy were both set in the muted grey, so the
     opening had a size difference and no tonal one and neither read as
     leading the other. The deck stays muted because it is secondary to the
     title; the body goes to full strength because it is what gets read. */
  :root[data-artifact="manual"] .blk-narrative__summary { color: var(--color-text); }

  /* The key points were rendering as full-width rows separated by rules,
     which reads as a table that lost its header rather than a list of
     claims. Markers and a tighter block make them a list again. */
  /* Not boxed. The outcome callout below it is boxed, and two rounded
     surfaces stacked with a gap between them made neither look like the
     emphasis: the callout has to be the only box in the opening. */
  :root[data-artifact="manual"] .blk-takeaways {
    margin-block: var(--space-5) 0;
    list-style: none;
  }
  :root[data-artifact="manual"] .blk-takeaways > li {
    border: none;
    padding: 0;
    position: relative;
    padding-inline-start: var(--space-4);
  }
  :root[data-artifact="manual"] .blk-takeaways > li + li { margin-block-start: var(--space-2); }
  :root[data-artifact="manual"] .blk-takeaways > li::before {
    content: "";
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0.62em;
    inline-size: 0.375rem;
    block-size: 0.375rem;
    border-radius: 999px;
    background: var(--color-accent);
  }

  /* Section padding plus the heading rules was double separation, and it
     opened voids of nearly 200px between a section's last block and the
     next heading. The rules carry the boundary now, so the padding only has
     to keep sections from touching. */
  :root[data-artifact="manual"] .section { padding-block: var(--space-5); }
  :root[data-artifact="manual"] .blk-narrative { padding-block-start: var(--space-6); }

  /* These two rails are vertical at every width, not only above 1280px, and
     their links carry inline padding the heading has to line up with. */
  :root[data-artifact="manual"] .side-toc .toc__label,
  :root[data-artifact="dashboard"] .side-toc .toc__label {
    display: block;
    padding-inline: 0.65em;
    margin-block-end: var(--space-2);
  }
  /* Editorial report — serif display type, a high-leverage cover, and an editorial
     opening rhythm without decorative images or motion. */
  :root[data-artifact="report"][data-variant="editorial"] {
    --font-serif: Georgia, "Nanum Myeongjo", serif;
  }
  :root[data-artifact="report"][data-variant="editorial"] .doc { max-width: 52rem; }
  :root[data-artifact="report"][data-variant="editorial"] h1,
  :root[data-artifact="report"][data-variant="editorial"] h2,
  :root[data-artifact="report"][data-variant="editorial"] h3,
  :root[data-artifact="report"][data-variant="editorial"] .blk-cover__title,
  :root[data-artifact="report"][data-variant="editorial"] .blk-narrative__question {
    font-family: var(--font-serif);
    font-weight: 400;
  }
  :root[data-artifact="report"][data-variant="editorial"] .blk-cover {
    border-block-start: 5px solid var(--color-text);
  }
  :root[data-artifact="report"][data-variant="editorial"] .blk-cover__title {
    font-size: clamp(2.15rem, 1.3rem + 3.2vw, 4rem);
    letter-spacing: -0.035em;
  }
  :root[data-artifact="report"][data-variant="editorial"] .blk-narrative__question { font-size: 1.5rem; }
  :root[data-artifact="report"][data-variant="editorial"] .blk-narrative__summary p:first-of-type::first-letter {
    font-family: var(--font-serif);
    font-size: 3.4em;
    font-weight: 700;
    float: inline-start;
    line-height: 0.8;
    padding-inline-end: var(--space-2);
  }
  :root[data-artifact="report"][data-variant="editorial"] .blk-takeaways {
    font-family: var(--font-serif);
    font-size: 1.0625rem;
    border-block: 1px solid var(--color-text);
    padding-block: var(--space-4);
  }

  @media (min-width: 800px) {
    :root[data-artifact="report"][data-variant="editorial"] .blk-cover {
      display: grid;
      grid-template-columns: minmax(0, 2.4fr) minmax(12rem, 1fr);
      column-gap: var(--space-7);
      align-items: start;
    }
    :root[data-artifact="report"][data-variant="editorial"] .blk-cover__eyebrow,
    :root[data-artifact="report"][data-variant="editorial"] .blk-cover__title,
    :root[data-artifact="report"][data-variant="editorial"] .blk-cover__subtitle,
    :root[data-artifact="report"][data-variant="editorial"] .blk-cover > .confidence-tag {
      grid-column: 1;
    }
    :root[data-artifact="report"][data-variant="editorial"] .blk-cover__meta {
      grid-column: 2;
      grid-row: 2 / span 3;
      border-block-start: 1px solid var(--color-text);
      padding-block-start: var(--space-3);
      margin-block-start: var(--space-2);
    }
  }

  /* A dashboard earns its name by aligning quantitative blocks to one
     shared grid. The first five sections use the full evidence width; the
     anomaly and action list form a 7/5 split before provenance returns to
     the full span. Narrow screens fall back to normal document flow. */
  @media (min-width: 1000px) {
    :root[data-artifact="dashboard"] .doc {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--space-5);
      align-content: start;
    }
    :root[data-artifact="dashboard"] .doc > .section { grid-column: 1 / -1; }
    :root[data-artifact="dashboard"] .doc > .blk-anomaly { grid-column: 1 / span 7; }
    :root[data-artifact="dashboard"] .doc > .blk-action-plan { grid-column: 8 / -1; }
    :root[data-artifact="advanced"] .doc {
      display: grid;
      grid-template-columns: repeat(12, minmax(0, 1fr));
      column-gap: var(--space-5);
      align-content: start;
    }
    :root[data-artifact="advanced"] .doc > .section { grid-column: 1 / -1; }
    :root[data-artifact="advanced"] .doc > .blk-challenge { grid-column: 1 / span 7; }
    :root[data-artifact="advanced"] .doc > .blk-simulation { grid-column: 8 / -1; }
  }

  @media (min-width: 1280px) {
    :root[data-artifact="manual"] .layout {
      grid-template-columns: 232px minmax(0, 1fr) 200px;
      max-width: calc(232px + 200px + 66rem + var(--space-8));
    }
    :root[data-artifact="manual"] .layout > .side-toc { display: block; }
  }

  /* Decision Room needs enough horizontal room for evidence graphs,
     simulations, and option matrices to be compared without shrinking their
     labels. Prose inside those blocks still uses the reading measure. */
  :root[data-artifact="advanced"] .layout {
    max-width: min(100%, 96rem);
  }
  :root[data-artifact="advanced"] .breakout { max-width: 100%; }
  :root[data-artifact="advanced"] .blk-brief {
    border-block-start: 4px solid var(--color-accent);
    padding-block-start: var(--space-7);
  }
  :root[data-artifact="advanced"] .blk-evidence-graph {
    background: var(--color-surface);
    border-block: 1px solid var(--color-border-strong);
    padding-inline: var(--space-5);
  }
  :root[data-artifact="advanced"] .claim {
    display: grid;
    grid-template-columns: minmax(8rem, 0.3fr) minmax(0, 1fr);
    gap: var(--space-2) var(--space-5);
    border-block-end: 1px solid var(--color-border);
  }
  :root[data-artifact="advanced"] .claim__meta { grid-row: 1 / span 3; }
  :root[data-artifact="advanced"] .claim__statement,
  :root[data-artifact="advanced"] .claim__support,
  :root[data-artifact="advanced"] .claim__contradiction { grid-column: 2; }
  :root[data-artifact="advanced"] .blk-challenge {
    background: color-mix(in oklab, var(--color-danger) 7%, var(--color-canvas));
    padding-inline: var(--space-5);
  }
  :root[data-artifact="advanced"] .blk-simulation {
    background: color-mix(in oklab, var(--color-info) 7%, var(--color-canvas));
    padding-inline: var(--space-5);
  }
  :root[data-artifact="advanced"] .blk-decision-record {
    border-block: 2px solid var(--color-text);
    padding-inline: var(--space-5);
  }

  @media (max-width: 900px) {
    :root[data-artifact="dashboard"] .layout,
    :root[data-artifact="manual"] .layout {
      grid-template-columns: minmax(0, 1fr);
      gap: var(--space-4);
      padding-inline: var(--space-4);
    }
    :root[data-artifact="dashboard"] .layout > .side-toc,
    :root[data-artifact="manual"] .layout > .side-toc,
    :root[data-artifact="manual"] .layout > .guide-sidebar {
      order: -1;
      position: static;
      max-height: none;
      overflow: visible;
      border-inline-end: none;
      border-block-end: 1px solid var(--color-border);
      margin-inline-start: 0;
      padding: 0 0 var(--space-4);
    }
    :root[data-artifact="manual"] .layout > .side-toc { display: none; }
    :root[data-artifact="manual"] .guide-nav {
      display: flex;
      gap: var(--space-2);
      overflow-x: auto;
      padding-block-end: var(--space-1);
    }
    :root[data-artifact="manual"] :is(.guide-nav__label, .guide-nav__group-label) {
      display: none;
    }
    :root[data-artifact="manual"] .guide-nav__group {
      display: contents;
    }
    :root[data-artifact="manual"] .guide-nav a {
      flex: none;
      white-space: nowrap;
      background: var(--color-surface);
    }
    :root[data-artifact="advanced"] .claim {
      grid-template-columns: minmax(0, 1fr);
    }
    :root[data-artifact="advanced"] .claim__meta { grid-row: auto; }
    :root[data-artifact="advanced"] :is(
      .claim__statement,
      .claim__support,
      .claim__contradiction
    ) { grid-column: 1; }
    :root[data-artifact="dashboard"] .side-toc .toc,
    :root[data-artifact="manual"] .side-toc .toc {
      position: static;
      max-height: none;
      overflow-x: auto;
      overflow-y: visible;
      flex-direction: row;
      flex-wrap: nowrap;
    }
    :root[data-artifact="dashboard"] .side-toc .toc__label,
    :root[data-artifact="manual"] .side-toc .toc__label {
      display: none;
    }
    :root[data-artifact="dashboard"] .side-toc .toc a,
    :root[data-artifact="manual"] .side-toc .toc a {
      white-space: nowrap;
    }
  }
`;
}
