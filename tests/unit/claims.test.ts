import { describe, expect, it } from "vitest";
import { validateFormaSpec } from "../../src/spec/validate.js";
import { STARTER_SPEC } from "../../src/cli/starter-spec.js";
import type { FormaSpec } from "../../src/spec/schema.js";

function withSections(sections: unknown[]): unknown {
  const spec = structuredClone(STARTER_SPEC) as unknown as Record<string, unknown>;
  spec["sources"] = [{ id: "junit", label: "CI 결과", kind: "junit" }];
  spec["sections"] = [...(spec["sections"] as unknown[]), ...sections];
  return spec;
}

/**
 * `verified` is the strongest thing a Forma document says, and until now
 * nothing checked it: a block could assert a verified claim while citing
 * nothing, and it rendered identically to a supported one.
 */
describe("claim and evidence checking", () => {
  it("rejects a verified claim that cites no source", () => {
    const result = validateFormaSpec(
      withSections([
        {
          id: "hf",
          type: "headline-finding",
          claim: "출시해도 안전하다",
          detail: "d",
          confidence: "verified",
        },
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("verified-claim-without-evidence"))).toBe(true);
    }
  });

  it("accepts the same claim when it is marked inferred", () => {
    const result = validateFormaSpec(
      withSections([
        {
          id: "hf",
          type: "headline-finding",
          claim: "출시해도 안전하다",
          detail: "d",
          confidence: "inferred",
        },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts a verified claim backed by evidenceRefs alone", () => {
    // sourceRefs says where the text came from; evidenceRefs says what
    // would falsify it. Either one is enough to back a claim.
    const result = validateFormaSpec(
      withSections([
        {
          id: "hf",
          type: "headline-finding",
          claim: "통과율은 95.2%다",
          detail: "d",
          confidence: "verified",
          evidenceRefs: ["junit"],
        },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("rejects a reference to a source that was never declared", () => {
    const result = validateFormaSpec(
      withSections([
        { id: "p", type: "prose", body: "b", sourceRefs: ["nowhere"] },
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("unknown-source-ref"))).toBe(true);
    }
  });

  it("leaves a legacy 0.1 spec's dangling refs as warnings", () => {
    // 0.1 predates the check. Failing those documents would break the
    // compatibility promise for a rule they were never written against.
    const legacy = {
      version: "0.1",
      meta: { title: "t", mode: "report", audience: "engineering", language: "ko" },
      narrative: { question: "q", summary: "s" },
      sections: [{ id: "a", type: "prose", body: "b", sourceRefs: ["nowhere"] }],
    };
    const result = validateFormaSpec(legacy);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.warnings.some((w) => w.field.includes("unknown-source-ref"))).toBe(true);
    }
  });

  it("accepts the shipped report fixture end to end", async () => {
    const { readFile } = await import("node:fs/promises");
    const raw = JSON.parse(await readFile("fixtures/report/technical/forma.spec.json", "utf-8"));
    const result = validateFormaSpec(raw);
    if (!result.ok) {
      throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
    }
    const spec = result.spec as FormaSpec;
    expect(spec.meta.artifact).toBe("report");
    expect(result.plan.roles.map((r) => r.role)).toContain("recommendation");
  });
});
