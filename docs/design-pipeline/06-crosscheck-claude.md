# 교차 검증 (claude): 1~3단계 조사 6건 + 오케스트레이터 문서 05

검증 대상: `01-feasibility-{codex,claude}.md`, `02-authoring-{codex,claude}.md`,
`03-antipattern-{codex,claude}.md`, `05-authoring-inputs.md`, 공유 입력 `00-source.md`.

방식: 인용된 `파일:줄`을 전부 직접 열었다. 임계값은 코드에서 읽었다. OKLCH 값은
독립 계산으로 재현했다. 자막 인용문은 원문에서 문자열 검색으로 대조했다. 웹 출처는
초록/본문을 fetch해서 확인했고, 열지 못한 것은 그렇게 적었다. `git` 명령은 쓰지 않았다.

---

## 결론

**치명 2건.** 둘 다 claude 쪽 문서에 있다.

1. **05 §3의 "AI 티가 안 난다 → 기계 17종 위반 0건"은 사실상 자동 충족되는
   기준이다.** 17종 중 7종은 AI 티가 아니라 correctness/provenance 규칙이고,
   CSS 린트 9종은 후보 간 CSS가 바이트 단위로 같아서 판별력이 0이며, 실제 AI
   표식(글래스모피즘, glow, fade-up)은 규칙 자체가 없다. 사용자의 1순위 요구가
   측정 불가능한 형태로 번역됐다.
2. **claude 01 §5가 "모델 간 블라인드 비교"를 잘못된 전제로 버렸다.** 자막의
   A/B/C는 GPT 5.6 / Fable 5 / Kimi K3 세 모델의 산출물 비교다. forma에서
   렌더러는 LLM이 아니지만 **spec은 LLM이 쓴다.** 비교 대상은 존재한다. codex
   01이 이 지점을 맞게 봤다.

**중간 9건, 경미 6건.** 아래에 나눠 적었다.

**그리고 맞는 것이 압도적으로 많다.** 검증한 저장소 인용 60여 건 중 틀린 것은
5건이고, 그중 3건은 파일명/줄 오차다. claude 03이 직접 계산했다는 OKLCH 표 11개
값은 **전부 소수점 자리까지 재현됐다.** codex 02의 DesignPref 인용(20명, 12k
pairwise, α=0.25), codex 03의 Nordhoff 인용(44개국 80,901개, 국가당 약 2,000개),
claude 03의 Design Theater 수치(25%/34%/0.54)는 원문 초록과 일치한다. 자막 인용문은
8개 전부 원문에 그대로 있다. 두 조사 모두 미확인 표시를 성실하게 달았다.

---

## 1. 치명

### 치명-1. 05 §3: "기계 17종 위반 0건"은 AI 티의 판정 기준이 될 수 없다

**05의 주장** (§3 표, §4):

> | AI 티가 안 난다 | 반례 목록 위반 0건. 목록은 4절에 있고 기계 17종 + 육안 항목 |

17종이라는 숫자 자체는 맞다. `design-lint.ts` 9종 + `dom-lint.ts` 8종이고, 05가
나열한 규칙 이름은 코드와 **완전히 일치한다**(`src/qa/design-lint.ts:38,64,88,101,
114,151,168,182,241` / `src/qa/dom-lint.ts:97,112,134,156,181,198,221,253`).

문제는 그 17종이 "AI 티"를 재지 않는다는 것이다. 세 겹이다.

**(a) 7종은 AI 티가 아니다.** 두 3단계 조사가 각각 독립적으로 지적했고
(`03-antipattern-codex.md:289-300`, `03-antipattern-claude.md:518-524`) 내가
코드에서 확인했다.

| 규칙 | 실제 성격 |
|---|---|
| `verified-claim-without-evidence` | 콘텐츠 provenance. `candidates.ts:137-139`에서 **hard gate**로 처리된다 |
| `hardcoded-paint-color` | 테마 정합성 버그 |
| `oklch-color-mix-hue-shift` | 색 보간 구현 결함 |
| `ch-measure` | CJK 측정 폭 결함 |
| `centered-width-cap` | 레이아웃 정렬 결함 |
| `orphan-heading` | 구조 결함(본문 40자 미만). 헤딩이 "개요"인지는 안 본다 |
| `prose-run` | 문서 리듬 |

**(b) CSS 린트 9종은 후보를 구별하지 못한다.** `buildStylesheet(fontFaceCss)`의
유일한 문서별 입력은 폰트이고(`src/design/foundations-css.ts:47`), `artifactCss()`
`blockCss()`는 인자가 없다(`artifact-css.ts:13`, `block-css.ts:9`). 확인했다.
따라서 8개 후보의 `<style>`은 동일하고 CSS 린트 9종의 결과도 동일하다. "위반 0건"은
후보 하나에서 참이면 전부에서 참이다.

**(c) 실제 AI 표식에는 규칙이 없다.** `generic-ai-patterns.md`가 나열한 글래스모피즘,
glow/neon, dot-grid/orb, 스크롤 fade-up에 대응하는 규칙은 0개다. `grep -rn "shadow"
src/qa/*.ts` → 0건, `backdrop-filter` 검사 0건, `@keyframes` 검사 0건. 전부 확인했다.

**결과.** 지금 forma가 내는 어떤 문서든 "기계 17종 위반 0건"을 거의 자동으로
통과한다. 사용자가 1순위로 꼽은 "AI 티가 전혀 안 난다"가 **아무것도 걸러내지 않는
게이트**로 번역된 것이다. 05 §3이 스스로 "세 번째(편의 기능)가 지금 가장 약하다"고
적었는데, 실제로 가장 약한 것은 첫 번째다.

