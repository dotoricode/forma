import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import { validateFormaSpec } from "../../src/spec/validate.js";

const manualBase = {
  version: "0.2",
  meta: {
    title: "t",
    artifact: "manual",
    purpose: "operate",
    audience: "engineering",
    language: "ko",
    variant: "procedural",
  },
  sources: [],
  narrative: { question: "q", summary: "s" },
};

const contractFilling = [
  { id: "map", type: "task-map", outcomes: ["o"] },
  { id: "scope", type: "audience-scope", appliesTo: ["a"] },
  { id: "pre", type: "prerequisite", items: [{ label: "l" }] },
  { id: "trouble", type: "troubleshooting", entries: [{ symptom: "s", fix: "f" }] },
  // Placed before the steps on purpose: it fills the `verification` role
  // the manual contract requires without also acting as the checkpoint
  // that would excuse an unverifiable step further down.
  { id: "done", type: "completion-check", check: "c", expected: "e" },
];

const manual = (steps: unknown[]) => ({ ...manualBase, sections: [...contractFilling, ...steps] });

/**
 * A manual's whole value is that the reader can tell whether a step worked.
 * A numbered list without that is a wall of instructions with a false sense
 * of structure.
 */
describe("procedure checking", () => {
  it("rejects a step the reader cannot verify", () => {
    const result = validateFormaSpec(
      manual([{ id: "s1", type: "step", number: 1, title: "Do the thing", instruction: "i" }]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("manual-step-without-verification"))).toBe(true);
    }
  });

  it("accepts a step that says what the reader should see", () => {
    const result = validateFormaSpec(
      manual([
        {
          id: "s1",
          type: "step",
          number: 1,
          title: "Do the thing",
          instruction: "i",
          expectedResult: "The light turns green",
        },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("accepts an unverifiable step when a checkpoint follows it", () => {
    // Not every step shows its own result. Demanding one on each would push
    // authors to write filler, so a later checkpoint covers the run.
    const result = validateFormaSpec(
      manual([
        { id: "s1", type: "step", number: 1, title: "Do the thing", instruction: "i" },
        { id: "cp", type: "checkpoint", conditions: ["everything above worked"] },
      ]),
    );
    expect(result.ok).toBe(true);
  });

  it("warns when step numbering disagrees with document order", () => {
    const result = validateFormaSpec(
      manual([
        {
          id: "s1",
          type: "step",
          number: 1,
          title: "a",
          instruction: "i",
          expectedResult: "e",
        },
        {
          id: "s2",
          type: "step",
          number: 4,
          title: "b",
          instruction: "i",
          expectedResult: "e",
        },
      ]),
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.plan.issues.some((i) => i.code === "step-number-out-of-order")).toBe(true);
    }
  });

  it("does not apply the step check to a report", () => {
    const result = validateFormaSpec({
      ...manualBase,
      meta: { ...manualBase.meta, artifact: "report", purpose: "explain", variant: "technical" },
      sections: [
        { id: "c", type: "cover", title: "t" },
        { id: "sum", type: "summary", title: "t", body: "b" },
        { id: "f", type: "finding", title: "t", body: "b" },
        { id: "d", type: "decision", title: "t", status: "proposed", rationale: "r" },
        { id: "a", type: "actions", items: [{ label: "l" }] },
        { id: "src", type: "source-note" },
      ],
    });
    expect(result.ok).toBe(true);
  });

  it("accepts the shipped manual fixture end to end", async () => {
    const raw = JSON.parse(await readFile("fixtures/manual/quickstart/forma.spec.json", "utf-8"));
    const result = validateFormaSpec(raw);
    if (!result.ok) {
      throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
    }
    expect(result.plan.roles.map((r) => r.role)).toEqual(
      expect.arrayContaining(["prerequisite", "procedure", "verification", "troubleshooting"]),
    );
  });
});

describe("rendered spec round trip", () => {
  it("re-validates the spec copy a render writes beside the HTML", async () => {
    // The normalized 0.2 form of a migrated 0.1 spec loses the version
    // marker that exempted it from the composition contract, so writing it
    // produced a file that could not be rendered again.
    for (const dir of [
      "fixtures/explain",
      "fixtures/review",
      "fixtures/test",
      "fixtures/report",
      "fixtures/report/technical",
      "fixtures/manual/quickstart",
    ]) {
      const raw = JSON.parse(await readFile(`${dir}/output/forma.spec.json`, "utf-8"));
      const result = validateFormaSpec(raw);
      expect(result.ok, `${dir} output spec should re-validate`).toBe(true);
    }
  });
});
