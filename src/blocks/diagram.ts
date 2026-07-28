/**
 * Diagram blocks. Each is laid out by Forma's own deterministic SVG engine
 * (`renderer/diagrams.ts`) rather than a runtime graphing library, so the
 * output stays byte-identical across runs and needs no browser at build time.
 */
import { z } from "zod";
import { escapeHtml, sanitizeSvg } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import {
  renderArchitectureSvg,
  renderFlowSvg,
  renderSequenceSvg,
} from "../renderer/diagrams.js";
import { defineBlock } from "./types.js";
import { measureWrap, section, sourceNoteList } from "./shared.js";

const flow = defineBlock({
  type: "flow",
  category: "diagram",
  capabilities: ["breakout", "svg"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail", "procedure"],
  schema: BlockBase.extend({
    type: z.literal("flow"),
    title: z.string().optional(),
    nodes: z
      .array(
        z.object({
          id: z.string().min(1),
          label: z.string().min(1),
          kind: z.enum(["start", "step", "decision", "end"]).default("step"),
        }),
      )
      .min(1),
    edges: z
      .array(
        z.object({ from: z.string().min(1), to: z.string().min(1), label: z.string().optional() }),
      )
      .default([]),
  }),
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-diagram__title">${escapeHtml(block.title)}</h2>` : "";
    return section(
      block.id,
      "blk-diagram breakout",
      `${title}<div class="blk-diagram__canvas">${sanitizeSvg(renderFlowSvg(block))}</div>${sourceNoteList(block, ctx)}`,
    );
  },
});

const sequence = defineBlock({
  type: "sequence",
  category: "diagram",
  capabilities: ["breakout", "svg"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail"],
  schema: BlockBase.extend({
    type: z.literal("sequence"),
    title: z.string().optional(),
    participants: z.array(z.object({ id: z.string().min(1), label: z.string().min(1) })).min(1),
    messages: z
      .array(
        z.object({
          from: z.string().min(1),
          to: z.string().min(1),
          label: z.string().min(1),
          kind: z.enum(["call", "return", "async"]).default("call"),
        }),
      )
      .default([]),
  }),
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-diagram__title">${escapeHtml(block.title)}</h2>` : "";
    return section(
      block.id,
      "blk-diagram breakout",
      `${title}<div class="blk-diagram__canvas">${sanitizeSvg(renderSequenceSvg(block))}</div>${sourceNoteList(block, ctx)}`,
    );
  },
});

const timeline = defineBlock({
  type: "timeline",
  category: "diagram",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail", "change"],
  schema: BlockBase.extend({
    type: z.literal("timeline"),
    title: z.string().optional(),
    entries: z
      .array(
        z.object({
          id: z.string().min(1),
          when: z.string().min(1),
          label: z.string().min(1),
          detail: z.string().optional(),
          status: z.enum(["past", "current", "future"]).default("past"),
        }),
      )
      .min(1),
  }),
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-timeline__title">${escapeHtml(block.title)}</h2>` : "";
    const items = block.entries
      .map(
        (entry) => `<li class="blk-timeline__item" data-status="${entry.status}">
        <div class="blk-timeline__when">${escapeHtml(entry.when)}</div>
        <div class="blk-timeline__label">${escapeHtml(entry.label)}</div>
        ${entry.detail ? `<div class="blk-timeline__detail">${escapeHtml(entry.detail)}</div>` : ""}
      </li>`,
      )
      .join("");
    return section(
      block.id,
      "blk-timeline",
      measureWrap(`${title}<ol class="blk-timeline__list">${items}</ol>${sourceNoteList(block, ctx)}`),
    );
  },
});

const architecture = defineBlock({
  type: "architecture",
  category: "diagram",
  capabilities: ["breakout", "svg"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail"],
  schema: BlockBase.extend({
    type: z.literal("architecture"),
    title: z.string().optional(),
    nodes: z
      .array(
        z.object({ id: z.string().min(1), label: z.string().min(1), group: z.string().optional() }),
      )
      .min(1),
    edges: z
      .array(
        z.object({ from: z.string().min(1), to: z.string().min(1), label: z.string().optional() }),
      )
      .default([]),
  }),
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-diagram__title">${escapeHtml(block.title)}</h2>` : "";
    return section(
      block.id,
      "blk-diagram breakout",
      `${title}<div class="blk-diagram__canvas">${sanitizeSvg(renderArchitectureSvg(block))}</div>${sourceNoteList(block, ctx)}`,
    );
  },
});

export const diagramBlocks = [flow, sequence, timeline, architecture] as const;
