/**
 * Composition roles: the semantic slots an artifact must fill.
 *
 * A contract is written in roles rather than block types on purpose. Saying
 * "a dashboard must answer 'what changed'" leaves room for a `metric-delta`,
 * an `anomaly`, or a `trend-chart` to answer it. Saying "a dashboard must
 * contain a metric-delta block" would freeze the contract to today's block
 * list and break every time a better block arrives.
 */
import { z } from "zod";

export const COMPOSITION_ROLES = [
  // shared
  "opening", // cover / status header: what is this
  "thesis", // the one-sentence answer
  "summary", // the short version for someone who stops here
  "detail", // the substance
  "evidence", // what backs the claims
  "action", // what the reader should do
  "provenance", // where the material came from, and how fresh
  // dashboard
  "status",
  "kpi",
  "change",
  "driver",
  "freshness",
  // report
  "finding",
  "alternatives",
  "recommendation",
  "risk",
  // manual
  "scope",
  "prerequisite",
  "quick-path",
  "procedure",
  "expected-result",
  "verification",
  "troubleshooting",
  "reference",
  // advanced
  "brief",
  "evidence-graph",
  "simulation",
  "decision",
] as const;

export const CompositionRoleSchema = z.enum(COMPOSITION_ROLES);
export type CompositionRoleName = z.infer<typeof CompositionRoleSchema>;

/** A role slot resolved against an actual spec: which blocks filled it. */
export interface CompositionRole {
  role: CompositionRoleName;
  blockIds: string[];
}
