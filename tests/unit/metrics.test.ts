import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { validateFormaSpec } from "../../src/spec/validate.js";
import { renderBreakdownSvg, renderSparklineSvg } from "../../src/renderer/sparkline.js";

const dashboard = (sections: unknown[]) => ({
  version: "0.2",
  meta: {
    title: "t",
    artifact: "dashboard",
    purpose: "monitor",
    audience: "engineering",
    language: "ko",
    variant: "overview",
  },
  sources: [],
  narrative: { question: "q", summary: "s" },
  sections,
});

const filling = [
  { id: "st", type: "status-header", headline: "h", status: "normal" },
  { id: "an", type: "anomaly", what: "w", when: "now", magnitude: "2x" },
  { id: "bd", type: "breakdown", unit: "%", reading: "r", contributions: [{ label: "l", value: 1 }] },
  { id: "ac", type: "action-plan", items: [{ id: "a", label: "l", owner: "o" }] },
  { id: "fr", type: "data-freshness", asOf: "now", coverage: "all" },
];

/**
 * A dashboard almost never misleads with a wrong number. It misleads with a
 * right number that has no basis.
 */
describe("metric checking", () => {
  it("rejects a metric with no period", () => {
    const result = validateFormaSpec(
      dashboard([...filling, { id: "m", type: "metric", label: "통과율", value: 95.2 }]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("metric-without-context"))).toBe(true);
    }
  });

  it("accepts the same metric once it states its period", () => {
    const result = validateFormaSpec(
      dashboard([
        ...filling,
        { id: "m", type: "metric", label: "통과율", value: 95.2, period: "2026-07-24" },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("checks metrics nested inside a group too", () => {
    const result = validateFormaSpec(
      dashboard([
        ...filling,
        {
          id: "g",
          type: "metric-group",
          metrics: [
            { id: "a", label: "A", value: 1, period: "now" },
            { id: "b", label: "B", value: 2 },
          ],
        },
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.message.includes("'B'"))).toBe(true);
    }
  });

  it("rejects a dashboard that shows metrics without saying how fresh they are", () => {
    const withoutFreshness = filling.filter((block) => block.type !== "data-freshness");
    const result = validateFormaSpec(
      dashboard([
        ...withoutFreshness,
        { id: "m", type: "metric", label: "A", value: 1, period: "now" },
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("dashboard-without-freshness"))).toBe(true);
    }
  });

  it("rejects a cover on a dashboard", () => {
    const result = validateFormaSpec(
      dashboard([{ id: "c", type: "cover", title: "t" }, ...filling]),
    );
    expect(result.ok).toBe(false);
  });

  it("accepts the shipped dashboard fixture end to end", async () => {
    const raw = JSON.parse(
      await readFile("fixtures/dashboard/release-gate/forma.spec.json", "utf-8"),
    );
    const result = validateFormaSpec(raw);
    if (!result.ok) {
      throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
    }
    expect(result.plan.roles.map((r) => r.role)).toEqual(
      expect.arrayContaining(["status", "kpi", "change", "driver", "action", "freshness"]),
    );
  });
});

describe("sparkline rendering", () => {
  it("breaks the line at a gap instead of drawing through it", () => {
    // Drawing across a gap asserts measurements nobody took.
    const svg = renderSparklineSvg({ values: [1, 2, null, 4, 5] });
    expect((svg.match(/<polyline/g) ?? []).length).toBe(2);
  });

  it("draws a lone measurement as a point, not a zero-length line", () => {
    const svg = renderSparklineSvg({ values: [null, 3, null] });
    expect(svg).toContain("spark-point");
    expect(svg).not.toContain("<polyline");
  });

  it("does not divide by zero on a flat series", () => {
    const svg = renderSparklineSvg({ values: [5, 5, 5] });
    expect(svg).not.toContain("NaN");
    expect(svg).toContain("<polyline");
  });

  it("survives an all-missing series without producing NaN geometry", () => {
    const svg = renderSparklineSvg({ values: [null, null] });
    expect(svg).not.toContain("NaN");
  });

  it("keeps a small negative value visible instead of rounding it to zero", () => {
    const svg = renderBreakdownSvg([{ label: "a", value: -0.002 }]);
    expect(svg).toContain("-0.002");
  });

  it("escapes labels rather than trusting them in markup", () => {
    const svg = renderBreakdownSvg([{ label: "<script>", value: 1 }]);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&lt;script&gt;");
  });
});
