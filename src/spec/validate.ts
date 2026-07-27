import { safeParseFormaSpec, type FormaSpec } from "./schema.js";

export interface ValidationIssue {
  path: string;
  message: string;
}

export type ValidationResult =
  | { ok: true; spec: FormaSpec }
  | { ok: false; issues: ValidationIssue[] };

/** Parses and validates a raw JSON value against the Forma Spec schema. */
export function validateFormaSpec(json: unknown): ValidationResult {
  const result = safeParseFormaSpec(json);
  if (result.success) {
    return { ok: true, spec: result.data };
  }
  const issues: ValidationIssue[] = result.error.issues.map((issue) => ({
    path: issue.path.length > 0 ? issue.path.join(".") : "(root)",
    message: issue.message,
  }));
  return { ok: false, issues };
}

export function formatValidationIssues(issues: ValidationIssue[]): string {
  return issues.map((issue) => `  - ${issue.path}: ${issue.message}`).join("\n");
}
