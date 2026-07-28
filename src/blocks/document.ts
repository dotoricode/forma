/**
 * Document blocks: prose-width text that carries the narrative. These are
 * available to every artifact — a dashboard still needs a status header's
 * worth of words, and a manual still explains before it instructs.
 */
import { z } from "zod";
import { escapeHtml, renderInlineMarkdown } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { defineBlock, type RenderContext } from "./types.js";
import {
  confidenceTag,
  measureWrap,
  renderSourceListItem,
  section,
  sourceNoteList,
} from "./shared.js";

const cover = defineBlock({
  type: "cover",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["opening"],
  schema: BlockBase.extend({
    type: z.literal("cover"),
    eyebrow: z.string().optional(),
    title: z.string().min(1),
    subtitle: z.string().optional(),
    meta: z.array(z.string()).default([]),
  }),
  renderStatic(block, ctx) {
    const eyebrow = block.eyebrow
      ? `<p class="blk-cover__eyebrow">${escapeHtml(block.eyebrow)}</p>`
      : "";
    const subtitle = block.subtitle
      ? `<p class="blk-cover__subtitle">${escapeHtml(block.subtitle)}</p>`
      : "";
    const meta =
      block.meta.length > 0
        ? `<ul class="blk-cover__meta">${block.meta.map((m) => `<li>${escapeHtml(m)}</li>`).join("")}</ul>`
        : "";
    return section(
      block.id,
      "blk-cover",
      `${eyebrow}<h1 class="blk-cover__title">${escapeHtml(block.title)}</h1>${subtitle}${meta}${confidenceTag(block, ctx)}`,
    );
  },
});

const summary = defineBlock({
  type: "summary",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["summary"],
  schema: BlockBase.extend({
    type: z.literal("summary"),
    title: z.string().min(1),
    body: z.string().min(1),
  }),
  renderStatic(block, ctx) {
    return section(
      block.id,
      "blk-summary",
      measureWrap(
        `<h2 class="blk-summary__title">${escapeHtml(block.title)}${confidenceTag(block, ctx)}</h2><div class="blk-summary__body">${renderInlineMarkdown(block.body)}</div>${sourceNoteList(block, ctx)}`,
      ),
    );
  },
});

const prose = defineBlock({
  type: "prose",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail"],
  schema: BlockBase.extend({
    type: z.literal("prose"),
    title: z.string().optional(),
    body: z.string().min(1),
  }),
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-prose__title">${escapeHtml(block.title)}</h2>` : "";
    return section(
      block.id,
      "blk-prose",
      measureWrap(
        `${title}<div class="blk-prose__body">${renderInlineMarkdown(block.body)}</div>${sourceNoteList(block, ctx)}`,
      ),
    );
  },
});

const keyPoints = defineBlock({
  type: "key-points",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["summary", "detail"],
  schema: BlockBase.extend({
    type: z.literal("key-points"),
    title: z.string().optional(),
    points: z.array(z.string().min(1)).min(1),
  }),
  renderStatic(block, ctx) {
    const title = block.title
      ? `<h2 class="blk-key-points__title">${escapeHtml(block.title)}</h2>`
      : "";
    const items = block.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
    return section(block.id, "blk-key-points", `${title}<ol>${items}</ol>${sourceNoteList(block, ctx)}`);
  },
});

const glossary = defineBlock({
  type: "glossary",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["reference"],
  schema: BlockBase.extend({
    type: z.literal("glossary"),
    title: z.string().optional(),
    terms: z.array(z.object({ term: z.string().min(1), definition: z.string().min(1) })).min(1),
  }),
  renderStatic(block, ctx) {
    const title = block.title
      ? `<h2 class="blk-glossary__title">${escapeHtml(block.title)}</h2>`
      : "";
    const items = block.terms
      .map((t) => `<dt>${escapeHtml(t.term)}</dt><dd>${escapeHtml(t.definition)}</dd>`)
      .join("");
    return section(block.id, "blk-glossary", `${title}<dl>${items}</dl>${sourceNoteList(block, ctx)}`);
  },
});

function renderAllSources(ctx: RenderContext): string {
  const sources = Array.from(ctx.sourcesById.values());
  if (sources.length === 0) return "";
  const items = sources.map((source) => renderSourceListItem(source, source.id)).join("");
  return `<ul>${items}</ul>`;
}

const sourceNote = defineBlock({
  type: "source-note",
  category: "document",
  capabilities: ["measure"],
  supportedArtifacts: ARTIFACTS,
  roles: ["provenance"],
  schema: BlockBase.extend({
    type: z.literal("source-note"),
    title: z.string().optional(),
  }),
  renderStatic(block, ctx) {
    // A standalone source-note with no sourceRefs of its own is meant as the
    // document's closing bibliography — list every source in the spec rather
    // than rendering an empty (but still TOC-linked) section.
    const hasOwnRefs = (block.sourceRefs ?? []).length > 0;
    const body = hasOwnRefs ? sourceNoteList(block, ctx) : renderAllSources(ctx);
    const title = block.title
      ? `<h2 class="blk-source-note__title">${escapeHtml(block.title)}</h2>`
      : "";
    return section(block.id, "blk-source-note", measureWrap(`${title}${body}`));
  },
});

export const documentBlocks = [cover, summary, prose, keyPoints, glossary, sourceNote] as const;
