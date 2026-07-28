import { describe, expect, it } from "vitest";
import { readFile } from "node:fs/promises";
import {
  FormulaError,
  evaluateFormula,
  variablesOf,
  type FormulaNode,
} from "../../src/spec/formula.js";
import { validateFormaSpec } from "../../src/spec/validate.js";

const lit = (value: number): FormulaNode => ({ type: "literal", value });
const v = (name: string): FormulaNode => ({ type: "variable", name });
const op = (
  operator: "add" | "subtract" | "multiply" | "divide",
  left: FormulaNode,
  right: FormulaNode,
): FormulaNode => ({ type: "operation", operator, left, right });

/**
 * The obvious implementation of a simulator is a string expression and
 * `eval`. The spec is authored by an agent from source material, so an
 * expression string is attacker-adjacent input that would run with the
 * page's full privileges. A closed AST cannot express anything but
 * arithmetic.
 */
describe("formula evaluation", () => {
  it("computes nested arithmetic", () => {
    // (users * rate / 100) * cost
    const formula = op("multiply", op("divide", op("multiply", v("users"), v("rate")), lit(100)), v("cost"));
    expect(evaluateFormula(formula, { users: 42000, rate: 0.42, cost: 12000 })).toBeCloseTo(2116800);
  });

  it("throws on an undeclared variable instead of treating it as zero", () => {
    // Zero would silently produce a plausible number from a broken model.
    expect(() => evaluateFormula(v("nope"), {})).toThrow(FormulaError);
  });

  it("throws on divide by zero rather than rendering Infinity", () => {
    expect(() => evaluateFormula(op("divide", lit(1), lit(0)), {})).toThrow(FormulaError);
  });

  it("refuses a formula nested past the depth guard", () => {
    let node: FormulaNode = lit(1);
    for (let i = 0; i < 40; i += 1) node = op("add", node, lit(1));
    expect(() => evaluateFormula(node, {})).toThrow(FormulaError);
  });

  it("collects every variable a formula reads", () => {
    const formula = op("add", v("a"), op("multiply", v("b"), v("a")));
    expect([...variablesOf(formula)].sort()).toEqual(["a", "b"]);
  });

  it("has no way to express a property access or a call", () => {
    // The schema is a closed union; anything else fails to parse, which is
    // the actual guarantee — not a denylist of dangerous strings.
    const hostile = { type: "call", name: "fetch", args: [] };
    const result = validateFormaSpec({
      version: "0.2",
      meta: {
        title: "t",
        artifact: "advanced",
        purpose: "decide",
        audience: "engineering",
        language: "ko",
      },
      sources: [],
      narrative: { question: "q", summary: "s" },
      sections: [
        {
          id: "sim",
          type: "simulation",
          inputs: [{ name: "x", label: "X", value: 1, min: 0, max: 2 }],
          outputs: [{ label: "Y", formula: hostile }],
        },
      ],
    });
    expect(result.ok).toBe(false);
  });
});

const room = (sections: unknown[]) => ({
  version: "0.2",
  meta: {
    title: "t",
    artifact: "advanced",
    purpose: "decide",
    audience: "engineering",
    language: "ko",
    variant: "release-decision",
  },
  sources: [],
  narrative: { question: "q", summary: "s" },
  sections,
});

describe("simulation checking", () => {
  const simulation = (overrides: Record<string, unknown>) => ({
    id: "sim",
    type: "simulation",
    inputs: [{ name: "x", label: "X", value: 1, min: 0, max: 10 }],
    outputs: [{ label: "Y", formula: v("x") }],
    ...overrides,
  });

  it("rejects a formula reading a variable the simulation does not declare", () => {
    const result = validateFormaSpec(
      room([simulation({ outputs: [{ label: "Y", formula: v("elsewhere") }] })]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("simulation-undeclared-variable"))).toBe(true);
    }
  });

  it("rejects a default the reader could never return to", () => {
    const result = validateFormaSpec(
      room([simulation({ inputs: [{ name: "x", label: "X", value: 99, min: 0, max: 10 }] })]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("simulation-default-out-of-range"))).toBe(true);
    }
  });

  it("rejects an inverted range", () => {
    const result = validateFormaSpec(
      room([simulation({ inputs: [{ name: "x", label: "X", value: 5, min: 10, max: 0 }] })]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("simulation-range-inverted"))).toBe(true);
    }
  });

  it("rejects a formula that divides by zero at its starting values", () => {
    const result = validateFormaSpec(
      room([
        simulation({
          inputs: [{ name: "x", label: "X", value: 0, min: 0, max: 10 }],
          outputs: [{ label: "Y", formula: op("divide", lit(1), v("x")) }],
        }),
      ]),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.issues.some((i) => i.path.includes("simulation-formula-error"))).toBe(true);
    }
  });
});

describe("shipped Decision Room", () => {
  it("validates end to end", async () => {
    const raw = JSON.parse(
      await readFile("fixtures/advanced/release-decision/forma.spec.json", "utf-8"),
    );
    const result = validateFormaSpec(raw);
    if (!result.ok) {
      throw new Error(result.issues.map((i) => `${i.path}: ${i.message}`).join("\n"));
    }
    expect(result.plan.roles.map((r) => r.role)).toEqual(
      expect.arrayContaining(["brief", "evidence-graph", "risk", "alternatives", "decision"]),
    );
  });

  it("ships no eval or Function constructor in the page script", async () => {
    const html = await readFile("fixtures/advanced/release-decision/output/index.html", "utf-8");
    const script = html.match(/<script type="module">([\s\S]*?)<\/script>/)?.[1] ?? "";
    expect(script.length).toBeGreaterThan(0);
    expect(script).not.toMatch(/\beval\s*\(/);
    expect(script).not.toMatch(/new\s+Function/);
  });
});
