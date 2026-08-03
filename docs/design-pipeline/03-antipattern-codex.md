# 3단계 조사: “AI가 만든 티”를 결함과 취향 신호로 분해하기

## 결론

**“AI 티”는 단일한 색이나 생성 출처의 흔적이 아니다.** 현재 확인 가능한 가장
강한 설명은 **(1) 이미 AI 이전부터 진행된 웹 디자인의 동질화, (2) 프레임워크와
디자인 시스템의 안전한 기본값, (3) 모호한 의도를 모델이 통계적으로 흔한 조합으로
채우는 현상, (4) 그 결과를 사람이 충분히 선별하지 않고 받아들이는 과정**이 겹친
것이다. 보라색은 이 묶음의 한 표식일 수 있지만, 보라색 자체를 금지할 실증 근거는
찾지 못했다.

Forma가 자동화해야 하는 것은 “AI가 만들었는가”의 판정이 아니라 다음 두 종류다.

1. **명백한 결함과 프로젝트 반례**: 대비 실패, 가짜 인터랙션, 모든 콘텐츠의 카드화,
   의미 없는 배지, 큰 장식 그라데이션과 채도 높은 청자색 glow의 결합처럼 사람의
   기존 거부 이력과 연결된 것. 이것은 lint와 hard/soft gate로 줄일 수 있다.
2. **후보의 측정 가능한 차이**: 색 분포, 표면 비율, 카드 기하, 타입 스케일, 시각
   복잡도, 레이아웃 반복도를 점수가 아닌 descriptor로 기록한다. 이것은 서로 다른
   clean 후보를 만들고 사람에게 비교시킬 때 필요하다.

반대로 **독창성, 맥락 적합성, 카피의 진부함, “우리답다”는 느낌은 사람의 선별
영역**이다. 자동 규칙을 늘리기만 하면 결함 없는 100점 후보가 더 많아져 현재의
동률 문제가 심해진다. 해결책은 더 정교한 단일 aesthetic score가 아니라
**hard gate → 반례 위반 제거 → descriptor 거리로 다양한 후보를 남김 → 블라인드
pairwise/MaxDiff와 이유 코드로 사람이 선택**하는 계층이다.

채택 권고는 작다.

- 지금은 새 런타임 의존성을 추가하지 않는다. 이미 있는 Playwright와 axe로 computed
  style, bounding box, screenshot을 측정할 수 있다.
- 새 규칙을 곧바로 감점에 넣지 말고 `measurement-only`로 수집한다.
- 실제 Forma 산출물의 “싫음/정상” 캘리브레이션 corpus가 생긴 뒤, 낮은 오탐률이
  입증된 조합 규칙만 lint로 승격한다.
- 색 파싱이 직접 구현하기 어려워질 때만 Color.js를 개발/QA 의존성으로 검토하고,
  CSS 정규식이 더 복잡해질 때만 CSSTree를 검토한다.

아래에서 **[확인]**은 원문·코드·저장소 메타데이터를 직접 확인한 사실,
**[추론]**은 그 사실에서 Forma에 대해 도출한 판단, **[제안]**은 아직 검증하지 않은
구현 가설이다. 웹 자료와 오픈소스 유지 상태는 2026-08-03에 확인했다.

---

## 1. “AI 티”의 정체

### 1-1. 출처 판정이 아니라 동질화 판정이다

