/**
 * Dashboard blocks — the Signal Grid vocabulary.
 *
 * The thing a dashboard gets wrong is presenting a number as a signal. A
 * bare value tells the reader nothing: 95.2% is good or catastrophic
 * depending on what it was last week and what the bar is. So `metric`
 * requires a unit and a period, and a comparison carries its own basis.
 *
 * Direction and meaning are separate fields on purpose. Cost up and pass
 * rate up are both `up`, and colouring them the same way is how a dashboard
 * tells its reader the wrong story without saying anything false.
 */
import { z } from "zod";
import { BlockBase } from "../spec/source.js";
import { sanitizeSvg } from "../security/sanitize.js";
import { renderBreakdownSvg, renderSparklineSvg } from "../renderer/sparkline.js";
import { defineBlock } from "./types.js";
import { DASHBOARD_LABEL } from "./strings.js";
import { InlineSvg, Measure, Section, SourceNotes } from "./primitives.js";

const DASHBOARD_AND_ADVANCED = ["dashboard", "advanced"] as const;

const StatusSchema = z.enum(["normal", "warning", "critical", "unknown"]);

const ComparisonSchema = z.object({
  value: z.number(),
  direction: z.enum(["up", "down", "flat"]),
  /** What it is being compared against. A delta with no basis is not a delta. */
  basis: z.string().min(1),
  /** Whether that direction is good news. Cost up and pass rate up differ. */
  sentiment: z.enum(["positive", "negative", "neutral"]).default("neutral"),
});

function Delta(props: {
  comparison: z.infer<typeof ComparisonSchema>;
  language: "ko" | "en";
}) {
  const arrow = props.comparison.direction === "up" ? "▲" : props.comparison.direction === "down" ? "▼" : "—";
  return (
    <p
      className="metric__delta"
      data-direction={props.comparison.direction}
      data-sentiment={props.comparison.sentiment}
    >
      <span className="metric__delta-arrow" aria-hidden="true">
        {arrow}
      </span>
      <span className="metric__delta-value">
        {DASHBOARD_LABEL[props.language].directionWord[props.comparison.direction]}{" "}
        {Math.abs(props.comparison.value)}
      </span>
      <span className="metric__delta-basis">{props.comparison.basis}</span>
    </p>
  );
}

function MetricBody(props: {
  label: string;
  value: number | string;
  unit?: string | undefined;
  period?: string | undefined;
  status?: z.infer<typeof StatusSchema> | undefined;
  comparison?: z.infer<typeof ComparisonSchema> | undefined;
  language: "ko" | "en";
}) {
  const labels = DASHBOARD_LABEL[props.language];
  return (
    <div className="metric" data-status={props.status ?? "normal"}>
      <p className="metric__label">{props.label}</p>
      <p className="metric__value">
        {props.value}
        {props.unit ? <span className="metric__unit">{props.unit}</span> : null}
      </p>
      {props.comparison ? <Delta comparison={props.comparison} language={props.language} /> : null}
      <p className="metric__period">{props.period ?? labels.periodUnknown}</p>
    </div>
  );
}

