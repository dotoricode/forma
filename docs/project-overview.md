# Forma 프로젝트 전체 설명

이 문서는 Forma가 무엇을 목표로 하고, 무엇을 어떤 언어로 만들어내며,
코드와 디자인이 어떤 구조로 짜여 있는지를 한 자리에 정리한 것이다.
2026-07-28 기준 실제 코드를 읽고 측정한 값만 담았다.

- 디자인 규칙의 정본: `DESIGN.md`
- 파이프라인 요약: `docs/architecture.md`
- 이 문서는 그 둘을 포함해 전체 그림을 잇는 용도다.

---

## 1. 목표

### 해결하려는 문제

기술적인 작업 결과(코드 변경, 리뷰 안건, 테스트 결과, 장애 보고, 매뉴얼)를
남에게 설명해야 할 때, Markdown은 구조가 없어 읽는 사람이 스스로 해석해야
하고, 손으로 만든 HTML은 매번 결과물이 달라진다. LLM에게 HTML을 통째로
쓰게 하면 그때그때 다른 디자인이 나오고, 대부분 "AI가 만든 티가 나는"
템플릿으로 수렴한다.

Forma는 이 셋을 동시에 피한다.

> Turn complex work into clear form.

### 핵심 아키텍처 제약

**Agent는 HTML을 쓰지 않는다. `forma.spec.json`만 쓴다.**

```
입력 자료  →  Agent 분석  →  forma.spec.json  →  결정론적 렌더러  →  단일 HTML  →  Playwright QA
             (내용/서사/블록 선택)  (Zod 검증)      (TypeScript)     (오프라인)
```

같은 spec을 두 번 렌더하면 바이트 단위로 같은 HTML이 나온다. 디자인 품질은
Agent의 그날 컨디션이 아니라 렌더러 코드가 보장한다. 새 시각 표현이
필요하면 CSS를 고치는 것이지 Agent에게 더 잘 써달라고 부탁하는 게 아니다.

### 절대 제약 (기밀성)

- 외부 LLM API 호출 없음
- 문서 내용을 제3자 네트워크 엔드포인트로 전송하지 않음
- Google Fonts CSS API도 사용 금지 (`text=` 쿼리로 문서 내용이 유출된다)
- 렌더된 HTML은 네트워크 요청 **0건**. `file://`로 열어도 완전히 동작

폰트는 npm 패키지에서 로컬로 subset해 base64로 문서 안에 박는다.
자세한 내용은 `docs/security.md`, `skills/forma/references/typography.md`.

---

## 2. 결과물과 언어 구성

### 만들어내는 것

`forma render` 한 번에 다음이 나온다.

```
output/
├── index.html        자기완결형 문서 (이게 결과물이다)
├── forma.spec.json   검증·정규화된 입력 사본
├── manifest.json     generator, specVersion, mode, 섹션 수, 바이트
└── qa/               브라우저 QA 산출물(스크린샷 등)이 들어갈 자리
```

### `index.html` 안의 실제 구성

`examples/forma-theme-simple/output/index.html` 실측 (169,914 bytes,
gzip 105,297 bytes):

| 구성 요소 | 바이트 | 비중 | 정체 |
|---|---:|---:|---|
| WOFF2 폰트 (base64) | 121,443 | 71.5% | `<style>` 안 `@font-face`의 data URI |
| CSS 규칙 | 33,511 | 19.7% | 인라인 `<style>`, 외부 파일 없음 |
| HTML 마크업 | 12,048 | 7.1% | 시맨틱 HTML + 인라인 SVG |
| JavaScript | 2,912 | 1.7% | 인라인 `<script type="module">` |

**용량의 7할이 폰트다.** 그래서 문서마다 실제 쓰인 글자만 골라 subset한다
(`src/design/fonts.ts`). 한글이 한 글자도 없으면 IBM Plex Sans KR은 아예
넣지 않는다.

### 언어 구성

**소스 코드: TypeScript 100%**

`src/` 아래 24개 파일 3,953줄이 전부 `.ts`다. `.html` 소스 파일도,
`.css` 소스 파일도 없다. HTML과 CSS는 TS 템플릿 리터럴로 조립한다.

