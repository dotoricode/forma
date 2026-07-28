/**
 * Tabular and quantitative blocks that predate the dashboard artifact.
 *
 * `chart` stays a general-purpose static chart. It deliberately does not
 * grow into the dashboard's data vocabulary — a KPI with a comparison basis,
 * a sparkline, or a freshness stamp carry meaning a bare bar chart does not,
 * and folding them into `chart` would make one block answer six different
 * reader questions.
 */
import { z } from "zod";
import { sanitizeSvg } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { renderChartSvg } from "../renderer/diagrams.js";
import { defineBlock } from "./types.js";
import { STRINGS } from "./strings.js";
import { InlineSvg, Section, SourceNotes } from "./primitives.js";

const comparison = defineBlock({
  type: "comparison",
  category: "data",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["alternatives", "detail"],
  schema: BlockBase.extend({
    type: z.literal("comparison"),
    title: z.string().optional(),
    left: z.object({ label: z.string().min(1), items: z.array(z.string()).default([]) }),
    right: z.object({ label: z.string().min(1), items: z.array(z.string()).default([]) }),
  }),
  Component({ block, ctx }) {
    const Column = (props: { label: string; items: string[] }) => (
      <div className="comparison__col">
        <h3>{props.label}</h3>
        <ul>
          {props.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    );
    return (
      <Section id={block.id} className="blk-comparison">
        {block.title ? <h2 className="blk-comparison__title">{block.title}</h2> : null}
        <div className="comparison__grid">
          <Column label={block.left.label} items={block.left.items} />
          <Column label={block.right.label} items={block.right.items} />
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const testSummary = defineBlock({
  type: "test-summary",
  category: "data",
  capabilities: ["numeric"],
  supportedArtifacts: ARTIFACTS,
  roles: ["kpi", "status", "evidence"],
  schema: BlockBase.extend({
    type: z.literal("test-summary"),
    title: z.string().optional(),
    total: z.number().int().nonnegative(),
    passed: z.number().int().nonnegative(),
    failed: z.number().int().nonnegative(),
    skipped: z.number().int().nonnegative().default(0),
    durationMs: z.number().nonnegative().optional(),
  }),
  Component({ block, ctx }) {
    const s = STRINGS[ctx.language];
    const Stat = (props: { value: number; label: string; tone?: "pass" | "fail" }) => {
      // A zero count carries no urgency — only color-code the number when
      // it's actually nonzero, so "0 failed" doesn't read as an alarm.
      const tone = props.tone && props.value > 0 ? props.tone : undefined;
      return (
        <div className="test-band__stat" data-tone={tone}>
          <span className="test-band__value">{props.value}</span>
          <span className="test-band__label">{props.label}</span>
        </div>
      );
    };
    return (
      <Section id={block.id} className="blk-test-summary">
        {block.title ? <h2>{block.title}</h2> : null}
        <div className="test-band">
          <Stat value={block.total} label={s.total} />
          <Stat value={block.passed} label={s.passed} tone="pass" />
          <Stat value={block.failed} label={s.failed} tone="fail" />
          <Stat value={block.skipped} label={s.skipped} />
        </div>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

const STATUS_SYMBOL: Record<string, string> = {
  pass: "✓",
  fail: "✕",
  skip: "–",
};

const testMatrix = defineBlock({
  type: "test-matrix",
  category: "data",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail", "evidence"],
  schema: BlockBase.extend({
    type: z.literal("test-matrix"),
    title: z.string().optional(),
    columns: z.array(z.string().min(1)).min(1),
    rows: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          cells: z.record(z.string(), z.enum(["pass", "fail", "skip", "na"])),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    const s = STRINGS[ctx.language];
    return (
      <Section id={block.id} className="blk-test-matrix">
        {block.title ? <h2>{block.title}</h2> : null}
        <div className="test-matrix__scroll">
          <table className="test-matrix__table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="visually-hidden">{s.rowLabel}</span>
                </th>
                {block.columns.map((column) => (
                  <th key={column} scope="col">
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.id}>
                  <th scope="row">{row.label}</th>
                  {block.columns.map((column) => {
                    const status = row.cells[column] ?? "na";
                    return (
                      <td key={column} className="test-matrix__cell" data-status={status}>
                        {STATUS_SYMBOL[status] ?? "·"}
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

const chart = defineBlock({
  type: "chart",
  category: "data",
  capabilities: ["breakout", "svg", "numeric"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail", "evidence"],
  schema: BlockBase.extend({
    type: z.literal("chart"),
    title: z.string().optional(),
    kind: z.enum(["bar", "line"]).default("bar"),
    categories: z.array(z.string().min(1)).min(1),
    series: z.array(z.object({ label: z.string().min(1), values: z.array(z.number()).min(1) })).min(1),
    unit: z.string().optional(),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-chart breakout">
        {block.title ? <h2 className="blk-chart__title">{block.title}</h2> : null}
        {/* The SVG gains a wrapper element that the string renderer did
            not have: `dangerouslySetInnerHTML` needs a host node. It is a
            plain block-level div, so layout is unchanged, and naming it
            matches the diagram blocks' `__canvas`. */}
        <InlineSvg className="blk-chart__canvas" svg={sanitizeSvg(renderChartSvg(block))} />
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

export const dataBlocks = [comparison, testSummary, testMatrix, chart] as const;
