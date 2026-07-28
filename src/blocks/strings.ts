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

/**
 * Report vocabulary. Kept separate from the shared `STRINGS` table because
 * these are section names a reader sees as headings, not UI chrome — they
 * change with the artifact, not with the browser.
 */
export interface ReportStrings {
  executiveSummary: string;
  evidence: string;
  recommendation: string;
  reversalConditions: string;
  implications: string;
  risks: string;
  risk: string;
  likelihood: string;
  impact: string;
  mitigation: string;
  owner: string;
  actions: string;
  blocking: string;
  option: string;
  recommended: string;
  decisionMatrix: string;
  criterion: string;
  weight: string;
  total: string;
  scoreOverride: string;
  sourceLedger: string;
  source: string;
  covers: string;
  limits: string;
}

export const REPORT_LABEL: Record<"ko" | "en", ReportStrings> = {
  en: {
    executiveSummary: "Executive summary",
    evidence: "Evidence",
    recommendation: "Recommendation",
    reversalConditions: "This changes if",
    implications: "What this means",
    risks: "Risks",
    risk: "Risk",
    likelihood: "Likelihood",
    impact: "Impact",
    mitigation: "Mitigation",
    owner: "Owner",
    actions: "Actions",
    blocking: "blocking",
    option: "Option",
    recommended: "recommended",
    decisionMatrix: "Decision matrix",
    criterion: "Criterion",
    weight: "Weight",
    total: "Weighted total",
    scoreOverride: "The chosen option is not the highest-scoring one. The rationale has to carry that difference.",
    sourceLedger: "Sources",
    source: "Source",
    covers: "Covers",
    limits: "Does not cover",
  },
  ko: {
    executiveSummary: "핵심 요약",
    evidence: "근거",
    recommendation: "권고",
    reversalConditions: "이 판단이 바뀌는 조건",
    implications: "무엇이 달라지나",
    risks: "위험",
    risk: "위험",
    likelihood: "가능성",
    impact: "영향",
    mitigation: "대응",
    owner: "담당",
    actions: "다음 행동",
    blocking: "선행 필요",
    option: "선택지",
    recommended: "권장",
    decisionMatrix: "판단 기준표",
    criterion: "기준",
    weight: "가중치",
    total: "가중 합계",
    scoreOverride: "선택한 안이 점수 1위가 아니다. 그 차이는 근거가 설명해야 한다.",
    sourceLedger: "출처",
    source: "출처",
    covers: "다루는 범위",
    limits: "다루지 않는 것",
  },
};

/** Manual vocabulary. Section names a reader sees, not UI chrome. */
export interface ManualStrings {
  taskMap: string;
  estimate: string;
  minutes: string;
  scope: string;
  appliesTo: string;
  doesNotCover: string;
  prerequisites: string;
  optional: string;
  quickPath: string;
  elevation: string;
  expectedResult: string;
  verify: string;
  ifItFails: string;
  checkpoint: string;
  ifNotMet: string;
  troubleshooting: string;
  cause: string;
  fix: string;
  compatibility: string;
  target: string;
  supported: string;
  partial: string;
  unsupported: string;
  untested: string;
  andLater: string;
  completion: string;
  nextTask: string;
  selectorFallback: string;
}

export const MANUAL_LABEL: Record<"ko" | "en", ManualStrings> = {
  en: {
    taskMap: "What you can finish here",
    estimate: "Estimated time",
    minutes: " min",
    scope: "Who this is for",
    appliesTo: "Applies to",
    doesNotCover: "Does not cover",
    prerequisites: "Before you start",
    optional: "optional",
    quickPath: "Fastest path",
    elevation: "needs elevated permissions",
    expectedResult: "You should see",
    verify: "Confirm it",
    ifItFails: "If it fails: ",
    checkpoint: "Checkpoint",
    ifNotMet: "If any of these is false: ",
    troubleshooting: "When it goes wrong",
    cause: "Cause",
    fix: "Fix",
    compatibility: "Compatibility",
    target: "Target",
    supported: "Supported",
    partial: "Partial",
    unsupported: "Not supported",
    untested: "Untested",
    andLater: "and later",
    completion: "Confirm you are done",
    nextTask: "What to do next",
    selectorFallback: "Every step is shown. Choosing an environment above narrows them.",
  },
  ko: {
    taskMap: "이 문서로 끝낼 수 있는 것",
    estimate: "예상 소요",
    minutes: "분",
    scope: "적용 대상",
    appliesTo: "해당됨",
    doesNotCover: "다루지 않음",
    prerequisites: "시작하기 전에",
    optional: "선택",
    quickPath: "가장 빠른 경로",
    elevation: "관리자 권한 필요",
    expectedResult: "이렇게 보이면 성공",
    verify: "확인 방법",
    ifItFails: "실패하면: ",
    checkpoint: "여기까지 확인",
    ifNotMet: "하나라도 아니라면: ",
    troubleshooting: "안 될 때",
    cause: "원인",
    fix: "해결",
    compatibility: "지원 범위",
    target: "대상",
    supported: "지원",
    partial: "부분 지원",
    unsupported: "미지원",
    untested: "미검증",
    andLater: "이상",
    completion: "완료 확인",
    nextTask: "다음에 할 것",
    selectorFallback: "모든 단계가 표시된 상태입니다. 위에서 환경을 고르면 해당 단계만 남습니다.",
  },
};

