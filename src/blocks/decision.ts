/**
 * Judgement blocks: what was found, what could go wrong, what was decided,
 * and what happens next. These are where a document stops describing and
 * starts committing, so each one carries its own confidence marker.
 */
import { z } from "zod";
import { escapeHtml, renderInlineMarkdown } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { defineBlock } from "./types.js";
import {
  LEVEL_LABEL,
  SEVERITY_LABEL,
  STATUS_LABEL,
  confidenceTag,
  measureWrap,
  section,
  sourceNoteList,
} from "./shared.js";

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
  renderStatic(block, ctx) {
    const severityLabel = SEVERITY_LABEL[ctx.language][block.severity] ?? block.severity;
    return section(
      block.id,
      "blk-finding",
      measureWrap(
        `<div data-severity="${block.severity}"><p class="blk-finding__badge">${escapeHtml(severityLabel)}${confidenceTag(block, ctx)}</p><h3 class="blk-finding__title">${escapeHtml(block.title)}</h3><div>${renderInlineMarkdown(block.body)}</div></div>${sourceNoteList(block, ctx)}`,
      ),
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
  renderStatic(block, ctx) {
    const l = LEVEL_LABEL[ctx.language];
    const g = RISK_GRID_LABEL[ctx.language];
    return section(
      block.id,
      "blk-risk",
      measureWrap(
        `<p class="blk-risk__badge">${g.likelihood} ${escapeHtml(l[block.likelihood] ?? block.likelihood)} · ${g.impact} ${escapeHtml(l[block.impact] ?? block.impact)}${confidenceTag(block, ctx)}</p><h3 class="blk-risk__title">${escapeHtml(block.title)}</h3><dl class="blk-risk__grid"><div><dt>${g.mitigation}</dt><dd>${escapeHtml(block.mitigation)}</dd></div></dl>${sourceNoteList(block, ctx)}`,
      ),
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
  renderStatic(block, ctx) {
    const statusLabel = STATUS_LABEL[ctx.language][block.status] ?? block.status;
    return section(
      block.id,
      "blk-decision",
      measureWrap(
        `<div class="decision-strip"><p class="decision-strip__status">${escapeHtml(statusLabel)}${confidenceTag(block, ctx)}</p><h3 class="decision-strip__title">${escapeHtml(block.title)}</h3><p>${renderInlineMarkdown(block.rationale)}</p></div>${sourceNoteList(block, ctx)}`,
      ),
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
  renderStatic(block, ctx) {
    const title = block.title
      ? `<h2 class="blk-actions__title">${escapeHtml(block.title)}</h2>`
      : "";
    const items = block.items
      .map(
        (item) =>
          `<li class="blk-actions__item"><span>${escapeHtml(item.label)}</span><span class="blk-actions__owner">${escapeHtml([item.owner, item.due].filter(Boolean).join(" · "))}</span></li>`,
      )
      .join("");
    return section(
      block.id,
      "blk-actions",
      `${title}<ul class="blk-actions__list">${items}</ul>${sourceNoteList(block, ctx)}`,
    );
  },
});

export const decisionBlocks = [finding, risk, decision, actions] as const;
