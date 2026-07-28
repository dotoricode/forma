import { describe, expect, it } from "vitest";
import { migrateSpec } from "../../src/spec/migrations.js";

const legacy = (meta: Record<string, unknown>) => ({
  version: "0.1",
  meta: { title: "t", audience: "engineering", language: "ko", ...meta },
  narrative: { question: "q", summary: "s" },
  sections: [{ id: "a", type: "prose", body: "b" }],
});

type MigratedMeta = {
  artifact: string;
  purpose: string;
  variant: string;
  colorMode?: string;
  mode?: unknown;
  theme?: unknown;
  designSystem?: unknown;
};
const metaOf = (spec: unknown) => (spec as { meta: MigratedMeta }).meta;

describe("migrateSpec", () => {
  it("leaves a 0.2 spec untouched so re-running is a no-op", () => {
    const current = { version: "0.2", meta: { artifact: "report" } };
    const result = migrateSpec(current);
    expect(result.migrated).toBe(false);
    expect(result.spec).toBe(current);
    expect(result.warnings).toEqual([]);
  });

  it.each([
    ["simple", "report", "technical"],
    ["guide", "manual", "procedural"],
    ["magazine", "report", "editorial"],
    // pre-rename identifiers are still accepted at the boundary
    ["developer-docs", "manual", "procedural"],
    ["editorial-magazine", "report", "editorial"],
  ] as const)("maps designSystem '%s' to %s/%s", (designSystem, artifact, variant) => {
    const meta = metaOf(migrateSpec(legacy({ designSystem })).spec);
    expect(meta.artifact).toBe(artifact);
    expect(meta.variant).toBe(variant);
  });

  it("lets an explicit 0.1 mode of report/manual name the artifact over designSystem", () => {
    // `mode` said what the document was; `designSystem` only said how it
    // looked, so the mode is the stronger signal when the two disagree.
    const meta = metaOf(migrateSpec(legacy({ mode: "manual", designSystem: "magazine" })).spec);
    expect(meta.artifact).toBe("manual");
  });

  it("warns instead of guessing when 'workspace' could be either artifact", () => {
    const result = migrateSpec(legacy({ designSystem: "workspace" }));
    expect(result.warnings.some((w) => w.field === "meta.designSystem")).toBe(true);
    expect(result.warnings.some((w) => w.message.includes("dashboard"))).toBe(true);
    expect(metaOf(result.spec).artifact).toBe("report");
  });

  it("warns when a 0.1 spec had no mode to derive a purpose from", () => {
    const result = migrateSpec(legacy({ designSystem: "simple" }));
    expect(result.warnings.some((w) => w.field === "meta.mode")).toBe(true);
    expect(metaOf(result.spec).purpose).toBe("explain");
  });

  it("warns on an unrecognized designSystem rather than dropping it silently", () => {
    const result = migrateSpec(legacy({ designSystem: "brutalist" }));
    expect(result.warnings.some((w) => w.message.includes("brutalist"))).toBe(true);
    expect(metaOf(result.spec).artifact).toBe("report");
  });

  it("carries theme across to colorMode", () => {
    expect(metaOf(migrateSpec(legacy({ theme: "dark" })).spec).colorMode).toBe("dark");
  });

  it("drops the three superseded fields so they cannot be read by accident", () => {
    const meta = metaOf(
      migrateSpec(legacy({ mode: "review", theme: "dark", designSystem: "simple" })).spec,
    );
    expect(meta.mode).toBeUndefined();
    expect(meta.theme).toBeUndefined();
    expect(meta.designSystem).toBeUndefined();
  });
});
