/**
 * Formula AST and its evaluator.
 *
 * A Decision Room lets the reader change an assumption and see the result
 * move. The obvious implementation is a string expression and `eval`, and
 * it is the wrong one: the spec is authored by an agent from source
 * material, so an expression string is attacker-adjacent input that would
 * run with the page's full privileges. A closed AST cannot express anything
 * but arithmetic — there is no property access, no call, no identifier
 * lookup beyond the declared variables.
 *
 * The same evaluator runs at build time and in the browser island, so the
 * number the reader sees before touching a control is the number Forma
 * computed, not a second implementation that might disagree.
 */
import { z } from "zod";

export type FormulaNode =
  | { type: "literal"; value: number }
  | { type: "variable"; name: string }
  | {
      type: "operation";
      operator: "add" | "subtract" | "multiply" | "divide";
      left: FormulaNode;
      right: FormulaNode;
    };

export const FormulaNodeSchema: z.ZodType<FormulaNode> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("literal"), value: z.number() }),
    z.object({ type: z.literal("variable"), name: z.string().min(1) }),
    z.object({
      type: z.literal("operation"),
      operator: z.enum(["add", "subtract", "multiply", "divide"]),
      left: FormulaNodeSchema,
      right: FormulaNodeSchema,
    }),
  ]),
);

export class FormulaError extends Error {}

/** Depth guard. A hand-authored formula is shallow; anything deeper is a mistake or an attack. */
const MAX_DEPTH = 32;

export function evaluateFormula(
  node: FormulaNode,
  variables: Readonly<Record<string, number>>,
  depth = 0,
): number {
  if (depth > MAX_DEPTH) {
    throw new FormulaError(`formula nested deeper than ${MAX_DEPTH} levels`);
  }
  switch (node.type) {
    case "literal":
      return node.value;
    case "variable": {
      const value = variables[node.name];
      if (value === undefined) {
        // Treating an unknown variable as 0 would silently produce a
        // plausible number from an incomplete model.
        throw new FormulaError(`formula references undeclared variable '${node.name}'`);
      }
      return value;
    }
    case "operation": {
      const left = evaluateFormula(node.left, variables, depth + 1);
      const right = evaluateFormula(node.right, variables, depth + 1);
      switch (node.operator) {
        case "add":
          return left + right;
        case "subtract":
          return left - right;
        case "multiply":
          return left * right;
        case "divide":
          if (right === 0) {
            // Infinity would render as "Infinity" in a decision document.
            throw new FormulaError("formula divides by zero");
          }
          return left / right;
      }
    }
  }
}

/** Every variable a formula reads. Used to check the declared inputs cover it. */
export function variablesOf(node: FormulaNode, into = new Set<string>()): Set<string> {
  if (node.type === "variable") into.add(node.name);
  if (node.type === "operation") {
    variablesOf(node.left, into);
    variablesOf(node.right, into);
  }
  return into;
}

/**
 * Serializes the AST to the compact form the browser island evaluates. The
 * island ships the same walk, so build-time and runtime cannot disagree.
 */
export function formulaToJson(node: FormulaNode): string {
  return JSON.stringify(node);
}
