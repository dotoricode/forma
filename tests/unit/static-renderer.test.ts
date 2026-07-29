import { describe, expect, it } from "vitest";
import { renderSpecToHtml } from "../../src/renderer/shell.js";
import { renderBlockToHtml } from "../../src/renderer/static.js";
import { STARTER_SPEC } from "../../src/cli/starter-spec.js";
import type { RenderContext } from "../../src/blocks/registry.js";
import type { FormaSpec } from "../../src/spec/schema.js";

const ctx: RenderContext = { language: "ko", sourcesById: new Map() };

/**
 * Moving to TSX put React in the build. These guard the two things that
 * would make that a bad trade: React leaking into the shipped page, and the
 * renderer becoming non-deterministic.
 */
describe("static compiler", () => {
  it("ships no React runtime in the rendered document", async () => {
    const { html } = await renderSpecToHtml(STARTER_SPEC);
    // renderToStaticMarkup emits no hydration markers; if it were ever
    // swapped for renderToString, these would appear.
    expect(html).not.toContain("data-reactroot");
    expect(html).not.toMatch(/<!--\$-->|<!--\/\$-->/);
    expect(html).not.toContain("react-dom");
    expect(html.toLowerCase()).not.toContain("createroot");
  });

  it("renders the same spec to identical bytes on repeat runs", async () => {
    const [first, second] = await Promise.all([
      renderSpecToHtml(STARTER_SPEC),
      renderSpecToHtml(STARTER_SPEC),
    ]);
    expect(first.html).toBe(second.html);
  });

  it("does not nest a paragraph inside a paragraph", async () => {
    // The string renderer wrapped the decision block's rationale in <p>,
    // and renderInlineMarkdown wrapped it again, so the shipped markup was
    // <p><p>…</p></p> and browsers split it into siblings. Components make
    // that shape unrepresentable; this keeps it that way.
    const spec: FormaSpec = structuredClone(STARTER_SPEC);
    const { html } = await renderSpecToHtml(spec);
    expect(html).not.toMatch(/<p[^>]*>\s*<p[^>]*>/);
  });

  it("runs a block's async prepare before rendering it", async () => {
    const html = await renderBlockToHtml(
      {
        id: "code",
        type: "annotated-code",
        language: "ts",
        code: "const answer = 42;",
        highlightLines: [],
        annotations: [],
      },
      ctx,
    );
    // Shiki ran: the source is present as highlighted spans, not raw text.
    expect(html).toContain("blk-code__lines");
    expect(html).toContain("42");
    expect(html).toContain("<span");
  });

  it("escapes text content rather than trusting it", async () => {
    const html = await renderBlockToHtml(
      { id: "p", type: "prose", body: "<script>alert(1)</script>" },
      ctx,
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("renders a line chart as colored, labelled series rather than identical bars", async () => {
    const html = await renderBlockToHtml(
      {
        id: "trend",
        type: "chart",
        title: "Build health",
        kind: "line",
        categories: ["Mon", "Tue", "Wed"],
        series: [
          { label: "Pass", values: [91, 94, 98] },
          { label: "Fail", values: [9, 6, 2] },
        ],
        unit: "%",
      },
      ctx,
    );

    expect(html).toContain('class="chart-line"');
    expect(html).toContain('data-series="0"');
    expect(html).toContain('data-series="1"');
    expect(html).toContain('class="blk-chart__legend"');
    expect(html).toContain("Pass");
    expect(html).toContain("Fail");
    expect(html).not.toContain('class="chart-bar"');
  });
});