**[확인]** AI 이전 웹도 이미 비슷해지고 있었다. Goree 등은 2003~2019년의 대표
웹사이트 이미지를 계산적으로 비교하고, 2007년 이후 특히 레이아웃의 평균 거리가
30% 넘게 줄었다고 보고했다. 11명의 경력 디자이너 인터뷰에서는 공통 라이브러리,
색 체계 표준화, 모바일 대응이 원인 후보로 나왔고, Bootstrap 사용은 다른
라이브러리에 비해 레이아웃 거리 감소와 강하게 연관됐다. 이것은 AI가 원인이라는
주장이 아니라 **AI가 등장하기 전에 이미 “안전한 웹 기본값”의 수렴이 있었다는
근거**다
([CHI 2021 논문](https://aux.engineering.ucsc.edu/publications/Goree_Doosti_Crandall_Su-HomogenizationWebDesign-CHI21.pdf),
[DOI](https://doi.org/10.1145/3411764.3445156)).

**[확인]** 2026년의 *Interrogating Design Homogenization in Web Vibe Coding*은
학술·회색문헌 63개와 도구 walkthrough를 바탕으로 vibe-coding 수명주기와 위험을
정리했다. 논문의 핵심 설명은 모호한 의도를 모델의 확률적 기본값이 채우고, 즉시
그럴듯한 결과를 주는 frictionless 흐름이 사용자의 조기 수용과 과의존을 유도한다는
것이다. 그러나 저자들이 한 것은 위험 분석과 사례 기반 완화 프레임이지, 여러
모델이 만든 웹사이트의 색·폰트·레이아웃 빈도를 계측한 출력 실험은 아니다. 논문도
실제 vibe coder 경험의 추가 실증이 필요하다고 한계를 적는다
([arXiv:2603.13036](https://arxiv.org/abs/2603.13036)).

**[확인]** 인접 분야의 실험은 “평균으로의 수렴” 가능성을 뒷받침한다. 36명 비교
실험에서 ChatGPT를 아이디어 도구로 쓴 서로 다른 사용자의 아이디어는 대안 도구를
쓴 경우보다 의미적으로 덜 구별됐고, 사용자는 더 많은 세부 아이디어를 냈지만
소유감은 낮았다
([Anderson et al., 2024](https://arxiv.org/abs/2402.01536)). 인도와 미국 참가자
118명의 문화적 글쓰기 실험에서도 AI 제안은 인도 참가자의 표현을 서구식으로
이동시켰다
([Agarwal et al., 2024](https://arxiv.org/abs/2409.11360)). 둘 다 웹 시각 디자인
실험은 아니므로, 방향을 뒷받침할 뿐 색·레이아웃 규칙의 임계값을 주지는 않는다.

**[추론]** 따라서 사용자가 말하는 “AI 같다”는 보통 생성기의 포렌식 흔적이 아니라
다음 결합을 알아보는 판단이다.

- **통계적으로 흔한 시각 어휘**: 중성 sans, 큰 중앙 정렬 hero, 둥근 카드, 약한
  그림자, 청색/보라색 accent.
- **장식의 의미 부재**: gradient, glow, pill, hover-lift가 상태·위계·행동을
  설명하지 않는다.
- **콘텐츠와 무관한 template 구조**: 모든 문제를 hero → CTA → 동일 카드 3개로
  번역한다.
- **낮은 국소 다양성과 높은 전역 균질성**: 각 요소는 정돈됐지만 모든 섹션의
  반경·간격·크기·위계가 같다.
- **카피까지 같은 확률적 중심**: 구체적 행위 대신 “unlock”, “transform”,
  “seamless”, “elevate” 같은 범용 약속이 시각적 CTA와 결합한다.

이 중 어느 하나도 단독으로 AI의 증거가 아니다. **결합과 맥락 불일치**가 표식이다.

### 1-2. 측정 가능한 특징으로 쪼개기

아래 임계값은 **[제안/캘리브레이션 전]**이다. 연구가 검증한 보편 임계값이 아니라,
첫 measurement schema를 만들기 위한 시작점이다. 규칙은 단일 특징이 아니라
두세 특징의 결합으로만 발화해야 한다.

| 층 | 측정값 | 계산 단위 | 자동 판정 가능성 | 해석 주의 |
|---|---|---|---|---|
| 색 | `chromatic_area_share`, `violet_blue_share` | computed background/border/text를 OKLCH로 변환해 보이는 painted area로 가중. 예비 청자색 대역 `h=250°..330°`, 고채도 후보 `C>=0.12` | 높음 | 대역과 chroma는 corpus로 보정해야 한다. 브랜드 보라는 정상이다. |
| 색 | `gradient_prominence` | gradient가 칠한 가장 큰 rect의 viewport 비율, 총 gradient 면적, stop의 hue/chroma 폭 | 높음 | 현재처럼 함수 개수만 세면 작은 차트와 큰 hero를 구별하지 못한다. |
| 색/표면 | `chromatic_glow_area` | 색이 있는 `box-shadow`/`filter: blur()` 중 blur radius, alpha, 확장 면적 | 중간 | focus ring과 데이터 강조를 allowlist해야 한다. |
| 표면 | `raised_surface_ratio` | section 중 배경+border/shadow+radius를 가진 비율; class명이 아니라 computed style 사용 | 높음 | 짧은 dashboard는 카드 비율이 높아도 정상일 수 있다. artifact별 기준 필요. |
| 표면 | `nested_surface_depth`, `radius_entropy` | raised surface 중첩 깊이, 의미 역할별 radius 값의 분포 | 높음 | radius가 일정한 것은 디자인 시스템의 장점이기도 하다. 단독 실패 금지. |
| 타이포 | `type_scale_vector` | h1/h2/h3/body의 computed font-size·weight·line-height 비율 | 높음 | 좋은 비율의 보편값은 없다. 승인 profile 또는 같은 artifact 후보끼리 비교한다. |
| 타이포 | `hierarchy_collapse` | 제목/본문 크기·weight 차가 동시에 작고, 카드 제목이 모두 같은 경우 | 중간 | dense technical 문서는 작은 차이가 의도일 수 있다. |
| 타이포 | `rendered_line_glyphs` | 실제 line box별 Latin 문자/CJK glyph 수 | 중간 | WCAG 2.2의 80자/40 CJK는 AAA에서 조절 수단을 요구하는 값이지 자동 미학 실패선이 아니다. |
| 간격 | `gap_scale_fit` | 관측한 margin/padding/gap이 승인 spacing token에 매핑되는 비율 | 높음 | 작은 optical correction은 예외가 필요하다. |
| 간격 | `role_gap_variance` | 동일 역할 간 간격의 분산과 서로 다른 역할 간 간격의 분리도 | 중간 | “모든 간격이 같다”와 “리듬이 일관된다”를 구분해야 한다. |
| 레이아웃 | `equal_card_grid_share` | 동일 폭·높이·표면의 sibling 3개 이상이 차지하는 면적과 반복 횟수 | 높음 | 비교표·metric grid는 정상이다. semantic block type을 함께 본다. |
| 레이아웃 | `template_signature` | 중앙 정렬 h1+짧은 설명+CTA 뒤에 동일 카드 3개가 오는 DOM/geometry 순서 | 중간 | landing page에만 적용하고 report/manual에는 적용하지 않는다. |
| 레이아웃 | `visual_complexity` | edge density, element/text-area 수, 색 수, 이미지/그래픽 영역, 공간 점유율 | 중간 | 선호 점수가 아니라 descriptor다. 사용자·문화에 따라 최적점이 다르다. |
| 모션 | `decorative_motion_count` | 비대화 요소의 hover transform, staggered entrance, pointer-follow, 무한 animation | 높음 | reduced-motion과 기능적 상태 전환은 별도다. |
| 카피 | `generic_claim_rate` | 프로젝트 반례 사전에 있는 범용 약속/CTA가 heading·button에서 차지하는 비율 | 낮음~중간 | 보편 사전은 오탐이 크다. 프로젝트가 실제 거부한 문구만 warning으로 쓴다. |
| 카피 | `claim_specificity` | 제목에 행위자·행동·대상·결과 중 몇 개가 있는지 | 낮음 | 한국어 형태 분석과 맥락 판단이 필요하다. hard gate로 쓰지 않는다. |

시각 미학을 수치화하는 선행 기반은 있다. VisAWI는 일곱 연구를 통해 웹 미학을
**simplicity, diversity, colorfulness, craftsmanship** 네 차원으로 검증했다
([Moshagen & Thielsch, 2010](https://www.sciencedirect.com/science/article/pii/S1071581910000777)).
또 450개 웹사이트와 548명 평가를 사용한 연구는 screenshot의 colorfulness와 visual
complexity, 인구통계 변수를 합쳐 500ms 첫인상 매력도 분산의 약 절반을 설명했다.
시각 복잡도가 colorfulness보다 더 큰 역할을 했고, 효과는 연령·성별·교육에 따라
달랐다
([Reinecke et al., 2013](https://www.eecs.harvard.edu/~kgajos/papers/2013/reinecke13predicting.shtml),
[저자 공개 PDF](https://wildlab.cs.washington.edu/Publications_files/Reinecke_CHI2013.pdf)).
이는 descriptor를 만들 근거이지 “미학 점수 1개”의 근거가 아니다.

### 1-3. Tailwind, shadcn, Bootstrap, 모델 기본값의 몫

**결론: 양을 나눠 말할 근거가 없다.** “AI 티 중 몇 %가 Tailwind인가”처럼 원인을
분해한 연구를 찾지 못했다. 확인 가능한 것은 다음뿐이다.

- **[확인]** CHI 2021 연구에서 Bootstrap은 레이아웃 유사성 증가와 상관이 있었다.
  인과 비율이나 AI 출력에서의 기여율은 제시하지 않았다.
- **[확인]** Bootstrap 5.3의 실제 기본 primary는 파랑 `#0d6efd`, 기본 radius는
  `0.375rem`, rounded 옵션은 기본 활성화다. 보라 gradient가 기본은 아니다
  ([CSS variables](https://getbootstrap.com/docs/5.3/customize/css-variables/),
  [options](https://getbootstrap.com/docs/5.3/customize/options/)).
- **[확인]** Tailwind는 blue/indigo/violet/purple을 포함한 넓은 OKLCH palette와
  system sans 기본 stack을 제공하지만 특정 보라색을 primary로 정하지 않는다
  ([colors](https://tailwindcss.com/docs/colors),
  [font family](https://tailwindcss.com/docs/font-family)).
- **[확인]** shadcn/ui는 `background`, `foreground`, `primary`, `radius` 같은
  semantic token을 제공하고 preset에서 색·반경·폰트·아이콘을 바꿀 수 있다.
  즉 shadcn의 흔적은 “neutral surface + 공통 component anatomy”일 수 있지만,
  보라색 강제는 아니다
  ([theming](https://ui.shadcn.com/docs/theming)).

**[추론]** 프레임워크는 가능한 어휘와 안전한 조합의 prior를 좁히고, 모델은 학습
데이터와 예제에서 그 어휘를 높은 확률로 재조합한다. 사용자가 구체적 시각 결정을
주지 않으면 모델·프레임워크·prompt·샘플 코드의 효과가 서로 얽히므로 관찰 결과만으로
각 몫을 식별할 수 없다. 알고 싶다면 같은 content와 prompt에서 모델, scaffold,
component library를 요인으로 둔 factorial 실험을 별도로 해야 한다.

---

## 2. 연구자료가 말하는 것과 말하지 않는 것

| 근거 | 표본/방법 | 쓸 수 있는 결론 | 쓸 수 없는 결론 |
|---|---|---|---|
| Goree et al., CHI 2021 | 2003~2019 웹 이미지 계산 분석 + 디자이너 11명 | AI 이전부터 레이아웃이 수렴했고 라이브러리·모바일·색 표준화가 관련됨 | AI 모델별 시각 습관, 보라색 임계값 |
| Shin et al., 2026 | 63개 학술·회색문헌 systematic review, 도구 walkthrough, 위험 분석 | 모호한 의도와 frictionless 수용이 동질화 위험을 키운다는 구조 | 생성 결과 corpus의 색/폰트/레이아웃 빈도. 논문 자체가 직접 출력 실험은 아님 |
| Anderson et al., 2024 | 참가자 36명 창의 아이디어 비교 | LLM 보조가 사용자 사이 의미적 다양성을 줄일 수 있음 | 웹 시각 디자인에서 동일 효과의 크기 |
| Reinecke et al., CHI 2013 | 웹 450개, 참가자 548명 | colorfulness·visual complexity는 측정 가능하고 첫인상 일부를 설명함 | 하나의 보편 최적값. 인구통계에 따라 효과가 달랐음 |
| Nordhoff et al., CHI 2018 | 44개국 80,901개 웹 디자인 | 색채성, 복잡도, text area 수, 평균 채도에 국가 차이가 있고 global site가 더 동질적 | 서구식 minimalism을 보편적인 정상으로 둘 근거 |
| VisAWI, 2010 | 7개 검증 연구 | simplicity/diversity/colorfulness/craftsmanship을 사람 평가 축으로 쓸 근거 | CSS 한 줄만 보고 craftsmanship를 자동 판정하는 법 |

44개국 연구는 약 2,000개 인기 사이트/국가를 비교해 색채성, 시각 복잡도, text area
수, 평균 채도의 유의한 차이를 보고했고, global reach 사이트가 local 사이트보다
국가 간 더 동질적이었다
([Nordhoff et al., 2018](https://doi.org/10.1145/3173574.3173911),
[초록과 표본 설명](https://www.researchgate.net/publication/324665520_A_Case_for_Design_Localization_Diversity_of_Website_Aesthetics_in_44_Countries)).
이는 Forma가 “낮은 복잡도·큰 여백·서구식 editorial”을 AI 냄새 제거의 보편 기준으로
삼으면 오히려 문화적 동질화를 강화할 수 있음을 경고한다.

### 직접 증거의 공백

이번 조사에서 찾지 못한 것:

- 동일 요구사항을 여러 모델·버전·scaffold로 대량 생성해 CSS/DOM/screenshot을
  공개하고 “보라색+gradient”, card ratio, 폰트, spacing, CTA 문구 빈도를 비교한
  재현 가능한 benchmark.
- 사람이 “AI 같다”고 판정한 웹 UI corpus와, 어떤 시각 특징이 그 판정에 얼마나
  기여하는지 보고한 ablation 연구.
- Tailwind/shadcn/Bootstrap/모델/prompt 각각의 분산 기여율.
- “gradient 3개”, “카드 35%”, “pill 12개” 같은 현재 Forma 임계값을 검증한 연구.

따라서 영상과 커뮤니티가 반복해서 말하는 보라색·gradient·Inter·둥근 카드 조합은
**체계적으로 반복되는 관찰 가설**로는 쓸 수 있지만, 이미 입증된 AI detector feature로
쓰면 안 된다.

### AI 생성물 탐지 연구는 적용 가능한가

**거의 적용할 수 없다.** 이미지 detector는 생성 모델이 raster를 합성할 때 남기는
주파수·재구성·generator-specific artifact를 찾는다. Forma screenshot은 AI가 pixel을
합성한 이미지가 아니라 브라우저가 HTML/CSS를 rasterize한 결과다. detector가 잡는
신호는 “누가 레이아웃 결정을 했는가”가 아니라 브라우저, 폰트, 압축, screenshot
환경이 된다.

더구나 이미지 탐지 연구 자체도 unseen generator 일반화가 핵심 난제로 남아 있다.
CVPR 2023 연구는 기존 분류기의 unseen diffusion/autoregressive 모델 일반화 문제를
지적했고
([Ojha et al., 2023](https://openaccess.thecvf.com/content/CVPR2023/html/Ojha_Towards_Universal_Fake_Image_Detectors_That_Generalize_Across_Generative_Models_CVPR_2023_paper.html)),
CVPR 2025 연구는 content, format, resolution 같은 spurious correlation이 실제
일반화를 해친다고 보고했다
([Guillaro et al., 2025](https://openaccess.thecvf.com/content/CVPR2025/html/Guillaro_A_Bias-Free_Training_Paradigm_for_More_General_AI-generated_Image_Detection_CVPR_2025_paper.html)).

텍스트 detector도 카피 검사기로 쓰지 않는다. EACL 2026의 6 prompting 전략,
7 LLM, 4 domain benchmark에서도 unseen prompt/model/domain 일반화가 흔히 무너졌고,
시제·대명사 빈도 같은 특징 이동과 성능이 연관됐다
([Xia et al., 2026](https://aclanthology.org/2026.eacl-long.307/)). 짧은 UI heading과
button copy는 이 연구의 장문 domain보다 정보가 더 적다. Forma는 “AI 카피”를
판정하지 말고, 실제 반례로 승인된 진부한 문구만 낮은 심각도의 project warning으로
다뤄야 한다.

---

## 3. 오픈소스와 도구 판정

### 3-1. 바로 쓰거나 이미 쓰는 것

유지 상태는 GitHub repository의 archived 여부, 최근 push와 latest release를
2026-08-03에 확인했다. 날짜는 최신 release 기준이다.

| 도구 | 용도 | 라이선스 / 최신 확인 | Forma 판정 |
|---|---|---|---|
| [Playwright](https://github.com/microsoft/playwright) | computed style, bounding box, viewport별 screenshot, visual regression | Apache-2.0; v1.62.1, 2026-07-30; active | **채택(이미 있음).** 외부 요청 없이 로컬 HTML을 열 수 있고 viewport·브라우저를 고정하면 결정론적 측정이 가능하다. `toHaveScreenshot()`은 내부적으로 pixelmatch를 쓴다. 단 OS·브라우저·폰트 차이가 screenshot을 바꾼다([공식 문서](https://playwright.dev/docs/test-snapshots)). |
| [axe-core](https://github.com/dequelabs/axe-core) / `@axe-core/playwright` | WCAG 접근성, 색 대비 포함 | MPL-2.0; v4.12.1, 2026-06-10; active | **채택(이미 있음).** correctness hard gate다. 프로젝트는 이미 `@axe-core/playwright` 4.12.1을 쓴다. 프로젝트 설명도 자동 검사로 평균 57%의 WCAG 문제를 찾고 나머지는 manual/incomplete로 남긴다고 명시한다. 미학 detector로 오용하지 않는다. |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) | 성능·접근성·best practice | Apache-2.0; v13.4.1, 2026-07-20; active | **유지(이미 있음).** 성능/기술 품질 gate이지 AI 티 점수가 아니다. 런타임 산출물에 포함되지 않는다. |
| [Vitest](https://github.com/vitest-dev/vitest) | 규칙의 defect/control paired test | MIT; v4.1.10, 2026-07-06; active | **유지(이미 있음).** 현재 lint 테스트의 “결함에 반응하고 정상 코드에 침묵” 구조를 확장한다. |

WCAG 2.2는 일반 텍스트 4.5:1, large text 3:1, 의미 있는 UI/그래픽 경계 3:1을
요구한다
([W3C Recommendation](https://www.w3.org/TR/WCAG22/),
[인접 색 경계 기법](https://www.w3.org/WAI/WCAG22/Techniques/general/G209.html)).
이 값은 접근성 실패선이지 “세련됨”이나 “AI 티”의 척도가 아니다.

### 3-2. 조건부로 쓸 수 있는 작은 라이브러리

| 도구 | 용도 | 라이선스 / 최신 확인 | Forma 판정 |
|---|---|---|---|
| [Color.js](https://github.com/color-js/color.js) | CSS Color 파싱, OKLCH/다른 공간 변환, DeltaE, WCAG 2.1/APCA 등 | MIT; v0.7.1, 2026-07-24; active | **조건부 채택.** procedural API가 tree-shakable하고 색 명세 편집자들이 관리한다([문서](https://colorjs.io/docs/), [contrast](https://colorjs.io/docs/contrast)). `violet_blue_share`, gradient stop 거리처럼 색 과학이 실제 필요해질 때 QA/dev 경로에만 넣는다. axe가 이미 대비를 검사하므로 대비 하나 때문에 추가하지 않는다. |
| [CSSTree](https://github.com/csstree/csstree) | CSS parser/walker/lexer와 W3C 기반 validation | MIT; v3.2.1, 2026-03-05; active | **조건부 채택.** 지금 renderer가 소유한 단순 CSS에는 regex가 싸다. nested rule, `color-mix()`, 복수 background layer를 분석하는 규칙이 늘어 regex가 오탐을 내기 시작할 때만 dev dependency로 쓴다. |
| [Capsize](https://github.com/seek-oss/capsize) | font metadata로 cap height·leading·fallback metric 정렬 | MIT; `@capsizecss/core` v4.1.3, metrics v4.2.0; 2026-07-20 active | **특정 문제에만 채택.** line-height와 fallback CLS를 결정론적으로 계산하는 도구이지 “좋은 type scale” validator가 아니다. Forma는 폰트를 자체 subset하므로 metric 정렬 결함이 실측될 때만 도입한다. |
| [Adobe Leonardo](https://github.com/adobe/leonardo) | 대비 목표를 만족하는 adaptive palette 생성·분석 | Apache-2.0; repo active, 2026-07 push 확인 | **저작 도구 후보, renderer 비채택.** 안전한 팔레트 후보 생성에는 유용하지만 취향을 평가하지 않는다. 승인된 최종 token을 spec/profile에 고정할 수 있을 때만 authoring 단계에서 사용한다. |

APCA는 Color.js가 구현하지만 WCAG 2.2의 normative conformance algorithm은
WCAG 2.x contrast다. APCA를 보조 실험값으로 병기할 수는 있어도 hard gate를
바꾸는 근거로 삼지 않는다.

### 3-3. 추천하지 않는 것

| 도구 | 라이선스 / 유지 | 기각 이유 |
|---|---|---|
| [Stylelint](https://github.com/stylelint/stylelint) | MIT; v17.14.1, 2026-07-20; active | 훌륭한 CSS convention/error linter지만 rendered DOM의 card saturation, geometry, 의미를 보지 못한다. 현재 작은 전용 lint에 비해 dependency/config 비용이 크다. CSSTree를 parser로 쓰는 편이 필요한 층에 정확히 맞는다. |
| [pixelmatch](https://github.com/mapbox/pixelmatch) | ISC; v7.2.0, 2026-04-29; active, 무의존성 | Playwright screenshot assertion이 이미 pixelmatch를 사용한다. 직접 추가하면 중복이다. visual regression은 결함 회귀를 잡지만 “더 독창적인가”를 판정하지 않는다. |
| [node-vibrant](https://github.com/Vibrant-Colors/node-vibrant) | MIT; v4.0.4, 2026-01-27; active | raster에서 대표 palette를 추출한다. 현재 Forma 최종 artifact에는 일반 raster 입력 경로가 없고, 추출은 평가가 아니다. moodboard 자산 경로가 생기기 전에는 YAGNI다. |
| AI image/text detector | 구현별 상이 | HTML/CSS 저작 출처가 아니라 raster/문체 artifact를 분류하고 OOD 일반화가 약하다. 모델 weight와 큰 inference dependency는 최소 런타임, 외부 요청 0, 결정론 목표에도 맞지 않는다. |
| BackstopJS/reg-suit/jest-image-snapshot 계열 | 구현별 상이 | Forma에는 이미 Playwright가 있다. 별도 runner·baseline 저장 규약을 추가해도 같은 pixel regression 문제만 푼다. |

**팔레트 생성과 팔레트 평가를 구분해야 한다.** Leonardo 같은 도구는 대비 조건을
만족하는 후보를 만들 수 있고 Color.js는 차이·대비를 계산할 수 있다. 어느 팔레트가
Forma답거나 이 문서에 맞는지는 결정하지 못한다. 생성기는 저작 보조, WCAG는 hard
gate, 나머지는 선별이다.

---

## 4. 현재 반례 목록과 기계 집행판의 대조

### 4-1. 체크리스트별 coverage

| `generic-ai-patterns.md` 반례 | 현재 잡는 규칙 | 잡지 못하는 핵심 | 근거 상태 | 권고 |
|---|---|---|---|---|
| 왼쪽 bracket/hook border | `bracket-border`, `rounded-edge-border`, `thick-side-border` | shorthand, logical nesting, SVG/DOM glyph 일부 | **프로젝트 반례로 강함.** 보편 연구 임계값은 없음 | 유지. CSSTree 도입 전까지 shorthand negative fixture를 추가해 경계를 기록 |
| 보라/파랑 gradient hero, glass, glow, neon, dot-grid, orb, corner glow | `gradient-overuse`가 gradient 함수 **3개 초과**만 탐지 | hue, chroma, 면적, 위치, glass의 blur/transparency, shadow/glow, 1~2개의 거대한 gradient | 현재 가장 큰 누락. “3개” 근거 약함 | 함수 개수 규칙을 즉시 강화하지 말고 `gradient_prominence`+`violet_blue_share`+`chromatic_glow_area` 측정부터 |
| 모든 콘텐츠를 둥근 카드로 감쌈 | `card-saturation`(section 4개 이상, raised class가 35% 초과), `nested-surface` | class명이 다르면 누락, 실제 radius/shadow/배경을 안 봄, dashboard 맥락 | 방향은 반례와 일치. 35%는 미검증 | computed style 기반 surface 분류를 measurement로 병행하고 artifact별 분포로 보정 |
| 의미 없는 pill/badge 과다 | `pill-overuse`(class명, 12개 초과) | 의미/중복, 페이지 길이에 대한 밀도, class명이 다른 capsule | 12개는 프로젝트 heuristic | `pill_count`와 `pill_per_1k_chars`, distinct semantic role을 측정. hard fail은 하지 않음 |
| SaaS hero + 의미 없는 CTA | 없음 | 구조와 카피 둘 다 없음 | 커뮤니티 관찰 외 직접 실증 없음 | landing artifact가 생기기 전에는 human checklist. 생기면 좁은 `template_signature` warning |
| 큰 `{}`, `[]`, `</>` 장식 | `decorative-glyph-content`가 CSS `content`의 일부 literal만 탐지 | 실제 DOM text, escaped code point, SVG path | 프로젝트 반례로 강함 | DOM text의 `aria-hidden` oversized glyph fixture를 추가하되 code block·실제 문법은 control로 둠 |
| staggered fade-up, hover-lift, tilt, mouse glow | `false-interactivity`가 비인터랙티브 selector의 `:hover`만 탐지 | keyframes, animation-delay sequence, pointer handler, interactive card의 장식 lift, reduced-motion | 기능 없는 affordance는 강한 결함. 특정 모션 목록은 취향 | `decorative_motion_count` measurement. 기능 상태 전환과 `prefers-reduced-motion`을 control로 둠 |
| 짧은 label뿐인 section heading | `orphan-heading`은 heading 아래 body가 40자 미만일 때 탐지 | 본문은 길지만 heading이 여전히 “Overview”인 경우, claim semantics, 한국어 | “40자”는 미검증이고 claimness는 의미 문제 | 길이 rule은 구조 결함으로 유지. claimness는 사람 reason code로 평가 |
| 위계 없는 균일 card grid | `layout-repetition`은 같은 `blk-*` section 4연속만 탐지; card saturation이 간접 탐지 | 한 section 안의 동일 카드 3개, 실제 기하·면적·강조 차이 | 핵심 누락 | `equal_card_grid_share`와 largest/smallest card emphasis ratio를 measurement로 추가 |

`generic-ai-patterns.md`는 `scripts/audit-design.mjs`가 CSS subset을 잡는다고 쓰지만,
현재 저장소의 실제 집행 구현은 `src/qa/design-lint.ts`와 `src/qa/dom-lint.ts`다.
문서와 코드의 도구 이름을 다음 문서 개정 때 맞춰야 한다. 이번 과제에서는 지정된
산출물 외 파일을 수정하지 않았다.

### 4-2. 현재 잡지만 “AI 티” 근거가 약하거나 다른 종류인 것

| 현재 규칙 | 실제 성격 | 판단 |
|---|---|---|
| `hardcoded-paint-color` | theme correctness/maintainability | 좋은 규칙이지만 AI 티가 아니다. QA 분류를 분리해야 설명력이 좋아진다. |
| `oklch-color-mix-hue-shift` | 색 보간 correctness | 특정 구현 결함이다. 유지하되 anti-AI score의 증거로 세지 않는다. |
| `ch-measure` | CJK와 font-size에 취약한 구현 선택 | 읽기 폭 결함 예방이다. 실제 rendered line length 측정과 별개다. |
| `centered-width-cap` | 주변 block과 시작선이 어긋나는 layout defect | Forma의 디자인 문법에는 타당하지만 모든 중앙 정렬을 AI로 보지 않는다. |
| `verified-claim-without-evidence` | 콘텐츠 provenance hard gate | 시각 AI 티와 무관한 correctness다. hard gate 유지. |
| `prose-run` | 문서 구조/인지 부하 heuristic | Forma artifact에 타당하지만 4연속 임계값은 corpus 검증이 없다. |
| `gradient-overuse` | 현재는 전역 함수 개수 | 3개 작은 gradient는 실패하고 1개 full-viewport purple glow는 통과한다. 반례의 대리값으로 약하다. |
| `card-saturation`, `pill-overuse`, `layout-repetition`, `orphan-heading` | 반례의 proxy | 방향은 맞지만 35%/12개/4연속/40자의 수치는 프로젝트 가설이다. 실증된 보편값처럼 문서화하면 안 된다. |

`scoreCandidate`는 알 수 없는 lint rule을 모두 `visualConsistency -2`로 처리한다.
그 결과 correctness, 프로젝트 취향, anti-pattern proxy가 한 숫자에 섞인다. 또한
`paragraph-density`와 `heading-overflow` 감점 case는 현재 lint에서 생성되지 않는다.
새 규칙을 추가하기 전에 finding에 최소한 `correctness | project-ban | descriptor`
성격을 부여하고, descriptor는 감점하지 않는 편이 안전하다.

### 4-3. 새 규칙의 테스트 계약

현재 unit test가 사용한 paired 구조를 유지한다. 각 규칙은 최소한 다음을 가져야 한다.

1. **결함 fixture**: 규칙이 잡으려는 최소 예.
2. **근접 정상 fixture**: 한 조건만 제거한 예. 규칙이 침묵해야 한다.
3. **의미 있는 예외**: chart gradient, focus glow, 실제 badge, metric grid, code glyph,
   interactive hover처럼 모양은 같아도 기능이 있는 예.
4. **shipped-output 회귀**: 현재 fixture 전체가 계속 통과해야 한다.
5. **metamorphic test**: 색만 보라에서 초록으로 바꾸거나, 면적만 5%에서 40%로
   바꾸거나, CTA 의미만 구체화했을 때 어떤 feature가 결과를 바꾸는지 확인한다.
6. **viewport/language matrix**: 1920/1440/1024/390, 영어/한국어에서 같은 의미의
   결함을 재현한다.

제안 규칙별 최소 paired test는 다음과 같다.

| 후보 규칙 | 결함에 반응 | 정상에 침묵 |
|---|---|---|
| `gradient-prominence` | viewport 40% hero에 고채도 청자 gradient+glow | 8% chart legend gradient, 단색 브랜드 hero, print gradient |
| `chromatic-glow` | 비인터랙티브 배경 orb의 blur 48px, 큰 painted bounds | keyboard focus ring, 작은 status halo, shadow 없는 accent |
| `surface-saturation-computed` | section 6개 중 5개가 radius+background+shadow | dashboard metric grid allowlist, 6개 중 1개만 evidence card |
| `equal-card-grid` | 같은 크기·스타일·강조의 3~4 카드가 연속 반복 | 비교 의미가 있는 표/metric grid, 한 카드가 primary로 명확히 큼 |
| `decorative-glyph-dom` | `aria-hidden` 큰 `</>` text decoration | code block 안의 `</>`, 실제 수식/문법, screen-reader label |
| `decorative-motion` | 비대화 section의 hover lift와 staggered entrance | button hover, disclosure transition, reduced-motion에서 제거되는 기능 모션 |
| `type-hierarchy-collapse` | h1/h2/body의 size·weight가 거의 같고 모든 card title도 동일 | dense manual profile, 큰 제목 대신 rule/spacing으로 위계를 의도적으로 만든 승인 profile |
| `generic-copy` | 프로젝트가 실제 거부한 phrase가 CTA/heading에 반복 | 본문 인용, 구체적 행위가 있는 CTA, 다른 프로젝트의 정상 표현 |

### 4-4. 임계값을 정하는 방법

임계값을 직감으로 더 만들지 않는다.

- 실제 Forma screenshot/HTML을 artifact와 언어별로 모은다.
- 사람이 `reject / acceptable / prefer`와 이유 코드를 붙인다. `reject`만 lint 학습에
  쓴다. `prefer`는 선별 데이터다.
- 규칙별 ROC보다 **false-positive budget**을 먼저 둔다. 예를 들어 shipped/승인
  corpus에서 오탐 0건을 승격 조건으로 하고, reject corpus recall은 공개한다.
- threshold를 고른 뒤 같은 corpus로 테스트하지 않는다. 프로젝트·artifact별
  holdout을 둔다.
- 모델/도구 이름은 label에 쓰지 않는다. 출력 특징만 저장해야 새 모델에서도
  의미가 남는다.

보편 임계값을 찾는 것보다 **사용자의 반례를 고정하고 정상 코드에 침묵시키는 것**이
이 제품 철학과 더 맞는다.

---

## 5. 자동 검사와 사람 선별의 경계

### 자동화해도 되는 것

- 접근성, overflow, clipping, broken anchor, 외부 요청, 근거 없는 verified claim.
- 명시적 project ban의 구조적 재현: bracket frame, 중첩 surface, 기능 없는 hover.
- 사람이 비교할 수 있도록 사실을 측정: hue/chroma/면적, type scale, 간격, 카드 기하,
  visual complexity, 반복도.
- 후보가 같은지 다른지, 어떤 축에서 다른지 설명.

### 사람에게 남겨야 하는 것

- 브랜드나 독자에게 그 보라색이 맞는가.
- 같은 grid가 명료한 비교인지 진부한 template인지.
- 단순함이 절제인지 정보 삭제인지.
- 카피가 구체적인지, 제품의 약속과 정직하게 연결되는지.
- 정상 후보 중 어느 것이 “우리답고” 더 기억에 남는지.

### lint를 늘리면 왜 동률이 심해지는가

현재 `candidates.ts`는 hard gate를 통과한 후보에서 lint finding만 감점한다. finding이
없으면 모든 breakdown이 최대값이고 100점이다. anti-pattern 규칙을 더 정확하게
만들면 나쁜 후보 제거율은 올라가지만, 살아남은 후보끼리의 좋은 차이를 설명하는
양의 신호는 생기지 않는다. 즉 **“후진 게 없어집니다”는 빨라져도 “무엇이 더
좋습니까”는 그대로**다.

게다가 새 규칙을 soft score에 계속 넣으면 두 부작용이 생긴다.

1. 규칙을 피하는 것이 목적이 되어 flat하고 무표정한 후보가 최적화된다.
2. correctness와 taste가 같은 숫자에 섞여, 98점과 96점의 의미를 사람이 알 수 없다.

### 필요한 선별 구조

```text
후보 생성
  → correctness hard gate
  → 프로젝트 반례 위반 제거
  → descriptor vector로 근접 중복 제거
  → 서로 다른 clean 후보의 Pareto/diversity set
  → 블라인드 pairwise 또는 MaxDiff + 이유 코드
  → 승인된 선택을 다음 round의 profile/축에 반영
```

구체적으로는 다음이 필요하다.

- **감점과 descriptor 분리.** `violet_blue_share=0.42`, `surface_ratio=0.18`은
  좋고 나쁨이 아니라 관측값이다.
- **거리 기반 후보 구성.** 동일한 clean 후보 8개 대신 색·표면·타입·복잡도 벡터가
  충분히 떨어진 후보를 보여준다. 단, 거리는 품질이 아니라 다양성이다.
- **Pareto 보존.** hierarchy, legibility, density, distinctiveness를 임의 가중합해
  하나로 죽이지 말고, 어느 축에서도 지배당하지 않는 후보를 남긴다.
- **사람의 구조화 신호.** 별점보다 A/B 또는 MaxDiff를 쓰고 `hierarchy`,
  `legibility`, `trust`, `distinctiveness`, `calm`, `too-generic`, `other` 이유 코드를
  받는다. 자유 코멘트는 보조다.
- **반례 승격.** 반복해서 `too-generic`으로 탈락한 구체 조합만 프로젝트 ban 후보가
  된다. 사람이 승인한 뒤 lint/typed profile로 내린다.
- **동점은 정직하게 노출.** 자동 근거로 가르지 못하면 seed 순서로 “winner”라고
  부르지 말고 `requires-human-selection` 상태로 남긴다.

VisAWI의 diversity와 craftsmanship은 특히 사람 선별에 남겨야 한다. 자동 metric은
element 수와 색 분포를 셀 수 있지만 “이 다양성이 맥락에 맞게 능숙하게 통합됐는가”를
판정하지 못한다.

---

## 6. Forma 적용 순서

1. **기존 finding을 재분류한다.** correctness hard gate, project-ban lint,
   measurement descriptor를 분리한다. 새 점수는 만들지 않는다.
2. **Playwright 측정기를 먼저 만든다.** computed style/geometry에서 gradient 면적,
   surface 비율, equal-card geometry, type scale을 JSON으로 기록한다. 외부 요청은 0,
   viewport·브라우저·폰트는 고정한다.
3. **현재 규칙의 오탐 corpus를 만든다.** shipped fixture 외에 dashboard/report/manual/
   advanced의 의도적 정상 예와 사람이 거부한 반례를 쌍으로 둔다.
4. **조합 규칙 두 개만 실험한다.** 우선순위는 `gradient prominence + chromatic
   blue/violet + glow`와 `computed surface saturation + equal-card geometry`다.
   현재 체크리스트의 가장 큰 누락이고 측정 가능성이 높다.
5. **카피와 claimness는 자동 탈락시키지 않는다.** 프로젝트 반례 phrase가 쌓일 때만
   warning으로 시작한다.
6. **후보 선택을 다양성+사람 비교로 바꾼다.** 자동 규칙 확대보다 이것이 clean
   100점 동률을 실제로 푸는 단계다.

## 남은 불확실성

- 모델·버전·prompt·framework별 대규모 공개 UI 생성 benchmark가 없어 기여율을
  말할 수 없다.
- 제안한 OKLCH 대역, chroma, 면적, surface 임계값은 아직 Forma corpus로 보정하지
  않았다.
- browser computed style만으로 실제 painted gradient/glow 면적을 얼마나 안정적으로
  근사할 수 있는지 실험하지 않았다.
- dashboard처럼 본래 카드와 metric이 많은 artifact에 적용할 artifact별 정상 분포가
  없다.
- 한국어 heading의 claim specificity를 낮은 오탐률로 자동 판정할 방법을 확인하지
  못했다.
- descriptor distance가 실제 사람의 “서로 다르다” 판단과 얼마나 일치하는지
  검증하지 않았다.

이 불확실성 때문에 지금 해야 할 일은 “AI detector” 도입이 아니라 **측정값과 사람의
거부/선호를 같은 후보 기록에 연결하는 것**이다. 반례는 결함 제거에 쓰고, 취향은
선별에 남겨야 한다.
