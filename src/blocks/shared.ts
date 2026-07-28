/**
 * Helpers shared by every block renderer: the section wrapper, the reading
 * measure wrapper, provenance markup, and the localized label tables.
 *
 * These were private to `renderer/blocks.ts` when all twenty renderers lived
 * in one file. Block definitions now live in their own modules, so the
 * helpers move here rather than being duplicated per module.
 */
import { escapeHtml, sanitizeUrl } from "../security/sanitize.js";
import type { FormaSource } from "../spec/source.js";
import type { RenderContext } from "./types.js";

export interface UiStrings {
  sources: string;
  confidenceVerified: string;
  confidenceInferred: string;
  confidenceUnknown: string;
  passed: string;
  failed: string;
  skipped: string;
  total: string;
  rowLabel: string;
}

export const STRINGS: Record<"ko" | "en", UiStrings> = {
  en: {
    sources: "Sources",
    confidenceVerified: "verified",
    confidenceInferred: "inferred",
    confidenceUnknown: "unconfirmed",
    passed: "passed",
    failed: "failed",
    skipped: "skipped",
    total: "total",
    rowLabel: "Row",
  },
  ko: {
    sources: "출처",
    confidenceVerified: "확인됨",
    confidenceInferred: "추정",
    confidenceUnknown: "미확인",
    passed: "성공",
    failed: "실패",
    skipped: "건너뜀",
    total: "전체",
    rowLabel: "행",
  },
};

// Bare enum values like "medium" or "recommended" read as unexplained
// jargon on their own. These give every badge a plain-language label
// instead of the raw schema value.
export const SEVERITY_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { info: "Info", low: "Low severity", medium: "Medium severity", high: "High severity", critical: "Critical" },
  ko: { info: "정보", low: "낮은 심각도", medium: "중간 심각도", high: "높은 심각도", critical: "긴급" },
};
export const LEVEL_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { low: "low", medium: "medium", high: "high" },
  ko: { low: "낮음", medium: "중간", high: "높음" },
};
export const STATUS_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { proposed: "Proposed", recommended: "Recommended", decided: "Decided", rejected: "Rejected" },
  ko: { proposed: "제안", recommended: "권장", decided: "결정됨", rejected: "반려" },
};

/**
 * Minimum shape every block shares once validated. The explicit `| undefined`
 * is required by `exactOptionalPropertyTypes`: a Zod `.optional()` field is
 * present-and-undefined, not absent.
 */
export interface BlockLike {
  id: string;
  sourceRefs?: string[] | undefined;
  confidence?: "verified" | "inferred" | "unknown" | undefined;
}

export function confidenceTag(block: BlockLike, ctx: RenderContext): string {
  if (!block.confidence) return "";
  const key: keyof UiStrings =
    block.confidence === "verified"
      ? "confidenceVerified"
      : block.confidence === "inferred"
        ? "confidenceInferred"
        : "confidenceUnknown";
  return `<span class="confidence-tag" data-confidence="${block.confidence}">${STRINGS[ctx.language][key]}</span>`;
}

export function sourceNoteList(block: BlockLike, ctx: RenderContext): string {
  const refs = block.sourceRefs ?? [];
  if (refs.length === 0) return "";
  const items = refs.map((id) => renderSourceListItem(ctx.sourcesById.get(id), id)).join("");
  return `<div class="blk-source-note" aria-label="${STRINGS[ctx.language].sources}"><ul>${items}</ul></div>`;
}

export function renderSourceListItem(source: FormaSource | undefined, fallbackId: string): string {
  if (!source) return `<li><span class="blk-source-note__label">${escapeHtml(fallbackId)}</span></li>`;

  const label = escapeHtml(source.label);
  if (!source.path) {
    return `<li><span class="blk-source-note__label">${label}</span></li>`;
  }

  const safeUrl = sanitizeUrl(source.path);
  const isLinkedUrl = source.kind === "url" && safeUrl !== "#";
  const renderedLabel = isLinkedUrl
    ? `<a class="blk-source-note__link" href="${escapeHtml(safeUrl)}" target="_blank" rel="noopener noreferrer" referrerpolicy="no-referrer">${label}</a>`
    : `<span class="blk-source-note__label">${label}</span>`;
  return `<li>${renderedLabel}<code class="blk-source-note__locator">${escapeHtml(source.path)}</code></li>`;
}

export function section(id: string, className: string, inner: string): string {
  return `<section class="section ${className}" id="${escapeHtml(id)}">${inner}</section>`;
}

/**
 * Prose-width text blocks (narrative, summary, prose, timeline, finding,
 * risk, decision) constrain their *content* to reading width, but the
 * section itself must stay full width — otherwise the section's own
 * border-block-end divider shrinks to the narrow content width too,
 * reading as an abrupt, oddly-centered fragment instead of a normal
 * full-bleed section boundary.
 */
export function measureWrap(inner: string): string {
  return `<div class="measure">${inner}</div>`;
}
