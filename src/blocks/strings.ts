/**
 * Localized label tables shared by every block.
 *
 * Markup helpers used to live here too; they are components now
 * (`primitives.tsx`). What is left is the vocabulary: UI strings and the
 * plain-language names for enum values, which are content decisions rather
 * than layout ones.
 */

export interface UiStrings {
  sources: string;
  confidenceVerified: string;
  confidenceInferred: string;
  confidenceUnknown: string;
  passed: string;
  failed: string;
  skipped: string;
  total: string;
  rowLabel: string;
}

export const STRINGS: Record<"ko" | "en", UiStrings> = {
  en: {
    sources: "Sources",
    confidenceVerified: "verified",
    confidenceInferred: "inferred",
    confidenceUnknown: "unconfirmed",
    passed: "passed",
    failed: "failed",
    skipped: "skipped",
    total: "total",
    rowLabel: "Row",
  },
  ko: {
    sources: "출처",
    confidenceVerified: "확인됨",
    confidenceInferred: "추정",
    confidenceUnknown: "미확인",
    passed: "성공",
    failed: "실패",
    skipped: "건너뜀",
    total: "전체",
    rowLabel: "행",
  },
};

// Bare enum values like "medium" or "recommended" read as unexplained
// jargon on their own. These give every badge a plain-language label
// instead of the raw schema value.
export const SEVERITY_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { info: "Info", low: "Low severity", medium: "Medium severity", high: "High severity", critical: "Critical" },
  ko: { info: "정보", low: "낮은 심각도", medium: "중간 심각도", high: "높은 심각도", critical: "긴급" },
};
export const LEVEL_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { low: "low", medium: "medium", high: "high" },
  ko: { low: "낮음", medium: "중간", high: "높음" },
};
export const STATUS_LABEL: Record<"ko" | "en", Record<string, string>> = {
  en: { proposed: "Proposed", recommended: "Recommended", decided: "Decided", rejected: "Rejected" },
  ko: { proposed: "제안", recommended: "권장", decided: "결정됨", rejected: "반려" },
};

/**
 * Minimum shape every block shares once validated. The explicit `| undefined`
 * is required by `exactOptionalPropertyTypes`: a Zod `.optional()` field is
 * present-and-undefined, not absent.
 */
export interface BlockLike {
  id: string;
  sourceRefs?: string[] | undefined;
  confidence?: "verified" | "inferred" | "unknown" | undefined;
}
