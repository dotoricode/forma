import type { ArtifactProfile } from "../profile.js";

/**
 * Signal Grid.
 *
 * `freshness` is required, not recommended. A metric with no "as of when"
 * is the single most common way a dashboard misleads: the number looks
 * current because it is on screen. `change` is required for the same reason
 * a bare value is not a signal — a reader needs a basis to compare against.
 *
 * The blocks that satisfy `kpi`, `change`, `driver`, and `freshness` arrive
 * with the dashboard block set. Until then this contract fails loudly rather
 * than letting a dashboard render as a report with cards.
 */
export const dashboardProfile: ArtifactProfile = {
  artifact: "dashboard",
  direction: "Signal Grid",
  answers: [
    "현재 상태는 어떤가",
    "무엇이 변했는가",
    "어디에서 문제가 발생했는가",
    "원인은 무엇인가",
    "어떤 행동이 필요한가",
    "데이터는 언제 기준인가",
  ],
  roles: [
    { role: "status", level: "required", because: "지금 정상인지 아닌지가 첫 화면에 있어야 한다" },
    { role: "kpi", level: "required", because: "판단 근거가 되는 핵심 수치" },
    { role: "change", level: "required", because: "비교 기준 없는 숫자는 신호가 아니다" },
    { role: "driver", level: "required", because: "무엇이 그 변화를 만들었는지" },
    { role: "detail", level: "recommended", because: "드릴다운할 상세 데이터" },
    { role: "action", level: "required", because: "보고 나서 무엇을 해야 하는지" },
    { role: "freshness", level: "required", because: "언제 기준 데이터인지 없으면 화면에 있다는 이유만으로 최신처럼 읽힌다" },
  ],
  order: ["status", "kpi", "change", "driver", "detail", "action", "freshness"],
  forbiddenBlockTypes: {
    cover: "대시보드는 긴 표지로 시작하지 않는다. 첫 화면은 상태와 수치여야 한다.",
  },
};
