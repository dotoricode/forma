# 3단계 조사: "AI가 만든 티"를 없애기 위한 연구자료와 오픈소스 (claude)

## 결론

**1. "AI 티"는 하나가 아니라 세 층이다. 그 중 forma에 실제로 위험한 층은 하나뿐이다.**

- **층 A — 모델의 통계적 중앙값**: 색/폰트/레이아웃이 학습 데이터의 최빈값으로
  수렴한다. 원인이 정렬 데이터의 typicality bias까지 추적된 실증 연구가 있다
  (Verbalized Sampling 2025, Artificial Hivemind NeurIPS 2025).
- **층 B — 특정 도구의 기본값**: Tailwind `indigo-500`, shadcn 기본 토큰,
  Bootstrap `primary`. 이건 모델의 취향이 아니라 **학습 데이터에 압도적으로
  많은 하나의 상수**다. Tailwind 저자 본인이 공개적으로 인정했다.
- **층 C — 관성적 장식**: 그라데이션 히어로, 모든 것을 카드로 감싸기, 배지 남발,
  스크롤 페이드업.

**forma는 층 A와 층 B에 거의 노출되지 않는다.** 에이전트가 CSS를 쓰지 않고,
스타일시트는 `buildStylesheet(fontFaceCss)` 하나로 문서 전체에서 동일하며
(`src/design/foundations-css.ts:47`), 팔레트는 VS Code Light+/Dark+에서 온
고정 hex다 (`src/design/tokens.ts`). 실측했다: forma accent는
OKLCH H=249 C=0.155(light) / H=255 C=0.181(dark)로, Tailwind indigo-500
(H=277 C=0.204)·violet-500(H=293 C=0.219)·Bootstrap primary(H=260 C=0.228)와
hue·chroma 양쪽에서 떨어져 있다. **forma의 위험은 층 C, 그리고 층 C 중에서도
"기계가 못 보는 구성" 쪽에 몰려 있다.**

**2. 이 주제를 직접 다룬 실증 연구는 거의 없다. 그러나 인접 연구는 쓸 만하다.**

"사람들이 무엇을 보고 AI 같다고 하는가"를 직접 측정한 논문은 찾지 못했다.
대신 **동질화(homogenization)를 측정한 연구**가 두 편 있고, 둘 다 forma가
그대로 베낄 수 있는 측정 정의를 준다:

- **Goree et al., CHI 2021** — 웹사이트 스크린샷 227,000장(약 10,000 사이트,
  2003–2019)에 컴퓨터 비전을 돌려 레이아웃 거리와 색 거리를 측정. 2010–2019
  사이 평균 레이아웃 거리가 **44% 감소**.
- **Design Theater, arXiv 2026** — 생성 UI 도구 5개(ChatGPT, Claude,
  Firebase Studio, Vercel v0, Bolt) × 24 과제 × 120 인터페이스. **DHI(Design
  Homogeneity Index)** 를 세 하위 측정으로 쪼갠다: 시각(UIClip 임베딩),
  **색(CIELCh 색 히스토그램 + Earth Mover's Distance)**, 레이아웃(요소 검출
  후 tree edit distance). 색은 도구마다 갈리고(20.6–39.7) **레이아웃은 좁게
  수렴(0.181–0.211)** 했다.

**AI 생성물 탐지 연구는 시각 디자인에 적용 불가다.** 이유는 3절에 적었다.
결론만: 탐지기는 생성 모델의 신호 흔적을 찾는 것이고, 스크린샷·텍스트 리치
이미지에서 성능이 무너진다는 벤치마크가 이미 있다(TextFake, arXiv 2026).
forma가 만드는 것은 결정론적 렌더러의 출력이므로 애초에 탐지 대상이 아니다.

**3. 오픈소스는 채택할 것이 딱 하나다: `culori`. 나머지는 참고 구현으로만 쓴다.**

| 도구 | 라이선스 | 최근 유지 | 판정 |
| --- | --- | --- | --- |
| `culori` 4.0.2 | MIT | 2025-06-27 npm / 2026-07-02 push | **채택 권고**. devDependency. 의존성 0, tree-shakable |
| `@projectwallace/css-analyzer` 9.9.3 | MIT | 2026-07-27 npm | **조건부**. 측정 전용(런타임 아님) |
| AIM (aalto-ui/aim) | MIT | 2023-06-11 (3년 정지) | **의존 금지, 알고리즘만 이식** |
| `apca-w3` 0.1.9 | **Limited W3 License** | 2022-07-04 (4년 정지) | **부적합**. 라이선스 + 정지 |
| OmniParser | CC-BY-4.0 + 모델 가중치 | 2026-07-20 | **부적합**. 무게·비결정론 |
| UIClip | HuggingFace 공개, 라이선스 **미확인** | UIST 2024 | **부적합**. CLIP 추론은 비결정론 위험 |
| `odiff-bin` 4.5.0 | MIT | 2026-07-23 | 시각 회귀 필요 시 채택 가능 |

**4. forma의 현재 반례 목록에는 실제 결함이 있다.** `generic-ai-patterns.md`가
근거로 지목하는 `scripts/audit-design.mjs`는 **존재하지 않는다**(`scripts/`에는
`check-naming.mjs` 하나뿐). 그 문서가 "자동으로 잡는다"고 주장하는
`excessive gradient/shadow/pill usage` 중 **shadow 검사는 코드 어디에도
없다**(`grep -rn "shadow" src/qa/*.ts` → 0건). 4절에 대조표를 넣었다.

**5. 가장 중요한 발견 — 자동 규칙을 늘려도 선별 부담은 1g도 줄지 않는다.**

`renderSpecToHtml`은 후보마다 `buildStylesheet(fontFaceCss)`를 호출하고
(`src/renderer/shell.ts:41`), composition 축은 `data-*` 속성으로만 내려간다
(`shell.ts:56`, `foundations-css.ts:178`). 즉 **8개 후보의 `<style>` 텍스트는
바이트 단위로 동일하다.** `design-lint.ts`의 9개 규칙은 전부 CSS 텍스트를
읽으므로 **모든 후보에 대해 같은 결과를 낸다 → 채점 차이 0.**

`applyComposition`이 DOM을 실제로 바꾸는 축은 `figurePlacement` 하나뿐이다
(`composition.ts:21`, density/measure/typeScale는 속성만 바꾼다). 따라서
`dom-lint.ts`의 순서 의존 규칙(card-saturation, layout-repetition, prose-run)도
**최대 2개 그룹**만 구분한다. 후보 8개 → 서로 다른 점수는 최대 2개.

**CSS 층 규칙을 아무리 추가해도 동률은 안 깨진다.** 규칙 추가의 효과는
"후보 전체를 통째로 반려"뿐이다. 그건 품질 게이트로 가치가 있지만
선별 문제와는 다른 문제다. 선별을 풀려면 (a) 후보마다 실제로 달라지는 축을
스타일시트에 연결하고, (b) 감점이 아닌 **가점(선호 신호)** 를 넣어야 한다.

### 권고 (우선순위 순)

1. **`generic-ai-patterns.md`의 거짓 주장 수정.** 없는 스크립트를 근거로
   내세우고 있고, 존재하지 않는 shadow 검사를 존재한다고 쓴다. 반례 목록의
   신뢰도가 여기서 먼저 깨진다. (문서 수정, 코드 변경 0)
2. **shadow / radius / 색 채도를 "규칙"이 아니라 "측정"으로 먼저 넣는다.**
   `@projectwallace/css-analyzer`를 devDependency로 붙여 현재 출력의
   분포(고유 shadow 수, radius 수, 색 수)를 기록한다. 임계값은 측정 후에
   정한다. 지금 임계값을 정하면 dom-lint의 `35%`, `12`, `4`처럼 근거 없는
   상수가 하나 더 늘어난다.
3. **`culori` 기반 토큰 검사 3개.** accent hue/chroma 대역, 중성 토큰의
   유채색 오염, 유채색 그라데이션. 이건 층 B를 정면으로 막고, 테스트가
   깨끗하게 설계된다(4-3절).
4. **`selectWinner`에 가점 축을 넣기 전까지 CSS 규칙 추가를 멈춘다.**
   현재 구조에서 규칙 추가는 선별에 기여하지 않는다.

---

## 조사 방법과 사실 표기

