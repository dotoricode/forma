/**
 * Block component styles.
 *
 * One section per block type, in the same order the registry lists them.
 * These are artifact-independent: an artifact changes composition and
 * rhythm in `artifact-css.ts`, not the internals of a block.
 */

export function blockCss(): string {
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
  .blk-key-points > ol { max-width: var(--measure-prose); counter-reset: kp; list-style: none; }
  .blk-key-points > ol > li {
    counter-increment: kp;
    display: grid;
    grid-template-columns: 2rem 1fr;
    gap: var(--space-3);
    padding-block: var(--space-2);
  }
  .blk-key-points > ol > li::before {
    content: counter(kp, decimal-leading-zero);
    color: var(--color-text-muted);
    font-family: var(--font-mono);
    font-size: 0.8125rem;
    padding-block-start: 0.15em;
  }

  /* annotated-code */
  .blk-code { max-width: 100%; }
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
    background: color-mix(in oklab, var(--color-accent) 12%, transparent);
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
  .blk-diff { max-width: 100%; }
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
  .blk-diff__row[data-op="add"] { background: color-mix(in oklab, var(--color-success) 12%, transparent); }
  .blk-diff__row[data-op="del"] { background: color-mix(in oklab, var(--color-danger) 10%, transparent); }

  /* diagram canvas (flow / sequence / timeline / architecture) */
  .blk-diagram { max-width: 100%; }
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
  .blk-test-summary { max-width: 100%; }
  .test-band { display: flex; flex-wrap: wrap; gap: var(--space-6); align-items: baseline; padding-block: var(--space-2); }
  /* .test-band__stat and its tone variants are defined once, near the
     bottom of this function, using native CSS nesting. */

  /* test-matrix */
  .blk-test-matrix { max-width: 100%; }
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
  .blk-chart { max-width: 100%; }
  .blk-chart__title { font-size: 1rem; margin-block-end: var(--space-2); }
  .blk-chart__reading {
    max-width: 48rem;
    margin-block-end: var(--space-4);
    color: var(--color-text-muted);
  }
  .blk-chart svg text { font-family: var(--font-sans); fill: var(--color-text-muted); font-size: 0.75rem; }
  .blk-chart .chart-axis { stroke: var(--color-border-strong); }
  .blk-chart .chart-grid { stroke: var(--color-border); stroke-width: 1; }
  .blk-chart .chart-line {
    fill: none;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .blk-chart :is(.chart-line, .chart-point)[data-series="0"] { stroke: var(--color-chart-1); }
  .blk-chart :is(.chart-line, .chart-point)[data-series="1"] { stroke: var(--color-chart-2); }
  .blk-chart :is(.chart-line, .chart-point)[data-series="2"] { stroke: var(--color-chart-3); }
  .blk-chart :is(.chart-line, .chart-point)[data-series="3"] { stroke: var(--color-chart-4); }
  .blk-chart :is(.chart-line, .chart-point)[data-series="4"] { stroke: var(--color-chart-5); }
  .blk-chart :is(.chart-line, .chart-point)[data-series="5"] { stroke: var(--color-chart-6); }
  .blk-chart .chart-point[data-series="0"] { fill: var(--color-chart-1); }
  .blk-chart .chart-point[data-series="1"] { fill: var(--color-chart-2); }
  .blk-chart .chart-point[data-series="2"] { fill: var(--color-chart-3); }
  .blk-chart .chart-point[data-series="3"] { fill: var(--color-chart-4); }
  .blk-chart .chart-point[data-series="4"] { fill: var(--color-chart-5); }
  .blk-chart .chart-point[data-series="5"] { fill: var(--color-chart-6); }
  .blk-chart .chart-bar[data-series="0"] { fill: var(--color-chart-1); }
  .blk-chart .chart-bar[data-series="1"] { fill: var(--color-chart-2); }
  .blk-chart .chart-bar[data-series="2"] { fill: var(--color-chart-3); }
  .blk-chart .chart-bar[data-series="3"] { fill: var(--color-chart-4); }
  .blk-chart .chart-bar[data-series="4"] { fill: var(--color-chart-5); }
  .blk-chart .chart-bar[data-series="5"] { fill: var(--color-chart-6); }
  .blk-chart__legend {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    list-style: none;
    margin-block-start: var(--space-3);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
  .blk-chart__legend li { display: inline-flex; align-items: center; gap: var(--space-2); }
  .blk-chart__swatch { inline-size: 0.75rem; block-size: 0.25rem; border-radius: 999px; }
  .blk-chart__swatch[data-series="0"] { background: var(--color-chart-1); }
  .blk-chart__swatch[data-series="1"] { background: var(--color-chart-2); }
  .blk-chart__swatch[data-series="2"] { background: var(--color-chart-3); }
  .blk-chart__swatch[data-series="3"] { background: var(--color-chart-4); }
  .blk-chart__swatch[data-series="4"] { background: var(--color-chart-5); }
  .blk-chart__swatch[data-series="5"] { background: var(--color-chart-6); }

  /* finding / risk / decision */
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
    padding-block: var(--space-2);
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
  .blk-source-note { font-size: 0.8125rem; color: var(--color-text-muted); }
  .blk-source-note:not(:first-child) { margin-block-start: var(--space-5); }
  .blk-source-note ul { display: grid; gap: var(--space-1); list-style: none; }
  .blk-source-note li { display: grid; gap: 0.15rem; }
  .blk-source-note__link {
    color: var(--color-accent);
    text-decoration-line: underline;
    text-decoration-thickness: 0.08em;
    text-underline-offset: 0.18em;
  }
  .blk-source-note__locator {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    overflow-wrap: anywhere;
    white-space: normal;
  }
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
      background: color-mix(in oklab, var(--color-warning) 18%, var(--color-surface));
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

  /* ---- report vocabulary ------------------------------------------- */

  /* The thesis is the one sentence a reader must not miss. It gets size and
     a rule above it, not a card: a box would make it one item among many. */
  .blk-thesis__statement {
    font-size: clamp(1.25rem, 1.05rem + 0.9vw, 1.75rem);
    line-height: 1.35;
    font-weight: 600;
    text-wrap: balance;
    border-block-start: 2px solid var(--color-text);
    padding-block-start: var(--space-5);
  }
  .blk-thesis__qualifier {
    margin-block-start: var(--space-3);
    color: var(--color-text-muted);
  }

  .blk-exec-summary__figures {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-5) var(--space-7);
  }
  .blk-exec-summary__figure {
    /* One flex item per label/value pair, so a pair never splits across
       two rows. */
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
    margin-block-start: var(--space-5);
    padding-block-start: var(--space-4);
    border-block-start: 1px solid var(--color-border);
  }
  .blk-exec-summary__figures dt {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }
  .blk-exec-summary__figures dd {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    /* Figures are compared down a column by eye; proportional digits make
       the same value look different widths from row to row. */
    font-variant-numeric: tabular-nums;
  }

  .blk-headline-finding__claim {
    font-size: 1.25rem;
    line-height: 1.4;
    text-wrap: balance;
  }
  .blk-headline-finding__meta:empty { display: none; }
  .blk-headline-finding [data-severity="high"] .blk-headline-finding__claim,
  .blk-headline-finding [data-severity="critical"] .blk-headline-finding__claim {
    color: var(--color-danger-text);
  }

  .blk-evidence-stack__list {
    list-style: none;
    padding: 0;
    margin-block-start: var(--space-4);
    display: grid;
    gap: var(--space-4);
  }
  .blk-evidence-stack__item {
    padding-inline-start: var(--space-4);
    border-inline-start: 1px solid var(--color-border-strong);
  }
  .blk-evidence-stack__item[data-confidence="inferred"] { border-inline-start-style: dashed; }
  .blk-evidence-stack__item[data-confidence="unknown"] { border-inline-start-style: dotted; }
  .blk-evidence-stack__detail,
  .blk-evidence-stack__source {
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .blk-option-comparison__scroll,
  .blk-risk-register__scroll,
  .blk-decision-matrix__scroll,
  .blk-source-ledger__scroll {
    overflow-x: auto;
  }
  .blk-option-comparison__table,
  .blk-risk-register__table,
  .blk-decision-matrix__table,
  .blk-source-ledger__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
  }
  .blk-option-comparison__table th,
  .blk-option-comparison__table td,
  .blk-risk-register__table th,
  .blk-risk-register__table td,
  .blk-decision-matrix__table th,
  .blk-decision-matrix__table td,
  .blk-source-ledger__table th,
  .blk-source-ledger__table td {
    text-align: start;
    vertical-align: top;
    padding: var(--space-3);
    border-block-end: 1px solid var(--color-border);
  }
  .blk-option-comparison__table thead th,
  .blk-risk-register__table thead th,
  .blk-decision-matrix__table thead th,
  .blk-source-ledger__table thead th {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    border-block-end-color: var(--color-border-strong);
  }
  .blk-option-comparison__table [data-recommended="true"] {
    background: color-mix(in oklab, var(--color-accent) 6%, var(--color-surface));
  }
  .blk-option-comparison__flag,
  .blk-action-plan__flag {
    display: inline-block;
    margin-inline-start: var(--space-2);
    font-size: 0.75rem;
    color: var(--color-accent-strong);
  }

  .blk-decision-matrix__weight,
  .blk-decision-matrix__score,
  .blk-decision-matrix__total {
    font-variant-numeric: tabular-nums;
  }
  .blk-decision-matrix__total { font-weight: 600; }
  .blk-decision-matrix__total[data-best="true"] { color: var(--color-accent-strong); }
  .blk-decision-matrix__override {
    margin-block-start: var(--space-3);
    font-size: 0.875rem;
    color: var(--color-warning-text);
  }

  .blk-recommendation__label {
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-accent-strong);
  }
  .blk-recommendation__statement {
    font-size: 1.25rem;
    line-height: 1.4;
    margin-block: var(--space-2) var(--space-4);
    text-wrap: balance;
  }
  .blk-recommendation__conditions-label {
    margin-block-start: var(--space-5);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .blk-implication__list dt {
    font-weight: 600;
    margin-block-start: var(--space-4);
  }
  .blk-implication__list dd { margin: 0; }

  .blk-risk-register__table tr[data-impact="high"] th[scope="row"] {
    color: var(--color-danger-text);
  }

  .blk-action-plan__list {
    list-style: none;
    padding: 0;
    counter-reset: forma-action;
  }
  .blk-action-plan__item {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-4);
    align-items: baseline;
    padding-block: var(--space-3);
    border-block-end: 1px solid var(--color-border);
  }
  .blk-action-plan__label { flex: 1 1 20rem; }
  .blk-action-plan__owner {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .blk-action-plan__item[data-blocking="true"] .blk-action-plan__label { font-weight: 600; }

  .blk-pull-quote__quote {
    margin: 0;
    padding-inline-start: var(--space-5);
    border-inline-start: 1px solid var(--color-border-strong);
  }
  .blk-pull-quote__quote p {
    font-size: 1.25rem;
    line-height: 1.5;
    text-wrap: pretty;
  }
  .blk-pull-quote__quote cite {
    display: block;
    margin-block-start: var(--space-3);
    font-style: normal;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .blk-figure__frame {
    margin: 0;
    padding: var(--space-4);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
  }
  .blk-figure__caption { font-weight: 600; }
  .blk-figure__reading {
    margin-block-start: var(--space-2);
    color: var(--color-text-muted);
  }

  .blk-appendix__title { font-size: 1rem; color: var(--color-text-muted); }

  /* ---- manual vocabulary ------------------------------------------- */

  .blk-task-map__outcomes { padding-inline-start: var(--space-5); }
  .blk-task-map__estimate {
    margin-block-start: var(--space-4);
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .blk-audience-scope__grid {
    display: grid;
    gap: var(--space-5) var(--space-7);
    grid-template-columns: repeat(auto-fit, minmax(16rem, 1fr));
  }
  .blk-audience-scope__grid h3 {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin-block-end: var(--space-2);
  }

  .blk-prerequisite__list { list-style: none; padding: 0; }
  .blk-prerequisite__item {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2) var(--space-3);
    padding-block: var(--space-3);
    border-block-end: 1px solid var(--color-border);
  }
  .blk-prerequisite__item[data-required="false"] .blk-prerequisite__label {
    color: var(--color-text-muted);
  }
  .blk-prerequisite__optional {
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
  .blk-prerequisite__check {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .blk-env-selector__control {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }
  .blk-env-selector__label {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    margin-inline-end: var(--space-2);
  }
  .blk-env-selector__option {
    font: inherit;
    font-size: 0.875rem;
    padding: 0.3em 0.8em;
    background: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    cursor: pointer;
  }
  .blk-env-selector__option[aria-pressed="true"] {
    background: var(--color-accent);
    color: var(--color-on-accent);
    border-color: var(--color-accent);
  }
  .blk-env-selector__fallback {
    margin-block-start: var(--space-3);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .blk-quick-path__list {
    padding-inline-start: var(--space-5);
    font-size: 0.9375rem;
  }

  /* The step number is the anchor the eye returns to after looking away at
     a terminal, so it sits outside the text column rather than inline. */
  .blk-step__title {
    position: relative;
    font-size: 1.125rem;
    padding-inline-start: var(--space-7);
  }
  .blk-step__number {
    position: absolute;
    inset-inline-start: 0;
    inset-block-start: 0;
    min-width: var(--space-6);
    font-variant-numeric: tabular-nums;
    color: var(--color-text-muted);
  }
  .blk-step__instruction, .blk-step__substeps,
  .blk-step__command, .blk-step__expected,
  .blk-step__verify, .blk-step__failure {
    margin-inline-start: var(--space-7);
  }
  .blk-step__command { margin-block: var(--space-4); }
  .blk-step__command-meta {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    margin-block-end: var(--space-1);
  }
  .blk-step__command-meta:empty { display: none; }
  .blk-step__command-shell {
    margin: 0;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    font-size: 0.875rem;
  }
  .blk-step__expected, .blk-step__verify {
    margin-block-start: var(--space-3);
    padding-inline-start: var(--space-4);
    border-inline-start: 1px solid var(--color-border-strong);
  }
  .blk-step__expected-label, .blk-step__verify-label,
  .blk-step__failure-label, .blk-checkpoint__fallback-label {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .blk-step__failure-label { margin-inline-end: var(--space-2); }
  .blk-step__failure { margin-block-start: var(--space-3); font-size: 0.9375rem; }

  .blk-checkpoint__title { font-size: 1rem; }
  .blk-checkpoint__list { padding-inline-start: var(--space-5); }
  .blk-checkpoint__fallback { margin-block-start: var(--space-3); font-size: 0.9375rem; }

  .blk-decision-tree__question { font-size: 1.0625rem; }
  .blk-decision-tree__branches dt {
    font-weight: 600;
    margin-block-start: var(--space-4);
  }
  .blk-decision-tree__branches dd { margin: 0; }

  .blk-troubleshooting__entry {
    border-block-end: 1px solid var(--color-border);
    padding-block: var(--space-3);
  }
  .blk-troubleshooting__entry summary {
    cursor: pointer;
    font-weight: 600;
  }
  .blk-troubleshooting__cause, .blk-troubleshooting__fix {
    margin-block-start: var(--space-2);
    font-size: 0.9375rem;
  }
  .blk-troubleshooting__cause span, .blk-troubleshooting__fix span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
    margin-inline-end: var(--space-2);
  }

  .blk-compat-matrix__scroll { overflow-x: auto; }
  .blk-compat-matrix__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }
  .blk-compat-matrix__table th,
  .blk-compat-matrix__table td {
    text-align: start;
    padding: var(--space-2) var(--space-3);
    border-block-end: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .blk-compat-matrix__table td[data-status="supported"] { color: var(--color-success-text); }
  .blk-compat-matrix__table td[data-status="unsupported"] { color: var(--color-danger-text); }
  .blk-compat-matrix__table td[data-status="partial"] { color: var(--color-warning-text); }
  .blk-compat-matrix__table td[data-status="untested"] { color: var(--color-text-muted); }

  .blk-version-note__range {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .blk-version-note__note {
    padding-block-start: var(--space-3);
    border-block-start: 1px solid var(--color-border);
  }

  .blk-completion-check__check {
    margin: var(--space-3) 0;
    padding: var(--space-3) var(--space-4);
    background: var(--color-surface-raised);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    font-size: 0.875rem;
  }
  .blk-completion-check__expected span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
    margin-inline-end: var(--space-2);
  }

  .blk-next-task__list { list-style: none; padding: 0; }
  .blk-next-task__list li {
    padding-block: var(--space-3);
    border-block-end: 1px solid var(--color-border);
  }
  .blk-next-task__why {
    display: block;
    font-size: 0.875rem;
    color: var(--color-text-muted);
  }

  .blk-narrative__title {
    font-size: clamp(1.75rem, 1.3rem + 1.8vw, 2.75rem);
    line-height: 1.15;
    margin-block-end: var(--space-3);
  }
  .blk-narrative__subtitle {
    font-size: 1.0625rem;
    color: var(--color-text-muted);
    margin-block-end: var(--space-6);
  }

  /* ---- dashboard vocabulary ---------------------------------------- */

  .status-header {
    padding-block: var(--space-5);
  }
  .status-header__state {
    font-size: 0.75rem;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .status-header[data-status="normal"] .status-header__state { color: var(--color-success-text); }
  .status-header[data-status="critical"] .status-header__state { color: var(--color-danger-text); }
  .status-header[data-status="warning"] .status-header__state { color: var(--color-warning-text); }
  .status-header__headline {
    font-size: clamp(1.375rem, 1.1rem + 1.1vw, 2rem);
    line-height: 1.25;
    margin-block: var(--space-2) 0;
  }
  .status-header__detail {
    margin-block-start: var(--space-3);
    color: var(--color-text-muted);
  }

  .metric-grid {
    display: grid;
    gap: var(--space-6);
    grid-template-columns: repeat(auto-fit, minmax(15rem, 1fr));
    /* Cells stretch so the sparklines share one baseline. Left to their
       natural height they stepped down the row, following whichever metric
       happened to carry a comparison line. */
    align-items: stretch;
  }
  .metric-grid__cell {
    display: flex;
    flex-direction: column;
  }
  .metric__label {
    font-size: 0.875rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }
  .metric__value {
    /* The number leads. Its size is what makes the grid scannable before
       any label is read. */
    font-size: 2.125rem;
    line-height: 1.1;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
    margin-block: var(--space-1) 0;
  }
  .metric__unit {
    font-size: 0.5em;
    font-weight: 400;
    color: var(--color-text-muted);
    margin-inline-start: 0.15em;
  }
  .metric__delta {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-1) var(--space-2);
    margin-block-start: var(--space-2);
    font-size: 0.875rem;
    font-variant-numeric: tabular-nums;
  }
  /* Colour follows sentiment, not direction. Cost up and pass rate up are
     both "up" and mean opposite things. */
  .metric__delta[data-sentiment="positive"] { color: var(--color-success-text); }
  .metric__delta[data-sentiment="negative"] { color: var(--color-danger-text); }
  .metric__delta[data-sentiment="neutral"] { color: var(--color-text-muted); }
  .metric__delta-basis { color: var(--color-text-muted); font-size: 0.8125rem; }
  .metric__period {
    margin-block-start: var(--space-2);
    font-size: 0.8125rem;
    line-height: 1.5;
    color: var(--color-text-muted);
  }
  .metric__spark { margin-block-start: auto; padding-block-start: var(--space-3); }
  .metric__spark svg { display: block; width: 100%; height: auto; }
  .spark-line { stroke: var(--color-accent); stroke-width: 1.5; }
  .spark-point, .spark-last { fill: var(--color-accent); }
  .spark-baseline {
    stroke: var(--color-border-strong);
    stroke-width: 1;
    stroke-dasharray: 3 3;
  }

  .anomaly { padding-block: var(--space-2); }
  .anomaly__meta {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    font-variant-numeric: tabular-nums;
  }
  .anomaly[data-severity="high"] .anomaly__meta { color: var(--color-danger-text); }
  .anomaly[data-severity="medium"] .anomaly__meta { color: var(--color-warning-text); }
  .anomaly__what { font-size: 1.125rem; margin-block: var(--space-1) var(--space-2); }
  .anomaly__suspected { font-size: 0.9375rem; }
  .anomaly__suspected span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
    margin-inline-end: var(--space-2);
  }

  .blk-breakdown__reading {
    max-width: 48rem;
    margin-block-end: var(--space-4);
    line-height: 1.65;
  }
  .blk-breakdown__canvas svg { display: block; max-width: 100%; height: auto; }
  .breakdown-label, .breakdown-value {
    font-family: var(--font-sans);
    font-size: 12px;
    fill: var(--color-text-muted);
  }
  .breakdown-value { font-variant-numeric: tabular-nums; }
  .breakdown-bar[data-sign="positive"] { fill: var(--color-accent); }
  .breakdown-bar[data-sign="negative"] { fill: var(--color-danger); }
  /* The SVG is presentational; the same numbers exist as a list for
     assistive tech and for print, where the chart may be dropped. */
  .blk-breakdown__values {
    list-style: none;
    padding: 0;
    margin-block-start: var(--space-4);
    display: grid;
    gap: var(--space-2);
    max-width: 48rem;
  }
  .blk-breakdown__values li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-4);
    font-size: 0.9375rem;
    padding-block-end: var(--space-2);
    border-block-end: 1px solid var(--color-border);
  }
  .blk-breakdown__value { font-variant-numeric: tabular-nums; }

  .blk-segmented-table__scroll { overflow-x: auto; }
  .blk-segmented-table__table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9375rem;
    font-variant-numeric: tabular-nums;
  }
  .blk-segmented-table__table th,
  .blk-segmented-table__table td {
    text-align: start;
    padding: var(--space-2) var(--space-3);
    border-block-end: 1px solid var(--color-border);
    white-space: nowrap;
  }
  .blk-segmented-table__table thead th {
    font-size: 0.8125rem;
    color: var(--color-text-muted);
    border-block-end-color: var(--color-border-strong);
  }
  .blk-segmented-table__table tr[data-status="critical"] th[scope="row"] {
    color: var(--color-danger-text);
  }
  .blk-segmented-table__table tr[data-status="warning"] th[scope="row"] {
    color: var(--color-warning-text);
  }
  .cell-missing { color: var(--color-text-muted); font-style: normal; }

  @media (max-width: 600px) {
    .blk-breakdown__canvas { display: none; }
  }

  .blk-data-freshness__grid {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4) var(--space-7);
  }
  .blk-data-freshness__grid > div { display: flex; flex-direction: column; gap: var(--space-1); }
  .blk-data-freshness__grid dt { font-size: 0.75rem; color: var(--color-text-muted); }
  .blk-data-freshness__grid dd { margin: 0; font-variant-numeric: tabular-nums; }
  .blk-data-freshness__delayed {
    margin-block-start: var(--space-4);
    color: var(--color-warning-text);
    font-size: 0.9375rem;
  }
  .blk-data-freshness__gaps-label {
    margin-block-start: var(--space-4);
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
    color: var(--color-text-muted);
  }
  .blk-data-freshness__gaps { padding-inline-start: var(--space-5); font-size: 0.9375rem; }

  /* ---- Decision Room ------------------------------------------------ */

  .blk-brief__question {
    font-size: clamp(1.5rem, 1.2rem + 1.3vw, 2.25rem);
    line-height: 1.2;
  }
  .blk-brief__summary { margin-block: var(--space-4) var(--space-6); }
  .blk-brief__heading {
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-block-start: var(--space-5);
  }
  .blk-brief__list { padding-inline-start: var(--space-5); }
  .blk-brief__list[data-tone="unknown"] { color: var(--color-text-muted); }

  .blk-evidence-graph__legend {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-block-end: var(--space-5);
  }
  .blk-evidence-graph__claims {
    list-style: none;
    padding: 0;
    display: grid;
    gap: var(--space-4);
  }
  .claim { padding-block: var(--space-2); }
  .claim[data-impact="high"] .claim__statement { font-weight: 700; }
  .claim[data-confidence="unknown"] .claim__meta { color: var(--color-warning-text); }
  .claim__meta {
    font-size: 0.75rem;
    letter-spacing: 0.03em;
    text-transform: uppercase;
    color: var(--color-text-muted);
  }
  .claim__statement { font-size: 1.0625rem; margin-block: var(--space-1) var(--space-2); }
  .claim__support, .claim__contradiction { font-size: 0.875rem; color: var(--color-text-muted); }
  .claim__support[data-empty="true"] { color: var(--color-warning-text); }
  .claim__contradiction span, .claim__support span {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .blk-challenge__counter {
    margin: var(--space-4) 0;
    color: var(--color-danger-text);
    font-size: 1.125rem;
    line-height: 1.5;
  }
  .blk-challenge__heading {
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-block-start: var(--space-5);
  }
  .blk-challenge__list { padding-inline-start: var(--space-5); }

  .blk-simulation__panel {
    margin-block-start: var(--space-4);
    padding: var(--space-5);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
  }
  .blk-simulation__inputs { display: grid; gap: var(--space-4); }
  .sim-input {
    display: grid;
    grid-template-columns: 1fr auto;
    gap: var(--space-2) var(--space-4);
    align-items: center;
  }
  .sim-input__label { font-size: 0.875rem; }
  .sim-input__unit { color: var(--color-text-muted); margin-inline-start: var(--space-1); }
  .sim-input input[type="range"] { grid-column: 1 / -1; width: 100%; accent-color: var(--color-accent); }
  .sim-input__value {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .blk-simulation__outputs {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4) var(--space-7);
    margin-block-start: var(--space-5);
    padding-block-start: var(--space-4);
    border-block-start: 1px solid var(--color-border);
  }
  .blk-simulation__outputs dt { font-size: 0.75rem; color: var(--color-text-muted); }
  .blk-simulation__outputs dd {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
  .blk-simulation__fallback {
    margin-block-start: var(--space-4);
    font-size: 0.8125rem;
    color: var(--color-text-muted);
  }

  .decision-record { padding-block: var(--space-3); }
  .decision-record__status {
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--color-accent-strong);
  }
  .decision-record__decision {
    font-size: 1.375rem;
    line-height: 1.3;
    margin-block: var(--space-2) var(--space-4);
  }
  .decision-record__meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-6);
    margin-block-start: var(--space-4);
  }
  .decision-record__meta > div { display: flex; flex-direction: column; gap: var(--space-1); }
  .decision-record__meta dt { font-size: 0.75rem; color: var(--color-text-muted); }
  .decision-record__meta dd { margin: 0; }
  .decision-record__heading {
    font-size: 0.8125rem;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    color: var(--color-text-muted);
    margin-block-start: var(--space-5);
  }
  .decision-record__dissent dt { font-weight: 600; margin-block-start: var(--space-3); }
  .decision-record__dissent dd { margin: 0; }
  .decision-record__revisit { padding-inline-start: var(--space-5); }

`;
}
