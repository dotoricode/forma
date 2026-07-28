/**
 * The single entry point for turning untrusted JSON into a `FormaSpec`.
 *
 * Validation runs in three passes, in this order: migrate an older spec to
 * the current version, check it against the schema, then check it against
 * the artifact's composition contract. The third pass is what makes an
 * artifact a promise rather than a label — a report with no recommendation
 * fails here, not silently at read time.
 */
import { migrateSpec, type MigrationWarning } from "./migrations.js";
import { safeParseFormaSpec, type FormaSpec } from "./schema.js";
import { planComposition, planErrors, type CompositionPlan } from "../planner/plan.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; spec: FormaSpec; plan: CompositionPlan; warnings: MigrationWarning[]; migrated: boolean }
  | { ok: false; issues: ValidationIssue[]; warnings: MigrationWarning[] };

export interface ValidateOptions {
  /**
   * Skips the composition contract pass. Used by tooling that needs to read
   * a structurally valid spec without judging its composition, such as the
   * migration test fixtures.
   */
  skipComposition?: boolean;
}

/** Parses, migrates, and validates a raw JSON value against the Forma Spec. */
export function validateFormaSpec(json: unknown, options: ValidateOptions = {}): ValidationResult {
  const { spec: normalized, warnings, migrated } = migrateSpec(json);

  const result = safeParseFormaSpec(normalized);
  if (!result.success) {
    const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
      message: issue.message,
    }));
    return { ok: false, issues, warnings };
  }

  const spec = result.data as FormaSpec;
  const plan = planComposition(spec);

  // A migrated 0.1 spec predates composition contracts, so judging it
  // against one would reject documents that were valid when they were
  // written — an onboarding guide from 0.1 has no `prerequisite` block
  // because no such block existed. Legacy specs render, and their contract
  // gaps surface as warnings pointing at what a 0.2 rewrite would add.
  const enforceComposition = !options.skipComposition && !migrated;
  const contractWarnings: MigrationWarning[] = migrated
    ? planErrors(plan).map((error) => ({
        field: `meta.artifact (${error.code})`,
        message: `${error.message} (0.1 호환 렌더로 진행)`,
      }))
    : [];

  if (enforceComposition) {
    const errors = planErrors(plan);
    if (errors.length > 0) {
      return {
        ok: false,
        warnings,
        issues: errors.map((error) => ({
          path: `meta.artifact (${error.code})`,
          message: error.message,
        })),
      };
    }
  }

  return { ok: true, spec, plan, warnings: [...warnings, ...contractWarnings], migrated };
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  return issues.map((issue) => `  - ${issue.path}: ${issue.message}`).join("\n");
}