```
src/design/css.ts      865줄  →  CSS 문자열 전부
src/renderer/shell.ts   67줄  →  <html> 골격
src/renderer/blocks.ts 484줄  →  블록 20종의 HTML
src/renderer/diagrams.ts 235줄 →  SVG 좌표 계산
```

JSX 없음, 템플릿 엔진 없음, CSS 전처리기 없음, 번들러 없음.
빌드는 `tsc` 하나다.

**결과물: HTML + CSS + 최소 JS + 인라인 SVG + 임베디드 WOFF2**

| 기술 | 쓰임 | 프레임워크 |
|---|---|---|
| HTML | 시맨틱 마크업, ARIA | 없음 |
| CSS | `@layer` 7단, OKLCH, 컨테이너 쿼리, subgrid, 논리 속성 | 없음 |
| JS | 테마 토글 + 코드 복사, 두 개의 작은 island | 없음. 런타임 0바이트 |
| SVG | flow / sequence / architecture / chart를 빌드 타임에 좌표 계산해 생성 | 없음. Mermaid·D3 미사용 |
| WOFF2 | 문서별 subset, base64 data URI | 외부 요청 0 |

JS를 꺼도 문서는 전부 읽히고 탐색된다. JS는 오직 편의 기능만 담당한다.

---

## 3. 코드 구성

### 디렉터리

```
src/
├── spec/         입력 계약. 여기를 통과 못 한 건 렌더러가 보지 않는다
│   ├── schema.ts        330줄  Zod 스키마 전부 (meta, 20블록, narrative)
│   ├── mode.ts           87줄  지시문에서 mode 추론
│   ├── validate.ts       27줄  사람이 읽는 오류 포매터
│   └── json-schema.ts     9줄  z.toJSONSchema 내보내기
│
├── design/       시각 토큰과 스타일시트
│   ├── css.ts           865줄  @layer 7단 전체 + 테마 4종
│   ├── tokens.ts        102줄  OKLCH 프리미티브, 간격/반경/모션/measure
│   └── fonts.ts         153줄  subset-font 파이프라인
│
├── renderer/     spec → HTML
│   ├── blocks.ts        484줄  블록별 렌더 함수
│   ├── diagrams.ts      235줄  자체 SVG 레이아웃 엔진
│   ├── interactive.ts    94줄  인라인 JS island
│   ├── compose.ts        93줄  섹션 조립 + 목차 + 폰트용 텍스트 수집
│   ├── diff-view.ts      72줄  unified diff 파싱
│   ├── shell.ts          67줄  <html> 문서 골격
│   ├── highlight.ts      57줄  Shiki 빌드 타임 하이라이팅
│   └── render.ts         64줄  파일 IO + manifest
│
├── security/
│   └── sanitize.ts       96줄  이스케이프·sanitize·시크릿 마스킹의 유일한 경계
│
├── qa/
│   ├── browser-qa.ts    281줄  Playwright 4뷰포트 + axe
│   ├── design-lint.ts   228줄  금지 패턴 정적 검사
│   ├── run-lighthouse.ts 119줄
│   └── run-qa.ts         40줄
│
└── cli/
    ├── index.ts         216줄  commander, 11개 명령
    ├── skills.ts        114줄  스킬 사본 동기화 + 체크섬
    ├── generate.ts       67줄  스캐폴딩 (LLM 호출 안 함)
    └── starter-spec.ts   53줄
```

### 의존성

| 런타임 | 용도 |
|---|---|
| `zod` | 스펙 스키마. 유일한 입력 신뢰 경계 |
| `shiki` | 빌드 타임 코드 하이라이팅 |
| `isomorphic-dompurify` | HTML/SVG sanitize |
| `diff` | unified diff 파싱 |
| `svgo` | SVG 최적화 |
| `commander` | CLI |

개발 전용으로 Playwright, axe-core, Lighthouse, subset-font, vitest,
그리고 폰트 소스 패키지(`geist`, `@ibm/plex-sans-kr`, 둘 다 SIL OFL-1.1).

