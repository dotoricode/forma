/**
 * The static compiler boundary.
 *
 * One place turns a React tree into HTML text. Everything upstream is
 * components; everything downstream is a string being inlined, sanitized,
 * and written to disk. Keeping the boundary in one module is what lets the
 * Decision Room reuse the same components with a different host.
 */
import { renderToStaticMarkup } from "react-dom/server";
import {
  prepareBlocks,
  renderBlockElement,
  type FormaBlock,
  type RenderContext,
} from "../blocks/registry.js";

/**
 * Renders a single block to HTML, running its async `prepare` first.
 *
 * Used by tests and component review. The document path uses
 * `composeDocument`, which prepares every block in one pass instead of one
 * round trip per block.
 */
export async function renderBlockToHtml(block: FormaBlock, ctx: RenderContext): Promise<string> {
  const prepared = await prepareBlocks([block], ctx);
  return renderToStaticMarkup(renderBlockElement(block, ctx, prepared));
}
