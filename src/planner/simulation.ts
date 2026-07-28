/**
 * Simulation checks.
 *
 * A formula that reads a variable nobody declared cannot be evaluated, and
 * the failure would surface as a blank number in a meeting rather than as a
 * build error. A slider whose default sits outside its own range is the
 * same class of mistake: the document shows a value the reader cannot
 * return to once they move the control.
 */
import { evaluateFormula, variablesOf, FormulaError, type FormulaNode } from "../spec/formula.js";
import type { FormaSpec } from "../spec/schema.js";
import type { PlanIssue } from "./plan.js";

interface SimulationLike {
  id: string;
  type: string;
  inputs?: { name: string; label: string; value: number; min: number; max: number }[];
  outputs?: { label: string; formula: FormulaNode; precision?: number }[];
}

export function checkSimulations(spec: FormaSpec): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const blocks = spec.sections as unknown as SimulationLike[];

  for (const block of blocks) {
    if (block.type !== "simulation") continue;
    const inputs = block.inputs ?? [];
    const declared = new Set(inputs.map((input) => input.name));

    for (const input of inputs) {
      if (input.min > input.max) {
        issues.push({
          severity: "error",
          code: "simulation-range-inverted",
          message: `'${input.label}' (${block.id}) has min ${input.min} above max ${input.max}.`,
        });
        continue;
      }
      if (input.value < input.min || input.value > input.max) {
        issues.push({
          severity: "error",
          code: "simulation-default-out-of-range",
          message: `'${input.label}' (${block.id}) starts at ${input.value}, outside its own ${input.min}–${input.max} range. The reader cannot get back to it.`,
        });
      }
    }

    const defaults = Object.fromEntries(inputs.map((input) => [input.name, input.value]));
    for (const output of block.outputs ?? []) {
      for (const name of variablesOf(output.formula)) {
        if (declared.has(name)) continue;
        issues.push({
          severity: "error",
          code: "simulation-undeclared-variable",
          message: `'${output.label}' (${block.id}) reads '${name}', which is not one of this simulation's inputs.`,
        });
      }
      try {
        const value = evaluateFormula(output.formula, defaults);
        if (!Number.isFinite(value)) {
          issues.push({
            severity: "error",
            code: "simulation-not-finite",
            message: `'${output.label}' (${block.id}) does not produce a finite number at its starting values.`,
          });
        }
      } catch (error) {
        if (error instanceof FormulaError) {
          issues.push({
            severity: "error",
            code: "simulation-formula-error",
            message: `'${output.label}' (${block.id}): ${error.message}`,
          });
          continue;
        }
        throw error;
      }
    }
  }

  return issues;
}