**고쳐야 할 것.** 17종을 세 갈래로 나눠 다시 적어야 한다 — hard gate(1),
correctness(6), 실제 반례(10) — 그리고 "AI 티 없음"의 판정 기준은 반례 10종 중
후보를 구별할 수 있는 것(dom-lint 쪽)과 육안 검수로만 구성해야 한다. 육안 항목이
1급 기준이 되는 것은 창피한 일이 아니라 두 3단계 조사가 도달한 결론이다.

---

### 치명-2. claude 01 §5: "모델 간 블라인드 비교"는 버릴 대상이 아니다

**claude 01의 주장** (`01-feasibility-claude.md:427-428`):

> 4. **모델 간 블라인드 비교(A/B/C).** forma는 LLM이 렌더하지 않는다.
>    비교 대상 자체가 존재하지 않는다.

전제는 맞고 결론이 틀렸다. 자막 원문을 열어서 확인했다:

> 비하인드 블라인드 테스트를 해요. A, B, C가 있거든요. 이게 세 개가 하나는
> GPT 5.6 Sol. 하나는 Fable 5. 하나는 Kimi K3로 디자인한 거예요.
> — `00-transcript-ko.txt` (문자열 검색으로 확인)

즉 영상이 비교한 것은 **서로 다른 모델이 만든 산출물**이다. forma에서 렌더러는
결정론적이지만 **`forma.spec.json`을 쓰는 것은 LLM이다.** `skills/forma/SKILL.md`
전체가 그 전제 위에 있다. 같은 원본을 서로 다른 모델/에이전트에게 주고 spec 3개를
받아 같은 렌더러로 렌더한 뒤 라벨을 가리고 비교하는 것은 지금 당장 가능하고,
결정론도 깨지 않는다(렌더는 여전히 spec의 함수다).

**codex 01이 이 지점을 맞게 봤다** (`01-feasibility-codex.md:241-243`):

> 현재 `candidates.ts`만 확장한다고 모델 간 다른 디자인이 생기지는 않는다.
> 모델별/스타일별 N개를 비교하려면 별도 spec 집합 또는 sidecar가 필요하고,
> 그 경계를 추가하는 설계는 **미확인**이다.

**판정: codex가 맞다.** 그리고 이건 사소한 차이가 아니다. 두 조사가 합의한 1차
병목은 "후보가 서로 안 다르다"인데, **오늘 당장 후보를 실제로 다르게 만들 수 있는
유일한 축이 spec 저작 층이다.** 스타일시트 파라미터화는 구현이 필요하지만
멀티-spec 비교는 필요 없다. claude 01은 그것을 영구 폐기 목록에 넣었다.

**주의할 점 하나.** 이 축을 열면 claude 01이 §1 선택지 B에서 지적한 재현성 문제가
그대로 온다 — LLM이 쓴 spec은 재현되지 않는다. 다만 산출물은 spec에서 결정론적으로
나오므로 "spec을 고정하면 렌더가 고정된다"는 성질은 유지된다. 폰트 임베딩과 같은
구조다. 버릴 이유가 아니라 기록할 이유다.

---

## 2. 중간 (근거가 약하거나 인용이 실제와 다름)

### 중간-1. claude 02가 arXiv:2602.11988의 결론 문장을 빼놓았다 — 05도 이어받았다

초록을 직접 fetch했다. 마지막 문장이 이렇다:

> "We conclude that while **context files are useful for specifying
> non-standard coding practices**, any attempts to improve performance should
> be rigorously evaluated before deployment."

claude 02가 인용한 앞부분(`02-authoring-claude.md:198-204`)은 정확하고, 오케스트레이터가
지적한 뉘앙스 — "지시는 따랐고 도움이 안 된 것은 저장소 개요" — 도 **claude 02는
본문에서 맞게 적었다**(`:201-203`). 여기까지는 문제없다.

문제는 그 결론에서 뽑아낸 문장이다.

| claude 02의 문장 | 초록이 실제로 말하는 것 |
|---|---|
| "컨텍스트 파일이 에이전트를 좋게 만든다는 것은 **실증적으로 반증됐다**"(`:35-36`) | "does not *generally* improve" — 일반적 개선 없음. 반증이 아니다. 그리고 같은 초록이 "useful for non-standard practices"라고 명시한다 |
| "**SOUL.md의 기본값은 '없음'이어야 하고**"(`:216`) | 논문의 결론은 "배포 전에 엄밀히 평가하라"이지 "쓰지 마라"가 아니다 |
| "LLM이 생성한 SOUL.md는 사람이 쓴 것보다 나쁘다"(`:222`) | 초록은 LLM 생성·개발자 커밋 **양쪽 모두에서** 결과가 성립했다고만 한다. -3%/+4%는 2차 출처이고 claude 02도 그렇게 표시했다(`:206-209`) — 표시는 맞지만 §결론에서는 그 유보 없이 쓴다 |

**05에서 더 나빠진다.** `05-authoring-inputs.md:65-67`:

> 이 판단은 arXiv:2602.11988이 뒷받침한다 — 컨텍스트 파일의 **지시**는 에이전트가
> 따르지만 **개요 산문**은 성공률을 올리지 않고 추론 비용만 20% 넘게 늘린다.
> 확인함(초록).

두 가지가 틀렸다. (a) **20% 비용 증가는 개요 산문이 아니라 컨텍스트 파일 전반에
대한 수치다.** 초록은 개요에 대해 "not helpful"이라고만 하고 비용을 분해하지 않는다.
(b) 이 논문은 **코딩 에이전트가 SWE-bench 이슈를 해결하는 과업**을 측정했다.
"뒤집기 테스트를 통과 못 하는 SOUL 문장을 빼라"는 규칙의 근거로 쓰기에는 대상이
다르다. 05는 이것을 §3의 설계 규칙 하나를 정당화하는 데 쓰고 있고, `[증거]`에
준하는 "확인함" 표시를 달았다.