### CLI

```bash
forma init                    스타터 스펙 생성
forma validate <spec>         스키마 검증
forma render <spec>           단일 HTML 렌더
forma build <spec>            렌더 + 브라우저 없는 정적 게이트
forma preview <dir>           localhost 서버 (외부 접근 차단)
forma qa <dir>                Playwright + axe + 반응형 + 오프라인 검사
forma install-skills          canonical 스킬을 .claude/.agents 로 복사
forma verify-skills           사본 체크섬 대조
forma doctor                  로컬 환경 점검
forma schema                  JSON Schema 출력
forma generate                구조화 입력 스캐폴딩 (LLM 호출 없음)
```

### 테스트

vitest 8개 파일 **52개 테스트** 전부 통과. 가장 큰 축은
`design-lint.test.ts` 23개로, 과거에 실제로 발생한 디자인 결함마다
"규칙이 결함에 반응한다 / 정상 코드에는 반응하지 않는다" 쌍을 갖고 있다.

---

## 4. 입력 계약: `forma.spec.json`

```jsonc
{
  "version": "0.1",
  "meta": {
    "title":        "필수",
    "subtitle":     "선택",
    "mode":         "explain | review | test | report | manual",
    "audience":     "self | engineering | qa | manager | executive | external",
    "language":     "ko | en",
    "theme":        "light | dark | auto",        // 기본 light
    "designSystem": "simple | workspace | guide | magazine",  // 기본 simple
    "density":      "comfortable | compact",
    "confidentiality": "public | internal | confidential"
  },
  "sources":   [ { "id", "label", "path?", "kind?" } ],
  "narrative": { "question", "summary", "takeaways": [] },
  "sections":  [ /* 블록 1개 이상 */ ]
}
```

`sections`는 `type`으로 판별하는 discriminated union이고, 모든 블록이
공통으로 `id`(앵커), `sourceRefs[]`(출처), `confidence`(verified /
inferred / unknown), `notes`를 가질 수 있다.

**근거 없는 주장을 `verified`로 렌더하지 않는 것**이 이 스키마의 존재
이유 중 하나다. `inferred`는 문서에 시각적으로 다르게 표시된다.

### 블록 20종

| 그룹 | 블록 | 시각 문법 |
|---|---|---|
| 진입 | `cover`, `summary` | 표지, 요약 |
| 문서 | `prose`, `key-points`, `glossary`, `source-note` | 본문 measure 폭 |
| 코드 | `annotated-code`, `diff` | breakout + 줄 주석 rail |
| 다이어그램 | `flow`, `sequence`, `timeline`, `architecture` | 전체 폭 SVG 캔버스 |
| 데이터 | `comparison`, `test-summary`, `test-matrix`, `chart` | 표/밴드/차트 |
| 판단 | `finding`, `risk`, `decision`, `actions` | 심각도·상태 색 |

그룹마다 레이아웃 문법이 다르다. 같은 카드 컴포넌트를 20번 반복하지
않는 것이 설계 원칙이다.

---

## 5. 디자인 아키텍처

### 5-1. 토큰 2계층

```
프리미티브 (src/design/tokens.ts)      시맨틱 (src/design/css.ts @layer tokens)
  neutral0 … neutral950         →       --color-canvas / surface / surface-raised
  accent400/500/600             →       --color-text / text-muted
  success/warning/danger/info   →       --color-border / border-strong
                                        --color-accent / accent-strong / on-accent
```

**컴포넌트 CSS는 시맨틱 토큰만 참조한다.** 프리미티브나 raw hex/OKLCH를
직접 쓰면 `design-lint`의 `hardcoded-paint-color` 규칙에 걸린다.
이유는 실제 사고에서 나왔다. 사이드바 배경에 `neutral900`을 하드코딩했더니
다크 모드에서 카드와 색이 똑같아져 두 면이 한 덩어리가 됐고, 대비가
2.41:1까지 떨어졌다.

