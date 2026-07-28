/**
 * Diagram blocks. Each is laid out by Forma's own deterministic SVG engine
 * (`renderer/diagrams.ts`) rather than a runtime graphing library, so the
 * output stays byte-identical across runs and needs no browser at build time.
 */
import { z } from "zod";
import { sanitizeSvg } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import {
  renderArchitectureSvg,
  renderFlowSvg,
  renderSequenceSvg,
} from "../renderer/diagrams.js";
import { defineBlock } from "./types.js";
import { InlineSvg, Measure, Section, SourceNotes } from "./primitives.js";

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
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-diagram breakout">
        {block.title ? <h2 className="blk-diagram__title">{block.title}</h2> : null}
        <InlineSvg className="blk-diagram__canvas" svg={sanitizeSvg(renderFlowSvg(block))} />
        <SourceNotes block={block} ctx={ctx} />
      </Section>
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
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-diagram breakout">
        {block.title ? <h2 className="blk-diagram__title">{block.title}</h2> : null}
        <InlineSvg className="blk-diagram__canvas" svg={sanitizeSvg(renderSequenceSvg(block))} />
        <SourceNotes block={block} ctx={ctx} />
      </Section>
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
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-timeline">
        <Measure>
          {block.title ? <h2 className="blk-timeline__title">{block.title}</h2> : null}
          <ol className="blk-timeline__list">
            {block.entries.map((entry) => (
              <li key={entry.id} className="blk-timeline__item" data-status={entry.status}>
                <div className="blk-timeline__when">{entry.when}</div>
                <div className="blk-timeline__label">{entry.label}</div>
                {entry.detail ? <div className="blk-timeline__detail">{entry.detail}</div> : null}
              </li>
            ))}
          </ol>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
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
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-diagram breakout">
        {block.title ? <h2 className="blk-diagram__title">{block.title}</h2> : null}
        <InlineSvg
          className="blk-diagram__canvas"
          svg={sanitizeSvg(renderArchitectureSvg(block))}
        />
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

export const diagramBlocks = [flow, sequence, timeline, architecture] as const;