**뒤집기 테스트 자체는 남길 만하다.** 근거는 Spool/Ström이지 이 논문이 아니다.
`02-authoring-claude.md:154-171`이 그 근거를 이미 제대로 대고 있으므로 arXiv 인용만
빼면 된다.

### 중간-2. claude 02: "시각 언어가 철학에서 나오지 않는다"는 자막보다 강하다

`02-authoring-claude.md:14-21`의 핵심 논증이다. 자막을 열어서 대조했다. 인용한
문장 세 개는 **전부 원문 그대로 있다.** 바우하우스가 soul.md에 없었고 시안 선별에서
나온 것도 맞다. 그런데 바로 앞 문장이 빠져 있다:

> 이런 철학이 Sol MD에 다 담겨 있고. **그런 철학에 맞춰서 디자인을 해달라고 했는데,**
> 디자인 시안이 그래서 여러 가지가 나왔는데 그중에서 제가 이걸 골랐거든요.

시안은 **철학을 조건으로 생성됐다.** 바우하우스는 철학이 좁혀놓은 공간 안에서
선별된 것이지 철학과 무관하게 나온 것이 아니다. claude 02의 "제품 철학에서 연역되는
시각 규칙은 극소수"는 이 사례로 지지되지 않는다. 지지되는 것은 더 약한 명제 —
**철학은 후보 공간을 좁히고 최종 선택은 선별이 한다** — 이고, 그 명제는 두 조사의
권고를 바꾸지 않는다.

`05-authoring-inputs.md:144-155`가 이 강한 버전을 그대로 받아 "6개 중 시각 규칙으로
내려가는 것은 둘"이라고 세고 프로필 스키마에 그 둘만 담으라고 못박는다. 근거가
버티지 못한다. 세는 것 자체가 나쁘지 않지만 "자막이 그렇게 말했다"는 뒷받침을 빼야
한다.

### 중간-3. claude 03: `paragraph-density`를 코드가 잡는 규칙으로 적었다

`03-antipattern-claude.md:524`의 표 "목록에 없지만 코드가 잡는 것":

> | `prose-run`, `orphan-heading`, `paragraph-density` | 문서 리듬 | 중간 |

`paragraph-density`는 린트 규칙으로 **존재하지 않는다.** 확인했다:

```
grep -rn "paragraph-density\|heading-overflow" src/ skills-src/ scripts/
→ src/qa/candidates.ts:176, src/qa/candidates.ts:179  (두 곳뿐)
```

`scoreCandidate`의 죽은 switch case일 뿐이다. **claude 01이 같은 사실을 이미 맞게
적었고**(`01-feasibility-claude.md:318-323`, 줄 번호 176/179까지 정확하다),
**codex 03도 맞게 적었다**(`03-antipattern-codex.md:304`). claude 03이 자기 팀의
1단계 문서와 모순된다.

### 중간-4. 05의 "dashboard 산출물 CSS 34.7% 실측"이 재현되지 않는다

`05-authoring-inputs.md:54`가 `[증거]`로 단 수치다. 직접 측정했다
(`examples/dashboard/output/index.html`, 224,985 bytes):

| 측정 | 값 |
|---|---|
| `<style>` 전체 | 200,263 B — **89.0%** |
| 그중 base64 폰트 | 119,660 B — 53.2% |
| 폰트 제외 CSS | 80,603 B — **35.8%** |
| 인라인 script | 7,257 B — 3.2% |

34.7%에 가장 가까운 것은 "폰트를 뺀 CSS 35.8%"인데 일치하지 않고, 측정 방법이
문서에 없다. **주장의 요지("문서가 짧아도 CSS 전체가 실린다")는 맞다** —
`buildStylesheet`가 문서와 무관하게 같은 문자열을 내므로 구조적으로 참이다. 수치만
방법과 함께 다시 쓰거나 빼야 한다.

### 중간-5. 05 §1 "누구를 위한 것인가"는 `[증거]`가 아니라 `[판단]`이다

> **누구를 위한 것인가** — 내부 기술 자료를 다루는 엔지니어링 조직.
> **[증거]** 기본 `confidentiality`가 `internal`이고 fixture 대부분이 사내
> 릴리스 판단이다.

기본값이 `internal`인 것은 맞다(`src/spec/schema.ts:61`). 그러나 **기본값에서
사용자 집단을 읽어낼 수 없다.** 그리고 "fixture 대부분"은 실제로 9 대 7이다:

```
fixtures/*/forma.spec.json + examples/*/forma.spec.json
→ internal 9건, public 7건
```

과반이지 "대부분"이 아니다. 05가 스스로 정한 표기 규칙에서 이 항목은 `[판단]`이다.
05 §0이 "[판단]은 사용자가 뒤집으라고 표시한 것"이라고 했으므로, `[증거]`로 달아둔
것은 사용자에게서 뒤집을 기회를 뺏는다.

### 중간-6. `[증거]`로 인용된 "clean 후보 100점 동률"에 재현 가능한 아티팩트가 없다

`00-source.md:48-52`가 "`examples/dashboard`에 기록된 실측"이라고 쓰고, codex 01이
`examples/dashboard/forma.spec.json:278-285`를 인용했다. **인용 위치는 정확하다.**
해당 블록은 `"magnitude": "8개 후보 중 탈락 0개, 점수 차 0점"`, `"confidence":
"verified"`다.

그런데 `forma build --quality advanced`는 후보 점수를 `qa/tournament.json`으로
쓴다(`src/cli/index.ts:127-139`). **저장소 전체에 `tournament.json`이 한 개도 없다.**

```
find . -name "tournament.json" -not -path "*/node_modules/*" → 결과 없음
```

