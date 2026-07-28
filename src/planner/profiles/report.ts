import type { ArtifactProfile } from "../profile.js";

/**
 * Editorial Brief.
 *
 * The failure mode a report contract has to prevent is burying the
 * conclusion. A reader who stops after the first screen should already know
 * what was found and what is being recommended, so `thesis` is required and
 * required early.
 */
export const reportProfile: ArtifactProfile = {
  artifact: "report",
  direction: "Editorial Brief",
  answers: [
    "무엇을 조사했는가",
    "결론은 무엇인가",
    "근거는 무엇인가",
    "대안은 무엇인가",
    "무엇을 결정해야 하는가",
    "다음 행동은 무엇인가",
  ],
  roles: [
    { role: "opening", level: "required", because: "독자가 무엇을 읽고 있는지 먼저 알아야 한다" },
    { role: "thesis", level: "required", because: "결론이 문서 후반에만 있으면 리포트가 아니라 일지다" },
    { role: "summary", level: "required", because: "첫 화면에서 멈추는 독자를 위한 짧은 버전" },
    { role: "finding", level: "required", because: "무엇을 알아냈는지가 리포트의 본체다" },
    // Recommended rather than required: a short technical report can be
    // sound without a table or code sample. The sharper rule lives with the
    // claim-to-evidence link, where a `verified` claim with no supporting
    // source fails outright.
    { role: "evidence", level: "recommended", because: "근거 없는 발견은 의견이다" },
    { role: "alternatives", level: "recommended", because: "선택지를 비교하지 않은 권고는 검증할 수 없다" },
    { role: "recommendation", level: "required", because: "독자가 무엇을 결정해야 하는지" },
    { role: "risk", level: "recommended", because: "권고를 따랐을 때 무엇이 잘못될 수 있는지" },
    { role: "action", level: "required", because: "결정 다음에 누가 무엇을 하는지" },
    { role: "provenance", level: "required", because: "자료 출처를 문서 안에서 추적할 수 있어야 한다" },
  ],
  order: [
    "opening",
    "thesis",
    "summary",
    "finding",
    "evidence",
    "alternatives",
    "recommendation",
    "risk",
    "action",
    "provenance",
  ],
};
