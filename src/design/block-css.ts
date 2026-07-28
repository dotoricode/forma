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
  .blk-chart__title { font-size: 1rem; margin-block-end: var(--space-4); color: var(--color-text-muted); }
  .blk-chart svg text { font-family: var(--font-sans); fill: var(--color-text-muted); font-size: 0.75rem; }
  .blk-chart .chart-bar { fill: var(--color-accent); }
  .blk-chart .chart-axis { stroke: var(--color-border); }

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
  .blk-source-note { font-size: 0.8125rem; color: var(--color-text-muted); }
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
    /* Severity is carried by a rule on the reading edge, not by tinting the
       text: coloured body copy fails contrast before it reads as urgent. */
    border-inline-start: 3px solid var(--color-danger);
    padding-inline-start: var(--space-4);
    margin-inline-start: calc(-1 * var(--space-4) - 3px);
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
    color: var(--color-warning);
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
    border-inline-start: 3px solid var(--color-danger);
    padding-inline-start: var(--space-3);
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

  `;
}