즉 "실측"의 근거는 사람이 spec 안에 써 넣은 서술이고 재실행으로 확인할 수 없다.
`confidence: "verified"`가 붙어 있지만 뒷받침하는 산출물이 없다 — 공교롭게도 forma
자신의 `verified-claim-without-evidence` 규칙이 겨냥하는 모양이다.

**다만 결론은 산다.** claude 01 §4-1과 claude 03 §5-1이 그 수치에 기대지 않고
코드에서 독립적으로 연역했고, 나는 그 연역을 검증했다(CSS 동일, `applyComposition`이
DOM을 바꾸는 축은 `figurePlacement` 하나 — `composition.ts:18-24`, density는
`data-density` 속성으로만 나감). **점수 동률은 사실이고 원인은 00-source가 적은
것보다 더 위에 있다.**

### 중간-7. 공유 입력 `00-source.md`가 두 조사의 진단을 한 방향으로 밀었다

`00-source.md:48-52`:

> soft score가 lint finding의 감점만 계산하므로 깨끗한 후보 사이의 선호를 가르지
> 못한다.

이 문장은 원인을 **채점기**에 고정한다. 실제 원인은 하나 더 위에 있다 — 후보들의
입력이 같다. codex 01은 이 전제를 그대로 받아 §4를 채점기와 사람 루프 중심으로
썼고(`01-feasibility-codex.md:180-183`), "같은 content와 renderer를 공유하는 제한된
composition 변형"까지는 갔지만 CSS가 동일하다는 지점에는 닿지 않았다. claude 01·03이
닿았다.

**둘 다 같은 전제를 공유해서 같이 틀릴 뻔한 지점이다.** 공유 입력을 쓸 때는 원인
가설을 문장에 박지 말고 관측만 적는 편이 낫다. 이 건에서는 claude 쪽이 전제를
깨서 손해가 없었다.

### 중간-8. claude 01: "`FormaSpecSchema`가 strict하고 unknown shape를 거부한다"는 코드와 다르다

`01-feasibility-claude.md:236-237`. 확인 결과:

- `src/spec/` 어디에도 `.strict()` / `strictObject` 가 없다(grep 0건).
- zod 4.4.3에서 `z.object()`는 미지의 키를 **거부하지 않고 벗겨낸다.** 실행해서
  확인했다: `z.object({a:z.string()}).safeParse({a:'x',unknown:1})` → `success=true`,
  `data={"a":"x"}`.
- `validateFormaSpec`(`src/spec/validate.ts:33-76`)도 `safeParse` 결과와 composition
  contract만 본다. 미지 필드 검사는 없다.

**claude가 지어낸 게 아니다.** 스킬 문서가 그렇게 쓰여 있다 —
`skills-src/_shared/references/spec-reference.md:47`: "the schema is strict and
rejects unknown fields." **저장소 문서가 코드와 다르다.** claude 03이 찾은
`audit-design.mjs` 건과 같은 종류의 결함이고, 같은 우선순위로 고쳐야 한다.

논지 자체(산문을 렌더러에 먹일 수 없다)는 다른 근거로 선다. 이 인용만 빼면 된다.

### 중간-9. codex 01의 스킬 인용 3건이 지금은 존재하지 않는 파일을 가리킨다

- `skills-src/dashboard/instructions.md:68-79`
- `skills-src/report/instructions.md:68-79`
- `skills-src/advanced/instructions.md:64-88`

현재 `skills-src/`에는 `_shared/`와 `forma/` 둘뿐이다. 작성 시점에는 있었을 것이다
(그 뒤 스킬 4개가 단일 `forma` 스킬로 합쳐졌다). 다만 지금 문서를 읽는 사람은 근거를
열 수 없다.

**대체 근거는 있다.** 같은 제약이 `skills/forma/SKILL.md:55-63`에 그대로 있고
내용도 동일하다. codex의 다른 스킬 인용 —
`skills-src/_shared/references/technology-policy.md:5-14`(정확),
`performance-budget.md:1-20`(정확),
`spec-reference.md:22-48`(정확), `skills/forma/SKILL.md:55-67`(정확) — 은 전부
살아 있다.

**부수 발견.** `DESIGN.md:101`이 같은 죽은 경로를 가리킨다:

> The canonical instructions live in `skills-src/{dashboard,report,manual,advanced}/instructions.md`.

codex는 이 문서를 따라간 것이므로 codex의 실수라기보다 저장소의 부채다.
`generic-ai-patterns.md`의 `audit-design.mjs`, `spec-reference.md`의 "strict"와
함께 **스킬/문서 층에 코드와 어긋난 서술이 최소 3건** 있다.

---

## 3. 경미

### 경미-1. codex 03: `gradient-overuse` 임계값을 "3개 초과"로 적었다

`03-antipattern-codex.md:275`: "`gradient-overuse`가 gradient 함수 **3개 초과**만 탐지".
코드는 `if (gradientCount > 2)`(`src/qa/design-lint.ts:111`) — **3개부터** 발화한다.
같은 문서 `:299`는 "3개 작은 gradient는 실패하고"라고 맞게 적어서 내부에서도 어긋난다.
**claude 03의 "개수 > 2"가 맞다.**

나머지 임계값은 양쪽 다 정확했다. 전부 코드에서 확인했다: `card-saturation`
section ≥4 & ratio > 0.35(`dom-lint.ts:87,94`), `pill-overuse` > 12(`:156`),
`layout-repetition` 연속 4(`:133`), `prose-run` 연속 4(`:219`), `orphan-heading`
본문 < 40자(`:250`), `thick-side-border` ≥ 2px(`design-lint.ts:86`).

### 경미-2. claude 03: `--shadow` 토큰의 파일이 틀렸다