색은 전부 OKLCH다. 다만 **혼합은 반드시 `oklab`으로** 한다.
`color-mix(in oklch, ...)`는 색상환에서 hue를 보간하는데, 중립 토큰의
hue가 0이라 파란 accent(hue 250)를 흰색과 섞으면 250에서 0으로 돌아가며
분홍(hue 353)에 착지한다. 이것도 lint 규칙(`oklch-color-mix-hue-shift`)이다.

### 5-2. 캐스케이드 레이어 7단

```css
@layer reset, tokens, base, layout, components, utilities, overrides;
```

순서가 고정되어 있어 specificity 싸움이 없고, print 스타일시트를 빼면
`!important`가 없다. 테마 CSS는 전부 마지막 `overrides` 레이어에 산다
(`designSystemCss()`).

레이어를 쓸 때 주의할 점 하나. `overrides`의 테마 규칙은 `layout` 레이어의
미디어 쿼리가 설정한 속성을 **명시적으로 되돌려야** 한다. workspace 레일이
페이지 중간에서 잘렸던 건 `@media (min-width: 1280px)`의
`max-height: calc(100vh - ...)`가 계속 살아 있었기 때문이다.

### 5-3. 테마 = CSS 변형, 렌더러 분기가 아님

`meta.designSystem`은 `<html data-design="...">` 속성 하나로만 나타난다.

```html
<html lang="ko" data-theme="light" data-design="workspace">
```

**네 테마 모두 완전히 동일한 DOM을 만든다.** 블록 렌더러는 테마를 알지
못한다. 테마를 추가한다는 것은 `[data-design="..."]` 아래에 CSS를 쓴다는
뜻이지, 병렬 렌더러를 만든다는 뜻이 아니다.

| 테마 | 용도 | 구성 |
|---|---|---|
| `simple` | 혼합 독자용 일반 문서 | 강한 도입부 괘선, 안정적 읽기 기준선, 넉넉한 여백 |
| `workspace` | 밀도 높은 리뷰·테스트 근거 | 좌측 고정 레일, 압축된 리듬, 근거만 카드로 띄움 |
| `guide` | 매뉴얼, 단계별 설명 | 방향 안내 우선 레일, 좁은 measure, 큰 콜아웃 |
| `magazine` | 서사형 보고서, 롱폼 | 디스플레이 세리프, 비대칭 표지, 편집 괘선 |

과거 이름(`quiet-editorial`, `precision-workbench`, `developer-docs`,
`editorial-magazine`)은 스키마 경계에서 자동 변환된다
(`LEGACY_DESIGN_SYSTEMS`).

### 5-4. 레이아웃 문법

**하나의 왼쪽 기준선.** 폭 제한과 정렬은 별개 결정이다.

```css
.measure  { max-width: var(--measure-prose); margin-inline: 0; }
.breakout { max-width: min(100%, 58rem);     margin-inline: 0; }
```

`margin-inline: auto`를 폭 제한과 묶으면 폭을 제한한 블록만 주변보다
100~240px 오른쪽에서 시작해 "왜 이 문단만 가운데 있지" 하는 결함이 된다.
가운데 정렬은 페이지 컬럼(`.doc`, `.layout`)에만 허용되고, 나머지에
붙으면 `centered-width-cap` 규칙에 걸린다.

**측정 단위는 rem이다.** `ch`는 "0" 글자의 폭이라 두 가지로 틀린다.
같은 `70ch`가 본문에서는 743px인데 글자가 작은 출처 주석에서는 603px가
되고, 한글은 "0"보다 약 두 배 넓어서 영문 기준으로 잡은 폭에 한글이 절반밖에
안 들어간다. `ch-measure` 규칙이 막는다.

```
--measure-prose  42rem (약 672px)   본문
--measure-wide   min(100%, 64rem)   표·코드·다이어그램
```

**현대 CSS를 실제로 쓴다.** 컨테이너 쿼리(comparison 2단 배치),
subgrid(test-matrix, `@supports` fallback 포함), 논리 속성
(`margin-inline`, `border-block-end`), `clamp()`.

