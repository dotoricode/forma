import type { FormaSpec, FormaSource } from "../spec/schema.js";
import { renderBlock, type RenderContext } from "./blocks.js";
import { escapeHtml, renderInlineMarkdown } from "../security/sanitize.js";

export interface ComposedDocument {
  bodyHtml: string;
  tocHtml: string;
  sansText: string;
  monoText: string;
}

const NAV_LABEL: Record<"ko" | "en", string> = {
  en: "Section navigation",
  ko: "섹션 이동",
};

function sectionTitle(block: FormaSpec["sections"][number]): string | null {
  if ("title" in block && typeof block.title === "string") return block.title;
  return null;
}

export async function composeDocument(spec: FormaSpec): Promise<ComposedDocument> {
  const sourcesById = new Map<string, FormaSource>(spec.sources.map((s) => [s.id, s]));
  const ctx: RenderContext = { sourcesById, language: spec.meta.language };

  const narrativeHtml = `<section class="section blk-narrative" id="narrative"><div class="measure">
    <p class="blk-narrative__question">${escapeHtml(spec.narrative.question)}</p>
    <div class="blk-narrative__summary">${renderInlineMarkdown(spec.narrative.summary)}</div>
    ${
      spec.narrative.takeaways.length > 0
        ? `<ul class="blk-takeaways">${spec.narrative.takeaways.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}</ul>`
        : ""
    }
  </div></section>`;

  const rendered = await Promise.all(spec.sections.map((block) => renderBlock(block, ctx)));
  // The title (cover) must be the first thing a reader sees. When a spec
  // leads with a `cover` block, the question/summary narrative slots in
  // right after it instead of floating above the title.
  const bodyHtml =
    spec.sections[0]?.type === "cover"
      ? [rendered[0], narrativeHtml, ...rendered.slice(1)].join("\n")
      : narrativeHtml + rendered.join("\n");

  const tocEntries = spec.sections
    .map((block) => ({ id: block.id, title: sectionTitle(block) }))
    .filter((entry): entry is { id: string; title: string } => Boolean(entry.title));
  const tocHtml =
    tocEntries.length > 0
      ? `<nav class="toc" aria-label="${NAV_LABEL[spec.meta.language]}">${tocEntries
          .map((entry) => `<a href="#${escapeHtml(entry.id)}">${escapeHtml(entry.title)}</a>`)
          .join("")}</nav>`
      : "";

  const { sansText, monoText } = collectText(spec);

  return { bodyHtml, tocHtml, sansText, monoText };
}

/** Walks the whole spec to gather visible text, split by which typeface renders it. */
function collectText(spec: FormaSpec): { sansText: string; monoText: string } {
  const sansParts: string[] = [spec.meta.title, spec.meta.subtitle ?? ""];
  const monoParts: string[] = [];

  sansParts.push(spec.narrative.question, spec.narrative.summary, ...spec.narrative.takeaways);
  for (const source of spec.sources) sansParts.push(source.label);

  for (const block of spec.sections) {
    switch (block.type) {
      case "annotated-code":
        monoParts.push(block.code);
        sansParts.push(block.title ?? "", ...block.annotations.map((a) => a.text));
        break;
      case "diff":
        monoParts.push(block.unifiedDiff);
        sansParts.push(block.title ?? "");
        break;
      default:
        sansParts.push(...extractStrings(block));
    }
  }

  return { sansText: sansParts.join("\n"), monoText: monoParts.join("\n") };
}

function extractStrings(value: unknown): string[] {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(extractStrings);
  if (value && typeof value === "object") {
    return Object.values(value as Record<string, unknown>).flatMap(extractStrings);
  }
  return [];
}