`03-antipattern-claude.md:488`: "`foundations-css.ts:33`에 `--shadow` 토큰이 있지만".
`foundations-css.ts`에 `shadow` 문자열은 **0건**이다. 실제 위치는
`src/design/artifact-css.ts:33`이고, 사용처는 `artifact-css.ts:76,93`이다.
**"토큰은 있는데 검사 규칙이 없다"는 주장 자체는 맞다** — `grep -rn "shadow"
src/qa/*.ts` → 0건, 확인했다.

### 경미-3. claude 01의 줄 번호 두 개가 어긋난다

- `src/spec/schema.ts:38` → `confidentiality`는 39행(`ConfidentialitySchema` 정의)
  또는 61행(`meta` 필드). 38행은 `LanguageSchema`.
- `src/spec/schema.ts:58` → `interaction` 기본값 `"static"`은 60행. 58행은 `colorMode`.

주장 내용은 둘 다 맞다. `confidentiality`가 라벨로만 쓰이고 동작을 제어하지 않는다는
지적도 확인했다 — 사용처는 `shell.ts:88`과 `shell.ts:99` 두 곳뿐이다
(claude 01이 댄 줄 번호 그대로).

### 경미-4. claude 02: "`DESIGN.md`를 참조하는 곳은 세 곳뿐"은 스코프를 좁힌 결과다

`02-authoring-claude.md:556`. `src/`, `skills/`, `skills-src/`로 한정하면 맞고
claude도 그 한정을 적었다. 저장소 전체로는 `docs/project-overview.md:7`,
`docs/handoff-artifact-architecture.md:6`, `docs/onorca-docs-design-target.md` 등
여러 곳이 더 있다. **"코드는 아무도 안 읽는다"는 결론은 그대로 맞다.**

같은 문단의 grep 결과 `SOUL` / `.forma/` / `forma.config` / `formarc` **0건**은
재실행해서 확인했다. 정확하다.

### 경미-5. codex 01: temp 삭제 서술이 절반만 맞다

`01-feasibility-codex.md:191-193`: "8개를 temp 디렉터리에 렌더하고 QA한 뒤 temp
전체를 삭제한다". 렌더된 HTML은 지워지는 게 맞다(`src/cli/index.ts:116`). 그런데
바로 다음에 후보별 점수와 breakdown이 `qa/tournament.json`으로 출력 디렉터리에
저장된다(`:127-139`). **점수는 남고 볼 수 있는 화면만 사라진다.** codex의 결론
("사람에게 보여 줄 지속 세션이나 평점 입력면이 없다")은 맞다.

### 경미-6. 05: "기계가 집행하는 반례 17종"의 성격 표시가 없다

치명-1에서 다뤘다. 여기서는 표현 문제만: 17이라는 숫자와 규칙 이름 나열은 코드와
정확히 일치하므로 `[증거]` 표시가 맞다. 문제는 그 17종을 "반례"라고 부른 것이다.

---

## 4. 두 조사가 갈린 지점의 판정

### 4-1. 1차 병목 — **claude가 맞다**

| | 주장 |
|---|---|
| codex 01 | 선호를 기록하는 사람 루프의 부재 |
| claude 01 | 스타일시트에 문서별 파라미터 구멍이 0개인 것 |

**claude 쪽에 인과적 선행성이 있고, 코드로 확인된다.**

1. `buildStylesheet(fontFaceCss)` — 문서별 입력은 폰트뿐(`foundations-css.ts:47`).
2. `artifactCss()`, `blockCss()` — 인자 없음(`artifact-css.ts:13`, `block-css.ts:9`).
3. `applyComposition`이 DOM을 바꾸는 축은 `figurePlacement` 하나
   (`composition.ts:18-24`). density/measure/typeScale는 `data-*` 속성으로만 나가고
   (`shell.ts:56,94`) 스타일시트가 아래 6줄로 받는다:

```
src/design/foundations-css.ts:174-179   ← claude 01이 인용한 줄 그대로다
```

따라서 8개 후보의 CSS는 동일하고, 사람 루프를 먼저 만들면 **여백과 글자 크기 8%만
다른 8개에 별점을 받는다.** claude 01 §4-2와 claude 03 §5-1의 판정이 옳다.

**codex의 주장도 틀린 게 아니다.** 파라미터화가 끝나도 평점 기록면은 없다. 두 개가
경쟁하는 진단이 아니라 순서 문제이고, claude가 순서를 맞게 잡았다.

### 4-2. 자유 코멘트 — **판정하지 않는다. 갈림 자체가 과장됐다**

`02-authoring-claude.md:79`가 "claude 쪽이 맞다"고 판정했다. 두 문서를 다시 읽으면
실질 차이가 거의 없다.

- codex 01 `:208-210`: "코멘트는 텍스트 그대로 자동 점수화하지 말고, 에이전트가
  제안한 디자인 delta를 사람이 확인한 뒤 반영한다."
- claude 01 `:406`: "자유 코멘트는 선택 필드로만 남긴다."
- codex 02 `:72`: "pairwise + 이유 코드 + 선택적 자유 설명"
- claude 02 `:79`: 구조화 질문 우선

**넷 다 같은 말이다.** 그리고 claude가 든 근거(영상 제작자의 회고)는 "자유 텍스트로는
부족하다"를 지지하지 그 "수집이 해롭다"를 지지하지 않는다. codex의 입장은 그 근거로
반박되지 않는다. 2단계에서 승패를 선언할 자리가 아니었다.

### 4-3. 사용자 파일 구조 — **판정 불가. 다만 claude 안에 미배치 슬롯이 하나 있다**

| | 제안 |
|---|---|
| codex 02 | `.forma/SOUL.md` + `.forma/DESIGN.md`(사람용 산문) + `design.tokens.json` |
| claude 02 | `.forma/SOUL.md` + `design.tokens.json` + `dislikes.md` |
| 05 | claude 안 채택(+ `.forma/` 위치는 `[공백]`으로 표시) |