/** Dashboard vocabulary. */
export interface DashboardStrings {
  status: Record<"normal" | "warning" | "critical" | "unknown", string>;
  directionWord: Record<"up" | "down" | "flat", string>;
  keyMetrics: string;
  periodUnknown: string;
  suspected: string;
  drivers: string;
  detail: string;
  segment: string;
  noData: string;
  freshness: string;
  asOf: string;
  coverage: string;
  lastUpdated: string;
  knownGaps: string;
  delayed: string;
}

export const DASHBOARD_LABEL: Record<"ko" | "en", DashboardStrings> = {
  en: {
    status: { normal: "Normal", warning: "Needs attention", critical: "Critical", unknown: "Unknown" },
    directionWord: { up: "up", down: "down", flat: "flat" },
    keyMetrics: "Key metrics",
    periodUnknown: "period not stated",
    suspected: "Suspected cause",
    drivers: "What drove it",
    detail: "Detail",
    segment: "Segment",
    noData: "no data",
    freshness: "Data freshness",
    asOf: "As of",
    coverage: "Coverage",
    lastUpdated: "Last updated",
    knownGaps: "Known gaps",
    delayed: "This feed is running behind. Treat the numbers as provisional.",
  },
  ko: {
    status: { normal: "정상", warning: "주의", critical: "심각", unknown: "확인 불가" },
    directionWord: { up: "증가", down: "감소", flat: "변화 없음" },
    keyMetrics: "핵심 지표",
    periodUnknown: "기간 미표기",
    suspected: "의심 원인",
    drivers: "무엇이 그렇게 만들었나",
    detail: "상세",
    segment: "구분",
    noData: "데이터 없음",
    freshness: "데이터 기준",
    asOf: "기준 시각",
    coverage: "포함 범위",
    lastUpdated: "마지막 갱신",
    knownGaps: "알려진 누락",
    delayed: "수집이 지연 중입니다. 잠정 수치로 보십시오.",
  },
};

/** Decision Room vocabulary. */
export interface AdvancedStrings {
  brief: string;
  decideToday: string;
  stillUnknown: string;
  evidenceGraph: string;
  graphLegend: string;
  confidence: Record<"verified" | "inferred" | "unknown", string>;
  impact: Record<"low" | "medium" | "high", string>;
  supportedBy: string;
  noSupport: string;
  contradictedBy: string;
  challenge: string;
  unprovenAssumptions: string;
  failureConditions: string;
  reversalTriggers: string;
  simulation: string;
  simulationFallback: string;
  decision: string;
  decisionStatus: Record<"proposed" | "decided" | "deferred", string>;
  owner: string;
  due: string;
  dissent: string;
  revisitWhen: string;
}

export const ADVANCED_LABEL: Record<"ko" | "en", AdvancedStrings> = {
  en: {
    brief: "Brief",
    decideToday: "To decide today",
    stillUnknown: "Still unknown",
    evidenceGraph: "Claims and evidence",
    graphLegend: "Ordered by exposure: high impact resting on weak evidence comes first.",
    confidence: { verified: "verified", inferred: "inferred", unknown: "unconfirmed" },
    impact: { low: "low impact", medium: "medium impact", high: "high impact" },
    supportedBy: "Supported by",
    noSupport: "No supporting source.",
    contradictedBy: "Contradicted by",
    challenge: "The strongest case against",
    unprovenAssumptions: "Unproven assumptions",
    failureConditions: "What would make this fail",
    reversalTriggers: "What would reverse the decision",
    simulation: "If the numbers move",
    simulationFallback: "Values shown are the current assumptions. Move a control to see the effect.",
    decision: "Decision",
    decisionStatus: { proposed: "Proposed", decided: "Decided", deferred: "Deferred" },
    owner: "Owner",
    due: "Due",
    dissent: "Objections on record",
    revisitWhen: "Revisit when",
  },
  ko: {
    brief: "브리핑",
    decideToday: "오늘 결정할 것",
    stillUnknown: "아직 모르는 것",
    evidenceGraph: "주장과 근거",
    graphLegend: "노출도 순입니다. 영향이 크고 근거가 약한 것이 위로 옵니다.",
    confidence: { verified: "확인됨", inferred: "추정", unknown: "미확인" },
    impact: { low: "영향 낮음", medium: "영향 중간", high: "영향 큼" },
    supportedBy: "근거",
    noSupport: "뒷받침하는 출처가 없습니다.",
    contradictedBy: "상충하는 자료",
    challenge: "가장 강한 반론",
    unprovenAssumptions: "검증되지 않은 가정",
    failureConditions: "무엇이 이걸 틀리게 만드나",
    reversalTriggers: "결정을 뒤집을 조건",
    simulation: "숫자가 바뀌면",
    simulationFallback: "지금 값은 현재 가정입니다. 조절하면 결과가 따라 바뀝니다.",
    decision: "결정",
    decisionStatus: { proposed: "제안", decided: "결정됨", deferred: "보류" },
    owner: "책임",
    due: "기한",
    dissent: "기록된 반대 의견",
    revisitWhen: "다시 볼 조건",
  },
};
