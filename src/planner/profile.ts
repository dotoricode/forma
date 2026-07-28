/**
 * Artifact profile: the composition contract an artifact must satisfy.
 *
 * A contract is stated in semantic roles, not block types. "A dashboard must
 * answer what changed" leaves room for a `metric-delta`, an `anomaly`, or a
 * `trend-chart` to answer it. "A dashboard must contain a metric-delta"
 * would freeze the contract to today's block list.
 */
import type { ArtifactKind } from "../spec/artifact.js";
import type { CompositionRoleName } from "../spec/roles.js";

export interface RoleRequirement {
  role: CompositionRoleName;
  /** `required` fails the build when unfilled; `recommended` warns. */
  level: "required" | "recommended";
  /** Why a reader needs it. Surfaced verbatim in the planner's error text. */
  because: string;
}

export interface ArtifactProfile {
  artifact: ArtifactKind;
  /** Art direction name. Documentation and QA output only, never a CSS hook. */
  direction: string;
  /** The reader questions this artifact promises to answer, in order. */
  answers: readonly string[];
  roles: readonly RoleRequirement[];
  /** Reading order the planner checks role placement against. */
  order: readonly CompositionRoleName[];
  /** Block types this artifact must not use, with the reason. */
  forbiddenBlockTypes?: Readonly<Record<string, string>>;
}

export function requiredRoles(profile: ArtifactProfile): CompositionRoleName[] {
  return profile.roles.filter((r) => r.level === "required").map((r) => r.role);
}