- **확인**: 저장소 코드를 직접 읽었거나, npm registry / GitHub API로 메타데이터를
  조회했거나, 논문 초록·본문을 fetch해서 읽은 것.
- **일화**: 블로그·트윗·커뮤니티 글. 출처는 남기지만 근거로 쓰지 않는다.
- **미확인**: 검색 결과에 존재는 보였으나 원문을 열지 못한 것.

OKLCH 값은 직접 계산했다(sRGB → linear → OKLab → OKLCh, 외부 라이브러리 없음).
계산 스크립트는 스크래치패드에만 있고 저장소에 넣지 않았다.

**열지 못한 것**: Goree et al. CHI 2021 원문 PDF(ACM 403, UCSC 미러는 TLS
인증서 오류). 방법론과 수치는 검색 스니펫과 인용 글에서 확인했으므로 그 범위
안에서만 인용한다. AIM 논문 원문(UIST 2018) PDF도 열지 못했다 — 대신
저장소의 메트릭 파일 목록을 직접 조회했다.

---

## 1. "AI 티"의 분해

### 1-1. 세 층으로 나눠야 하는 이유

"보라색"은 원인이 아니라 증상이다. 원인을 층으로 나누면 forma가 어디에
노출되고 어디에 노출되지 않는지 갈린다.

**층 A — 생성 과정의 최빈값 수렴 (확인, 연구 있음)**

정렬 후 모델의 다양성 붕괴는 측정된 현상이다. `Verbalized Sampling`
(arXiv 2510.01171, Zhang·Yu·Chong 외, Northeastern/Stanford)은 원인을
**preference 데이터의 typicality bias** 로 지목한다. 주석자가 익숙한 산출물을
체계적으로 선호하므로, 보상 모델과 최적화가 완벽해도 mode collapse가 남는다.
`Artificial Hivemind`(arXiv 2510.22954, Jiang 외, NeurIPS 2025 Best Paper)는
26K 개방형 질의(INFINITY-CHAT)로 70개 이상 모델을 측정해, 같은 모델을 반복
샘플링할 때와 **다른 모델 계열끼리 비교할 때 모두** 산출물이 비슷해진다는 것을
보인다. 그리고 Reward Model과 LLM-as-a-Judge가 다양성을 **처벌**한다는 것도
보인다.

> forma 관련성: 이 층은 **에이전트가 시각을 결정할 때만** 작동한다. forma의
> 에이전트는 `forma.spec.json`만 쓴다. 다만 "다양성을 처벌하는 판정자" 문제는
> forma의 `scoreCandidate`에 그대로 있다 — 감점만 있는 채점자는 정확히
> "튀지 않는 것"을 뽑는 판정자다. 5절에서 다시 다룬다.

**층 B — 도구 기본값 (확인, 1차 출처 있음)**

