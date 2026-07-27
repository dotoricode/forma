/**
 * Block renderers: one pure function per semantic block type. Each takes a
 * validated block plus shared context (language, confidence markup helper)
 * and returns a self-contained HTML fragment. No block renderer touches the
 * DOM or invents its own escaping — see security/sanitize.ts.
 */
import type { FormaBlock, FormaSource } from "../spec/schema.js";
import {
  escapeHtml,
  renderInlineMarkdown,
  sanitizeSvg,
  sanitizeUrl,
} from "../security/sanitize.js";
import { highlightLines } from "./highlight.js";
import { parseUnifiedDiff, renderDiffHunksHtml } from "./diff-view.js";
import {
  renderArchitectureSvg,
  renderChartSvg,
  renderFlowSvg,
  renderSequenceSvg,
} from "./diagrams.js";

export interface RenderContext {
  sourcesById: Map<string, FormaSource>;
  language: "ko" | "en";
}

interface UiStrings {
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

const STRINGS: Record<"ko" | "en", UiStrings> = {
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
const SEVERITY_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { info: "Info", low: "Low severity", medium: "Medium severity", high: "High severity", critical: "Critical" },
  ko: { info: "정보", low: "낮은 심각도", medium: "중간 심각도", high: "높은 심각도", critical: "긴급" },
};
const LEVEL_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { low: "low", medium: "medium", high: "high" },
  ko: { low: "낮음", medium: "중간", high: "높음" },
};
const STATUS_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { proposed: "Proposed", recommended: "Recommended", decided: "Decided", rejected: "Rejected" },
  ko: { proposed: "제안", recommended: "권장", decided: "결정됨", rejected: "반려" },
};

function confidenceTag(block: FormaBlock, ctx: RenderContext): string {
  if (!block.confidence) return "";
  const key: keyof UiStrings =
    block.confidence === "verified"
      ? "confidenceVerified"
      : block.confidence === "inferred"
        ? "confidenceInferred"
        : "confidenceUnknown";
  return `<span class="confidence-tag" data-confidence="${block.confidence}">${STRINGS[ctx.language][key]}</span>`;
}

function sourceNoteList(block: FormaBlock, ctx: RenderContext): string {
  const refs = "sourceRefs" in block ? (block.sourceRefs ?? []) : [];
  if (refs.length === 0) return "";
  const items = refs
    .map((id) => {
      const source = ctx.sourcesById.get(id);
      return renderSourceListItem(source, id);
    })
    .join("");
  return `<div class="blk-source-note" aria-label="${STRINGS[ctx.language].sources}"><ul>${items}</ul></div>`;
}

