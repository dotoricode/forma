import { describe, expect, it } from "vitest";
import { ARTIFACT_PROFILES, planComposition, planErrors } from "../../src/planner/plan.js";
import { requiredRoles } from "../../src/planner/profile.js";
import { ARTIFACTS } from "../../src/spec/artifact.js";
import { STARTER_SPEC } from "../../src/cli/starter-spec.js";
import type { FormaSpec } from "../../src/spec/schema.js";

const clone = (): FormaSpec => structuredClone(STARTER_SPEC);

describe("planComposition", () => {
  it("accepts the starter spec as a complete report", () => {
    expect(planErrors(planComposition(clone()))).toEqual([]);
  });

  it("fails a report whose recommendation was removed", () => {
    const spec = clone();
    spec.sections = spec.sections.filter((s) => s.type !== "decision");
    const errors = planErrors(planComposition(spec));
    expect(errors.some((e) => e.code === "unfilled-role" && e.message.includes("recommendation"))).toBe(true);
  });

  it("fails a report whose actions were removed", () => {
    const spec = clone();
    spec.sections = spec.sections.filter((s) => s.type !== "actions");
    expect(planErrors(planComposition(spec)).some((e) => e.message.includes("'action'"))).toBe(true);
  });

  it("treats the narrative as the thesis rather than demanding a second one", () => {
    // Every spec already states its question and answer, and the renderer
    // emits them as a section. Requiring a separate thesis block would make
    // a report state its conclusion twice.
    const plan = planComposition(clone());
    expect(plan.roles.find((r) => r.role === "thesis")?.blockIds).toEqual(["narrative"]);
  });

  it("rejects a variant belonging to another artifact", () => {
    const spec = clone();
    spec.meta.variant = "diagnostic";
    expect(
      planErrors(planComposition(spec)).some((e) => e.code === "variant-artifact-mismatch"),
    ).toBe(true);
  });

  it("rejects a cover on a dashboard, which must open with state and numbers", () => {
    const spec = clone();
    spec.meta.artifact = "dashboard";
    spec.meta.variant = "overview";
    const errors = planErrors(planComposition(spec));
    expect(errors.some((e) => e.code === "forbidden-block" && e.message.includes("cover"))).toBe(true);
  });

  it("reports missing recommended roles as warnings, not errors", () => {
    const plan = planComposition(clone());
    // The starter has no comparison block, so `alternatives` is unfilled.
    const alternatives = plan.issues.find((i) => i.message.includes("'alternatives'"));
    expect(alternatives?.severity).toBe("warning");
  });

  it("lists filled roles in the profile's reading order", () => {
    const plan = planComposition(clone());
    const order = ARTIFACT_PROFILES.report.order;
    const positions = plan.roles.map((r) => order.indexOf(r.role));
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
  });
});

describe("artifact profiles", () => {
  it("defines a profile for every artifact", () => {
    for (const artifact of ARTIFACTS) {
      expect(ARTIFACT_PROFILES[artifact].artifact).toBe(artifact);
    }
  });

  it("states at least one required role per artifact, so no contract is empty", () => {
    for (const artifact of ARTIFACTS) {
      expect(requiredRoles(ARTIFACT_PROFILES[artifact]).length).toBeGreaterThan(0);
    }
  });

  it("keeps every required role inside the profile's declared reading order", () => {
    for (const artifact of ARTIFACTS) {
      const profile = ARTIFACT_PROFILES[artifact];
      for (const role of profile.roles) {
        expect(profile.order, `${artifact} omits '${role.role}' from its order`).toContain(role.role);
      }
    }
  });

  it("requires a freshness slot on the dashboard", () => {
    // A metric with no "as of when" reads as current simply because it is
    // on screen. This is the dashboard's single most important guard.
    expect(requiredRoles(ARTIFACT_PROFILES.dashboard)).toContain("freshness");
  });

  it("requires troubleshooting and verification on the manual", () => {
    const roles = requiredRoles(ARTIFACT_PROFILES.manual);
    expect(roles).toContain("troubleshooting");
    expect(roles).toContain("verification");
  });
});
