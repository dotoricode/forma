# 핸드오프: artifact 아키텍처 개편

2026-07-28 작성. PR1~7 완료, PR8~9 남음.

이 문서만 읽고 이어서 작업할 수 있게 쓴 것이다. 배경은
`docs/project-overview.md`, 디자인 규칙은 `DESIGN.md`,
artifact 계약은 `skills/forma/references/artifacts.md`.

---

## 지금 상태

| PR | 내용 | 상태 |
|---|---|---|
| 1 | spec 0.2 + artifact registry + block registry | 머지됨 (#2) |
| 2 | 공유 TSX 디자인 시스템 + 정적 컴파일러 | 머지됨 (#2) |
| 3 | report artifact 블록 14종 + 근거 검증 | 머지됨 (#3) |
| 4 | manual artifact 블록 13종 + 절차 검증 | 머지됨 (#4) |
| 5 | dashboard artifact 블록 7종 + 지표 검증 | 머지됨 (#5) |
| 6 | DOM lint 8종 + 후보 선택 계층 | 머지됨 (#6) |
| 7 | Decision Room 블록 5종 + Portable 모드 | **PR #7 열림, CI 통과. 머지만 하면 됨** |
| 8 | Room Mode + 협업 + Decision Freeze | 미착수 |
| 9 | Codex/Claude 스킬 패키징 + 최종 QA | 미착수 |

브랜치: `feat/decision-room` (푸시됨, 워킹트리 clean)

**첫 할 일**

```bash
gh pr checks 7          # 통과 확인
gh pr merge 7 --merge --delete-branch
git checkout main && git pull
```

---

## 현재 게이트 상태

전부 통과 상태다. 작업 전에 한 번 돌려서 기준선을 확인하라.

```bash
pnpm install
pnpm build            # tsc, 오류 0
pnpm test             # 172개 통과
pnpm qa               # 8/8 (fixture 8종 x 4뷰포트 + axe)
node scripts/check-naming.mjs
pnpm forma verify-skills
```

`pnpm qa`는 몇 분 걸린다. 개별 산출물 lint는:

```bash
pnpm lint:design fixtures/advanced/release-decision/output/index.html
```

---

## 구조 요약 (개편 후)

```
src/
├── spec/          artifact.ts  roles.ts  source.ts  formula.ts
│                  schema.ts  migrations.ts  validate.ts  infer-artifact.ts
├── blocks/        registry.ts  types.ts  primitives.tsx  strings.ts
│                  document|code|diagram|data|decision.tsx   (공통 20종)
│                  report.tsx (14) manual.tsx (13)
│                  dashboard.tsx (7) advanced.tsx (5)
├── planner/       plan.ts  profile.ts  profiles/{4종}
│                  claims.ts  procedure.ts  metrics.ts  simulation.ts
├── renderer/      document.tsx  compose.tsx  static.tsx  shell.ts
│                  diagrams.ts  sparkline.ts  interactive.ts  highlight.ts
├── design/        foundations-css.ts  block-css.ts  artifact-css.ts  tokens.ts
└── qa/            design-lint.ts  dom-lint.ts  candidates.ts  browser-qa.ts
```

**블록 추가 방법**: 해당 `*.tsx`에 `defineBlock({...})` 하나 쓰고
`registry.ts`의 배열에 넣는다. union / 타입 / JSON Schema / artifact
허용 목록 / dispatch가 전부 파생된다. `tests/unit/block-registry.test.ts`의
`minimalBlockFor`에 최소 fixture를 추가하지 않으면 테스트가 실패한다.
이건 의도된 가드다.

---

## PR8: Room Mode

### 요구사항 (사용자 확정)

```
forma advanced <spec> --room
```

- 기본 bind는 `127.0.0.1`. `--lan`을 **명시해야만** 사내 네트워크 허용
- 일회용 session token
- WebSocket 또는 동등한 로컬 실시간 동기화
- 여러 참여자의 투표와 코멘트
- 세션 종료 후 자동 폐기 가능
- 외부 서버 및 telemetry 전송 없음
- Freeze 실행 시에만 영구 저장
- 회의 후 정적 snapshot HTML export

**Decision Freeze** 출력물: `decision.json`, `snapshot.html`, `manifest.json`.
포함 정보 — 최종 결정, 근거, 반대 의견, 미해결 항목, 선택 당시 입력값,
담당자, 기한, source hash, spec hash, 생성 시각.

### 반드시 지킬 구분

**"외부 네트워크 요청 0건"과 "참여자 간 LAN 통신"은 다른 것이다.**
사용자가 명시적으로 요구한 사항이다. manifest와 문서에서 두 개를 섞어
쓰면 안 된다. Portable은 진짜 0건이고, Room Mode는 외부는 0건이지만
LAN 통신은 발생한다.

### 이미 준비된 것

`src/cli/index.ts`의 `advanced` 명령이 `--portable` 아니면 "Room Mode는
아직 없다"고 명시적으로 거부한다. 여기를 확장하면 된다.
`meta.interaction === "live"`도 이미 Portable에서 거부하고 있다.

### 주의

Room Mode는 서버를 띄우고 상태를 공유하므로 지금까지의 "정적 산출물"
전제가 처음으로 깨지는 지점이다. 기존 `preview` 명령
(`src/cli/index.ts`, localhost 서버)이 참고가 된다.

---

## PR9: 스킬 패키징

### 요구사항 (사용자 확정)

논리적 기능 4종을 두 호스트에 맞춰 배포한다.

| 논리 이름 | Claude Code | Codex |
|---|---|---|
| forma:dashboard | `/forma:dashboard` | `$forma-dashboard` |
| forma:report | `/forma:report` | `$forma-report` |
| forma:manual | `/forma:manual` | `$forma-manual` |
| forma:advanced | `/forma:advanced` | `$forma-advanced` |

권장 구조:

```
skills-src/{dashboard,report,manual,advanced}/
  instructions.md  profile.json  references/
dist/claude/forma/.claude-plugin/ + skills/<name>/SKILL.md
dist/codex/forma-<name>/SKILL.md
```

하나의 canonical source에서 어댑터를 생성한다. 현재
`src/cli/skills.ts`의 copy+checksum 구조를 확장하면 된다.

`advanced`는 명시적 호출 전용:
- Claude: `disable-model-invocation: true`
- Codex: `policy.allow_implicit_invocation: false`

### 착수 전에 반드시 할 것

**사용자 제안서에 인용된 외부 문서를 아직 아무도 검증하지 않았다.**
Agent Skills 표준의 이름 규칙, Claude Code 플러그인 namespace,
Codex의 `$skill-name` 호출 형식과 `.agents/skills` 탐색 경로,
스킬 목록 컨텍스트 상한(2% 또는 8,000자) — 전부 미확인이다.

PR1~7에는 영향이 없었지만 PR9는 이 위에 서 있다. **먼저 확인하고 시작하라.**
확인 결과가 제안서와 다르면 사용자에게 알리고 진행할 것.

---

## 남은 완료 기준 (사용자 제시 18항목 중 미충족)

```
[ ] advanced Decision Room 구현        ← Portable만 완료, Room Mode 남음
[ ] 4개 스킬 설치와 호출 검증
[ ] artifact별 fixture와 example 제공   ← fixture는 있고 examples/ 재구성 남음
[ ] Visual Tournament advanced quality  ← 아래 "알려진 부채" 참조
[ ] 관련 문서와 실제 코드의 drift 제거
```

최종적으로 이 명령들이 전부 성공해야 한다:

```bash
pnpm build && pnpm test && pnpm lint:design && pnpm qa
pnpm forma build fixtures/dashboard/release-gate/forma.spec.json
pnpm forma build fixtures/report/technical/forma.spec.json
pnpm forma build fixtures/manual/quickstart/forma.spec.json
pnpm forma advanced fixtures/advanced/release-decision/forma.spec.json --portable
pnpm forma verify-skills
```

앞의 다섯 개는 현재 통과한다.

---

## 알려진 부채

**1. Visual Tournament의 축이 스타일시트로 내려가지 않는다.**
`src/qa/candidates.ts`가 후보를 만들고 점수를 매기고 승자를 뽑는 것까지는
실제로 동작하고 테스트로 고정돼 있다. 하지만 `density` / `measure` /
`figurePlacement` / `typeScale` 네 축이 아직 렌더러에 연결되지 않아서
모든 후보가 같은 증거로 채점된다. `src/cli/index.ts`의 해당 블록 주석과
PR #6 본문에 명시해뒀다. **없는 걸 있는 척하지 말 것.**

**2. `examples/`가 아직 0.1 구조다.**
`fixtures/`는 artifact별로 재구성했지만 `examples/forma-theme-*`는
옛 테마 이름을 그대로 쓰고 있다. 마이그레이션으로 렌더는 되지만
이름이 거짓말이다.

**3. artifact별 CSS가 아직 옛 4테마 매핑이다.**
`src/design/artifact-css.ts`로 파일은 분리했지만 규칙 자체는 옛
simple/workspace/guide/magazine을 옮긴 것이다. dashboard가 옛 workspace
레일 스타일을 쓰고 있다. Signal Grid 고유의 12열 그리드는 아직 없다.

**4. Storybook 미도입.**
TSX 전환의 목적 중 하나였으나 앱 신설이라 미뤘다. PR6에 넣으려다
분리했다. 문서에 기록돼 있다.

**5. 링크 끊긴 정적 목업 3개.**
`prototypes/{precision-workbench,developer-docs,editorial-magazine}/onboarding.html`이
갤러리에서 참조되지 않는다. 정리 여부 미정 — 사용자에게 두 번 물었으나
답이 없었다.

---

## 작업 방식 (이어갈 때 지킬 것)

이 개편에서 값을 한 것들이다.

**첫 렌더를 그대로 넘기지 않는다.** PR3~5에서 브라우저 QA(axe/overflow/
console)를 전부 통과한 상태에서도 스크린샷을 보면 결함이 나왔다. 한국어
줄바꿈이 "백그라운드"를 "백그라운 / 드"로 쪼개던 것, 수치 쌍이 라벨과 값으로
흩어지던 것, 목차가 리포트 핵심 섹션을 통째로 빼먹던 것 전부 육안 검수에서
나왔다.

```bash
# 스크린샷 찍는 최소 스크립트 (scratch로 만들고 지울 것)
node -e '...'  # playwright chromium, deviceScaleFactor 2, fullPage
```

**lint 규칙은 쌍으로 테스트한다.** 결함에 반응하는 테스트와 정상 코드에
침묵하는 테스트. 항상 통과만 하는 규칙은 고장난 규칙과 구별되지 않는다.

**성능 측정은 반복한다.** 이전 세션에서 Lighthouse TBT가 77 / 263 / 910ms로
흔들렸고 CLS 0.245는 재측정 결과 0.0073이었다. 한 번 재고 회귀를 판정하지 말 것.

**CSS는 TS 템플릿 리터럴 안에 있다.** 주석에 백틱을 쓰면 리터럴이 끊긴다.
이 프로젝트에서 두 번 걸렸다.

**커밋 메시지는 한국어, prefix 없음, 왜 했는지 중심.**
`feat:` `fix:` 같은 Conventional Commits 형식 쓰지 않는다.

---

## 절대 제약 (변경 불가)

- 외부 LLM API 호출 금지
- 문서 내용을 제3자 네트워크 엔드포인트로 전송 금지
- Google Fonts CSS API 사용 금지 (`text=` 쿼리로 내용이 유출된다)
- 표준 artifact 산출물의 외부 네트워크 요청 **0건**
- Advanced Portable 외부 네트워크 요청 **0건**
- Agent는 HTML/CSS를 직접 생성하지 않는다. spec만 쓴다
- 렌더된 문서 본문에 em dash 사용 금지 (사용자가 AI 티라고 지적)

## 축소 금지 (사용자 명시)

4종 artifact를 전부 실제 사용 가능한 상태로 완성하는 것이 목표다.
`report`와 `manual`만 구현한 중간 상태를 완료로 보지 않는다.
미구현 블록을 빈 renderer로 등록하거나, 지원하지 않는 artifact를
report로 fallback시키거나, `planned` 상태로 남기는 것 전부 금지다.
