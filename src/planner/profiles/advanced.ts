import type { ArtifactProfile } from "../profile.js";

/**
 * Decision Room.
 *
 * Advanced is not a report with tabs. What makes it a different artifact is
 * that the reader argues with it and then records an outcome, so the
 * contract requires an evidence graph (claims linked to sources, with
 * confidence) and a decision slot. Simulation is recommended rather than
 * required because not every review has a quantity worth varying.
 *
 * The interactive blocks that satisfy `evidence-graph`, `simulation`, and
 * `decision` arrive with the Decision Room build.
 */
export const advancedProfile: ArtifactProfile = {
  artifact: "advanced",
  direction: "Decision Room",
  answers: [
    "지금 무엇을 검토하는가",
    "어떤 주장이 어떤 근거에 기대는가",
    "가장 강한 반론은 무엇인가",
    "조건이 바뀌면 결과가 어떻게 달라지는가",
    "무엇을 결정했고 누가 책임지는가",
  ],
  roles: [
    { role: "brief", level: "required", because: "회의 시작 전에 전체를 파악할 수 있어야 한다" },
    { role: "evidence-graph", level: "required", because: "주장과 근거의 연결이 Decision Room의 본체다" },
    { role: "risk", level: "required", because: "영향이 크고 근거가 약한 항목을 드러내야 한다" },
    { role: "alternatives", level: "required", because: "비교 대상 없는 결정은 기록할 가치가 없다" },
    { role: "simulation", level: "recommended", because: "조건을 바꿔볼 수량이 있을 때" },
    { role: "decision", level: "required", because: "결론·담당자·기한이 남지 않으면 회의 기록이 아니다" },
    { role: "provenance", level: "required", because: "결정 당시 어떤 자료를 봤는지 재현할 수 있어야 한다" },
  ],
  order: [
    "brief",
    "evidence-graph",
    "risk",
    "alternatives",
    "simulation",
    "decision",
    "provenance",
  ],
};