2025년 8월, Tailwind CSS의 Adam Wathan이 X에 올렸다: "5년 전 Tailwind UI의
모든 버튼을 `bg-indigo-500`으로 만든 것을 공식적으로 사과한다. 그 결과 지구상의
모든 AI 생성 UI가 indigo가 되었다"
(<https://x.com/adamwathan/status/1953510802159219096>).

이건 **모델의 취향이 아니라 학습 데이터의 상수**다. 그래서 측정 가능하다.
직접 계산한 값:

| 출처 | hex | OKLCH L | C | H |
| --- | --- | --- | --- | --- |
| Tailwind indigo-500 | `#6366F1` | 58.5% | 0.204 | **277** |
| Tailwind indigo-600 | `#4F46E5` | 51.1% | 0.230 | **277** |
| Tailwind violet-500 | `#8B5CF6` | 60.6% | 0.219 | **293** |
| Tailwind purple-600 | `#9333EA` | 55.8% | 0.252 | **302** |
| Tailwind fuchsia-500 | `#D946EF` | 66.7% | 0.259 | **322** |
| Tailwind blue-500 | `#3B82F6` | 62.3% | 0.188 | 260 |
| Bootstrap `primary` | `#0D6EFD` | 57.8% | 0.228 | 260 |
| shadcn 기본 primary | `#18181B` | 21.0% | 0.006 | (무채색) |
| **forma light accent** | `#007ACC` | 56.7% | **0.155** | **249** |
| **forma dark accent** | `#3794FF` | 66.6% | **0.181** | **255** |
| forma chartPurple (light) | `#AF00DB` | 55.9% | 0.274 | 316 |

읽는 방법:

- "AI 보라"는 **H 270–310 + C ≥ 0.18** 이라는 좁은 상자다. hue만으로도,
  채도만으로도 정의가 안 된다. 둘의 곱이다.
- forma accent는 hue에서 20–28° 떨어져 있고 chroma도 낮다. **층 B에 대한
  forma의 현재 노출은 0이다.**
- 그런데 forma의 `chartPurple`은 H=316 C=0.274로 그 상자보다 더 튄다.
  "고채도 보라 금지"를 순진하게 규칙화하면 **forma 자기 토큰이 걸린다.**
  차트 시리즈 색은 hue를 벌려 구분하는 것이 목적이므로 정상이다. 규칙은
  `accent`/`accentStrong` 역할에만 걸어야 한다. 이게 4-3절 테스트 설계의 핵심이다.

**층 C — 관성적 장식 (일화 다수, 실증 연구 없음)**

커뮤니티가 반복해서 지목하는 목록은 서로 놀랍도록 일치한다: 보라-청 그라데이션
히어로, Inter, 1px 회색 테두리 카드, 3열 피처 카드, 채워진 버튼 + 외곽선 버튼
2개 세트, 다크 히어로 + radial glow, 글래스모피즘, 배지 밭.
(<https://www.925studios.co/blog/ai-slop-design-tells>,
<https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p>,
<https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website>)

이 목록들은 **일화**다. 표본도 방법도 없다. 예외는 하나 있다:
Sascha Becker, "Same Same but Different: The Anatomy of AI Design Sameness"
(2026-06-12, <https://saschb2b.com/blog/same-same-but-different>). 이 글은
동질화를 세 파(Material Design 2014–2018 / 템플릿 웹 2010–2019 / AI 인터페이스
2023–)로 나누고 20편 이상의 피어리뷰 연구를 인용한다(위의 CHI 2021,
Artificial Hivemind, Kirk 외 ICLR 2024, Shumailov 외 Nature 2024 model
collapse 포함). 인용된 논문 중 두 편은 내가 직접 확인했다. **일화 중에서
유일하게 근거 사슬이 있는 글이므로, 반례 목록을 갱신할 때 출발점으로 쓸 만하다.**
단, Becker의 개별 주장 자체를 검증한 것은 아니다.

### 1-2. 측정 가능한 형태로 쪼갠 것

각 항목은 **관찰 가능한 정의 → 측정 방법 → forma 적용 가능성** 순서다.
"forma 적용"은 forma가 결정론·의존성 최소·외부 요청 0 안에서 실제로 계산할 수
있는지다.

| # | AI 티의 정체 | 관찰 가능한 정의 | 측정 방법 | forma 적용 |
| --- | --- | --- | --- | --- |
| C1 | AI 보라 | accent 역할 토큰이 OKLCH H∈[268,312] **및** C≥0.17 | 토큰 hex → OKLCh 변환 | **가능**, 정적, 토큰만 읽음 |
| C2 | 유채색 그라데이션 | 한 gradient의 두 stop이 ΔH≥25° 이고 두 stop 모두 C≥0.08 | CSS 텍스트 파싱 + 색 변환 | **가능** |
| C3 | 히어로 그라데이션 | `h1`을 포함한 블록의 배경이 gradient | CSS + DOM 조합 | **가능** (현행 규칙은 개수만 셈) |
| C4 | 중성색의 유채색 오염 | canvas/surface/border 역할 토큰의 C > 0.03 | 토큰 → OKLCh | **가능** |
| C5 | 팔레트 과다 | 고유 색 값 개수 / 선언 수 | css-analyzer `colors.unique` | **가능**(측정 전용) |
| T1 | 중앙값 폰트 | font-family가 Inter/Poppins/Montserrat 계열 | CSS 텍스트 | 해당 없음(자체 서브셋 Geist + IBM Plex Sans KR) |
| T2 | 스케일 없는 타입 | 인접 font-size 비율의 분산이 큼 / 고유 size 과다 | css-analyzer `fontSizes` | **가능**(측정 전용) |
| T3 | 라벨 헤딩 | 헤딩이 주장이 아니라 명사구 | — | **불가**, 사람 판정 |
| S1 | 균일 radius | 고유 nonzero radius 값이 1개인데 다수 선택자에 쓰임 | css-analyzer `borderRadiuses` | 측정 가능, **규칙화는 근거 부족** |
| S2 | 그림자 남발 | box-shadow 총 사용 수, 고유 값 수, 비대화형 요소 위 사용 | CSS + DOM | **가능**, 현재 **검사 없음** |
| S3 | 균일 패딩 | 모든 섹션 padding이 동일 토큰 | CSS 텍스트 | 가능하나 forma는 density 축으로 이미 통제 |
| L1 | 전면 카드화 | 카드 섹션 비율 | `dom-lint` card-saturation | **이미 있음** |
| L2 | 반복 레이아웃 | 동일 블록 클래스 연속 | `dom-lint` layout-repetition | **이미 있음** |
| L3 | 3열 피처 그리드 | 동일 자식 3개를 가진 균일 그리드 | DOM | 없음, 추가 가능 |
| L4 | 위계 없음 | 레이아웃 거리 / 요소 트리 편집거리 | Design Theater DHI-Layout 방식 | **후보 간 비교용으로만 가능** (5절) |
| P1 | 카피의 AI 티 | 과장 형용사, 근거 없는 단정 | — | **불가**, 사람 판정. 단 `verified-claim-without-evidence`가 인접 |
| P2 | 의미 없는 CTA | 히어로 + 큰 CTA | DOM | forma 문서 종류에는 해당 없음 |

**색·간격·레이아웃에서 오는 부분은 대체로 기계화 가능하고, 타이포의 "성격"과
카피는 거의 전부 사람 판정이다.** 이 경계가 5절의 답이다.

### 1-3. 도구 기본값이 차지하는 비중

정확한 비율을 측정한 연구는 못 찾았다(**미확인**). 확인된 것은 방향뿐이다:
Design Theater의 DHI-Color 범위가 20.6–39.7로 **색은 도구마다 갈리는데**
DHI-Layout은 0.181–0.211로 **레이아웃이 좁게 수렴**했다. 즉 색(=층 B, 도구
기본값)은 프롬프트/도구로 바꾸기 쉽고, 레이아웃 수렴(=층 A/C)이 더 질기다.
CHI 2021의 "2010–2019 레이아웃 거리 44% 감소"도 같은 방향이다. AI 이전부터
레이아웃이 먼저 수렴하고 있었다는 뜻이다.

**따라서 "보라색만 피하면 된다"는 오답이다.** 색은 가장 눈에 띄고 가장
고치기 쉬운 층이다. forma는 이미 색을 고정해서 그 층을 통과했고, 남은 문제는
레이아웃 위계다 — 그리고 forma의 후보 축 4개(density, measure,
figurePlacement, typeScale)는 레이아웃 위계를 거의 바꾸지 않는다.

---

## 2. 연구자료

### 2-1. 직접 다룬 연구: 사실상 없다

"사람들이 어떤 시각적 특징 때문에 디자인을 AI 산출물로 판정하는가"를 측정한
논문은 찾지 못했다. 가장 가까운 것도 부분적이다.

**Usable but Conventional: An Empirical Study on the UX of AI-Generated
Interface Prototypes** (arXiv 2605.15124, Romero·Wiese·Balancieiri·Leal·Guerino,
2026-05-14 제출). UEQ-S로 참가자 92명에게 AI 생성 프로토타입과 사람 제작
프로토타입을 평가시켰다. 결과: AI 프로토타입은 **실용 품질(usability,
efficiency)에서 긍정적**, **창의 품질(originality, innovation)에서 낮음**.
저자 결론은 "GenAI는 기능하는 인터페이스를 만들지만 시각적·구조적 패턴을
강화해 독창성 인식에 영향을 준다".

> 한계: 초록·저자·날짜는 확인했다. **어떤 시각 요소가 그 판정을 유발했는지는
> 초록에 없다**(본문 미확인). 즉 "AI 티의 정체"에 대한 답은 이 논문에서
> 나오지 않는다. 쓸 수 있는 것은 방향 하나: **실용성은 통과하고 독창성에서
> 떨어진다** — forma의 hard gate(접근성·오버플로·클리핑)가 잡는 것이 전자이고,
> 선별이 필요한 것이 후자라는 구조와 정확히 일치한다.

### 2-2. 동질화 측정 연구: 두 편, 둘 다 유용하다

**Goree, Doosti, Crandall, Su. "Investigating the Homogenization of Web
Design: A Mixed-Methods Approach." CHI 2021.**
<https://dl.acm.org/doi/abs/10.1145/3411764.3445156>

- 표본: 스크린샷 227,000장 이상, 약 10,000 사이트, 2003–2019.
- 방법: 컴퓨터 비전으로 사이트 간 **평균 레이아웃 거리**와 **색 거리** 측정.
- 결과: 2007년 이후 유의하게 유사해짐. 레이아웃에서 특히 강하며 평균 거리가
  30% 이상 감소. 2010–2019 구간에서는 **44% 감소**.
- **원문 PDF를 열지 못했다**(ACM 403, UCSC 미러 TLS 실패). 거리 함수의 정확한
  정의는 **미확인**. 위 수치는 검색 스니펫과 2차 인용에서 온 것이다.

forma에 주는 것: **"동질화"는 절대적 심미가 아니라 집합 내 거리로 정의된다.**
단일 문서를 보고 "AI 같다"를 판정하는 것보다, **후보 8개가 서로 얼마나 다른지**를
재는 것이 방법론적으로 더 단단하다. 이건 forma의 `distinctiveness` 가중치
(5점, 현재 `layout-repetition`에서만 3점 깎임)를 실제로 채울 방법이다.

**Imteyaz, Imteyaz, Rajpal, Shaikh, Muller, Savage. "Design Theater: A
Benchmark for Generative UI." arXiv 2607.22928, 2026-07-24 제출. CC-BY-4.0.**
<https://arxiv.org/abs/2607.22928>

- 표본: 24 UI 과제 × 도구 5개(ChatGPT, Claude, Firebase Studio, Vercel v0,
  Bolt) = 인터페이스 120개.
- 지표 3개(정의는 본문에서 확인):
  - **TFS** = (1.0·N_full + 0.5·N_partial) / N_total — 도구가 말한 디자인
    근거가 실제 구현에 반영된 비율. 결과: 진술된 근거의 **25% 이상이
    미구현**, 기능 요구로 한정하면 **34%**.
  - **PAS** = Σ P_i / 2 — 프롬프트에 암묵적으로 깔린 UX 원칙 인식률.
    결과 약 **54%**.
  - **DHI** — 단일 값이 아니라 하위 측정 3개:
    - *Visual*: UIClip 임베딩 유사도. Claude와 Vercel v0가 가장 유사
      (DHI-Visual = 0.119).
    - *Color*: 스크린샷을 **CIELCh 색 히스토그램**으로 표현하고
      **Earth Mover's Distance**로 비교. 범위 20.6–39.7.
    - *Layout*: OmniParser v2.0으로 UI 요소를 검출한 뒤 **tree edit
      distance**. 범위 0.181–0.211.

forma에 주는 것 두 가지:

1. **DHI-Color 방식은 거의 그대로 이식 가능하다.** forma는 스크린샷 없이
   토큰에서 CIELCh(=OKLCh와 같은 극좌표 계열)를 직접 계산할 수 있고, EMD 대신
   토큰 집합 간 단순 거리로도 충분하다. 외부 모델·요청 0.
2. **DHI-Layout 방식은 forma가 더 유리하다.** OmniParser는 스크린샷에서
   요소를 *추정* 하는데, forma는 자기 DOM을 갖고 있다. `dom-lint.ts`의
   `scanElements`가 이미 태그·클래스·깊이를 뽑는다. **tree edit distance를
   후보 쌍에 적용하면 "이 8개가 정말 다른가"를 결정론적으로 측정할 수 있다.**
   이게 4절의 새 규칙보다 5절의 선별 문제에 직접 기여한다.

**TFS의 함의도 있다.** 도구가 말한 근거의 25–34%가 구현되지 않는다는 것은,
2단계 조사가 지적한 "말한 선호와 실제 선호는 다르다"의 기계 버전이다.
forma에서는 `DESIGN.md`에 적힌 규칙이 실제 렌더 출력에 반영되었는지를
검사해야 한다는 뜻이다 — **`DESIGN.md`의 각 값이 어떤 lint 규칙이나 토큰으로
집행되는지 매핑이 없으면 forma도 design theater를 한다.**

### 2-3. 심미·품질을 계산하는 연구와 그 구현

**Aalto Interface Metrics (AIM), UIST 2018 데모.** MIT.
<https://github.com/aalto-ui/aim>

저장소 파일 목록을 직접 조회해 구현된 메트릭을 확인했다:

| 메트릭 | 내용 | ML 가중치 필요 | forma 이식 |
| --- | --- | --- | --- |
| m1/m2 | PNG/JPEG 파일 크기 (시각 복잡도 대리) | 아니오 | 무의미 |
| m3 | 고유 RGB 값 수 | 아니오 | 색 다양성 대리로 유용 |
| m4/m6 | contour density / contour congestion | 아니오 | 스크린샷 필요 |
| m5 | figure-ground contrast | 아니오 | 토큰 대비로 대체 가능 |
| m7 | subband entropy (Rosenholtz clutter) | 아니오 | 스크린샷 필요 |
| m8 | feature congestion | 아니오 | 스크린샷 필요 |
| m9 | UMSI saliency | **예 (.h5)** | 부적합 |
| m11/m12 | static/dynamic color clusters | 아니오 | 유용 |
| m13/m14/m16 | luminance std, LAB 평균·표준편차, HSV 평균·표준편차 | 아니오 | 유용 |
| m15 | **colorfulness (Hasler & Süsstrunk)** | 아니오 | **유용** |
| m17 | 고유 hue/saturation/value 개수 | 아니오 | 유용 |
| m18 | NIMA 심미 점수 | **예 (.pt)** | 부적합 |
| m20 | color harmony | 아니오 | 유용하나 근거 약함 |
| m21 | **grid quality** | 아니오 | 레이아웃 위계에 직결 |
| m22 | white space | 아니오 | 유용 |
| m23 | color blindness | 아니오 | axe로 이미 부분 커버 |
| m24/m25 | 레거시/UIED 세그멘테이션 | 아니오 | forma는 DOM 보유, 불필요 |
| m30 | MDEAM (멀티듀레이션 saliency) | **예 (.hdf5)** | 부적합 |

m15의 원논문: Hasler & Süsstrunk, "Measuring Colourfulness in Natural
Images", IS&T/SPIE Electronic Imaging 2003, pp.87–95.
<https://infoscience.epfl.ch/record/33994/files/HaslerS03.pdf>
7단계 심리물리 범주 척도 실험에 지표를 피팅해 **실험 데이터와 상관 90% 이상**.
정의는 대립색 공간에서 픽셀 값의 평균과 표준편차 기반(L\*a\*b\*의 a\*b\*
점군으로 간단히 표현 가능). 실시간 계산을 목표로 설계됨.

> **판정: AIM에 의존하지 않는다.** 라이선스(MIT)는 문제없지만
> **2023-06-11 이후 push가 없다(약 3년)**. Python + Tornado + Vue 서비스이고,
> 절반은 스크린샷 픽셀 기반이라 forma의 결정론과 궁합이 나쁘다(브라우저
> 렌더링 편차가 그대로 점수에 들어온다). **가치는 "검증된 메트릭 목록"에
> 있다.** 특히 m15(colorfulness)와 m21(grid quality)은 정의가 공개된
> 논문 기반이므로 forma가 DOM/토큰 위에서 자체 구현하는 편이 낫다.

**UIClip: A Data-driven Model for Assessing User Interface Design.**
UIST 2024, arXiv 2404.12500. <https://uimodeling.github.io/uiclip/>
CLIP 기반, UI 230만 개로 학습, 스크린샷 + 자연어 설명 → 품질 점수와 개선 제안.
설계자 12명의 랭킹과 가장 높은 일치를 보였다고 보고. 모델·데이터셋은
HuggingFace 공개(`biglab/uiclip-uist-2024-...`), **라이선스는 확인하지 못했다
(미확인)**.

> **판정: forma에 부적합.** (1) 신경망 추론은 하드웨어·버전에 따라 결과가
> 흔들려 "같은 spec, 같은 seed, 같은 승자"를 깬다. (2) 모델 가중치가 무겁고
> devDependency로 넣을 성격이 아니다. (3) 스크린샷이 필요하다.
> 단, Design Theater가 DHI-Visual에 UIClip을 쓴다는 사실은 **"시각 유사도를
> 임베딩으로 재는 것이 현재 표준"** 이라는 정보를 준다. forma가 그 표준을
> 따라갈 필요는 없다 — forma는 DOM을 갖고 있어서 더 값싼 구조적 거리로
> 대체할 수 있다.

### 2-4. AI 생성물 탐지 연구는 적용 불가

이유 세 가지, 근거와 함께.

1. **대상이 다르다.** 탐지 연구는 생성 *모델* 이 픽셀에 남기는 흔적(주파수
   아티팩트, 업샘플링 지문)을 찾는다. forma의 출력은 결정론적 렌더러가
   만든 브라우저 렌더링이므로 생성 모델 흔적이 애초에 없다. "AI 티"는
   **결정의 진부함**이고, 탐지 연구가 찾는 것은 **신호의 흔적**이다.
2. **스크린샷·텍스트 리치 이미지에서 무너진다.** `TextFake: Benchmarking
   AI-Generated Image Detection on Text-Rich Images`
   (<https://arxiv.org/pdf/2606.01050>)는 실제 8,002장의 스크린샷을 포함한
   20,000장 벤치마크를 만들었고, 텍스트 리치 이미지가 별도 벤치마크를 요구할
   만큼 어려운 영역이라는 전제에서 출발한다. 더 일반적으로, 무압축 출력에서
   최고 점수를 받는 탐지기가 JPEG 저장이나 스크린샷 한 번에 무너진다는 것이
   이 분야의 알려진 결과다. **UI 문서는 정확히 "텍스트 리치 스크린샷"이다.**
3. **판정의 방향이 반대다.** 탐지기는 "이것이 AI 산출물인가"에 답한다. forma가
   필요한 것은 "이것이 진부한가"다. 두 번째 질문은 참조 집합 없이는 정의되지
   않는다 — CHI 2021과 Design Theater가 **거리**로 정의한 이유가 그것이다.

**대신 쓸 것**: 동질화 측정(2-2절). 절대 판정이 아니라 집합 내 거리다.

### 2-5. 없는 것 (정직하게)

- 타이포그래피 스케일의 "좋음"을 실증한 연구: 찾지 못했다. `modular-scale`
  (Apache-2.0, npm 마지막 발행 **2021-11-16**)은 계산기이고 검증 도구가 아니다.
  T2는 "규칙"이 아니라 "측정" 이상으로 올릴 근거가 없다.
- radius/shadow 균일성이 AI 티와 상관된다는 실증: 없다. 일화만 있다.
- forma가 만드는 종류의 문서(대시보드·보고서·매뉴얼)에 대한 심미 연구: 없다.
  위 연구는 전부 랜딩페이지·앱 UI 대상이다. **이건 forma에 유리하다** —
  "AI 티" 목록의 절반(히어로, CTA, 3열 피처, 테스티모니얼)이 forma의 문서
  종류에 애초에 존재하지 않는다.

---

## 3. 오픈소스와 도구: 검증표

npm registry API와 GitHub API로 직접 조회했다. 날짜는 조회 시점(2026-08-03) 기준.

| 패키지 | 버전 | 라이선스 | npm 마지막 발행 | repo 마지막 push | forma 제약 판정 |
| --- | --- | --- | --- | --- | --- |
| `culori` | 4.0.2 | MIT | 2025-06-27 | 2026-07-02 | **채택**. 런타임 의존 0, `culori/fn` tree-shakable, 외부 요청 없음, 순수 함수(결정론) |
| `colorjs.io` | 0.7.1 | MIT | 2026-07-24 | 2026-08-03 | 적합하나 불필요. 0.x이고 culori로 충분 |
| `chroma-js` | 3.2.0 | BSD-3-Clause AND Apache-2.0 | 2025-11-28 | — | 적합. OKLCH 지원은 culori가 더 두텁다 |
| `@ctrl/tinycolor` | 4.2.0 | MIT | 2025-09-16 | — | OKLCH 계열 취약. 불필요 |
| `color-diff` | 1.4.0 | BSD-3-Clause | 2023-05-31 | — | ΔE만. culori에 포함 |
| `@projectwallace/css-analyzer` | 9.9.3 | MIT | 2026-07-27 | 2026-08-01 | **조건부 채택**(devDependency). 의존성 1개, Node/브라우저, JSON 출력 |
| `css-tree` | 3.2.1 | MIT | 2026-03-05 | — | 정규식 파싱을 대체할 때만. 현재 lint는 정규식 기반 |
| `stylelint` | 17.14.1 | MIT | 2026-07-20 | — | **부적합**. forma는 저자 CSS가 없고 CSS를 자기가 생성한다. 검사 대상이 사람이 쓴 CSS가 아님 |
| `postcss` | 8.5.25 | MIT | 2026-07-29 | — | 필요 없음 |
| `apca-w3` | 0.1.9 | **Limited W3 License** | **2022-07-04** | — | **부적합**. 비표준 라이선스 + 4년 정지. APCA 자체도 WCAG 3 초안 단계 |
| `wcag-contrast` | 3.0.0 | BSD-2-Clause | **2019-11-05** | — | 부적합(7년 정지). culori `wcagContrast`로 대체 |
| `@adobe/leonardo-contrast-colors` | 1.1.0 | Apache-2.0 | 2026-02-18 | — | 팔레트 *생성* 용. forma는 팔레트가 고정이라 불필요 |
| `pixelmatch` | 7.2.0 | ISC | 2026-04-29 | — | 시각 회귀. 적합 |
| `odiff-bin` | 4.5.0 | MIT | 2026-07-23 | 2026-07-23 | 시각 회귀. 네이티브 바이너리 — 빠르지만 플랫폼 의존 |
| `specificity` | 1.0.0 | MIT | 2023-06-23 | — | css-analyzer에 포함. 불필요 |
| `modular-scale` | 5.1.2 | Apache-2.0 | **2021-11-16** | — | 부적합(5년 정지), 그리고 검증 도구가 아님 |
| AIM (`aalto-ui/aim`) | — | MIT | — | **2023-06-11** | **의존 금지**. 메트릭 정의만 이식 (2-3절) |
| OmniParser | — | CC-BY-4.0 | — | 2026-07-20 | **부적합**. 모델 가중치, 비결정론, forma는 DOM 보유 |
| UIClip | — | **미확인** | — | — | **부적합**. 2-3절 |

### 3-1. 채택 권고: `culori` 하나

이유:

- forma는 현재 **색 과학 의존성이 0개다**(`package.json` 확인: commander,
  diff, isomorphic-dompurify, react, react-dom, shiki, svgo, zod). 토큰은
  hex 리터럴이고 OKLCh 변환 로직이 없다. C1/C2/C4 규칙은 변환 없이 못 만든다.
- 직접 확인한 API: `oklch` 변환, ΔE 8종(`differenceCiede2000`,
  `differenceEuclidean`, `differenceHyab` 등), `wcagContrast`,
  `wcagLuminance`, 색맹 시뮬레이션 3종(`filterDeficiencyProt/Deuter/Trit`).
  `culori/fn`으로 tree-shake 가능.
  (<https://culorijs.org/api/>)
- **APCA는 없다.** forma가 APCA 대비를 원하면 `apca-w3`이 필요한데 라이선스와
  유지 상태 둘 다 문제다. **WCAG 2 대비로 남기는 것을 권고한다** — 이미
  axe-core가 그 기준으로 hard gate를 걸고 있어 일관성도 맞는다.
- 배치: **devDependency로 충분하다.** 토큰 검사는 lint 시점(빌드/QA)에 돌고,
  렌더된 HTML에는 들어가지 않는다. 런타임 의존성 최소 제약을 건드리지 않는다.

### 3-2. 조건부: `@projectwallace/css-analyzer`

- 확인한 출력: `colors`, `gradients`, `boxShadows`, `borderRadiuses`,
  `fontFamilies`, `fontSizes`, `zindexes`를 total/unique로, 선택자 specificity를
  `[a,b,c]`로, 그리고 min/max/mean/mode/sum 통계. 의존성 1개, zero-config,
  TypeScript 타입 내장.
- **규칙용이 아니라 측정용으로만 채택하라.** 임계값 없는 숫자를 먼저 기록해
  현재 출력의 분포를 알아야 한다. 지금 `shadow > 3`처럼 정하면
  `card-saturation 35%`와 같은 근거 없는 상수가 하나 더 생긴다.
- 반대 근거: forma의 스타일시트는 forma가 생성하므로 분포는 forma가 바꾸지
  않는 한 고정이다. 즉 **회귀 감시용**으로는 값이 있지만 **후보 선별용으로는
  값이 0이다**(5절). 그래서 "조건부"다.

### 3-3. 명시적 반대: stylelint

forma에는 사람이 쓴 CSS가 없다. `foundations-css.ts`/`block-css.ts`/
`artifact-css.ts`가 문자열을 만든다. stylelint는 저자 CSS의 실수를 잡는
도구이고, forma의 문제는 "생성된 CSS가 진부한가"다. 규칙 엔진을 하나 더
들여오면 유지 대상만 늘고 잡는 것은 늘지 않는다.

---

## 4. forma의 현재 반례 목록과 대조

### 4-0. 먼저: 문서가 거짓을 말하고 있다

`skills-src/_shared/references/generic-ai-patterns.md` 마지막 단락:

> `scripts/audit-design.mjs` catches the CSS-detectable subset of these
> automatically (bracket-border pseudo-elements, decorative `content: "["`,
> excessive gradient/shadow/pill usage).

확인한 사실:

- **`scripts/audit-design.mjs`는 없다.** `scripts/`에는 `check-naming.mjs`
  하나뿐이다. 실제 집행판은 `src/qa/design-lint.ts` + `src/qa/dom-lint.ts`다.
- **shadow 검사는 존재하지 않는다.** `grep -rn "shadow" src/qa/*.ts` → 0건.
  `foundations-css.ts:33`에 `--shadow` 토큰이 있지만 검사하는 규칙이 없다.
- pill 검사는 있다(`dom-lint` `pill-overuse`), gradient도 있다
  (`design-lint` `gradient-overuse`). 두 항목만 사실이다.

이건 스킬이 에이전트에게 주는 문서다. **에이전트가 "자동으로 잡힌다"를 믿고
넘기는 항목이 실제로는 안 잡힌다.** 코드 변경 없이 고칠 수 있고, 다른
어떤 작업보다 먼저 해야 한다.

### 4-1. 대조표

`generic-ai-patterns.md`의 9개 항목 × 실제 집행 상태.

| 반례 목록 항목 | 집행 규칙 | 상태 | 비고 |
| --- | --- | --- | --- |
| 좌측 bracket/hook border | `bracket-border`, `rounded-edge-border`, `thick-side-border` | **잡는다** | 3중으로 잡는다. 과잉일 수 있음 |
| 보라/청 그라데이션 히어로 | `gradient-overuse` (개수 > 2) | **부분** | 개수만 셈. 색도, 히어로 위치, 유채색 여부 안 봄 |
| 글래스모피즘 | 없음 | **못 잡음** | `backdrop-filter` 검사 0건 |
| glow / neon | 없음 | **못 잡음** | shadow/blur 검사 자체가 없음 |
| dot-grid / gradient orb / corner glow | 없음 | **못 잡음** | 배경 이미지·pseudo 요소 검사 없음 |
| 모든 콘텐츠를 둥근 카드로 | `card-saturation`(35%), `nested-surface` | **잡는다** | 임계값 근거 없음 |
| 의미 없는 pill/badge 남발 | `pill-overuse`(> 12) | **잡는다** | 임계값 근거 없음 |
| SaaS 히어로 + 큰 CTA | 없음 | **해당 없음** | forma 블록 스키마에 히어로/CTA 없음 |
| 장식용 대형 `{ } [ ] </>` | `decorative-glyph-content` | **잡는다** | 문자열 일치. `content: ")"` 등은 빠짐 |
| 스크롤 페이드업 / hover-lift / tilt / mouse-follow glow | `false-interactivity`(부분) | **부분** | hover 대상만 봄. `@keyframes`·`transition` 검사 없음 |
| 주장이 아닌 라벨 헤딩 | 없음 | **사람 판정** | 한국어에서 기계 판정 불가 |
| 위계 없는 균일 카드 그리드 | `layout-repetition`(연속 4개) | **부분** | "연속"만 봄. 그리드 자체 균일성 안 봄 |

목록에 없지만 코드가 잡는 것 (= 목록이 낡았다):

| 규칙 | 무엇을 잡는가 | 근거 |
| --- | --- | --- |
| `hardcoded-paint-color` | 테마를 못 따라가는 색 리터럴 | **강함**. 실제 버그 기록(사이드바 융합, 대비 2.41:1) |
| `centered-width-cap` | max-width + auto margin으로 한 블록만 가운데 | **강함**. 구체적 결함 서술 |
| `ch-measure` | ch 단위 측정 폭 (CJK에서 반토막) | **강함**. 한국어 근거 명시 |
| `oklch-color-mix-hue-shift` | 무채색(hue 0)과 oklch 혼합 → 분홍 | **강함**. 실제 버그 |
| `verified-claim-without-evidence` | 검증 표시했는데 출처 없음 | **강함**. hard gate |
| `prose-run`, `orphan-heading`, `paragraph-density` | 문서 리듬 | 중간 |

### 4-2. 잡고 있지만 근거가 약한 것

| 규칙 | 약한 이유 | 어떻게 해야 하는가 |
| --- | --- | --- |
| `card-saturation` 35% | 35%의 출처가 주석의 서술뿐. 왜 40%나 30%가 아닌가 | css-analyzer로 현재 예제 4개의 실측 분포를 기록하고, 사람이 "카드 과다"라고 판정한 지점과 비교해 정하라 |
| `pill-overuse` 12 | 같은 문제. 문서 길이와 무비례(짧은 문서의 12개와 긴 문서의 12개가 같은 취급) | 절대 개수 대신 **섹션당 밀도**로 바꾸라 |
| `layout-repetition` 연속 4 | 4의 근거 없음. 그리고 "비연속 반복"은 못 잡는다 | 연속 판정 대신 블록 클래스 **엔트로피**로 바꾸는 것을 검토 |
| `prose-run` 연속 4 | 같은 문제 | 위와 같음 |
| `gradient-overuse` > 2 | 개수는 AI 티와 무관하다. 무채색 미세 그라데이션 3개는 문제가 아니고, **유채색 히어로 그라데이션 1개가 문제다** | C2/C3로 교체 (4-3) |
| `thick-side-border` ≥ 2px | 2px의 근거 없음. `rounded-edge-border`와 겹쳐 같은 결함을 두 번 감점 | 중복 감점 여부를 확인하고 하나로 합쳐라 |
| `scoreCandidate`의 `default: deduct("visualConsistency", 2)` | **9개 규칙 중 7개가 이 default로 떨어진다** (`hardcoded-paint-color`, `bracket-border`, `rounded-edge-border`, `thick-side-border`, `decorative-glyph-content`, `gradient-overuse`, `oklch-color-mix-hue-shift`). 즉 대비 실패급 결함과 장식 괄호가 같은 2점 | 규칙마다 명시적으로 매핑하거나, 매핑 없는 규칙은 hard gate로 올려라. 지금은 감점 체계가 있다고 말하기 어렵다 |

### 4-3. 새 규칙 제안과 그 테스트 방법

제안은 4개다. 각각 **정의 → 왜 지금 필요한가 → 결함 반응 테스트 → 정상 침묵
테스트** 순서. 침묵 테스트가 없는 규칙 제안은 쓰지 않았다.

`culori`가 devDependency로 들어간다는 전제다.

---

**R1. `ai-accent-band` — accent 역할 토큰의 hue/chroma 대역**

- 정의: `FormaColorPalette`의 `accent`, `accentStrong`을 OKLCh로 변환해
  `H ∈ [268, 312]` **및** `C ≥ 0.17` 이면 finding.
- 필요한 이유: 층 B를 정면으로 막는 유일한 규칙. 그리고 `DESIGN.md`가 프로젝트별
  accent를 허용하게 되면(1단계·2단계 조사의 방향) **이 규칙 없이는 사용자가
  indigo-500을 그대로 넣을 수 있다.**
- **결함 반응 테스트**: 파라미터화 테스트로 위 표의 5개 값
  (`#6366F1`, `#4F46E5`, `#8B5CF6`, `#9333EA`, `#D946EF`)을 accent에 넣고
  각각 정확히 `ai-accent-band` 1건이 나오는지 확인. 경계 테스트: H=267.9와
  H=312.1은 침묵, C=0.169는 침묵.
- **정상 침묵 테스트**: `vscodeLight.accent`(#007ACC, H249 C0.155)와
  `vscodeDark.accent`(#3794FF, H255 C0.181) → 0건. Tailwind blue-500
  (H260 C0.188) → 0건(청색은 금지 대상이 아니다).
- **함정 테스트 (반드시 포함)**: `vscodeLight.chartPurple`(#AF00DB, H316
  C0.274)을 팔레트에 그대로 둔 상태에서 0건이어야 한다. 규칙이 팔레트 전체를
  훑으면 이게 걸린다. **역할 스코프가 제대로 걸렸는지를 이 테스트가 증명한다.**

---

**R2. `chromatic-neutral` — 중성 토큰의 유채색 오염**

- 정의: `canvas`, `surface`, `surfaceRaised`, `border`, `borderStrong`를
  OKLCh로 변환해 `C > 0.03` 이면 finding.
- 필요한 이유: "전체가 살짝 보라"는 층 B의 은근한 형태다. accent만 검사하면
  통과한다. 그리고 `oklch-color-mix-hue-shift` 규칙의 주석이 말하는
  "중성 토큰은 hue 0"이라는 **전제 자체를 검증한다** — 지금 그 전제는
  검사되지 않고 주석에만 있다.
- **결함 반응 테스트**: `surface`를 `#F3F0F8`(보라 기운) 같은 값으로 바꾸면
  1건. `#F3F3F3` → 0건.
- **정상 침묵 테스트**: `vscodeLight`/`vscodeDark`의 중성 토큰 전체 → 0건.
  직접 계산해 확인했다: `#FFFFFF`/`#F3F3F3`/`#F0F0F0`/`#D4D4D4`/`#1E1E1E`/
  `#3C3C3C` = C 0.000, `#252526` = 0.002, `#5A5D5E` = 0.004,
  `#2A2D2E` = 0.005. 임계값 0.03까지 여유가 6배 이상이므로 오탐 위험이 낮다.
- **회귀 가치**: 이 규칙은 팔레트가 바뀔 때만 반응한다. 즉 **평소 침묵이
  기본값**이고, 침묵이 깨지면 누군가 팔레트를 건드린 것이다. 규칙으로서
  이상적인 형태다.

---

**R3. `chromatic-gradient` — `gradient-overuse` 교체**

- 정의: 각 `linear-gradient`/`radial-gradient`의 색 stop을 파싱해,
  두 stop 사이 `ΔH ≥ 25°` 이고 **두 stop 모두 `C ≥ 0.08`** 이면 finding.
  개수 임계값은 없앤다(1건도 안 된다).
- 필요한 이유: 현행 `> 2`는 잘못된 축이다. `--shadow` 토큰처럼 무채색
  그라데이션은 몇 개든 문제가 아니고, **유채색 hue 이동 그라데이션 1개가
  AI 티다**. 그리고 개수 기반이라 스타일시트가 커지면 자동으로 위험해진다.
- **결함 반응 테스트**:
  `linear-gradient(135deg, #6366F1, #D946EF)`(ΔH=45, C 0.204/0.259) → 1건.
  `linear-gradient(#007ACC, #3794FF)`(ΔH=6) → 0건.
- **정상 침묵 테스트**: 현재 4개 예제 출력(`examples/{dashboard,report,manual,advanced}/output/index.html`)에
  대해 0건. 현행 규칙과의 차이를 함께 기록하라 — 현재 gradient 사용 수가
  2 이하라서 `gradient-overuse`가 침묵하는 것인지, 아니면 애초에 유채색
  그라데이션이 없는 것인지 실측으로 구분해야 한다.
- **주의**: 교체이므로 `scoreCandidate`의 매핑도 같이 옮겨야 한다. 현재
  `gradient-overuse`는 `default` 분기로 2점만 깎인다.

---

**R4. `shadow-inventory` — 규칙이 아니라 측정부터**

- 정의: 규칙을 만들지 않는다. `@projectwallace/css-analyzer`로
  `boxShadows.total` / `boxShadows.unique` / `borderRadiuses.unique` /
  `colors.unique` / `fontSizes.unique`를 뽑아 QA 출력에 **숫자로만** 남긴다.
- 필요한 이유: `generic-ai-patterns.md`가 존재한다고 주장하는 shadow 검사가
  없다. 그런데 "몇 개가 많은가"에 대한 근거도 없다. **측정 없이 임계값을
  정하는 것이 지금 dom-lint의 상수들이 근거 없는 이유다.** 같은 실수를
  반복하지 않는 방법은 숫자를 먼저 쌓는 것이다.
- **테스트**: 스냅샷 테스트. 4개 예제의 인벤토리를 스냅샷으로 고정하고,
  스타일시트가 바뀌어 숫자가 변하면 테스트가 깨져 사람이 본다. 이건
  "결함 반응/정상 침묵"이 아니라 **회귀 감시**다. 그렇게 명시하고 도입하라.
- 임계값을 정할 시점: 사람이 실제 후보를 보고 "그림자 과하다"고 판정한 사례가
  3건 이상 쌓인 뒤.

---

**제안하지 않은 것과 이유**

| 검토했으나 제안하지 않음 | 이유 |
| --- | --- |
| `uniform-radius` | 균일 radius가 AI 티와 상관된다는 근거가 일화뿐. forma는 radius 토큰이 소수라 규칙화하면 자기 출력이 걸린다 |
| `median-font` (Inter/Poppins 금지) | forma는 Geist + IBM Plex Sans KR을 자체 서브셋한다. 지금은 해당 없음. `DESIGN.md`가 폰트를 열어줄 때 다시 검토 |
| `label-heading` (라벨 헤딩 검출) | 한국어에서 "동사 유무"로 주장/라벨을 가릴 수 없다. 오탐이 침묵보다 나쁘다 |
| `glassmorphism` (`backdrop-filter` 금지) | 규칙 자체는 쉽다(문자열 1개). 하지만 forma 렌더러가 `backdrop-filter`를 절대 생성하지 않으므로 **영구히 침묵하는 규칙**이다. 침묵만 하는 규칙은 유지 비용만 만든다. `custom` 콘텐츠 경로가 열릴 때 도입하라 |
| `fade-up-on-scroll` (`@keyframes` 검출) | 위와 같음. forma의 상호작용 스크립트는 고정이다 |

**이 표가 4절의 진짜 결론이다.** forma의 반례 목록 중 "못 잡는 것" 대부분은
**forma가 애초에 생성하지 않기 때문에 잡을 필요가 없다.** 규칙을 추가하면
영구 침묵 규칙이 늘어난다. 실제로 위험한 것은 **토큰이 열릴 때**(R1, R2)와
**임계값의 근거 부재**(4-2)다.

---

## 5. 선별과의 관계

### 5-1. 결론: 자동 규칙을 늘려도 선별 부담은 줄지 않는다. 구조적으로 그렇다.

코드에서 확인한 사슬:

1. `renderSpecToHtml(spec, composition)`은 후보마다
   `buildStylesheet(fontFaceCss)`를 호출한다(`src/renderer/shell.ts:41`).
   인자는 폰트 CSS뿐이다(`src/design/foundations-css.ts:47`).
   → **후보 8개의 `<style>` 텍스트는 동일하다.**
2. `applyComposition`이 실제로 바꾸는 것은 `meta.density` 값과,
   `figurePlacement === "before"`일 때의 섹션 순서뿐이다
   (`src/renderer/composition.ts:19-23`).
3. `measure`/`typeScale`/`density`는 `data-*` 속성으로만 내려간다
   (`shell.ts:56`, `shell.ts:94`). 스타일시트가 그 속성을 받아 해석한다
   (`foundations-css.ts:178-179`).

따라서:

| 검사 층 | 규칙 수 | 후보 간 차이를 만드는가 |
| --- | --- | --- |
| `design-lint.ts` (CSS 텍스트) | 9 | **아니오. 8개 후보 전부 동일한 결과** |
| `dom-lint.ts` 순서 의존 (`card-saturation`, `layout-repetition`, `prose-run`) | 3 | `figurePlacement` 2값에 따라 **최대 2그룹** |
| `dom-lint.ts` 순서 무관 (`nested-surface`, `pill-overuse`, `false-interactivity`, `orphan-heading`, `verified-claim-without-evidence`) | 5 | 아니오 |
| 브라우저 증거 (axe, overflow, clipping, external, anchors) | 5 | `hardGate`에만 쓰임 — **감점이 아니라 실격**. 순위를 만들지 않음 |

**후보 8개가 만들 수 있는 서로 다른 점수는 최대 2개다.** `00-source.md`가
기록한 "결함 없는 후보는 모두 100점 동률"은 soft score의 설계 문제만이
아니었다. **입력이 애초에 같다.**

그러므로 질문 "자동 규칙을 늘리면 선별 부담이 줄어드는가"의 답은:

- **CSS 층 규칙 추가 → 선별 기여 0.** 모든 후보에 같은 감점이 들어가므로
  순위가 안 바뀐다. 효과는 "후보 전체를 통째로 반려"뿐이다.
- **DOM 층 규칙 추가 → 최대 2그룹까지만.** `figurePlacement` 외의 축이
  DOM을 바꾸지 않는 한 그 이상은 불가능하다.
- **깨끗한 후보만 늘어나는 것도 아니다.** 후보들이 이미 동일하게 깨끗하다.
  동률 문제는 "깨끗한 후보가 많아서"가 아니라 **"후보가 사실상 서로 같아서"**
  생긴다.

### 5-2. 그래서 무엇이 필요한가

순서대로 세 가지. 앞의 것이 없으면 뒤의 것은 의미가 없다.

**(a) 후보가 실제로 달라지게 만든다 — 통로 문제 (1단계 조사가 확정한 1차 병목)**

`buildStylesheet`가 문서별 입력을 받아야 한다. 최소한:
accent 역할 토큰, 표면 대비 강도, radius 단계, 여백 스케일. 이 축이 후보마다
달라지면 CSS 텍스트가 후보마다 달라지고, **그때 처음으로 CSS 층 규칙이
선별에 기여한다.** 지금 순서를 뒤집으면 (규칙 먼저, 통로 나중) 규칙 작업
전체가 선별에는 기여하지 않는다.

**(b) 감점만 있는 채점을 고친다 — 다양성을 처벌하는 판정자 문제**

`Artificial Hivemind`가 보인 것: Reward Model과 LLM-as-a-Judge는 다양성을
처벌한다. `scoreCandidate`는 정확히 같은 구조다 — 100에서 시작해 결함만
깎는다. **"결함 없음"의 최대값이 "가장 무난함"** 이다.

필요한 것은 가점 축이다. 후보 집합 내 거리로 정의하면 외부 모델 없이
결정론적으로 계산할 수 있다 (CHI 2021과 Design Theater가 쓴 방식):

- **후보 간 구조 거리**: `dom-lint.ts`의 `scanElements`가 이미 (태그,
  클래스, 깊이) 시퀀스를 만든다. 후보 쌍에 tree edit distance를 적용해,
  집합의 중앙값에서 먼 후보에 `distinctiveness`(현재 5점, 거의 안 쓰임)를
  가점한다. Design Theater의 DHI-Layout과 같은 아이디어인데 OmniParser 없이
  된다 — forma는 자기 DOM을 갖고 있다.
- **토큰 거리**: 축이 (a)로 열린 뒤, 후보 팔레트 간 OKLCh 거리
  (`culori` `differenceCiede2000` 또는 `differenceEuclidean`). Design
  Theater의 DHI-Color와 같은 축이다.

**주의**: 이건 "다른 것에 가점"이지 "좋은 것에 가점"이 아니다. 다양성은
품질의 대리 지표일 뿐이다. 방향을 주는 것은 사람의 반례다.

**(c) 사람의 판정을 축으로 되먹인다**

`00-source.md`와 2단계 조사가 확정한 것: 반례가 가장 값싸고 신뢰도 높은
취향 신호다. 자동 규칙은 반례를 **집행**할 수는 있어도 **발견**할 수 없다.
그리고 발견된 반례가 축 샘플링을 편향시키지 않으면 다음 라운드가 개선되지
않는다.

### 5-3. 자동/사람 경계

| 자동으로 판정 가능 | 사람만 판정 가능 |
| --- | --- |
| 토큰 값이 금지 대역에 있는가 (R1, R2) | 이 accent가 이 문서에 맞는가 |
| 선언이 존재하는가/몇 개인가 | 그 개수가 이 문서에서 과한가 |
| 구조가 반복되는가 (연속 카운트, 엔트로피) | 그 반복이 지루한가 아니면 리듬인가 |
| 후보 A와 B가 얼마나 다른가 (거리) | 어느 쪽이 더 나은가 (방향) |
| 대비비·오버플로·클리핑 (hard gate) | 위계가 읽히는가 |
| 헤딩 아래 콘텐츠가 몇 자인가 | 헤딩이 주장인가 라벨인가 |
| 검증 표시에 출처가 붙었는가 | 그 출처가 주장을 실제로 뒷받침하는가 |

**경계의 규칙**: 기계는 **부호 없는 거리와 이진 위반**을 잰다. **방향(어느
쪽이 더 좋은가)** 은 전부 사람이다. `card-saturation 35%`가 근거가 약한
이유가 바로 이것이다 — 그건 이진 위반으로 위장한 방향 판정이다.

---

## 확인한 것 / 미확인

**저장소에서 직접 확인**

- `scripts/audit-design.mjs` 없음. `scripts/`에 `check-naming.mjs`만 존재.
- `src/qa/*.ts`에 shadow 관련 검사 0건.
- `buildStylesheet(fontFaceCss)` — 문서별 입력은 폰트뿐 (`foundations-css.ts:47`).
- `applyComposition`이 DOM을 바꾸는 축은 `figurePlacement` 하나
  (`composition.ts:19-23`). density/measure/typeScale는 `data-*` 속성.
- `scoreCandidate`의 switch에서 9개 CSS 규칙 중 7개가 `default` 분기(2점)로 떨어짐.
- `hardGate`의 브라우저 증거는 실격만 하고 순위를 만들지 않음.
- forma 색 의존성 0개 (`package.json`).
- 토큰은 VS Code Light+/Dark+ 유래 hex (`src/design/tokens.ts`).

**직접 계산으로 확인**: 위 OKLCH 표 전체 (sRGB→OKLab→OKLCh, 외부 의존 없음).

**API로 확인**: 3절 표의 라이선스·발행일·push일 전부 (npm registry API,
GitHub API, 2026-08-03 조회).

**원문을 읽어 확인**: Design Theater(초록 + 본문의 TFS/PAS/DHI 정의),
Usable but Conventional(초록), UIClip 프로젝트 페이지, culori API 문서,
css-analyzer README, AIM 메트릭 파일 목록(GitHub API 디렉터리 조회).

**미확인 (그래서 인용 범위를 제한했다)**

- **Goree et al. CHI 2021 원문 PDF** — ACM 403, UCSC 미러 TLS 인증서 실패.
  레이아웃/색 거리 함수의 정확한 정의는 확인하지 못했다. 44%·30% 수치와
  표본 규모는 검색 스니펫과 2차 인용 기준이다. **거리 함수를 forma에 이식할
  계획이면 원문을 먼저 확보해야 한다.**
- **AIM 논문 원문(UIST 2018)** — 메트릭 파일 목록은 확인했지만 각 메트릭의
  검증 수준(어떤 논문에서 왔고 얼마나 재현되었는지)은 파일명 수준의 추정이다.
- **UIClip의 라이선스** — HuggingFace 컬렉션 존재는 확인, 라이선스는 미확인.
  어차피 부적합 판정이므로 추적하지 않았다.
- **"AI 티" 중 도구 기본값이 차지하는 비율의 정량치** — 그런 측정은 찾지
  못했다. 방향(색은 갈리고 레이아웃은 수렴)만 확인했다.
- **Becker 글이 인용한 나머지 논문들** (Kirk 외 ICLR 2024, Shumailov 외
  Nature 2024) — 제목·존재는 검색으로 보았지만 원문을 읽지 않았다. 이 문서에서
  근거로 쓰지 않았다.
- **`gradient-overuse`가 현재 예제에서 침묵하는 이유** — 사용 수가 2 이하인지,
  유채색 그라데이션이 아예 없는지 실측하지 않았다. R3 도입 시 먼저 측정해야 한다.
- **`thick-side-border`와 `rounded-edge-border`의 중복 감점 여부** — 코드상
  같은 결함에 둘 다 반응할 수 있어 보이지만 실제 출력에서 확인하지 않았다.

---

## 출처

**논문**

- Goree, Doosti, Crandall, Su. "Investigating the Homogenization of Web
  Design: A Mixed-Methods Approach." CHI 2021.
  <https://dl.acm.org/doi/abs/10.1145/3411764.3445156>
- Imteyaz 외. "Design Theater: A Benchmark for Generative UI." arXiv, 2026.
  <https://arxiv.org/abs/2607.22928>
- Romero 외. "Usable but Conventional: An Empirical Study on the UX of
  AI-Generated Interface Prototypes." arXiv, 2026.
  <https://arxiv.org/abs/2605.15124>
- Wu 외. "UIClip: A Data-driven Model for Assessing User Interface Design."
  UIST 2024. <https://arxiv.org/abs/2404.12500> ·
  <https://uimodeling.github.io/uiclip/>
- Oulasvirta 그룹. "Aalto Interface Metrics (AIM)." UIST 2018 데모.
  <https://dl.acm.org/doi/pdf/10.1145/3266037.3266087> ·
  <https://github.com/aalto-ui/aim>
- Hasler, Süsstrunk. "Measuring Colourfulness in Natural Images."
  IS&T/SPIE Electronic Imaging 2003.
  <https://infoscience.epfl.ch/record/33994/files/HaslerS03.pdf>
- Jiang 외. "Artificial Hivemind: The Open-Ended Homogeneity of Language
  Models (and Beyond)." NeurIPS 2025 Best Paper.
  <https://arxiv.org/abs/2510.22954>
- Zhang 외. "Verbalized Sampling: How to Mitigate Mode Collapse and Unlock
  LLM Diversity." arXiv, 2025. <https://arxiv.org/abs/2510.01171>
- "TextFake: Benchmarking AI-Generated Image Detection on Text-Rich Images."
  arXiv, 2026. <https://arxiv.org/pdf/2606.01050>

**1차 출처 (층 B)**

- Adam Wathan (Tailwind CSS), 2025-08.
  <https://x.com/adamwathan/status/1953510802159219096>

**도구 문서**

- culori API: <https://culorijs.org/api/>
- Project Wallace css-analyzer: <https://github.com/projectwallace/css-analyzer>
- odiff: <https://github.com/dmtrKovalenko/odiff>
- OmniParser: <https://github.com/microsoft/OmniParser>

**일화 (근거로 쓰지 않음, 반례 목록 갱신 시 출발점)**

- Sascha Becker. "Same Same but Different: The Anatomy of AI Design
  Sameness." 2026-06-12. <https://saschb2b.com/blog/same-same-but-different>
  (인용 사슬이 있는 유일한 글)
- 925 Studios. "AI Slop Fonts and Gradients: The Tells That Give Away AI
  Design." <https://www.925studios.co/blog/ai-slop-design-tells>
- Alan West. "Why Every AI-Built Website Looks the Same (Blame Tailwind's
  Indigo-500)." <https://dev.to/alanwest/why-every-ai-built-website-looks-the-same-blame-tailwinds-indigo-500-3h2p>
- "Why Your AI Keeps Building the Same Purple Gradient Website."
  <https://prg.sh/ramblings/Why-Your-AI-Keeps-Building-the-Same-Purple-Gradient-Website>
