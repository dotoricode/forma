/**
 * Claim and evidence checking.
 *
 * `confidence: "verified"` is the strongest thing a Forma document can say,
 * and until now nothing checked it. A block could assert a verified claim
 * while citing no source at all, or cite a source id that does not exist —
 * both render identically to a genuinely supported claim, which is the
 * failure mode the confidence field was added to prevent.
 *
 * These run as errors, not warnings. A warning would be ignored, and the
 * whole value of the marker is that a reader can trust it.
 */
import type { FormaSpec } from "../spec/schema.js";
import type { PlanIssue } from "./plan.js";

/** Fields that can carry provenance, in the order they are consulted. */
function evidenceIdsOf(block: Record<string, unknown>): string[] {
  const sourceRefs = Array.isArray(block["sourceRefs"]) ? (block["sourceRefs"] as string[]) : [];
  const evidenceRefs = Array.isArray(block["evidenceRefs"])
    ? (block["evidenceRefs"] as string[])
    : [];
  return [...sourceRefs, ...evidenceRefs];
}

export function checkClaims(spec: FormaSpec): PlanIssue[] {
  const issues: PlanIssue[] = [];
  const known = new Set(spec.sources.map((source) => source.id));

  for (const block of spec.sections) {
    const record = block as unknown as Record<string, unknown>;
    const refs = evidenceIdsOf(record);

    // A reference to a source that was never declared is a dangling claim:
    // the document looks sourced and is not.
    for (const ref of refs) {
      if (!known.has(ref)) {
        issues.push({
          severity: "error",
          code: "unknown-source-ref",
          message: `'${block.type}' (${block.id}) references source '${ref}', which is not declared in spec.sources.`,
        });
      }
    }

    if (block.confidence !== "verified") continue;
    if (refs.length === 0) {
      issues.push({
        severity: "error",
        code: "verified-claim-without-evidence",
        message: `'${block.type}' (${block.id}) is marked verified but cites no source. Mark it inferred, or add sourceRefs/evidenceRefs.`,
      });
    }
  }

  return issues;
}