컨테이너 쿼리는 조용히 실패한다는 점을 기억할 것. magazine 테마의
`.doc { max-width: 44rem }`(704px)이 `@container (min-width: 720px)`
바로 아래였던 탓에 2단이 한 번도 발동하지 않고 세로로 쌓였는데,
에러도 경고도 없었다.

### 5-5. 다크 모드

```css
[data-theme="dark"]                              명시적 (토글 island)
@media (prefers-color-scheme: dark)
  :root:not([data-theme="light"])                암묵적
```

토큰만 갈아끼우면 되도록 설계했다. workspace 레일도 지금은 파생 토큰
하나(`--wb-rail: var(--color-canvas)`)로 묶여 있어서, 테마별로 실제
갈리는 값은 `--color-canvas` 하나뿐이다.

인쇄는 테마와 무관하게 항상 흰 종이에 검은 잉크로 강제된다.

### 5-6. 명시적 금지 목록

`skills/forma/references/generic-ai-patterns.md`가 정본이고, 구조적으로
중요한 둘은 정적 lint가 잡는다.

1. **좌측 bracket/갈고리 테두리 금지.** note rail은 요소 자신에
   `border-inline-start: 1px solid`를 주는 방식만 허용. `::before`에
   왼쪽 테두리와 위/아래 테두리를 조합하는 순간 `bracket-border` 규칙에
   걸린다.
2. **장식용 대형 괄호 금지.** `content: "["`, `content: "{"`,
   `content: "</>"` 전부 금지.

그 외에 gradient 3개 이상(`gradient-overuse`), glassmorphism, glow,
dot-grid, hover lift, 순차 fade-up 등.

### 5-7. 재발 방지 lint 규칙 7종

`src/qa/design-lint.ts`. **전부 실제로 한 번씩 발생한 결함이다.**
같은 검수를 두 번 하지 않기 위해 규칙으로 굳혔다.

| 규칙 | 무엇을 막나 |
|---|---|
| `hardcoded-paint-color` | 테마를 못 따라가는 색 리터럴 (`@media print`는 면제) |
| `oklch-color-mix-hue-shift` | oklch 혼합의 hue 보간으로 색이 딴 데 착지 |
| `centered-width-cap` | 폭 제한 + auto 마진이 만드는 "혼자 가운데" 블록 |
| `ch-measure` | ch 단위 읽기 폭 (글자 크기·한글에 따라 폭이 흔들림) |
| `bracket-border` | 좌측 bracket 프레임 |
| `decorative-glyph-content` | 장식용 괄호 글리프 |
| `gradient-overuse` | gradient 3개 이상 |

브라우저가 필요 없어서 `forma build`에 그대로 들어간다.

---

## 6. 품질 게이트

```bash
pnpm test           vitest 52개
pnpm lint:design    금지 패턴 정적 검사
pnpm qa             Playwright 1920/1440/1024/390 4뷰포트 + axe
pnpm lighthouse     성능
```

`pnpm qa`가 뷰포트마다 확인하는 것: console 에러 0, **외부 네트워크 요청
0**, 가로 overflow 0, heading 순서, 앵커 대상 존재, 키보드 도달성,
axe 위반 0, 스크린샷.

최근 전체 통과 기준: 라이트/다크 x 4테마 = 8조합 전부 axe 0, console 0.

성능 수치는 한 번 재고 판단하면 안 된다. 같은 문서에서 TBT가
77 / 263 / 910ms로 흔들렸고, CLS가 0.245로 찍혔던 실행은 재측정 결과
0.0073이었다. 회귀 판정은 반복 측정 후에.

---

## 7. 보안 경계

**`src/security/sanitize.ts` 하나가 유일한 경계다.** 블록 모듈이 자기
마음대로 HTML 문자열을 이어붙이지 않는다.

| 함수 | 역할 |
|---|---|
| `escapeHtml` | 모든 평문 |
| `renderInlineMarkdown` | 인라인 Markdown 허용 목록 (bold/italic/code/link)만, 이후 sanitize |
| `sanitizeFragment` | DOMPurify, 태그 7종 / 속성 2종만 허용 |
| `sanitizeSvg` | SVG 프로필, `script`·`foreignObject` 차단 |
| `redactSecrets` | private key, `sk-`, `AKIA`, `ghp_`, `api_key=` 패턴 마스킹 |
| `stripHomeDirectory` | 사용자 홈 절대경로를 `~`로 |
| `sanitizeUrl` | http/https/mailto 외 스킴 차단 |

