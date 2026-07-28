/**
 * Procedure checks.
 *
 * A manual's whole value is that the reader can tell whether a step worked.
 * A numbered list without that is a wall of instructions with a false sense
 * of structure, and it is the single most common way a manual fails its
 * reader — so an unverifiable step is an error, not a style note.
 *
 * The check is deliberately satisfiable three ways. Some steps show their
 * own result ("the light turns green"), some need a command to confirm, and
 * some are covered by a checkpoint a few steps later. Demanding
 * `expectedResult` on every single step would push authors to write filler.
 */
import type { FormaSpec } from "../spec/schema.js";
import type { PlanIssue } from "./plan.js";

interface StepLike {
  id: string;
  type: string;
  number?: number;
  title?: string;
  expectedResult?: string;
  verification?: string;
}

export function checkProcedure(spec: FormaSpec): PlanIssue[] {
  if (spec.meta.artifact !== "manual" && spec.meta.artifact !== "advanced") return [];

  const issues: PlanIssue[] = [];
  const sections = spec.sections as unknown as StepLike[];
  const hasCheckpointAfter = (index: number) =>
    sections.slice(index + 1).some((block) => {
      if (block.type === "checkpoint" || block.type === "completion-check") return true;
      // A later step means this one is not the last chance to verify.
      return false;
    });

  sections.forEach((block, index) => {
    if (block.type !== "step") return;
    const selfVerifying = Boolean(block.expectedResult || block.verification);
    if (selfVerifying) return;
    if (hasCheckpointAfter(index)) return;
    issues.push({
      severity: "error",
      code: "manual-step-without-verification",
      message: `step '${block.title ?? block.id}' (${block.id}) has no expectedResult, no verification, and no checkpoint after it. The reader cannot tell whether it worked.`,
    });
  });

  // Step numbers are authored, so they can disagree with document order.
  // A manual whose steps read 1, 2, 4 has lost one somewhere.
  const numbers = sections.filter((b) => b.type === "step").map((b) => b.number ?? 0);
  numbers.forEach((value, index) => {
    if (value === index + 1) return;
    issues.push({
      severity: "warning",
      code: "step-number-out-of-order",
      message: `step ${value} appears at position ${index + 1}. Numbering and document order disagree.`,
    });
  });

  return issues;
}
