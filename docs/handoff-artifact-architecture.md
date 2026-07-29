# 핸드오프: artifact 아키텍처 개편

2026-07-28 작성. PR1~7 완료, PR8~9 남음.

이 문서만 읽고 이어서 작업할 수 있게 쓴 것이다. 배경은
`docs/project-overview.md`, 디자인 규칙은 `DESIGN.md`,
artifact 계약은 `skills-src/_shared/references/artifacts.md`.

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
| 7 | Decision Room 블록 5종 + Portable 모드 | 머지됨 (#7) |
| 8 | Room Mode + 협업 + Decision Freeze | **PR 열림 (`feat/room-mode`)** |
| 9 | Codex/Claude 스킬 패키징 + 최종 QA | **패키징·호스트 로더 검증 완료** |

브랜치: `feat/room-mode`

**첫 할 일**: PR8을 머지하고 PR9로 넘어간다. PR9는 아래 "PR9" 절의
경고를 먼저 읽어라 — 검증되지 않은 외부 문서 전제 위에 서 있다.

---

## 현재 게이트 상태

전부 통과 상태다. 작업 전에 한 번 돌려서 기준선을 확인하라.

```bash
pnpm install
pnpm build            # tsc, 오류 0
pnpm test             # 277개 통과
pnpm qa               # 8/8 (fixture 8종 x 5뷰포트 + axe + clipped text)
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
│                  document|code|diagram|data|decision.tsx   (기반 20종)
│                  report.tsx (14) manual.tsx (13)
│                  dashboard.tsx (7) advanced.tsx (5)
├── planner/       plan.ts  profile.ts  profiles/{4종}
│                  claims.ts  procedure.ts  metrics.ts  simulation.ts
├── renderer/      document.tsx  compose.tsx  static.tsx  shell.ts
│                  diagrams.ts  sparkline.ts  interactive.ts  highlight.ts
├── design/        foundations-css.ts  block-css.ts  artifact-css.ts  tokens.ts
├── room/          state.ts  protocol.ts  token.ts  server.ts
│                  panel.ts  freeze.ts  persist.ts        (Room Mode, PR8)
└── qa/            design-lint.ts  dom-lint.ts  candidates.ts  browser-qa.ts
```

**블록 추가 방법**: 해당 `*.tsx`에 `defineBlock({...})` 하나 쓰고
`registry.ts`의 배열에 넣는다. union / 타입 / JSON Schema / artifact
허용 목록 / dispatch가 전부 파생된다. `tests/unit/block-registry.test.ts`의
`minimalBlockFor`에 최소 fixture를 추가하지 않으면 테스트가 실패한다.
이건 의도된 가드다.

---

## PR8: Room Mode (완료)

### 무엇을 만들었나

```
forma advanced <spec> --room [--lan] [--port N] [--out dir]
```

```
src/room/
├── state.ts      메모리 전용 상태 + 순수 reducer (투표/코멘트/sim 입력/freeze)
├── protocol.ts   클라이언트 메시지 zod 스키마 (경계 검증, 상한 명시)
├── token.ts      192bit 세션 토큰, timingSafeEqual 비교
├── server.ts     HTTP + SSE, bind 정책, CSP, Origin 검사
├── panel.ts      참여 패널 HTML/CSS/클라이언트 스크립트
├── freeze.ts     DecisionRecord 조립 (순수)
└── persist.ts    decision.json / snapshot.html / manifest.json 기록
```

### 결정 사항과 이유

**WebSocket 대신 SSE + POST.** Node 코어에 WS 서버가 없어서 `ws` 런타임
의존성이 필요한데, 이 프로젝트의 주장 자체가 "산출물이 아무것에도 의존하지
않는다"다. 요구사항은 "WebSocket 또는 동등한 로컬 실시간 동기화"였고 SSE가
그 동등물이다. 단방향 push + 일반 POST는 이 트래픽의 실제 모양이기도 하다.

**패널은 완성된 문서에 문자열로 주입한다.** 블록 파이프라인을 타지 않는다.
그래서 "room 문서 = portable 문서 + 패널"이 증명 가능하고, 패널을 떼면
Freeze snapshot이 그대로 나온다. 두 경로가 갈라져 drift하는 일이 없다.

**reducer는 순수하고 타임스탬프는 인자로 받는다.** `Date.now()`를 안에서
부르지 않으므로 테스트가 결정적이다.

### 반드시 지킬 구분 (유지됨)

"외부 네트워크 요청 0건"과 "참여자 간 LAN 통신"은 다른 것이다. manifest는
`session`과 `snapshot`을 별도 객체로 유지한다. 하나로 합치면 둘 중 하나에
대해 거짓이 되고, 어느 쪽인지는 읽는 사람이 무엇을 뜻했느냐에 달린다.
`docs/security.md`의 "Room Mode is the one networked surface" 절과
`skills-src/_shared/references/artifacts.md`의 두 모드 표에 같은 내용이 있다.

로 백 바인드는 주장이 아니라 검증됐다. `--lan` 없이 호스트 자신의 LAN
주소(`10.10.7.43:4181`)로 접속하면 connection refused, `127.0.0.1`은 200.

### 육안 검수에서 나온 결함 5건 (전부 테스트로 고정됨)

브라우저 QA(axe/overflow/console)를 통과한 상태에서 스크린샷을 보고 찾은
것들이다. 이 프로젝트에서 이 절차가 또 값을 했다.

1. **`[hidden]`이 무력화됐다.** 패널 CSS의 `display:flex`가 UA
   스타일시트의 `[hidden]{display:none}`을 이긴다. 그래서 JS를 끄면 패널이
   통째로 렌더됐다 — 안의 컨트롤이 하나도 동작하지 않는 유일한 상태에서.
2. **표결이 `1 / 1 / 0`이었다.** 라벨 없는 숫자 3개는 눈으로도 스크린
   리더로도 읽을 수 없다. `찬성 1 · 반대 1 · 기권 0`으로 바꿨다.
3. **호스트 절대 경로가 참여자 브라우저로 갔다.** freeze 응답이 전체
   경로를 담았다. `--lan`이면 다른 데스크로 건너간다. basename만 보낸다.
4. **확정 후에도 "확정하면 저장된다"는 안내가 남았다.** 이미 일어난 일에
   대한 조언이 된다.
5. **snapshot의 입력값이 `delayDays=30`이었다.** 1년 뒤 읽을 기록에
   변수명이 들어가면 안 된다. spec의 `label`과 `unit`을 쓴다
   (`정식 인증 지연 30 일`). 원시 변수명은 기계용인 `decision.json`에만
   남는다.

**테스트 함정 하나 기록.** 5번을 고정하려고 쓴 첫 테스트가 진공 통과였다.
`expect(snapshot).toContain(label)`은 라벨이 위쪽 본문에도 있으므로 기록이
잘못 만들어져도 통과한다. `#room-record` 구간만 잘라내고, fixture에 없는
값(4242)을 주입해서 검증하도록 고쳤다. 스코프 없는 `toContain`은
"항상 통과하는 규칙"의 다른 얼굴이다.

### 알려진 한계

**좁은 화면에서 패널이 문서 아래에 정적 배치된다.** 오버플로 0, axe 0으로
동작은 하지만, 모바일 참여자는 투표하려면 문서 전체를 스크롤해서 지나가야
한다. 데스크톱(고정 사이드바)만 편하다. 스티키 하단 바나 접이식 패널이
답인데 마크업 변경이 필요해서 넣지 않았다. 요구사항에 모바일 항목이
없었다.

### 남은 것

`pnpm qa`는 room 문서를 검사하지 않는다 — fixture 산출물만 돈다. room과
snapshot의 브라우저 QA(2인 세션 실시간 동기화, axe, 오버플로, 외부 요청,
freeze 잠금)는 이번에 scratch 스크립트로 돌려서 확인했지만 자동화되지
않았다. PR9의 최종 QA에 넣을 후보다.

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

### 외부 문서 검증 결과 (2026-07-28 확인 완료)

핸드오프가 "착수 전 반드시 확인"으로 남겼던 항목을 전부 1차 출처에서
확인했다. **제안서의 컨텍스트 상한 수치가 틀렸고, 이름 규칙에 제안서가
언급하지 않은 제약이 하나 더 있다.**

| 제안서 주장 | 검증 결과 |
|---|---|
| Agent Skills 이름 규칙 | 맞음 + 제약 추가 (아래) |
| Claude `/forma:dashboard` namespace | 맞음 |
| Codex `$skill-name` 호출 | 맞음 (CLI/IDE에서 `$`. ChatGPT Work는 `@`) |
| `.agents/skills` 탐색 경로 | 맞음 |
| Claude `disable-model-invocation: true` | 맞음 (SKILL.md frontmatter) |
| Codex `policy.allow_implicit_invocation: false` | 맞음, **단 위치가 다르다** |
| 컨텍스트 상한 "2% 또는 8,000자" | **틀렸다** |

**이름은 부모 디렉터리 이름과 일치해야 한다.** Agent Skills 스펙:
1~64자, 소문자·숫자·하이픈만, 앞뒤 하이픈 금지, 연속 하이픈(`--`) 금지,
그리고 **`name`이 부모 디렉터리 이름과 같아야 한다**. `description`은
1~1024자.

이게 설계에 직접 영향을 준다. Claude 쪽은
`forma/skills/dashboard/SKILL.md` + `name: dashboard` → `/forma:dashboard`.
Codex 쪽은 `forma-dashboard/SKILL.md` + `name: forma-dashboard` →
`$forma-dashboard`. **두 호스트가 서로 다른 `name` 값을 요구한다.** 어댑터
생성기가 SKILL.md를 그냥 복사하면 안 되고 호스트별로 frontmatter를 다시
써야 한다. 현재 `src/cli/skills.ts`의 copy+checksum 구조를 그대로 확장하면
여기서 걸린다.

**Codex의 암묵 호출 차단은 frontmatter가 아니다.** `agents/openai.yaml`에
`policy.allow_implicit_invocation: false`로 넣는다. Codex가 지원하는
SKILL.md frontmatter는 `name`과 `description` 두 개뿐이다. Claude 쪽
`disable-model-invocation`은 frontmatter가 맞다. 즉 `advanced`를 명시적
호출 전용으로 만들려면 **서로 다른 파일 두 곳**을 건드려야 한다.

**컨텍스트 상한 실제 값** (Claude Code):
- 스킬 목록 예산 기본값은 모델 컨텍스트 창의 **1%**. 제안서의 "2%"는
  `skillListingBudgetFraction`을 **올리는 예시**(`0.02`)를 기본값으로
  잘못 읽은 것이다.
- 고정 문자수로 바꾸려면 `SLASH_COMMAND_TOOL_CHAR_BUDGET`.
- 항목별 `description` + `when_to_use` 합계 상한은 **1,536자**
  (`skillListingMaxDescChars`로 조정). **8,000자는 어디에도 없다.**
- 예산을 넘기면 Claude Code가 덜 쓰는 스킬부터 description을 버린다.
  이름은 항상 남는다. `/doctor`로 실측할 수 있다.

스킬이 4종뿐이므로 1,536자 상한만 지키면 예산은 문제가 아니다. 다만
`description`을 1024자(Agent Skills 스펙 상한)로 쓰면 Claude Code 목록에서
잘리지는 않지만, 4종 합계가 예산을 압박할 수 있다. 핵심 용례를 앞에 둘 것.

**Codex 탐색 경로 전체**: `$CWD/.agents/skills` → 상위 디렉터리들 →
`$REPO_ROOT/.agents/skills` → `$HOME/.agents/skills` →
`/etc/codex/skills`. Claude Code: `.claude/skills/`(시작 디렉터리와 repo
root까지의 모든 상위, 작업 중 하위도 on-demand) → `~/.claude/skills/` →
enterprise. 플러그인 스킬은 `plugin-name:skill-name`으로 namespace되므로
다른 레벨과 충돌하지 않는다.

**출처**
- https://code.claude.com/docs/en/skills
- https://code.claude.com/docs/en/plugins-reference
- https://agentskills.io/specification
- https://learn.chatgpt.com/docs/build-skills.md (developers.openai.com/codex/skills.md에서 308 리다이렉트)

---

### 구현 결과 (PR10)

```
skills-src/
├── _shared/{references,scripts,assets}/    4종이 공유
└── {dashboard,report,manual,advanced}/
    ├── skill.json        호스트 중립 메타 (id, description, whenToUse, explicitOnly)
    └── instructions.md   frontmatter 없는 본문

src/skills/{source.ts, adapters.ts, build.ts}
pnpm forma build-skills → dist/agent-skills/{claude/forma, codex/forma-*}
```

**frontmatter를 소스에서 뺀 것이 설계의 핵심이다.** 호스트마다 달라지는
유일한 부분이라서, 한 번 저자가 쓰면 최소 한 호스트에 대해 거짓이 된다.
`skill.json`의 `id` 하나에서 Claude는 `dashboard`, Codex는
`forma-dashboard`를 파생시킨다. `explicitOnly: true` 하나가 Claude에서는
frontmatter의 `disable-model-invocation`, Codex에서는
`agents/openai.yaml`의 policy가 된다.

검사는 **생성된 파일**에 대해 돈다. 입력만 보는 규칙은 어댑터가 이름을
잘못 파생시키는 경우를 못 잡는데, 이 계층이 존재하는 이유가 바로 그거다.

**실제 호스트 로더까지 검증했다.** Claude Code 2.1.220에서 생성된
플러그인을 `--plugin-dir`로 로드해 `/forma:dashboard`, `/forma:report`,
`/forma:manual`, `/forma:advanced`가 자동완성 목록에 나타나는 것을
확인했다. Codex 0.145.0의 오프라인 prompt-input 검사에서는 일반 3종이
스킬 목록에 나타나고 `forma-advanced`는 implicit 목록에서 빠졌다.
모델 요청은 보안 규칙상 보내지 않았다.

네 artifact 스킬은 `skills-src/` 한 곳에서 관리하고,
`install-skills`가 Codex standalone package 또는 Claude plugin으로
빌드·설치한다. 구형 `skills/forma/SKILL.md`는 생성된 compatibility
router를 체크섬으로 식별해 안전하게 제거하기 위한 마이그레이션
자료로만 남아 있다. 생성 스크립트는 현재 checkout, 설치 시 기록한
`.forma-runtime.json`, `FORMA_REPO`, PATH 순으로 실행기를 찾는다.

---

## 남은 완료 기준 (사용자 제시 18항목 중 미충족)

```
[x] advanced Decision Room 구현        ← Portable + Room Mode 완료 (PR7, PR8)
[x] 4개 스킬 설치와 호출 경로 검증
[x] artifact별 fixture와 example 제공
[x] Visual Tournament advanced quality
[x] 관련 문서와 실제 코드의 drift 제거
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

전부 통과한다.

---

## 알려진 부채

**1. ~~Visual Tournament의 축이 스타일시트로 내려가지 않는다.~~ 해소됨.**
네 축이 실제 DOM/CSS와 섹션 순서에 반영된다. advanced quality는 후보마다
정적 lint와 5개 viewport 브라우저 probe를 별도로 실행하고, overflow,
clipped text, axe, 외부 요청, 깨진 anchor가 있는 후보를 탈락시킨다.

**2. ~~`examples/`가 아직 0.1 구조다.~~ 해소됨.**
`examples/forma-theme-*` 9개를 지우고 artifact별 4개로 다시 만들었다.
내용도 전부 forma 자신을 설명하는 것으로 바꿨다: 현재 상태(dashboard),
왜 spec 우선인가(report), Agent Skill로 쓰기(manual), 아직 안 한 결정
하나(advanced). 4종 모두 검증·렌더·design lint·브라우저 QA를 통과한다.

**3. ~~artifact별 CSS가 아직 옛 4테마 매핑이다.~~ 해소됨.**
CSS의 옛 theme 명칭과 workspace 전용 토큰을 제거했다. Dashboard는
실제 12열 Signal Grid와 7:5 anomaly/action 분할을 쓰고, Advanced는
evidence graph·simulation·matrix를 위한 96rem 검토 캔버스를 쓴다.

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