`redactSecrets`와 `stripHomeDirectory`는 최종 HTML 문자열 전체에 한 번 더
적용된다(`render.ts:40`). 블록 하나가 새더라도 파일에 쓰이기 전에 걸린다.

---

## 8. 현재 상태와 열린 문제

### 동작하는 것

spec 검증, 20블록 렌더, 4테마 x 라이트/다크, 폰트 subset, 다이어그램 SVG,
Shiki 하이라이팅, diff 파싱, 인쇄 스타일, 4뷰포트 QA, axe 통과,
디자인 lint, 스킬 동기화. fixture 4종 + example 5종이 렌더된 상태로 있다.

### 알려진 문제

**1. `mode`가 렌더링에 아무 영향이 없다.**
`grep`으로 확인한 결과 `spec.meta.mode`는 `render.ts:54`에서 manifest에
기록되는 것과 `forma generate` 스캐폴딩에서만 쓰인다. `DESIGN.md`의
"Mode composition" 표는 **의도이지 구현이 아니다.** 지금은 Agent가
블록을 그 순서로 배치해주기를 기대하는 것뿐이고, 강제하는 코드가 없다.

**2. 테마 배정이 전적으로 Agent 재량이다.**
`mode`에서 테마를 유도하는 로직이 없고, 스키마 기본값 `simple`이 전부다.
`SKILL.md` 3단계의 지침 한 줄과 `design-grammar.md`의 테마당 한 줄이
근거의 전부라, 같은 문서를 두 번 만들면 테마가 달라질 수 있다.

**3. 테마 이름과 모드 이름이 겹칠 위험.**
테마를 `report` / `dashboard` / `manual`로 개편하자는 논의가 있는데,
`report`와 `manual`은 이미 `mode` 값이다. 또 "대시보드"를 표방하려면
지표 타일·스파크라인 블록이 필요한데 현재 20블록은 전부 문서 블록이다.

**4. 문서 drift.**
`DESIGN.md`가 `--measure-prose`를 아직 `70ch`로 적고 있다. 실제 값은
`42rem`이다(`src/design/tokens.ts`).

**5. 링크 끊긴 정적 목업 3개.**
`prototypes/{precision-workbench,developer-docs,editorial-magazine}/onboarding.html`이
갤러리에서 참조되지 않는 상태로 남아 있다. 삭제할지 "손으로 그린 원안"으로
보존할지 미정.

### 하려다 만 것

- 온보딩 문서의 전체 흐름을 사람의 사고 순서에 맞게 재구성
- flow 다이어그램을 더 정교하게 (애니메이션·인터랙션 포함)
- narrative 섹션의 시각 처리 대안 여러 개 제시

---

## 9. 빠른 참조

```bash
pnpm install
pnpm build                                   # tsc
pnpm test                                    # 52개
pnpm forma validate fixtures/review/forma.spec.json
pnpm forma render   fixtures/review/forma.spec.json
pnpm forma build    fixtures/report/forma.spec.json
pnpm qa                                      # Playwright + axe
pnpm lint:design
pnpm lighthouse
node scripts/check-naming.mjs
```

| 알고 싶은 것 | 볼 파일 |
|---|---|
| 입력에 무엇을 쓸 수 있나 | `src/spec/schema.ts` |
| 블록이 어떤 HTML이 되나 | `src/renderer/blocks.ts` |
| 색·간격·타이포 값 | `src/design/tokens.ts` |
| 스타일 전부 | `src/design/css.ts` |
| 하면 안 되는 것 | `src/qa/design-lint.ts`, `skills/forma/references/generic-ai-patterns.md` |
| Agent가 따르는 절차 | `skills/forma/SKILL.md` |
| 왜 이렇게 했나 | `docs/decisions.md`, `docs/design-iterations.md` |
