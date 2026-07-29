import { describe, expect, it } from "vitest";
import { STARTER_SPEC } from "../../src/cli/starter-spec.js";
import { applyComposition } from "../../src/renderer/composition.js";
import { renderSpecToHtml } from "../../src/renderer/shell.js";
import type { FormaSpec } from "../../src/spec/schema.js";

const before = {
  density: "compact",
  measure: "narrow",
  figurePlacement: "before",
  typeScale: "compact",
} as const;

describe("composition axes", () => {
  it("writes every axis into the rendered document", async () => {
    const { html } = await renderSpecToHtml(STARTER_SPEC, before);
    expect(html).toContain('data-density="compact"');
    expect(html).toContain('data-measure="narrow"');
    expect(html).toContain('data-figure-placement="before"');
    expect(html).toContain('data-type-scale="compact"');
  });

  it("moves a breakout figure before the measure it illustrates", () => {
    const spec: FormaSpec = structuredClone(STARTER_SPEC);
    spec.sections.splice(2, 0, {
      id: "overview-figure",
      type: "figure",
      caption: "Overview evidence",
      of: "overview",
    });

    const composed = applyComposition(spec, before);
    expect(composed.sections.map((section) => section.id).slice(1, 4)).toEqual([
      "overview-figure",
      "overview",
      "finding",
    ]);
    expect(spec.sections.map((section) => section.id).slice(1, 4)).toEqual([
      "overview",
      "overview-figure",
      "finding",
    ]);
  });

  it("keeps authored section order for the after placement", () => {
    const spec: FormaSpec = structuredClone(STARTER_SPEC);
    spec.sections.splice(2, 0, {
      id: "overview-figure",
      type: "figure",
      caption: "Overview evidence",
      of: "overview",
    });
    const ids = spec.sections.map((section) => section.id);

    const composed = applyComposition(spec, { ...before, figurePlacement: "after" });
    expect(composed.sections.map((section) => section.id)).toEqual(ids);
  });

  it("does not move non-figure breakout blocks", () => {
    const spec: FormaSpec = structuredClone(STARTER_SPEC);
    spec.sections.splice(2, 0, {
      id: "sources",
      type: "source-ledger",
      entries: [],
    });
    const ids = spec.sections.map((section) => section.id);

    const composed = applyComposition(spec, before);
    expect(composed.sections.map((section) => section.id)).toEqual(ids);
  });
});
