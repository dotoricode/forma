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

  it("defaults colorMode, density, interaction, and confidentiality when omitted", () => {
    const minimal = {
      version: "0.2",
      meta: {
        title: "Minimal",
        artifact: "report",
        purpose: "explain",
        audience: "self",
        language: "en",
      },
      narrative: { question: "q", summary: "s" },
      sections: [{ id: "a", type: "prose", body: "hello" }],
    };
    // Composition is skipped so this stays a test of schema defaults rather
    // than of the report contract, which a one-block spec cannot satisfy.
    const result = validateFormaSpec(minimal, { skipComposition: true });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.spec.meta.colorMode).toBe("light");
      expect(result.spec.meta.density).toBe("comfortable");
      expect(result.spec.meta.interaction).toBe("static");
      expect(result.spec.meta.confidentiality).toBe("internal");
    }
  });

  it("rejects a confidence value outside verified|inferred|unknown", () => {
    const broken = structuredClone(STARTER_SPEC) as Record<string, unknown>;
    (broken["sections"] as Record<string, unknown>[])[1]!["confidence"] = "definitely";
    const result = validateFormaSpec(broken);
    expect(result.ok).toBe(false);
  });

  it("rejects a variant that belongs to a different artifact", () => {
    const mismatched = structuredClone(STARTER_SPEC);
    mismatched.meta.variant = "quickstart"; // a manual variant on a report
    const result = validateFormaSpec(mismatched);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("variant-artifact-mismatch"))).toBe(true);
    }
  });

  it("renders a 0.1 spec by migrating it rather than rejecting it", () => {
    const legacy = {
      version: "0.1",
      meta: {
        title: "Legacy onboarding guide",
        mode: "manual",
        audience: "engineering",
        language: "ko",
        theme: "dark",
        designSystem: "developer-docs",
      },
      narrative: { question: "q", summary: "s" },
      sections: [{ id: "a", type: "prose", body: "hello" }],
    };
    const result = validateFormaSpec(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.migrated).toBe(true);
      expect(result.spec.meta.artifact).toBe("manual");
      expect(result.spec.meta.variant).toBe("procedural");
      expect(result.spec.meta.purpose).toBe("operate");
      expect(result.spec.meta.colorMode).toBe("dark");
    }
  });

  it("reports a legacy spec's unmet contract as a warning, not a failure", () => {
    const legacy = {
      version: "0.1",
      meta: { title: "Legacy", mode: "manual", audience: "engineering", language: "ko" },
      narrative: { question: "q", summary: "s" },
      sections: [{ id: "a", type: "prose", body: "hello" }],
    };
    const result = validateFormaSpec(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.some((w) => w.field.includes("unfilled-role"))).toBe(true);
    }
  });
});