저장소 증거로 가를 수 없다. `.forma/` discovery는 양쪽 다 없다고 확인했고 내가
재확인했다(grep 0건). 이건 governance 선택이다.

**다만 claude 안에 빈칸이 있다.** claude 02 §4-2가 "근거는 DTCG `$description`
한 줄에 담는다"고 정했는데, 같은 문서 §4-3(c)가 "축의 근거는 토큰이 아니라 원칙이므로
SOUL로 간다"고 예외를 인정한다. 그런데 claude 02 §결론은 SOUL을 "뒤집을 수 있는
결정 문장만"으로 좁혔다. **"표면 단계를 왜 3개로 제한하는가" 같은 횡단 규칙이
들어갈 자리가 세 파일 어디에도 없다.** codex의 `.forma/DESIGN.md`는 정확히 그
자리다. 05가 claude 안을 채택하면서 이 빈칸을 물려받았다.

판정하려면 필요한 것: 실제로 그런 횡단 규칙이 몇 개나 생기는지. 1개면 SOUL에 넣고
끝, 10개면 파일이 하나 더 필요하다. 지금은 표본이 없다.

### 4-4. 새 lint 규칙을 늘려야 하는가 — **양쪽이 같은 결론에 다른 강도로 도달했다. claude 쪽이 더 정확하다**

- codex 03 `:372-378`: "규칙을 더 정확하게 만들면 나쁜 후보 제거율은 올라가지만
  살아남은 후보끼리의 좋은 차이를 설명하는 양의 신호는 생기지 않는다."
- claude 03 `:671-679`: "CSS 층 규칙 추가 → 선별 기여 **0**. DOM 층 규칙 추가 →
  **최대 2그룹**."

claude 쪽이 더 강하고, **검증했더니 맞다.** codex는 "동률이 심해진다"는 정성 서술에
그쳤고 claude는 그 정도를 수치로 못 박았다. 내가 확인한 사슬은 claude가 적은 것과
동일하다. `dom-lint`의 순서 의존 규칙 3개(`card-saturation`, `layout-repetition`,
`prose-run`)만 `figurePlacement` 두 값에 반응할 수 있고 나머지 5개는 순서 무관이다.

---

## 5. 합의했지만 검증이 필요했던 것 — 검증 결과

### 5-1. "소스에 래스터 이미지를 못 넣는다" — **맞다**

- `figure` 블록 스키마: `caption`(필수) / `of` / `reading`뿐. 이미지 필드 없음
  (`src/blocks/report.tsx:476-502`). claude 01의 476-500 인용 정확.
- 렌더러 전체에서 `<img>`는 `src/pages/build.ts:64` 한 곳(갤러리 썸네일). 정확.
- `SAFE_URL_SCHEMES = {http:, https:, mailto:}`, `data:`는 `#`으로
  치환(`src/security/sanitize.ts:85,92`). 정확.
- 외부 요청 1건이면 `hardGate` 실격(`src/qa/candidates.ts:131`). 정확.

**claude 01의 미확인 #2를 여기서 해소한다.** 성능 예산 수치는
`performance-budget.md:7-9`에 있다 — HTML+CSS+JS ≤ 350KB(이미지·폰트 제외),
CSS gzip ≤ 70KB. 그리고 `:3`과 `:17-19`가 **사용자 이미지는 예산에서 명시적으로
제외**한다. 즉 data URI 임베딩의 여유는 예산 문제가 아니라 정책 공백이다.

### 5-2. claude 03의 OKLCH 표 — **전부 재현됐다**

sRGB→OKLab→OKLCh를 독립 구현해 계산했다. 11개 값 중 **하나도 어긋나지 않았다.**

| | claude 03 | 재현 |
|---|---|---|
| forma light accent `#007ACC` | L 56.7 / C 0.155 / H 249 | 56.7 / 0.155 / 249 |
| forma dark accent `#3794FF` | 66.6 / 0.181 / 255 | 66.6 / 0.181 / 255 |
| Tailwind indigo-500 | 58.5 / 0.204 / 277 | 58.5 / 0.204 / 277 |
| Tailwind violet-500 | 60.6 / 0.219 / 293 | 60.6 / 0.219 / 293 |
| Bootstrap primary | 57.8 / 0.228 / 260 | 57.8 / 0.228 / 260 |
| chartPurple `#AF00DB` | 55.9 / 0.274 / 316 | 55.9 / 0.274 / 316 |

`FormaColorPalette` 24개 필드도 맞다(`src/design/tokens.ts:11-34`). 색 의존성 0개도
맞다(`package.json` — commander, diff, isomorphic-dompurify, react, react-dom,
shiki, svgo, zod). **R1 규칙의 함정 테스트(`chartPurple`이 H316 C0.274라 순진한
"고채도 보라 금지"에 자기 토큰이 걸린다)는 실제로 성립한다.** 이 조사에서 가장
잘 검증된 부분이다.

### 5-3. `generic-ai-patterns.md`의 거짓 서술 — **claude 03이 맞다**

원문 마지막 문단을 확인했다:

> `scripts/audit-design.mjs` catches the CSS-detectable subset of these
> automatically (bracket-border pseudo-elements, decorative `content: "["`,
> excessive gradient/**shadow**/pill usage).

- `scripts/`에는 `check-naming.mjs` 하나뿐. `audit-design.mjs` 없음.
- `grep -rn "shadow" src/qa/*.ts` → 0건.

**둘 다 사실이다.** codex 03도 `:284-287`에서 도구 이름 불일치를 지적했으나 shadow
검사 부재는 놓쳤다. claude 03의 권고 1이 옳고, 우선순위도 옳다(코드 변경 0).

### 5-4. 웹 출처 — **표본 4건 전부 정확**

