/**
 * Tabular and quantitative blocks that predate the dashboard artifact.
 *
 * `chart` stays a general-purpose static chart. It deliberately does not
 * grow into the dashboard's data vocabulary — a KPI with a comparison basis,
 * a sparkline, or a freshness stamp carry meaning a bare bar chart does not,
 * and folding them into `chart` would make one block responsible for six
 * different reader questions.
 */
import { z } from "zod";
import { escapeHtml, sanitizeSvg } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { renderChartSvg } from "../renderer/diagrams.js";
import { defineBlock } from "./types.js";
import { STRINGS, section, sourceNoteList } from "./shared.js";

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
  renderStatic(block, ctx) {
    const title = block.title
      ? `<h2 class="blk-comparison__title">${escapeHtml(block.title)}</h2>`
      : "";
    const col = (label: string, items: string[]) =>
      `<div class="comparison__col"><h3>${escapeHtml(label)}</h3><ul>${items
        .map((i) => `<li>${escapeHtml(i)}</li>`)
        .join("")}</ul></div>`;
    return section(
      block.id,
      "blk-comparison",
      `${title}<div class="comparison__grid">${col(block.left.label, block.left.items)}${col(block.right.label, block.right.items)}</div>${sourceNoteList(block, ctx)}`,
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
  renderStatic(block, ctx) {
    const title = block.title ? `<h2>${escapeHtml(block.title)}</h2>` : "";
    const s = STRINGS[ctx.language];
    const stat = (value: number, label: string, tone?: string) => {
      // A zero count carries no urgency — only color-code the number when
      // it's actually nonzero, so "0 failed" doesn't read as an alarm.
      const appliedTone = tone && value > 0 ? tone : undefined;
      return `<div class="test-band__stat" ${appliedTone ? `data-tone="${appliedTone}"` : ""}><span class="test-band__value">${value}</span><span class="test-band__label">${label}</span></div>`;
    };
    return section(
      block.id,
      "blk-test-summary",
      `${title}<div class="test-band">${stat(block.total, s.total)}${stat(block.passed, s.passed, "pass")}${stat(block.failed, s.failed, "fail")}${stat(block.skipped, s.skipped)}</div>${sourceNoteList(block, ctx)}`,
    );
  },
});

function statusSymbol(status: string): string {
  switch (status) {
    case "pass":
      return "✓";
    case "fail":
      return "✕";
    case "skip":
      return "–";
    default:
      return "·";
  }
}

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
  renderStatic(block, ctx) {
    const title = block.title ? `<h2>${escapeHtml(block.title)}</h2>` : "";
    const s = STRINGS[ctx.language];
    const head = `<tr><th scope="col"><span class="visually-hidden">${escapeHtml(s.rowLabel)}</span></th>${block.columns
      .map((c) => `<th scope="col">${escapeHtml(c)}</th>`)
      .join("")}</tr>`;
    const rows = block.rows
      .map((row) => {
        const cells = block.columns
          .map((col) => {
            const status = row.cells[col] ?? "na";
            return `<td class="test-matrix__cell" data-status="${status}">${statusSymbol(status)}</td>`;
          })
          .join("");
        return `<tr><th scope="row">${escapeHtml(row.label)}</th>${cells}</tr>`;
      })
      .join("");
    return section(
      block.id,
      "blk-test-matrix",
      `${title}<div class="test-matrix__scroll"><table class="test-matrix__table"><thead>${head}</thead><tbody>${rows}</tbody></table></div>${sourceNoteList(block, ctx)}`,
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
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-chart__title">${escapeHtml(block.title)}</h2>` : "";
    return section(
      block.id,
      "blk-chart breakout",
      `${title}${sanitizeSvg(renderChartSvg(block))}${sourceNoteList(block, ctx)}`,
    );
  },
});

export const dataBlocks = [comparison, testSummary, testMatrix, chart] as const;
