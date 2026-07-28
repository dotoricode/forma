# Artifacts

An artifact is what the output *is*. It is fixed when the skill is invoked,
not chosen by taste partway through: `/forma:report` means `artifact:
"report"`. Each artifact owes the reader a specific set of answers, and
`forma validate` fails when a required one has nowhere to come from.

This replaced the 0.1 `designSystem` field, which swapped CSS over an
identical DOM. Four looks over one structure can change colour and spacing,
but it cannot make a dashboard answer "what changed and where is the
problem" while a manual answers "what do I do, in what order".

## Claims and evidence

`confidence: "verified"` is checked, not decorative. A block marked
verified must cite at least one `sourceRefs` or `evidenceRefs` id, and
every referenced id must exist in `spec.sources`. Both are build errors.

`sourceRefs` answers "where did this text come from". `evidenceRefs`
answers "what would I check to falsify this". A block may cite a source it
merely paraphrases without claiming that source proves anything.

## How the contract works

Contracts are written in **roles**, not block types. A dashboard must fill
the `change` role; a `metric-delta`, an `anomaly`, or a `trend-chart` can
all fill it. Stating the contract in block types would freeze it to today's
block list.

Two levels:

- **required** — validation fails when nothing fills the role.
- **recommended** — a warning; the document still builds.

The `thesis` role is filled by `narrative.question` + `narrative.summary`,
which the schema already requires. You do not add a separate thesis block.

---

## `dashboard` — Signal Grid

Dense, numeric, state-first. Variants: `overview`, `diagnostic`,
`release-gate`.

| Answers | Role | Level |
|---|---|---|
| 현재 상태는 어떤가 | `status` | required |
| 판단 근거가 되는 핵심 수치 | `kpi` | required |
| 무엇이 변했는가 | `change` | required |
| 무엇이 그 변화를 만들었는가 | `driver` | required |
| 드릴다운할 상세 | `detail` | recommended |
| 무엇을 해야 하는가 | `action` | required |
| 언제 기준 데이터인가 | `freshness` | required |

`freshness` is required, not recommended. A metric with no "as of when"
reads as current simply because it is on screen — the most common way a
dashboard misleads.

`cover` is forbidden. A dashboard opens with state and numbers, not a title
page.

## `report` — Editorial Brief

Conclusion up front, evidence behind it. Variants: `executive`,
`technical`, `postmortem`, `editorial`.

| Answers | Role | Level |
|---|---|---|
| 무엇을 읽고 있는가 | `opening` | required |
| 결론은 무엇인가 | `thesis` | required (from narrative) |
| 짧은 버전 | `summary` | required |
| 무엇을 알아냈는가 | `finding` | required |
| 근거는 무엇인가 | `evidence` | recommended |
| 대안은 무엇인가 | `alternatives` | recommended |
| 무엇을 결정해야 하는가 | `recommendation` | required |
| 무엇이 잘못될 수 있는가 | `risk` | recommended |
| 다음 행동은 무엇인가 | `action` | required |
| 자료 출처 | `provenance` | required |

The failure this prevents is burying the conclusion. A reader who stops
after the first screen must already know what was found and what is
recommended.

## `manual` — Guided Path

Navigation-first, narrow measure, steps with checkable results. Variants:
`quickstart`, `procedural`, `troubleshooting`, `reference`.

| Answers | Role | Level |
|---|---|---|
| 이 문서로 무엇을 할 수 있는가 | `opening` | required |
| 누구에게, 어떤 환경에 | `scope` | required |
| 시작 전에 무엇이 필요한가 | `prerequisite` | required |
| 가장 빠른 경로 | `quick-path` | recommended |
| 수행 단계 | `procedure` | required |
| 성공 판단 기준 | `expected-result` | required |
| 전체 완료 확인 | `verification` | required |
| 실패하면 어떻게 하는가 | `troubleshooting` | required |
| 설정값·옵션 | `reference` | recommended |

The failure this prevents is a numbered list with no way to tell whether a
step worked, and no recovery path when one does not.

## `advanced` — Decision Room

Interactive: the reader argues with it and records an outcome. Variants:
`architecture-review`, `release-decision`, `incident-review`.

| Answers | Role | Level |
|---|---|---|
| 지금 무엇을 검토하는가 | `brief` | required |
| 어떤 주장이 어떤 근거에 기대는가 | `evidence-graph` | required |
| 영향이 크고 근거가 약한 것 | `risk` | required |
| 비교 대상은 무엇인가 | `alternatives` | required |
| 조건이 바뀌면 | `simulation` | recommended |
| 무엇을 결정했는가 | `decision` | required |
| 당시 어떤 자료를 봤는가 | `provenance` | required |

`advanced` is explicit-invocation only: it generates and scores multiple
candidates and runs a browser pass, so it must never be picked implicitly.

---

## Current implementation status

`report` has its own vocabulary: `thesis`, `executive-summary`,
`headline-finding`, `evidence-stack`, `option-comparison`,
`decision-matrix`, `recommendation`, `implication`, `risk-register`,
`action-plan`, `pull-quote`, `figure`, `appendix`, `source-ledger`.
`manual` has its own vocabulary too: `task-map`, `audience-scope`,
`prerequisite`, `environment-selector`, `quick-path`, `step`, `checkpoint`,
`decision-tree`, `troubleshooting`, `compatibility-matrix`, `version-note`,
`completion-check`, `next-task`.

A `step` must be checkable. Give it an `expectedResult`, a `verification`,
or put a `checkpoint` after it — otherwise `forma validate` fails with
`manual-step-without-verification`. Environment branching is a field
(`environments: ["macos"]`), not a sentence in the middle of a paragraph;
the selector island filters on it and shows everything when JS is off.
`dashboard` has `status-header`, `metric`, `metric-group`, `anomaly`,
`breakdown`, `segmented-table`, `data-freshness`.

Every metric must state its `period`, and a dashboard showing metrics must
carry a `data-freshness` block — both are build errors
(`metric-without-context`, `dashboard-without-freshness`). A comparison
carries its own `basis` and a separate `sentiment`, because cost up and
pass rate up are both "up" and mean opposite things.

`advanced` has its contract defined and enforced, but the blocks that fill
`evidence-graph`, `simulation`, and `decision` are still being built. Until
they land it fails validation with a named unfilled role rather than
quietly rendering as a report with tabs.

Do not work around a missing block by approximating it. A wrong-shaped
output that validates is worse than a clear failure.