| 출처 | 인용자 | 확인 |
|---|---|---|
| arXiv:2602.11988 AGENTS.md | claude 02 | 초록 fetch. 인용문 일치. 결론 문장 누락은 중간-1 |
| arXiv:2511.20513 DesignPref | codex 02 | 초록 fetch. 20명 / 12k pairwise / α=0.25 **정확**. preprint 유보도 정확 |
| arXiv:2607.22928 Design Theater | claude 03 | 초록 fetch. 24×5=120, >25%/34%, mean 0.54, CC-BY-4.0 **정확**. "색은 갈리고 레이아웃은 수렴" **정확** |
| Nordhoff CHI 2018 | codex 03 | 44개국 80,901개, 국가당 약 2,000개 **정확** |
| Goree CHI 2021 | 양쪽 | 227,000장 / 약 10,000 사이트 / 2003–2019 / 2007년 이후 30%+ / 2010–2019 44% — 검색 결과와 일치. **원문 PDF는 나도 못 열었다**(ACM 403, UCSC 미러 TLS 인증서 실패). claude 03이 이를 미확인으로 표시한 것은 정확한 처리다 |

### 5-5. 자막 인용문 8건 — **전부 원문에 그대로 있다**

"왜 그게 괜찮았고", "후진 게 없어집니다", "바우하우스", "색깔을 싹 다 빼고",
"디베이트", "비행기 조종석", "6라운드", "이틀" — 전부 확인. `00-source.md`의 워크플로
요약(Pinterest 무드보드 → paper.design 디더링/셰이더 → soul.md → 시안 N개 → 별점
랭킹 → 라운드 반복 → 블라인드 A/B/C)도 자막과 일치한다. RLVR 언급도 실재한다.

한 가지: `00-source.md:41-42`의 "AI 느낌 표식은 보라색, 그라데이션, 관성적으로 붙는
장식"에서 자막 원문은 "보라색 쓰고... 여기 이렇게 **핸들 같은 거** 딱 두고... 약간
**그레디언트** 같은 거 좋아하고"다. "관성적으로 붙는 장식"은 "핸들 같은 거"의 느슨한
일반화다. 공교롭게도 forma의 `bracket-border` 규칙이 정확히 그 "핸들"을 잡는다.
요약이 원문을 흐려서, **자막이 지목한 표식 중 forma가 이미 3중으로 잡고 있는 것**이
두 조사에서 연결되지 않았다.

---

## 6. 05에 대한 총평 — `[증거]` 표시의 신뢰도

`[증거]`로 표시된 항목을 전수 확인했다.

**정확한 것 (13건):**

| 항목 | 확인 |
|---|---|
| §1 재현성 우선 | `examples/report/forma.spec.json:166-168` 가중치 3/3/1 **정확**. `:175` "자유도에 가중치 1을 준 것이 이 표의 결론을 사실상 정한다" **원문 그대로** |
| §2 finding-cost | `examples/report/forma.spec.json:115` 존재 |
| §3-1 라벨보다 문장 | `DESIGN.md:96-99` "Section headings are... complete claims... rather than bare labels ('Overview')" **정확** |
| §3-2 근거 없는 단정 차단 | `verified-claim-without-evidence`가 `candidates.ts:137-139`에서 hard gate **정확** |
| §3-3 모르는 것을 적는다 | `src/blocks/advanced.tsx:40` `stillUnknown`, `src/blocks/dashboard.tsx:360` `knownGaps` **정확** |
| §3-4 반대 의견 기록 | `src/room/freeze.ts:51` `UNSTATED_OBJECTION = "반대했으나 사유를 남기지 않음"` **정확** |
| §3-5 장식은 의미가 있을 때만 | `DESIGN.md:26-31` "additional hues carry status or data-series meaning rather than decoration", 표면 3단계 **정확** |
| §3-6 결론 먼저 | `skills-src/forma/references/artifacts/report.md` "Open with a thesis... Move from judgement to evidence" **정확** |
| §4 design-lint 9종 / dom-lint 8종 이름 | 코드와 **완전 일치** |
| §6 색·서체·모서리·모션 | `DESIGN.md:26-43` — 무채색 기조, Geist+Plex Sans KR+mono, functional rounding, 120/180/240ms + reduced-motion 전부 제거 **정확** |
| §6 다크 모드 1급 | `examples/*/output/qa/dark-1440.png` 5개 존재 **정확** |
| §6 이미지 블록 없음 | 5-1에서 재확인 |
| §3 편의 기능 목록 | 테마 토글·코드 복사(`interactive.ts:3`), 목차 활성 상태(`:38`), 스킵 링크(`shell.ts:78`) **전부 존재** |

**문제 있는 것 (4건):** 치명-1(17종), 중간-1(arXiv), 중간-4(34.7%), 중간-5(사용자 집단).

**`[판단]`이 `[증거]`로 위장한 사례는 중간-5 한 건뿐이다.** 05가 스스로 정한 표기
규칙을 대체로 지켰다는 뜻이고, 이건 칭찬할 부분이다. 특히 §5의 "여기를 억지로
채우면 안 된다"와 §8의 "역추출로 얻은 것은 forma가 지금까지 무엇을 해왔는가이지
앞으로 무엇이고 싶은가가 아니다"는 05가 자기 한계를 정확히 짚은 곳이다.

**남은 `[공백]` 중 지금 확인 가능한 것 하나.** §7의 "`.forma/`가 맞는 위치인지
확인하지 않았다"는 확인할 방법이 없는 게 맞다 — discovery 구현이 0이므로 관례를
비교하는 수밖에 없다. 그대로 `[공백]`이 옳다.

---

## 7. 저장소에 남은 부채 (조사 문서가 아니라 코드/문서 쪽)

교차 검증 중에 확인된, 조사 문서의 잘못이 아닌 것들이다. 셋 다 코드 변경 없이
고칠 수 있다.

