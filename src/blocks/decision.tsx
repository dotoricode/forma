/**
 * Judgement blocks: what was found, what could go wrong, what was decided,
 * and what happens next. These are where a document stops describing and
 * starts committing, so each one carries its own confidence marker.
 */
import { z } from "zod";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { defineBlock } from "./types.js";
import { LEVEL_LABEL, SEVERITY_LABEL, STATUS_LABEL } from "./strings.js";
import {
  ConfidenceTag,
  InlineMarkdown,
  Measure,
  Section,
  SourceNotes,
} from "./primitives.js";

const finding = defineBlock({
  type: "finding",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["finding", "detail"],
  schema: BlockBase.extend({
    type: z.literal("finding"),
    title: z.string().min(1),
    body: z.string().min(1),
    severity: z.enum(["info", "low", "medium", "high", "critical"]).default("info"),
  }),
  Component({ block, ctx }) {
    const severityLabel = SEVERITY_LABEL[ctx.language][block.severity] ?? block.severity;
    return (
      <Section id={block.id} className="blk-finding">
        <Measure>
          <div data-severity={block.severity}>
            <p className="blk-finding__badge">
              {severityLabel}
              <ConfidenceTag block={block} ctx={ctx} />
            </p>
            <h3 className="blk-finding__title">{block.title}</h3>
            <InlineMarkdown text={block.body} />
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const RISK_GRID_LABEL: Record<"ko" | "en", { likelihood: string; impact: string; mitigation: string }> = {
  en: { likelihood: "Likelihood", impact: "Impact", mitigation: "Mitigation" },
  ko: { likelihood: "가능성", impact: "영향", mitigation: "대응" },
};

const risk = defineBlock({
  type: "risk",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["risk"],
  schema: BlockBase.extend({
    type: z.literal("risk"),
    title: z.string().min(1),
    likelihood: z.enum(["low", "medium", "high"]),
    impact: z.enum(["low", "medium", "high"]),
    mitigation: z.string().min(1),
  }),
  Component({ block, ctx }) {
    const level = LEVEL_LABEL[ctx.language];
    const grid = RISK_GRID_LABEL[ctx.language];
    return (
      <Section id={block.id} className="blk-risk">
        <Measure>
          <p className="blk-risk__badge">
            {`${grid.likelihood} ${level[block.likelihood] ?? block.likelihood} · ${grid.impact} ${level[block.impact] ?? block.impact}`}
            <ConfidenceTag block={block} ctx={ctx} />
          </p>
          <h3 className="blk-risk__title">{block.title}</h3>
          <dl className="blk-risk__grid">
            <div>
              <dt>{grid.mitigation}</dt>
              <dd>{block.mitigation}</dd>
            </div>
          </dl>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const decision = defineBlock({
  type: "decision",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["decision", "recommendation"],
  schema: BlockBase.extend({
    type: z.literal("decision"),
    title: z.string().min(1),
    status: z.enum(["proposed", "recommended", "decided", "rejected"]),
    rationale: z.string().min(1),
  }),
  Component({ block, ctx }) {
    const statusLabel = STATUS_LABEL[ctx.language][block.status] ?? block.status;
    return (
      <Section id={block.id} className="blk-decision">
        <Measure>
          <div className="decision-strip">
            <p className="decision-strip__status">
              {statusLabel}
              <ConfidenceTag block={block} ctx={ctx} />
            </p>
            <h3 className="decision-strip__title">{block.title}</h3>
            <InlineMarkdown text={block.rationale} />
          </div>
          <SourceNotes block={block} ctx={ctx} />
        </Measure>
      </Section>
    );
  },
});

const actions = defineBlock({
  type: "actions",
  category: "decision",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["action"],
  schema: BlockBase.extend({
    type: z.literal("actions"),
    title: z.string().optional(),
    items: z
      .array(
        z.object({
          label: z.string().min(1),
          owner: z.string().optional(),
          due: z.string().optional(),
        }),
      )
      .min(1),
  }),
  Component({ block, ctx }) {
    return (
      <Section id={block.id} className="blk-actions">
        {block.title ? <h2 className="blk-actions__title">{block.title}</h2> : null}
        <ul className="blk-actions__list">
          {block.items.map((item, i) => (
            <li key={i} className="blk-actions__item">
              <span>{item.label}</span>
              <span className="blk-actions__owner">
                {[item.owner, item.due].filter(Boolean).join(" · ")}
              </span>
            </li>
          ))}
        </ul>
        <SourceNotes block={block} ctx={ctx} />
      </Section>
    );
  },
});

export const decisionBlocks = [finding, risk, decision, actions] as const;
