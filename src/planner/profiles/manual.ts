import type { ArtifactProfile } from "../profile.js";

/**
 * Guided Path.
 *
 * The failure mode here is a numbered list with no way to tell whether a
 * step worked. `expected-result` and `verification` are what separate a
 * manual from a wall of instructions, so at least one of the two is required
 * and `troubleshooting` is required rather than recommended: a procedure
 * with no recovery path strands the reader at the first failure.
 */
export const manualProfile: ArtifactProfile = {
  artifact: "manual",
  direction: "Guided Path",
  answers: [
    "무엇을 완료할 수 있는가",
    "시작 전에 무엇이 필요한가",
    "어떤 순서로 진행하는가",
    "정상 결과는 무엇인가",
    "실패하면 어떻게 복구하는가",
  ],
  roles: [
    { role: "opening", level: "required", because: "이 문서로 무엇을 할 수 있는지" },
    { role: "scope", level: "required", because: "누구에게, 어떤 환경에 적용되는지" },
    { role: "prerequisite", level: "required", because: "전제 조건 없이 시작하면 중간에 막힌다" },
    { role: "quick-path", level: "recommended", because: "익숙한 독자를 위한 최단 경로" },
    { role: "procedure", level: "required", because: "실제 수행 단계" },
    { role: "expected-result", level: "required", because: "각 단계가 성공했는지 판단할 기준" },
    { role: "verification", level: "required", because: "전체가 끝났는지 확인하는 방법" },
    { role: "troubleshooting", level: "required", because: "실패했을 때 독자를 그대로 두면 안 된다" },
    { role: "reference", level: "recommended", because: "설정값·옵션을 다시 찾아볼 곳" },
    { role: "provenance", level: "recommended", because: "절차의 근거 문서" },
  ],
  order: [
    "opening",
    "scope",
    "prerequisite",
    "quick-path",
    "procedure",
    "expected-result",
    "verification",
    "troubleshooting",
    "reference",
    "provenance",
  ],
};
