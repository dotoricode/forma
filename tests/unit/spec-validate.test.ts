import { describe, expect, it } from "vitest";
import { validateFormaSpec } from "../../src/spec/validate.js";
import { STARTER_SPEC } from "../../src/cli/starter-spec.js";

describe("validateFormaSpec", () => {
  it("accepts the starter spec", () => {
    const result = validateFormaSpec(STARTER_SPEC);
    expect(result.ok).toBe(true);
  });

  it("rejects a spec missing a required narrative.question", () => {
    const broken = structuredClone(STARTER_SPEC) as Record<string, unknown>;
    const narrative = broken["narrative"] as Record<string, unknown>;
    delete narrative["question"];
    const result = validateFormaSpec(broken);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("question"))).toBe(true);
    }
  });

  it("rejects an unknown block type", () => {
    const broken = structuredClone(STARTER_SPEC) as Record<string, unknown>;
    (broken["sections"] as unknown[]).push({ id: "x", type: "not-a-real-block" });
    const result = validateFormaSpec(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects a spec with zero sections", () => {
    const broken = structuredClone(STARTER_SPEC) as Record<string, unknown>;
    broken["sections"] = [];
    const result = validateFormaSpec(broken);
    expect(result.ok).toBe(false);
  });

  it("defaults theme, density, and confidentiality when omitted", () => {
    const minimal = {
      version: "0.1",
      meta: {
        title: "Minimal",
        mode: "explain",
        audience: "self",
        language: "en",
      },
      narrative: { question: "q", summary: "s" },
      sections: [{ id: "a", type: "prose", body: "hello" }],
    };
    const result = validateFormaSpec(minimal);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.meta.theme).toBe("light");
      expect(result.spec.meta.density).toBe("comfortable");
      expect(result.spec.meta.confidentiality).toBe("internal");
    }
  });

  it("rejects a confidence value outside verified|inferred|unknown", () => {
    const broken = structuredClone(STARTER_SPEC) as Record<string, unknown>;
    (broken["sections"] as Record<string, unknown>[])[1]!["confidence"] = "definitely";
    const result = validateFormaSpec(broken);
    expect(result.ok).toBe(false);
  });
});
