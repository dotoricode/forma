import { renderToStaticMarkup } from "react-dom/server";
import type { FormaSpec } from "../spec/schema.js";
import type { FormaSource } from "../spec/source.js";
import { prepareBlocks, type RenderContext } from "../blocks/registry.js";
import { DocumentBody, TableOfContents } from "./document.js";

export interface ComposedDocument {
  bodyHtml: string;
  tocHtml: string;
  sansText: string;
  monoText: string;
}

/**
 * Renders the document body and table of contents to static markup.
 *
 * `renderToStaticMarkup` emits no hydration markers and no runtime, so the
 * shipped HTML contains zero React. The React version is pinned exactly in
 * package.json: its escaping and attribute serialization are part of the
 * output, and a minor bump could change bytes that golden comparisons treat
 * as meaningful.
 */
export async function composeDocument(spec: FormaSpec): Promise<ComposedDocument> {
  const sourcesById = new Map<string, FormaSource>(spec.sources.map((s) => [s.id, s]));
  const ctx: RenderContext = { sourcesById, language: spec.meta.language };

  const prepared = await prepareBlocks(spec.sections, ctx);

  const bodyHtml = renderToStaticMarkup(
    <DocumentBody spec={spec} ctx={ctx} prepared={prepared} />,
  );
  const toc = TableOfContents({ spec });
  const tocHtml = toc ? renderToStaticMarkup(toc) : "";

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
