/**
 * Composition planner.
 *
 * This is what the old `mode` field was supposed to be. `mode` recorded
 * intent in the manifest and changed nothing, so `mode: "report"` guaranteed
 * no report-shaped output. The planner resolves each block onto the semantic
 * roles it can fill, then checks the artifact's contract against the result.
 */
import { getBlockDefinition, rolesForBlockType } from "../blocks/registry.js";
import { isVariantOfArtifact, type ArtifactKind } from "../spec/artifact.js";
import type { CompositionRole, CompositionRoleName } from "../spec/roles.js";
import type { FormaSpec } from "../spec/schema.js";
import type { ArtifactProfile } from "./profile.js";
import { advancedProfile } from "./profiles/advanced.js";
import { dashboardProfile } from "./profiles/dashboard.js";
import { manualProfile } from "./profiles/manual.js";
import { reportProfile } from "./profiles/report.js";
import { checkClaims } from "./claims.js";
import { checkProcedure } from "./procedure.js";
import { checkMetrics } from "./metrics.js";
import { checkSimulations } from "./simulation.js";

export const ARTIFACT_PROFILES: Record<ArtifactKind, ArtifactProfile> = {
  dashboard: dashboardProfile,
  report: reportProfile,
  manual: manualProfile,
  advanced: advancedProfile,
};

export interface PlanIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
}

export interface CompositionPlan {
  artifact: ArtifactKind;
  direction: string;
  roles: CompositionRole[];
  issues: PlanIssue[];
}

export function planComposition(spec: FormaSpec): CompositionPlan {
  const profile = ARTIFACT_PROFILES[spec.meta.artifact];
  const issues: PlanIssue[] = [];

  const filled = new Map<CompositionRoleName, string[]>();

  // The narrative is not a block, but it is the document's thesis: the
  // schema already requires a question and a one-paragraph answer, and the
  // renderer emits them as their own section. Requiring a separate thesis
  // block on top of that would make every spec state its conclusion twice.
  filled.set("thesis", ["narrative"]);
  if (spec.narrative.takeaways.length > 0) filled.set("brief", ["narrative"]);

  for (const block of spec.sections) {
    for (const role of rolesForBlockType(block.type)) {
      const ids = filled.get(role) ?? [];
      ids.push(block.id);
      filled.set(role, ids);
    }
  }

  issues.push(...checkVariant(spec, profile));
  issues.push(...checkForbiddenBlocks(spec, profile));
  issues.push(...checkRequiredRoles(profile, filled));
  issues.push(...checkUnsupportedBlocks(spec));
  issues.push(...checkClaims(spec));
  issues.push(...checkProcedure(spec));
  issues.push(...checkMetrics(spec));
  issues.push(...checkSimulations(spec));

  const roles: CompositionRole[] = profile.order
    .filter((role) => filled.has(role))
    .map((role) => ({ role, blockIds: filled.get(role) ?? [] }));

  return { artifact: profile.artifact, direction: profile.direction, roles, issues };
}

function checkVariant(spec: FormaSpec, profile: ArtifactProfile): PlanIssue[] {
  const variant = spec.meta.variant;
  if (!variant) return [];
  if (isVariantOfArtifact(profile.artifact, variant)) return [];
  return [
    {
      severity: "error",
      code: "variant-artifact-mismatch",
      message: `variant '${variant}' does not belong to artifact '${profile.artifact}'.`,
    },
  ];
}

function checkForbiddenBlocks(spec: FormaSpec, profile: ArtifactProfile): PlanIssue[] {
  const forbidden = profile.forbiddenBlockTypes;
  if (!forbidden) return [];
  return spec.sections
    .filter((block) => forbidden[block.type] !== undefined)
    .map((block) => ({
      severity: "error" as const,
      code: "forbidden-block",
      message: `'${block.type}' (${block.id}) is not allowed in a ${profile.artifact}: ${forbidden[block.type]}`,
    }));
}

function checkRequiredRoles(
  profile: ArtifactProfile,
  filled: Map<CompositionRoleName, string[]>,
): PlanIssue[] {
  return profile.roles
    .filter((requirement) => !filled.has(requirement.role))
    .map((requirement) => ({
      severity: requirement.level === "required" ? ("error" as const) : ("warning" as const),
      code: "unfilled-role",
      message: `${profile.artifact}: no block fills the '${requirement.role}' role — ${requirement.because}`,
    }));
}

/** A block may be registered but not offered to every artifact. */
function checkUnsupportedBlocks(spec: FormaSpec): PlanIssue[] {
  return spec.sections.flatMap((block) => {
    const definition = getBlockDefinition(block.type);
    if (!definition) return [];
    if (definition.supportedArtifacts.includes(spec.meta.artifact)) return [];
    return [
      {
        severity: "error" as const,
        code: "block-not-supported-by-artifact",
        message: `'${block.type}' (${block.id}) is not available to artifact '${spec.meta.artifact}'.`,
      },
    ];
  });
}

export function planErrors(plan: CompositionPlan): PlanIssue[] {
  return plan.issues.filter((issue) => issue.severity === "error");
}

export function formatPlanIssues(issues: readonly PlanIssue[]): string {
  return issues.map((issue) => `  - [${issue.code}] ${issue.message}`).join("\n");
}