1. `skills-src/_shared/references/generic-ai-patterns.md` — 없는 스크립트
   `scripts/audit-design.mjs`를 근거로 대고, 없는 shadow 검사를 있다고 쓴다.
   (claude 03 발견, 재확인)
2. `skills-src/_shared/references/spec-reference.md:47` — "the schema is strict and
   rejects unknown fields". `.strict()`가 없고 zod가 미지 키를 벗겨낸다.
   (이 검증에서 발견)
3. `DESIGN.md:101` — 삭제된 `skills-src/{dashboard,report,manual,advanced}/instructions.md`를
   canonical로 가리킨다. (이 검증에서 발견)

세 건 다 **에이전트가 읽는 문서**다. 에이전트가 "자동으로 잡힌다" / "스키마가
막아준다"를 믿고 넘기면 실제로는 아무것도 막히지 않는다.

부수 관찰 하나: `src/qa/dom-lint.ts:122`의 주석은 "Three sections in a row"인데
코드는 `run === 4`에서 발화한다. 주석과 코드가 하나 어긋난다.

---

## 확인한 것 / 확인하지 못한 것

**직접 열어 확인한 저장소 파일**

`src/qa/candidates.ts`(전체), `src/qa/design-lint.ts`(규칙 9종 + `lintHtmlFile`),
`src/qa/dom-lint.ts`(규칙 8종 + 임계값 전부), `src/renderer/composition.ts`(전체),
`src/renderer/shell.ts:41-99`, `src/renderer/interactive.ts`,
`src/design/foundations-css.ts:28-50,174-179`, `src/design/artifact-css.ts:13,33,76,93`,
`src/design/block-css.ts:9`, `src/design/tokens.ts:11-54`, `src/design/fonts.ts:1-18`,
`src/spec/schema.ts:35-70`, `src/spec/artifact.ts:1-20,85-100`,
`src/spec/validate.ts:33-80`, `src/security/sanitize.ts:85-96`,
`src/blocks/report.tsx:470-502`, `src/blocks/advanced.tsx:40`,
`src/blocks/dashboard.tsx:360`, `src/pages/build.ts:64`, `src/room/freeze.ts:51,134`,
`src/room/server.ts:45`, `src/cli/index.ts:27-150`(명령 13개 목록 포함),
`DESIGN.md`(전체), `README.md:214-218`, `CLAUDE.md`, `AGENTS.md`,
`docs/security.md`, `skills/forma/SKILL.md`(전체), `skills-src/forma/instructions.md:9`,
`skills-src/_shared/references/{generic-ai-patterns,technology-policy,performance-budget,spec-reference}.md`,
`examples/report/forma.spec.json:115,164-175`,
`examples/dashboard/forma.spec.json:272-292`, `examples/dashboard/output/{index.html,manifest.json}`,
`package.json`, `docs/design-pipeline/00-transcript-ko.txt`.

**직접 실행해 확인**

- zod 4.4.3의 `z.object()` unknown-key 처리(strip, 거부 아님)
- `examples/dashboard/output/index.html`의 CSS/폰트/스크립트 바이트 비율
- OKLCH 변환 11개 값 (sRGB→linear→OKLab→OKLCh 독립 구현)
- grep: `paragraph-density`/`heading-overflow` 2건(candidates.ts만),
  `shadow` in `src/qa` 0건, `SOUL`/`.forma/`/`forma.config`/`formarc` 0건,
  `tournament.json` 0건, `.strict()` 0건

**웹으로 확인**

arXiv:2602.11988 초록(전문), arXiv:2607.22928 초록(전문), arXiv:2511.20513 초록(전문),
Nordhoff CHI 2018 표본, Goree CHI 2021 수치(검색 결과 — 원문 PDF는 열지 못함).

**확인하지 못한 것**

1. **Goree et al. CHI 2021 원문.** ACM 403, UCSC 미러 TLS 인증서 오류. 두 조사가
   인용한 수치는 검색 결과와 일치하지만 거리 함수 정의는 나도 못 봤다.
2. **codex 03이 [확인]으로 단 Goree 세부** — "디자이너 11명 인터뷰", "Bootstrap이
   레이아웃 거리 감소와 강하게 연관" — 원문을 못 열어 검증하지 못했다.
3. **claude 03의 Design Theater DHI 하위 수치** (Visual 0.119, Color 20.6–39.7,
   Layout 0.181–0.211). 초록에는 없고 본문에서 왔다고 적혀 있다. 본문은 열지 않았다.
   초록의 정성 서술("색은 갈리고 시각·레이아웃은 수렴")과는 일치한다.
4. **codex 02의 웹 인용 다수** (Adobe creative brief, GOV.UK, USWDS, Docusign,
   DTCG 2025.10, Guo & Sanner) — 표본으로 DesignPref만 검증했고 나머지는 열지 않았다.
   claude 02의 DTCG "13종 타입 / 24개 조직", Spool 6가지 테스트, repertory grid
   문헌도 열지 않았다.
5. **`skills-src/{dashboard,report,advanced}/instructions.md`의 과거 내용.**
   git 명령이 금지되어 codex 01이 인용한 시점의 내용을 확인할 수 없었다.
   현행 `skills/forma/SKILL.md`에 같은 제약이 있다는 것까지만 확인했다.
6. **05 §4의 "이번 세션 육안 검수로 잡은 것들" 5개 항목.** 저장소에 대응 아티팩트가
   없다. 05가 `[판단]`으로 표시했으므로 표기는 옳다.
7. **05 §6의 DocPilot 매뉴얼.** 저장소 어디에도 언급이 없고 링크도 없다.
   `[사용자]` 표시이므로 검증 대상은 아니지만, 이 기준을 쓰려면 실물이 필요하다.