const statusHeader = defineBlock({
  type: "status-header",
  category: "dashboard",
  capabilities: ["numeric"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["status", "opening"],
  navTitle: (block) => block.headline,
  schema: BlockBase.extend({
    type: z.literal("status-header"),
    /** One sentence: is this healthy or not, in words. */
    headline: z.string().min(1),
    status: StatusSchema,
    detail: z.string().optional(),
  }),
  Component({ block, ctx }) {
    const labels = DASHBOARD_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-status-header">
        <div className="status-header" data-status={block.status}>
          {/* The state is spelled out, not only signalled by the band's
              colour: a status a reader has to decode from a hue is not a
              status in print, in greyscale, or for a third of readers. */}
          <p className="status-header__state">{labels.status[block.status]}</p>
          <h1 className="status-header__headline">{block.headline}</h1>
          {block.detail ? <p className="status-header__detail">{block.detail}</p> : null}
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const metric = defineBlock({
  type: "metric",
  category: "dashboard",
  capabilities: ["numeric"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["kpi"],
  navTitle: () => undefined,
  schema: BlockBase.extend({
    type: z.literal("metric"),
    label: z.string().min(1),
    value: z.union([z.number(), z.string()]),
    unit: z.string().optional(),
    /** As of when. Required in spirit; the planner flags its absence. */
    period: z.string().optional(),
    comparison: ComparisonSchema.optional(),
    status: StatusSchema.optional(),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-metric">
        <MetricBody {...block} language={ctx.language} />
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const metricGroup = defineBlock({
  type: "metric-group",
  category: "dashboard",
  capabilities: ["numeric", "breakout"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["kpi", "change"],
  navTitle: (block, language) => block.title ?? DASHBOARD_LABEL[language].keyMetrics,
  schema: BlockBase.extend({
    type: z.literal("metric-group"),
    title: z.string().optional(),
    /** Three to five. More than that and every number carries equal weight, which is none. */
    metrics: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          value: z.union([z.number(), z.string()]),
          unit: z.string().optional(),
          period: z.string().optional(),
          comparison: ComparisonSchema.optional(),
          status: StatusSchema.optional(),
          /** Optional trend behind the number, drawn as a sparkline. */
          series: z.array(z.union([z.number(), z.null()])).optional(),
        }),
      )
      .min(1)
      .max(6),
  }),
  Component({ block, ctx }) {
    const labels = DASHBOARD_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-metric-group breakout">
        <h2 className="blk-metric-group__title">{block.title ?? labels.keyMetrics}</h2>
        <div className="metric-grid">
          {block.metrics.map((entry) => (
            <div key={entry.id} className="metric-grid__cell">
              <MetricBody {...entry} language={ctx.language} />
              {entry.series && entry.series.length > 1 ? (
                <InlineSvg
                  className="metric__spark"
                  svg={sanitizeSvg(renderSparklineSvg({ values: entry.series }))}
                />
              ) : null}
            </div>
          ))}
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const anomaly = defineBlock({
  type: "anomaly",
  category: "dashboard",
  capabilities: ["measure"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["change"],
  navTitle: (block) => block.what,
  schema: BlockBase.extend({
    type: z.literal("anomaly"),
    /** What changed, in one sentence. */
    what: z.string().min(1),
    when: z.string().min(1),
    magnitude: z.string().min(1),
    /** Where a reader should look next. */
    suspected: z.string().optional(),
    severity: z.enum(["low", "medium", "high"]).default("medium"),
  }),
  Component({ block, ctx }) {
    const labels = DASHBOARD_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-anomaly">
        <Measure>
          <div className="anomaly" data-severity={block.severity}>
            <p className="anomaly__meta">
              {block.when} · {block.magnitude}
            </p>
            <h3 className="anomaly__what">{block.what}</h3>
            {block.suspected ? (
              <p className="anomaly__suspected">
                <span>{labels.suspected}</span> {block.suspected}
              </p>
            ) : null}
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const breakdown = defineBlock({
  type: "breakdown",
  category: "dashboard",
  capabilities: ["breakout", "svg", "numeric"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["driver"],
  navTitle: (block, language) => block.title ?? DASHBOARD_LABEL[language].drivers,
  schema: BlockBase.extend({
    type: z.literal("breakdown"),
    title: z.string().optional(),
    unit: z.string().min(1),
    /** What the reader should take from the chart. A chart with no reading is data, not a finding. */
    reading: z.string().min(1),
    contributions: z
      .array(z.object({ label: z.string().min(1), value: z.number() }))
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = DASHBOARD_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-breakdown breakout">
        <h2 className="blk-breakdown__title">{block.title ?? labels.drivers}</h2>
        <p className="blk-breakdown__reading">{block.reading}</p>
        <InlineSvg
          className="blk-breakdown__canvas"
          svg={sanitizeSvg(renderBreakdownSvg(block.contributions))}
        />
        {/* The chart is decorative to assistive tech; the same numbers are
            available as a list so nothing is only in the picture. */}
        <ul className="blk-breakdown__values">
          {block.contributions.map((entry, i) => (
            <li key={i}>
              <span>{entry.label}</span>
              <span className="blk-breakdown__value">
                {entry.value > 0 ? `+${entry.value}` : entry.value}
                {block.unit}
              </span>
            </li>
          ))}
        </ul>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const segmentedTable = defineBlock({
  type: "segmented-table",
  category: "dashboard",
  capabilities: ["breakout", "numeric"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["detail"],
  navTitle: (block, language) => block.title ?? DASHBOARD_LABEL[language].detail,
  schema: BlockBase.extend({
    type: z.literal("segmented-table"),
    title: z.string().optional(),
    columns: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    rows: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          cells: z.record(z.string(), z.union([z.number(), z.string(), z.null()])),
          status: StatusSchema.optional(),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const labels = DASHBOARD_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-segmented-table breakout">
        <h2 className="blk-segmented-table__title">{block.title ?? labels.detail}</h2>
        <div className="blk-segmented-table__scroll" tabIndex={0}>
          <table className="blk-segmented-table__table">
            <thead>
              <tr>
                <th scope="col">{labels.segment}</th>
                {block.columns.map((column) => (
                  <th key={column.id} scope="col">
                    {column.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.id} data-status={row.status ?? "normal"}>
                  <th scope="row">{row.label}</th>
                  {block.columns.map((column) => {
                    const cell = row.cells[column.id];
                    return (
                      <td key={column.id}>
                        {/* An empty cell and a measured zero are different
                            facts. Blank would read as zero. */}
                        {cell === null || cell === undefined ? (
                          <span className="cell-missing">{labels.noData}</span>
                        ) : (
                          cell
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const dataFreshness = defineBlock({
  type: "data-freshness",
  category: "dashboard",
  capabilities: ["measure"],
  supportedArtifacts: DASHBOARD_AND_ADVANCED,
  roles: ["freshness", "provenance"],
  navTitle: (block, language) => block.title ?? DASHBOARD_LABEL[language].freshness,
  schema: BlockBase.extend({
    type: z.literal("data-freshness"),
    title: z.string().optional(),
    /** The instant the numbers describe. */
    asOf: z.string().min(1),
    coverage: z.string().min(1),
    lastUpdated: z.string().optional(),
    /** Known gaps. Saying "none" is a claim; saying nothing is a silence. */
    knownGaps: z.array(z.string().min(1)).default([]),
    delayed: z.boolean().default(false),
  }),
  Component({ block, ctx }) {
    const labels = DASHBOARD_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-data-freshness">
        <Measure>
          <h2 className="blk-data-freshness__title">{block.title ?? labels.freshness}</h2>
          <dl className="blk-data-freshness__grid">
            <div>
              <dt>{labels.asOf}</dt>
              <dd>{block.asOf}</dd>
            </div>
            <div>
              <dt>{labels.coverage}</dt>
              <dd>{block.coverage}</dd>
            </div>
            {block.lastUpdated ? (
              <div>
                <dt>{labels.lastUpdated}</dt>
                <dd>{block.lastUpdated}</dd>
              </div>
            ) : null}
          </dl>
          {block.delayed ? <p className="blk-data-freshness__delayed">{labels.delayed}</p> : null}
          {block.knownGaps.length > 0 ? (
            <>
              <p className="blk-data-freshness__gaps-label">{labels.knownGaps}</p>
              <ul className="blk-data-freshness__gaps">
                {block.knownGaps.map((gap, i) => (
                  <li key={i}>{gap}</li>
                ))}
              </ul>
            </>
          ) : null}
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

export const dashboardBlocks = [
  statusHeader,
  metric,
  metricGroup,
  anomaly,
  breakdown,
  segmentedTable,
  dataFreshness,
] as const;
