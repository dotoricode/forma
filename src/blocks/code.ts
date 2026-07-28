/**
 * Code blocks. Both break out past the reading measure: source lines and
 * diff hunks have their own natural width and wrapping them to prose measure
 * turns every other line into a continuation.
 */
import { z } from "zod";
import { escapeHtml } from "../security/sanitize.js";
import { ARTIFACTS } from "../spec/artifact.js";
import { BlockBase } from "../spec/source.js";
import { highlightLines } from "../renderer/highlight.js";
import { parseUnifiedDiff, renderDiffHunksHtml } from "../renderer/diff-view.js";
import { defineBlock } from "./types.js";
import { section, sourceNoteList } from "./shared.js";

const annotatedCode = defineBlock({
  type: "annotated-code",
  category: "code",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["detail", "evidence", "procedure"],
  schema: BlockBase.extend({
    type: z.literal("annotated-code"),
    title: z.string().optional(),
    language: z.string().min(1),
    code: z.string(),
    highlightLines: z.array(z.number().int().positive()).default([]),
    annotations: z
      .array(z.object({ line: z.number().int().positive(), text: z.string().min(1) }))
      .default([]),
  }),
  async renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-code__title">${escapeHtml(block.title)}</h2>` : "";
    const lines = await highlightLines(block.code, block.language);
    const highlightSet = new Set(block.highlightLines);
    const linesHtml = lines
      .map((line, i) => {
        const lineNumber = i + 1;
        const isHighlighted = highlightSet.has(lineNumber);
        return `<li class="blk-code__line" data-highlight="${isHighlighted}">${line.html}</li>`;
      })
      .join("");
    const hasNotes = block.annotations.length > 0;
    const notes = hasNotes
      ? `<dl class="blk-code__notes">${block.annotations
          .map((a) => `<dt>L${a.line}</dt><dd>${escapeHtml(a.text)}</dd>`)
          .join("")}</dl>`
      : "";
    return section(
      block.id,
      "blk-code breakout",
      `${title}<div class="blk-code__frame" data-has-notes="${hasNotes}"><div class="blk-code__scroll"><pre><ol class="blk-code__lines">${linesHtml}</ol></pre></div>${notes}</div>${sourceNoteList(block, ctx)}`,
    );
  },
});

const diff = defineBlock({
  type: "diff",
  category: "code",
  capabilities: ["breakout"],
  supportedArtifacts: ARTIFACTS,
  roles: ["evidence", "detail"],
  schema: BlockBase.extend({
    type: z.literal("diff"),
    title: z.string().optional(),
    language: z.string().optional(),
    unifiedDiff: z.string().min(1),
  }),
  renderStatic(block, ctx) {
    const title = block.title ? `<h2 class="blk-diff__title">${escapeHtml(block.title)}</h2>` : "";
    const hunks = parseUnifiedDiff(block.unifiedDiff);
    return section(
      block.id,
      "blk-diff breakout",
      `${title}<div class="blk-diff__frame">${renderDiffHunksHtml(hunks)}</div>${sourceNoteList(block, ctx)}`,
    );
  },
});

export const codeBlocks = [annotatedCode, diff] as const;