function renderSourceListItem(source: FormaSource | undefined, fallbackId: string): string {
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

export async function renderBlock(block: FormaBlock, ctx: RenderContext): Promise<string> {
  switch (block.type) {
    case "cover":
      return renderCover(block, ctx);
    case "summary":
      return renderSummary(block, ctx);
    case "prose":
      return renderProse(block, ctx);
    case "key-points":
      return renderKeyPoints(block, ctx);
    case "annotated-code":
      return renderAnnotatedCode(block, ctx);
    case "diff":
      return renderDiff(block, ctx);
    case "flow":
      return renderFlow(block, ctx);
    case "sequence":
      return renderSequence(block, ctx);
    case "timeline":
      return renderTimeline(block, ctx);
    case "comparison":
      return renderComparison(block, ctx);
    case "architecture":
      return renderArchitecture(block, ctx);
    case "test-summary":
      return renderTestSummary(block, ctx);
    case "test-matrix":
      return renderTestMatrix(block, ctx);
    case "chart":
      return renderChart(block, ctx);
    case "finding":
      return renderFinding(block, ctx);
    case "risk":
      return renderRisk(block, ctx);
    case "decision":
      return renderDecision(block, ctx);
    case "actions":
      return renderActions(block, ctx);
    case "glossary":
      return renderGlossary(block, ctx);
    case "source-note":
      return renderSourceNote(block, ctx);
  }
}

function section(id: string, className: string, inner: string): string {
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
function measureWrap(inner: string): string {
  return `<div class="measure">${inner}</div>`;
}

function renderCover(block: Extract<FormaBlock, { type: "cover" }>, ctx: RenderContext): string {
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
}

function renderSummary(block: Extract<FormaBlock, { type: "summary" }>, ctx: RenderContext): string {
  return section(
    block.id,
    "blk-summary",
    measureWrap(
      `<h2 class="blk-summary__title">${escapeHtml(block.title)}${confidenceTag(block, ctx)}</h2><div class="blk-summary__body">${renderInlineMarkdown(block.body)}</div>${sourceNoteList(block, ctx)}`,
    ),
  );
}

function renderProse(block: Extract<FormaBlock, { type: "prose" }>, ctx: RenderContext): string {
  const title = block.title ? `<h2 class="blk-prose__title">${escapeHtml(block.title)}</h2>` : "";
  return section(
    block.id,
    "blk-prose",
    measureWrap(
      `${title}<div class="blk-prose__body">${renderInlineMarkdown(block.body)}</div>${sourceNoteList(block, ctx)}`,
    ),
  );
}

function renderKeyPoints(
  block: Extract<FormaBlock, { type: "key-points" }>,
  ctx: RenderContext,
): string {
  const title = block.title
    ? `<h2 class="blk-key-points__title">${escapeHtml(block.title)}</h2>`
    : "";
  const items = block.points.map((p) => `<li>${escapeHtml(p)}</li>`).join("");
  return section(block.id, "blk-key-points", `${title}<ol>${items}</ol>${sourceNoteList(block, ctx)}`);
}

async function renderAnnotatedCode(
  block: Extract<FormaBlock, { type: "annotated-code" }>,
  ctx: RenderContext,
): Promise<string> {
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
}

function renderDiff(block: Extract<FormaBlock, { type: "diff" }>, ctx: RenderContext): string {
  const title = block.title ? `<h2 class="blk-diff__title">${escapeHtml(block.title)}</h2>` : "";
  const hunks = parseUnifiedDiff(block.unifiedDiff);
  return section(
    block.id,
    "blk-diff breakout",
    `${title}<div class="blk-diff__frame">${renderDiffHunksHtml(hunks)}</div>${sourceNoteList(block, ctx)}`,
  );
}

function renderFlow(block: Extract<FormaBlock, { type: "flow" }>, ctx: RenderContext): string {
  const title = block.title ? `<h2 class="blk-diagram__title">${escapeHtml(block.title)}</h2>` : "";
  return section(
    block.id,
    "blk-diagram breakout",
    `${title}<div class="blk-diagram__canvas">${sanitizeSvg(renderFlowSvg(block))}</div>${sourceNoteList(block, ctx)}`,
  );
}

function renderSequence(block: Extract<FormaBlock, { type: "sequence" }>, ctx: RenderContext): string {
  const title = block.title ? `<h2 class="blk-diagram__title">${escapeHtml(block.title)}</h2>` : "";
  return section(
    block.id,
    "blk-diagram breakout",
    `${title}<div class="blk-diagram__canvas">${sanitizeSvg(renderSequenceSvg(block))}</div>${sourceNoteList(block, ctx)}`,
  );
}

function renderTimeline(block: Extract<FormaBlock, { type: "timeline" }>, ctx: RenderContext): string {
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
}

function renderComparison(
  block: Extract<FormaBlock, { type: "comparison" }>,
  ctx: RenderContext,
): string {
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
}

function renderArchitecture(
  block: Extract<FormaBlock, { type: "architecture" }>,
  ctx: RenderContext,
): string {
  const title = block.title ? `<h2 class="blk-diagram__title">${escapeHtml(block.title)}</h2>` : "";
  return section(
    block.id,
    "blk-diagram breakout",
    `${title}<div class="blk-diagram__canvas">${sanitizeSvg(renderArchitectureSvg(block))}</div>${sourceNoteList(block, ctx)}`,
  );
}

function renderTestSummary(
  block: Extract<FormaBlock, { type: "test-summary" }>,
  ctx: RenderContext,
): string {
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
}

function renderTestMatrix(
  block: Extract<FormaBlock, { type: "test-matrix" }>,
  ctx: RenderContext,
): string {
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
}

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

function renderChart(block: Extract<FormaBlock, { type: "chart" }>, ctx: RenderContext): string {
  const title = block.title ? `<h2 class="blk-chart__title">${escapeHtml(block.title)}</h2>` : "";
  return section(
    block.id,
    "blk-chart breakout",
    `${title}${sanitizeSvg(renderChartSvg(block))}${sourceNoteList(block, ctx)}`,
  );
}

function renderFinding(block: Extract<FormaBlock, { type: "finding" }>, ctx: RenderContext): string {
  const severityLabel = SEVERITY_LABEL[ctx.language][block.severity] ?? block.severity;
  return section(
    block.id,
    "blk-finding",
    measureWrap(
      `<div data-severity="${block.severity}"><p class="blk-finding__badge">${escapeHtml(severityLabel)}${confidenceTag(block, ctx)}</p><h3 class="blk-finding__title">${escapeHtml(block.title)}</h3><div>${renderInlineMarkdown(block.body)}</div></div>${sourceNoteList(block, ctx)}`,
    ),
  );
}

const RISK_GRID_LABEL: Record<"ko" | "en", { likelihood: string; impact: string; mitigation: string }> = {
  en: { likelihood: "Likelihood", impact: "Impact", mitigation: "Mitigation" },
  ko: { likelihood: "가능성", impact: "영향", mitigation: "대응" },
};

function renderRisk(block: Extract<FormaBlock, { type: "risk" }>, ctx: RenderContext): string {
  const l = LEVEL_LABEL[ctx.language];
  const g = RISK_GRID_LABEL[ctx.language];
  return section(
    block.id,
    "blk-risk",
    measureWrap(
      `<p class="blk-risk__badge">${g.likelihood} ${escapeHtml(l[block.likelihood] ?? block.likelihood)} · ${g.impact} ${escapeHtml(l[block.impact] ?? block.impact)}${confidenceTag(block, ctx)}</p><h3 class="blk-risk__title">${escapeHtml(block.title)}</h3><dl class="blk-risk__grid"><div><dt>${g.mitigation}</dt><dd>${escapeHtml(block.mitigation)}</dd></div></dl>${sourceNoteList(block, ctx)}`,
    ),
  );
}

function renderDecision(block: Extract<FormaBlock, { type: "decision" }>, ctx: RenderContext): string {
  const statusLabel = STATUS_LABEL[ctx.language][block.status] ?? block.status;
  return section(
    block.id,
    "blk-decision",
    measureWrap(
      `<div class="decision-strip"><p class="decision-strip__status">${escapeHtml(statusLabel)}${confidenceTag(block, ctx)}</p><h3 class="decision-strip__title">${escapeHtml(block.title)}</h3><p>${renderInlineMarkdown(block.rationale)}</p></div>${sourceNoteList(block, ctx)}`,
    ),
  );
}

function renderActions(block: Extract<FormaBlock, { type: "actions" }>, ctx: RenderContext): string {
  const title = block.title
    ? `<h2 class="blk-actions__title">${escapeHtml(block.title)}</h2>`
    : "";
  const items = block.items
    .map(
      (item) =>
        `<li class="blk-actions__item"><span>${escapeHtml(item.label)}</span><span class="blk-actions__owner">${escapeHtml([item.owner, item.due].filter(Boolean).join(" · "))}</span></li>`,
    )
    .join("");
  return section(block.id, "blk-actions", `${title}<ul class="blk-actions__list">${items}</ul>${sourceNoteList(block, ctx)}`);
}

function renderGlossary(block: Extract<FormaBlock, { type: "glossary" }>, ctx: RenderContext): string {
  const title = block.title
    ? `<h2 class="blk-glossary__title">${escapeHtml(block.title)}</h2>`
    : "";
  const items = block.terms
    .map((t) => `<dt>${escapeHtml(t.term)}</dt><dd>${escapeHtml(t.definition)}</dd>`)
    .join("");
  return section(block.id, "blk-glossary", `${title}<dl>${items}</dl>${sourceNoteList(block, ctx)}`);
}

function renderSourceNote(
  block: Extract<FormaBlock, { type: "source-note" }>,
  ctx: RenderContext,
): string {
  // A standalone source-note with no sourceRefs of its own is meant as the
  // document's closing bibliography — list every source in the spec rather
  // than rendering an empty (but still TOC-linked) section.
  const hasOwnRefs = (block.sourceRefs ?? []).length > 0;
  const body = hasOwnRefs
    ? sourceNoteList(block, ctx)
    : renderAllSources(ctx);
  const title = block.title ? `<h2 class="blk-source-note__title">${escapeHtml(block.title)}</h2>` : "";
  return section(block.id, "blk-source-note", measureWrap(`${title}${body}`));
}

function renderAllSources(ctx: RenderContext): string {
  const sources = Array.from(ctx.sourcesById.values());
  if (sources.length === 0) return "";
  const items = sources.map((source) => renderSourceListItem(source, source.id)).join("");
  return `<ul>${items}</ul>`;
}
