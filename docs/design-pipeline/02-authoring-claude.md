# 2단계 조사: DESIGN.md와 SOUL.md를 만드는 더 나은 방법 (claude)

입력: `00-source.md`, `00-transcript-ko.txt`, `01-feasibility-codex.md`,
`01-feasibility-claude.md`, 저장소 코드, 웹 조사.
표기: 저장소에서 직접 확인한 것은 `파일:줄`, 웹 출처는 URL, 확인하지 못한 것은
**[미확인]**.

---

## 결론

**녹음-정제 방식은 최선이 아니다. 하지만 흔히 생각하는 이유 때문이 아니다.**

영상의 방법이 부실해서가 아니라, **영상 자신의 사례에서 시각 언어는 soul.md에서
나오지 않았기 때문이다.** 자막을 그대로 읽으면 순서가 이렇다. 철학(테슬라 대
비행기 조종석)을 녹음해서 soul.md를 만들고 → 시안 N개를 뽑고 → **"그중에서 제가
이걸 골랐거든요. 이게 바우하우스 스타일이에요."** 바우하우스는 soul.md에 없었다.
선별에서 나왔다. soul.md가 실제로 결정한 시각 규칙은 하나뿐이다 — "색깔을 싹 다
빼고 제일 중요한 버튼 딱 하나만 색깔이 있는 거예요."

즉 **제품 철학에서 연역되는 시각 규칙은 극소수이고, 나머지는 선별로만 정해진다.**
이 관찰이 아래 권고 전체의 뿌리다. 산문 하나를 잘 쓰려고 노력하는 대신, 산문이
할 수 있는 일(결정 규칙 몇 개)과 선별이 해야 하는 일(나머지 전부)을 갈라놓는
것이 옳다.

### 권고 (우선순위 순)

1. **반례 문서를 먼저 만든다.** "이건 싫다"는 사람이 즉시, 정확하게, 일관되게
   말할 수 있는 유일한 종류의 취향이다. forma는 이미 이걸 하고 있다 —
   `generic-ai-patterns.md`와 `src/qa/design-lint.ts`가 반례 목록의 기계
   집행판이다. 사용자용 반례 목록은 새 발명이 아니라 이 패턴의 복제다.
   비용 최저, 신뢰도 최고, 1단계 병목(스타일시트 파라미터화)을 기다릴 필요도
   없다.
2. **SOUL.md는 짧게, 그리고 "뒤집을 수 있는 문장"만 넣는다.** 컨텍스트 파일이
   에이전트를 좋게 만든다는 것은 실증적으로 반증됐다(§1-4, arXiv:2602.11988).
   길이 상한과 문장 형식을 규칙으로 박지 않으면 SOUL.md는 비용만 늘리는
   장식이 된다.
3. **DESIGN은 산문이 아니라 DTCG 호환 JSON으로 만들고, `DESIGN.md`라는 이름을
   쓰지 않는다.** 값의 교환 형식은 이미 표준이 있다(§1-2). 재발명하지 않는다.
   이름 충돌 해소는 §4-4.
4. **인터뷰는 자유 서술이 아니라 삼원 비교(repertory grid)와 강제 선택으로
   한다.** `process-interviewer` 스킬은 껍데기(컨텍스트 스캔 → 소량씩 질문 →
   요약 확정 게이트 → 템플릿 출력)만 재사용하고 질문 뱅크와 출력 템플릿은
   교체한다. 그대로 쓰면 안 된다(§3-4).
5. **검증은 두 종류만 가능하다고 인정한다.** 기계 검증(스키마·대비비·lint·QA
   게이트)과 결정력 검증(이 문장이 실제로 후보를 탈락시킨 적이 있는가). "이
   문서가 이 사람의 취향을 맞게 담았는가"를 판정하는 방법은 없다. 유일하게
   방향을 주는 것은 홀드아웃 블라인드 1회다(§5).

### 순서 의존성

권고 1·3·4의 역추출 부분은 지금 할 수 있다. 권고 4의 강제 선택 부분과 권고 5의
홀드아웃은 **1단계 결론대로 `buildStylesheet`가 파라미터를 받기 전에는 의미가
없다.** 후보 8개가 여백과 글자 크기 8%만 다르면 강제 선택의 답이 노이즈다
(`01-feasibility-claude.md:289-327`의 측정).

---

## 0. 1단계 두 조사가 합의한 것과 갈린 것

과제 지시에 따라 재논쟁하지 않되, 어디서 갈렸는지는 2단계의 출발점이므로
정리한다.

**합의한 것**

- 저작 시점과 렌더 시점을 분리하면 제약을 지킬 수 있다. 에이전트가 최종
  HTML/CSS/셰이더를 쓰는 것은 버린다.
- paper.design 셰이더와 산출물 내 무드보드 이미지는 버린다.
- `SOUL.md`는 프로젝트당 하나. artifact당·문서당은 둘 다 버린다.
- `SOUL.md`는 렌더러가 읽는 파일이 아니라 사람과 에이전트가 읽는 입력이다.
- 사람 루프(별점·라운드)는 필요하고, 하드 게이트를 덮어써서는 안 된다.

**갈린 것**

| 쟁점 | codex | claude | 2단계의 판단 |
|---|---|---|---|
| 두 파일의 형식 | 둘 다 문서. `DESIGN.md` 이름 유지, "프로젝트당 하나"로 정리 (`01-feasibility-codex.md:123-170`) | SOUL은 산문, DESIGN은 스키마 검증되는 JSON. 이름은 `forma.mood.json`으로 개명 (`01-feasibility-claude.md:227-237`) | **claude 쪽이 옳다.** 근거를 §1-2와 §4에 보강한다. 다만 이름은 `mood`보다 DTCG 호환 토큰 파일이 낫다 |
| 1차 병목 | 사람 선호를 기록하는 루프의 부재 | 스타일시트 파라미터 구멍이 0개인 것 | 과제 지시가 후자로 확정. 다만 §3의 프로토콜 선택은 이 순서에 종속된다 |
| 자유 코멘트 | 남기되 자동 점수화하지 않는다 (`01-feasibility-codex.md:208-210`) | 1차 신호로 삼는 것에 반대. 구조화 질문으로 대체 (`01-feasibility-claude.md:379-409`) | **claude 쪽에 동의하고, §2·§3에서 왜 그런지의 근거를 취향 유도 문헌으로 보강한다** |
| 사람 루프의 UI | 정적 review 페이지가 더 단순 | 룸 모드 재사용 | 이 조사의 범위 밖 |

가장 중요한 갈림은 세 번째다. codex는 자유 코멘트를 "수집하되 조심히 쓰자"로,
claude는 "1차 신호로는 반대"로 정리했다. 2단계 조사의 결과는 **claude 쪽이 맞고,
근거가 영상 제작자의 회고 하나보다 훨씬 넓다**는 것이다(§2).

---

## 1. 선행 사례

이 문제 — 사람의 취향과 제품 철학을 기계가 쓸 수 있는 형태로 바꾸기 — 는 네
계통에서 이미 다뤄지고 있다. 각각이 무엇을 담고 무엇을 담지 않는지가 중요하다.

### 1-1. 브랜드 브리프 / 크리에이티브 브리프 (마케팅·브랜딩 계통)

**담는 것:** 브랜드의 목적과 지향, 가치, 타깃 오디언스, 톤 오브 보이스, 성격,
색·일러스트·그래픽의 방향, 예외 규칙. 크리에이티브 브리프는 여기에 캠페인 단위의
목표·산출물·일정·성공 지표를 더한다.
([ziflow](https://www.ziflow.com/blog/brand-brief),
[bynder](https://www.bynder.com/en/blog/find-creative-direction-write-great-creative-brief/))

**담지 않는 것:** 기계가 소비할 수 있는 값. 브리프는 사람 크리에이티브에게 주는
문서라서 "따뜻하지만 격식 있게" 같은 문장이 정상이다. 이 문장은 `--color-accent`
값으로 번역되지 않는다.

**forma가 가져올 것 하나:** 톤 오브 보이스 문서의 정석은 **형용사가 아니라 실제
문장 예시를 싣는 것**이다("written examples ... allowing people to see the brand's
tone in action"). forma로 옮기면 — SOUL.md에 "간결하게"라고 쓰지 말고, 같은 내용을
쓴 좋은 문장과 나쁜 문장을 나란히 싣는다. forma의 `DESIGN.md:97-101`이 이미 artifact별
writing voice를 서술로만 갖고 있는데, 예시 쌍이 없다.

### 1-2. 디자인 토큰 표준 (W3C Design Tokens Community Group)

**담는 것:** 도구 간 토큰 교환 파일 포맷. 2025년 10월 28일 첫 안정판(v2025.10)이
나왔고 Adobe·Google·Meta·Figma를 포함한 24개 이상 조직이 참여한다
([W3C DTCG 발표](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/),
[스펙 초안](https://www.designtokens.org/tr/drafts/format/)). 정의된 타입은 color,
dimension, fontFamily, fontWeight, duration, cubicBezier, number, strokeStyle,
border, transition, shadow, gradient, typography 13종. 별칭·참조(중괄호 문법)와
Display P3·Oklch 등 CSS Color Module 4 색 공간을 지원한다.

**담지 않는 것:** 스펙 문서에 명시적 "Out of scope" 절은 없지만, 자기 정의를
"도구 간 디자인 토큰을 교환하기 위한 파일 포맷의 기술 명세"로 한정한다. 설계
근거·원칙·의도를 담는 구조가 **없다.** 있는 것은 `$description`(토큰 하나에 대한
평문 설명)과 `$extensions`(벤더 메타데이터, "중요하지 않은 선택적 메타데이터"로
명시)뿐이다.

**forma가 가져올 것:** 두 가지.

1. **값 파일의 형식을 재발명하지 않는다.** 사용자의 팔레트·타입·간격을 DTCG
   호환 서브셋으로 받으면, Figma나 Style Dictionary에서 나온 토큰을 그대로
   먹일 수 있다. forma의 현재 토큰(`src/design/tokens.ts:10-35`의
   `FormaColorPalette` 24개 필드, spacing 1-9, radius sm/md/lg,
   motion 3종)은 DTCG의 color/dimension/duration 타입에 그대로 대응된다.
   **[미확인]** 실제 매핑의 손실 여부는 확인하지 않았다. `measure.wide`가
   `min(100%, 72rem)`인 것처럼 CSS 함수가 들어간 값은 DTCG dimension으로
   표현되지 않는다.
2. **표준이 "근거를 담지 않는다"고 결정했다는 사실 자체.** 값 파일에 철학을
   섞지 말라는 것이 업계 합의다. §4의 역할 분리가 forma만의 취향이 아니라는
   근거다.

### 1-3. 디자인 시스템의 원칙 문서

IBM Carbon은 clarity·efficiency·consistency·beauty 네 개
([carbondesignsystem.com](https://carbondesignsystem.com/all-about-carbon/what-is-carbon/)),
Atlassian은 세 가지 가치와 그에 딸린 원칙들을 둔다
([principles.design](https://principles.design/examples/atlassian-design-system)).

**담는 것:** 팀이 논쟁할 때 꺼내는 판정 기준.

**담지 않는 것:** 대부분의 경우 **판정력**. 이 계통에서 가장 유용한 선행 지식은
원칙의 내용이 아니라 **원칙을 검사하는 방법**이다. Jared Spool의 여섯 가지
반직관적 테스트가 그것이다
([Center Centre](https://articles.centercentre.com/creating-design-principles/)):

1. 연구에서 직접 나왔는가 (이론적 이상이 아니라 실제 사용자 불편에서)
2. 대부분의 경우 "아니오"라고 말하게 해주는가 (이전 제안의 약 2/3를 재고하게
   만들 정도로)
3. 경쟁자의 디자인과 우리를 구별하는가
4. 다음 릴리스에서 뒤집을 수도 있는가 (보편 진리가 아니라 이번 프로젝트에
   국한된 것인가)
5. 이번 프로젝트에 대해 재평가했는가
6. 그 의미가 계속 검증되고 있는가 (팀이 "지금 이 원칙이 지켜진 건가"를
   계속 이야기하는가)

4번이 이른바 **뒤집기 테스트(reversibility test)** 다. 원칙의 반대가 합리적인
사람이 믿을 만한 것이면 통과한다. "쓰기 쉽게 만든다"는 반대("쓰기 어렵게
만든다")가 아무도 안 믿으므로 탈락이다
([Matthew Ström](https://mattstromawn.com/writing/principles/)). 영상의 예를
넣어보면 — "전문가 기능을 기본 화면에 노출하지 않는다"는 반대("전문가 기능을
기본 화면에 노출한다")가 파이널컷·프리미어의 실제 선택이므로 **통과한다.**
좋은 SOUL.md 문장의 모양이 이것이다.

**forma가 가져올 것:** 이 여섯 개가 §5 검증 가능성의 뼈대다. 그리고 2번("아니오라고
말하게 해주는가")은 유일하게 **사후 측정 가능한** 항목이다 — 라운드 로그에 이
문장 때문에 탈락한 후보가 있는지를 세면 된다.

### 1-4. 에이전트용 컨텍스트 파일 (CLAUDE.md / AGENTS.md / rules)

가장 직접적인 선행 사례이자, **이 조사에서 가장 중요한 발견이 나온 곳이다.**

AGENTS.md는 2025년 8월 OpenAI 주도로 개방 명세가 됐고 2025년 12월 Linux
Foundation의 Agentic AI Foundation에 기증됐다. 2025년 12월 기준 6만 개 이상의
오픈소스 프로젝트가 채택했다
([augmentcode](https://www.augmentcode.com/guides/how-to-build-agents-md),
[asdlc.io](https://asdlc.io/practices/agents-md-spec/)). GitHub Spec Kit의
`constitution.md`는 같은 계통의 다른 변종으로, **스펙·계획·구현보다 먼저 작성되는
프로젝트의 비협상 원칙 문서**다
([Microsoft Learn](https://learn.microsoft.com/en-us/training/modules/spec-driven-development-github-spec-kit-greenfield-intro/),
[spec-kit](https://github.com/github/spec-kit/blob/main/spec-driven.md)).
제안된 SOUL.md와 위치가 정확히 같다.

**그런데 이 관행이 효과가 있다는 증거가 없다.** ETH Zurich SRI Lab의 Gloaguen,
Mündler, Müller, Raychev, Vechev, "Evaluating AGENTS.md: Are Repository-Level
Context Files Helpful for Coding Agents?" (arXiv:2602.11988, 2026-02-12 제출,
2026-06-23 개정, [초록](https://arxiv.org/abs/2602.11988)). 초록의 문장:

> "providing context files does not generally improve task success rates, while
> increasing inference cost by over 20% on average."

이 결과는 여러 LLM과 여러 코딩 에이전트에서 동일했고, LLM이 생성한 컨텍스트
파일과 개발자가 커밋한 컨텍스트 파일 **양쪽 모두**에서 성립했다. 에이전트가
지시를 무시한 것은 아니었다 — 지시는 따랐는데, 모델 제공사들이 흔히 권장하는
"저장소 개요(repository overview)"가 도움이 되지 않았다. 저자들의 결론은
컨텍스트 파일을 배포 전에 엄밀히 평가하라는 것이다.

세부 수치는 2차 출처에서만 봤으므로 구분해 적는다 **[2차 출처]**:
LLM 생성 파일은 성공률을 약 3% 낮췄고, 사람이 쓴 파일은 약 4% 높였다
([asdlc.io](https://asdlc.io/practices/agents-md-spec/),
[upsun](https://developer.upsun.com/posts/ai/agents-md-less-is-more)).
같은 페이지가 인용하는 해석: "불필요한 요구사항은 에이전트 성능을 실제로
해친다. 에이전트가 무시해서가 아니라 충실히 따르기 때문이다 — 탐색 범위를
넓히고 추론 비용을 올리면서 결과는 개선하지 않는다."

**forma에 대한 함의 (세 가지, 전부 실행 가능하다):**

1. **SOUL.md의 기본값은 "없음"이어야 하고, 있다면 짧아야 한다.** 사람이 쓴
   최소한의 파일만 +4%였다. 그것도 크지 않다. "철학을 문서로 만들면 에이전트가
   알아서 잘한다"는 전제는 실증적으로 기각됐다.
2. **개요·요약·배경 서술을 넣지 마라.** 정확히 그 부분이 도움이 안 된 것으로
   측정됐다. SOUL.md에 "우리 제품은 영상 편집 자동화 도구이고…"를 쓰는 것은
   비용만 늘린다. 남길 것은 **결정 규칙**뿐이다.
3. **LLM이 생성한 SOUL.md는 사람이 쓴 것보다 나쁘다.** 녹취를 LLM이 정리해
   SOUL.md를 만드는 것은 정의상 LLM 생성 파일이다. 사람의 승인 게이트가
   장식이 아니라 이 결과에 대한 유일한 방어다.

asdlc.io가 정리한 AGENTS.md 권장 절 구성도 참고할 만하다: Mission(2-4문장),
Toolchain Registry, **Judgment Boundaries(NEVER/ASK/ALWAYS 형태의 행동 규칙)**,
Available Personas, Context Map(선택). 넣지 말 것으로는 린터가 이미 강제하는
스타일 규칙, README와 중복되는 내용, 비판 없이 넣은 LLM 생성 인벤토리, 그리고
**부정문 위주 지시**("do not use X"는 컨텍스트 앵커링을 유발한다)를 든다.
마지막 항목은 §3-1의 반례 수집과 긴장 관계에 있다 — 반례는 수집하되 SOUL.md
본문에 부정문 목록으로 붓지 말고 lint 규칙으로 내려야 한다는 뜻으로 읽는 것이
맞다. **[해석]**

---

## 2. 녹음-정제 방식의 약점

### 2-1. 근본 문제: 말한 선호와 실제 선호는 다르다

이건 취향 연구의 기본 구분이다. **표명 선호(stated preference)** 는 가상의
상황에서 물어 얻고, **현시 선호(revealed preference)** 는 실제로 한 선택에서
얻는다. 표명 선호는 근본적으로 신뢰하기 어렵다는 것이 이 분야의 출발 명제다 —
사람은 자기가 뭘 원하는지 모르는 경우가 많고, 말할 때는 사회적 지위·지적으로
보이고 싶은 욕구·이상적 자아상 같은 다른 힘의 영향을 받는다. 현시 선호가 실제
행동의 더 나은 예측자다
([full stack researcher](https://fullstackresearcher.substack.com/p/the-most-misunderstood-research-method),
[Columbia Mailman](https://www.publichealth.columbia.edu/research/population-health-methods/discrete-choice-model-and-analysis)).

**녹음은 정의상 표명 선호다.** 그것도 최악의 조건에서다 — 마이크가 켜져 있고,
상대가 듣고 있고, 자기가 어떤 사람으로 보이고 싶은지가 답에 섞인다. 디자인
철학 토론을 녹음하면 그 자리에서 멋있게 들리는 말이 남는다.

### 2-2. 영상 사례가 보여주는 구체적 실패 지점 세 가지

**(a) 시각 언어가 철학에서 안 나온다.**
§결론에서 이미 적었다. 영상 제작자의 soul.md는 제품 철학(초보자용 최소 UI ↔
전문가용 조종석 모드)을 담았고, 거기서 연역된 시각 규칙은 "색을 다 빼고 버튼
하나만 강조" 하나였다. 최종 시각 언어인 바우하우스는 **시안을 보고 고른
결과**다. 녹음-정제 방식이 시각 언어를 만들어 준다는 기대 자체가 이 사례에서
지지되지 않는다.

**(b) 왜 좋은지를 말로 못 쓴다.**
제작자 본인의 회고(자막): "결국에는 고르고 왜 그게 괜찮았고 왜 그게 안
괜찮았는지를 말로 써줘야 되는데 그걸 제가 못 써요. 디자이너가 아니니까."
이것은 태도의 문제가 아니라 **어휘의 부재**다. 취향은 있는데 그 취향을 부를
이름이 없다. 자유 서술 입력창은 어휘가 있는 사람에게만 작동한다.

**(c) 라운드가 개선이 아니라 제거만 한다.**
같은 자막: "정확히는 더 좋아진다기보다는. 후진 게 없어집니다." 자유 서술
신호는 열등한 것을 쳐내는 데는 충분하고 우월한 것을 만드는 데는 부족했다.
(b)와 붙여 읽으면 원인이 분명하다 — 사람이 낼 수 있었던 신호가 "이건 아니다"
쪽뿐이었다는 것이다. **이 관찰이 권고 1의 근거다.** 사람이 실제로 낼 수 있는
신호가 반례라면, 반례를 1급 산출물로 다루는 게 맞다.

### 2-3. 참여자가 한 명일 때

영상은 "혼자면 혼자 계속 녹음하는 거고, 아니면 두세 명이서 디자인 철학에 대해서
디베이트를 시키면서"라고 두 경우를 같이 취급한다. 같지 않다.

토론 녹음이 가치를 만드는 메커니즘은 **반대 의견이 근거를 강제하는 것**이다.
혼자 녹음하면 이 메커니즘이 없다. 반박이 없으므로 첫 직관이 그대로 결론이 되고,
녹취록은 그 직관을 정당화하는 문장으로 채워진다. 결과물은 "숙고된 철학"처럼
생겼지만 실제로는 **최초 직관의 장식판**이다. 그리고 그것을 SOUL.md로 만들면
이후 모든 라운드가 그 직관을 상수로 취급한다.

forma 사용자의 기본 상황이 1인이다. 혼자서도 반대를 만들어내는 프로토콜이
필요하다는 뜻이고, §3의 세 프로토콜은 전부 이 요건을 만족한다(삼원 비교는
"셋 중 둘이 닮았다"가 강제 대조를 만들고, 강제 선택은 정의상 대안을 제시하고,
역추출은 초안이 반박 대상이 된다).

### 2-4. 취향이 아직 형성되지 않았을 때

이게 가장 흔한 경우인데 영상도 1단계 조사도 다루지 않았다. 사용자가 디자인
취향을 아직 안 갖고 있으면, 녹음은 **없는 것을 만들어낸다.** 질문을 받으면
사람은 답을 하고, 그 답은 즉석에서 구성된 것이지 원래 있던 선호가 아니다.
그런데 SOUL.md로 문서화되는 순간 그것은 "확정된 철학"의 지위를 얻고, 이후
라운드가 전부 그 위에서 돈다.

이 경우의 올바른 처리는 **문서를 만들지 않는 것**이다. 취향이 없으면 반례부터
모으고(권고 1), 선별 라운드를 몇 번 돌린 뒤 **거기서 나온 선택을 사후에 문서로
정리한다.** 순서가 거꾸로다: 철학 → 선별이 아니라 선별 → 철학. §1-4의 Spool
1번 테스트("연구에서 직접 나왔는가")가 요구하는 것도 정확히 이 순서다.

forma에 적용하면: `.forma/SOUL.md`가 없어도 파이프라인이 정상 동작해야 하고,
없는 상태가 결함으로 취급되면 안 된다. §1-4의 실증 결과("컨텍스트 파일이 일반적으로
성공률을 올리지 않는다")를 고려하면 이건 편의가 아니라 기본값이다.

---

## 3. 대안 프로토콜

세 개를 제안한다. 서로 배타적이지 않고, 아래 순서대로 쌓는 것이 권장 조합이다.

### 3-1. 프로토콜 A — 반례 우선 수집 (negative space)

**하는 일.** 좋은 것을 묻지 않는다. 싫은 것만 모은다. 입력은 두 종류다.

1. 사용자가 자기 분야에서 흔히 보는 것 중 싫은 것을 자유롭게 지목 ("보라색
   그라데이션", "카드가 다 똑같은 크기로 깔린 대시보드", "제목이 다 '개요'").
2. 에이전트가 후보 문서를 렌더해 보여주고, 사용자는 **탈락 이유만** 남긴다.
   좋은 점은 묻지 않는다.

**왜 신뢰할 만한가.** §2-2(c)에서 확인한 대로 사람이 실제로 낼 수 있는 신호가
이쪽이다. 그리고 반례는 표명 선호의 함정에 덜 걸린다 — "나는 미니멀을
좋아한다"는 자아상이 섞이지만 "저 보라색은 싫다"는 즉각 반응에 가깝다.

**forma에 이미 있는 것.** 이게 새 발명이 아니라는 게 핵심이다.
`skills-src/_shared/references/generic-ai-patterns.md`가 금지 패턴 목록이고,
`src/qa/design-lint.ts`가 그중 기계로 잡을 수 있는 것을 규칙으로 갖고 있다
(`gradient-overuse`, `bracket-border`, `decorative-glyph-content` 등).
루트 `DESIGN.md:68-86`도 "What's explicitly banned" 절을 갖는다. 즉 **forma의
디자인 언어는 이미 반례 목록으로 정의되어 있다.** 사용자용 반례 목록은 같은
구조의 프로젝트 스코프 복제다.

**출력 형태.** 산문이 아니라 규칙 목록. 기계로 검사 가능한 것은 lint 규칙으로,
불가능한 것은 사람이 읽는 체크리스트로 분리한다. §1-4의 "부정문을 SOUL.md
본문에 붓지 말라"는 권고와 충돌하지 않는 이유가 이것이다 — 반례는 SOUL.md에
안 들어가고 별도 파일 또는 lint로 간다.

**입력 비용:** 최저. 첫 목록은 15분. 라운드마다 증분.
**산출물 신뢰도:** 최고. 사용자가 실제로 낸 반응이고, 상당 부분이 자동
검사 가능하다.
**선행 조건:** 없음. 지금 할 수 있다.

### 3-2. 프로토콜 B — 삼원 비교 (repertory grid triad elicitation)

**하는 일.** 참조물 3개를 보여주고 묻는다. **"이 셋 중 둘은 서로 닮았고 하나는
다릅니다. 어느 둘이고, 무엇이 다릅니까?"** 답에서 나온 대조축("빽빽하다 ↔
성기다", "차갑다 ↔ 따뜻하다")을 기록하고, 참조물 조합을 바꿔 반복한다. 5~8회
돌리면 이 사람이 실제로 쓰는 축 목록이 나온다.

**출처와 근거.** George Kelly의 개인 구성개념 이론(1955)에서 나온 repertory
grid technique이고, 삼원 유도(triad elicitation)가 그 표준 절차다. 디자인·기술
제품 평가에 적용된 선행 연구가 있고, 이 기법의 장점으로 꼽히는 것이 **연구자
편향의 최소화** 다 — 구성개념을 연구자가 제시하지 않고 참여자에게서 직접
끌어내기 때문이다
([EduTech Wiki](https://edutechwiki.unige.ch/en/Repertory_grid_technique),
[Loughborough / Kelly's repertory grid in design and technology](https://repository.lboro.ac.uk/articles/conference_contribution/Kelly_s_repertory_grid_a_technique_for_developing_evaluation_in_design_and_technology/9341825),
[IJDesign](http://www.ijdesign.org/index.php/IJDesign/article/view/358/274)).

**이게 §2-2(b)를 정면으로 푼다.** "왜 좋은지를 말로 못 쓴다"의 원인은 어휘
부재였다. 삼원 비교는 **어휘를 요구하지 않고 어휘를 생산한다.** 사용자는 전문
용어를 모르는 상태로 "이 둘은 답답하고 저건 숨통이 트인다"라고 말하면 되고,
그 문장 자체가 축의 이름이 된다. 디자이너의 어휘를 빌려 쓰지 않으므로
사용자 자신의 구성개념이 남는다.

**forma에 붙는 지점.** 나온 축을 `src/qa/candidates.ts:114-122`의 breakdown
차원(informationHierarchy, typography, spacingRhythm, contentDensity,
visualConsistency, responsiveQuality, distinctiveness)에 매핑하거나, 매핑되지
않으면 그 자체가 축이 부족하다는 신호다. `01-feasibility-claude.md:396-406`이
제안한 "forma의 어휘로 묻기"와 방향이 같은데 차이가 하나 있다 — 그쪽은 forma의
축 이름을 사용자에게 주는 것이고, 삼원 비교는 사용자의 축 이름을 받아온 뒤
forma 축에 맞춰보는 것이다. **후자가 낫다.** forma의 7개 축이 이 사용자의 취향
공간을 덮는다는 보장이 없고, 못 덮는 부분이 바로 그 사용자를 다른 사용자와
구별하는 부분이기 때문이다.

**입력 비용:** 중간. 참조물 준비 + 세션 30~45분.
**산출물 신뢰도:** 중상. 여전히 표명 선호지만, 절대 판단이 아니라 상대 비교라서
자아상 개입이 적고 재현성이 높다.
**선행 조건:** 참조물 세트. 무드보드 이미지든, forma가 렌더한 기존 예시든,
사용자의 기존 문서든 상관없다. **스타일시트 파라미터화 이전에도 가능하다.**

### 3-3. 프로토콜 C — 기존 산출물에서 역추출

**하는 일.** 사용자에게 묻는 대신 사용자가 이미 만든 것을 읽는다. 저장소의
README·기존 문서·기존 CSS·발표 자료·사내 위키. 에이전트가 거기서 반복되는 선택을
뽑아 SOUL/DESIGN 초안을 만들고, **사용자는 쓰는 게 아니라 고친다.**

**왜 유용한가.** 이건 표명 선호가 아니라 **현시 선호**다(§2-1). 사용자가 실제로
한 선택의 기록이므로, 말과 실제가 다를 때 실제 쪽을 잡는다. 그리고 백지에서
쓰는 것보다 초안을 고치는 게 압도적으로 쉽다 — §2-3의 1인 문제도 부분적으로
푼다. 초안이 반박 상대 역할을 한다.

**결정적 약점 하나.** 역추출은 **사고와 의도를 구별하지 못한다.** 기존 문서가
전부 회색인 이유가 "절제가 우리 가치라서"일 수도 있고 "테마를 안 골랐어서"일
수도 있다. 역추출은 후자를 전자로 승격시킨다. 그래서 역추출 초안은 반드시
**"이 선택은 의도였습니까, 아니면 기본값이었습니까?"** 를 항목마다 물어야 하고,
"기본값"이라고 답한 항목은 문서에서 빼야 한다. 이 질문 없이 쓰면 우연을
철학으로 굳히는 기계가 된다.

**입력 비용:** 최저(사용자 시간 기준). 검토 시간만 든다.
**산출물 신뢰도:** 중. 위 약점을 처리하면 중상, 안 하면 하.
**선행 조건:** 사용자에게 기존 산출물이 있어야 한다. 신규 프로젝트에는 못 쓴다.
그리고 §1-4에 따라 **에이전트가 만든 초안은 LLM 생성 컨텍스트 파일**이므로,
사람의 항목별 승인을 통과한 것만 남긴다.

### 3-4. 강제 선택 (A/B, MaxDiff) — 프로토콜이 아니라 이후 단계

과제가 대안 프로토콜의 하나로 언급했으므로 위치를 명확히 해둔다.

MaxDiff는 여러 항목 중 최고와 최악을 고르게 해서 상대 선호를 뽑는 기법으로,
쌍대 비교법의 변형이다
([Wikipedia](https://en.wikipedia.org/wiki/MaxDiff),
[quantilope](https://www.quantilope.com/resources/maxdiff-explained-how-the-advanced-method-works-non-research-examples)).
"최고와 최악을 동시에" 묻는 것이 별점보다 정보량이 많고 척도 사용 습관(누구는
다 4점, 누구는 다 2점)의 영향을 안 받는다.

**하지만 이건 문서를 만드는 프로토콜이 아니라 문서를 만든 뒤 후보를 고르는
방법이다.** 그리고 1단계가 확정한 병목에 직접 걸린다 — 후보 8개의 CSS가 6줄
빼고 동일하면(`01-feasibility-claude.md:293-307`) 최고/최악을 물어도 답이
노이즈다. **스타일시트 파라미터화 이후에만 켠다.** 켤 때는 별점보다 MaxDiff
쪽이 낫다는 것이 이 조사의 권고다(1단계 두 조사는 별점을 전제하고 있었다).

### 3-5. 비교표

| | A. 반례 수집 | B. 삼원 비교 | C. 역추출 | (D. 강제선택) |
|---|---|---|---|---|
| 선호의 종류 | 즉각 반응 | 상대 표명 선호 | 현시 선호 | 현시 선호 |
| 사용자 시간 | 15분 + 증분 | 30~45분 | 검토만 | 라운드마다 |
| 어휘 요구 | 없음 | 없음 (생산한다) | 없음 | 없음 |
| 1인 환경 | 가능 | 가능 | 가능 | 가능 |
| 취향 미형성 | **가능** | 가능 | 불가 (기존물 필요) | 가능 |
| 산출물 신뢰도 | 최고 | 중상 | 중 (의도 질문 필수) | 상 |
| 기계 검증 가능성 | 높음 (lint화) | 낮음 | 중 | 높음 (로그) |
| 스타일시트 파라미터화 선행 필요 | 아니오 | 아니오 | 아니오 | **예** |
| 주된 실패 모드 | 반례만으로는 방향이 안 생김 | 축은 나오는데 값이 안 나옴 | 우연을 철학으로 굳힘 | 축이 없으면 노이즈 |

**권장 조합:** A로 시작 → C로 초안 → B로 축을 교정 → (파라미터화 후) D로
값을 확정. A와 C는 문서를 만들고, B는 어휘를 만들고, D는 값을 만든다.
녹음은 이 넷 어디에도 필요하지 않다. 사용자가 이미 녹취록을 갖고 있으면 C의
입력으로 쓰면 된다 — 다만 녹취록은 표명 선호이므로 다른 현시 선호 증거와
충돌할 때는 진다.

### 3-6. `process-interviewer` 스킬을 쓸 수 있는가

읽어봤다(`~/.claude/skills/process-interviewer/SKILL.md`). 판정은 **껍데기는
쓸 만하고 내용물은 못 쓴다.**

**재사용할 것 (그대로 좋다):**

- 1단계 컨텍스트 스캔 — 질문 전에 기존 파일부터 읽고 중복 질문을 피한다.
  프로토콜 C(역추출)와 정확히 같은 발상이다.
- 질문 리듬 — 심층 인터뷰는 한 번에 2개 이내. 삼원 비교도 한 번에 하나씩
  돌려야 한다.
- 4단계 요약 확정 게이트 — "명시적 확인 전까지 파일을 만들지 않는다". §1-4의
  실증 결과를 고려하면 이 게이트는 편의가 아니라 필수다.
- 중간 탈출 허용.

**교체해야 할 것:**

- **질문 뱅크 전체.** 현재 카테고리는 입력/출력, 프로세스 단계, 의사결정 지점,
  엣지 케이스, 성공 기준, 트리거 조건이다. 전부 **절차**를 캐는 질문이고
  **취향**을 캐는 질문이 하나도 없다. 그리고 전부 자유 서술을 요구한다 —
  §2-2(b)에서 확인한 바로 그 실패 모드다.
- **출력 템플릿.** 산출물이 "skill PRD + Anthropic skill 모범사례 체크리스트"다.
  SOUL.md도 DESIGN 토큰도 아니다.
- **질문 개수 10~15개.** 삼원 비교는 회차당 1문항이고 5~8회면 충분하다.
  강제 선택은 그보다 많이 필요하다. 고정 개수가 맞지 않는다.

**결론:** 별도 스킬(가칭 `forma-taste`)로 만들되 `process-interviewer`의
워크플로 골격과 확정 게이트를 그대로 베낀다. 기존 스킬을 수정하는 것은 아니다
— 용도가 다르고, 전역 스킬이라 다른 프로젝트에 영향이 간다.
**[미확인]** 이 스킬이 forma 저장소의 스킬 동기화 대상(`~/.agents/skill-targets.json`)
과 어떻게 어울리는지는 확인하지 않았다.

---

## 4. 두 파일의 역할 분리

### 4-1. 1단계 결론(DESIGN=시각 언어, SOUL=제품 철학)은 맞는가

**방향은 맞다. 다만 축이 하나 틀렸다.**

두 파일을 가르는 기준을 "시각 언어 대 제품 철학"이라는 **주제**로 잡으면
경계가 계속 무너진다. §4-3에서 볼 세 가지 회색지대가 전부 이 축에서 생긴다.
더 나은 기준은 **소비자**다.

| | SOUL | DESIGN |
|---|---|---|
| 누가 소비하는가 | 사람과 에이전트가 **읽는다** | 렌더러가 **실행한다** |
| 형식 | 문장 | 값 |
| 검증 방법 | 뒤집기 테스트 (사람 판정) | 스키마 + 대비비 + lint (기계 판정) |
| 틀렸을 때 증상 | 후보를 못 고른다 | 렌더가 깨지거나 QA 게이트에 걸린다 |
| 변경 빈도 | 거의 안 바뀜 | 라운드마다 |

`01-feasibility-claude.md:227-237`이 이미 이 표에 가까운 것을 제시했고, 이
조사는 §1-2로 그 근거를 보강한다 — DTCG 표준이 값 파일에서 근거·원칙·의도를
**의도적으로 배제했다.** 값과 철학을 섞지 않는 것은 forma의 취향이 아니라
업계 합의다.

소비자 기준으로 가르면 판정 규칙이 하나로 정리된다. **렌더러가 그 항목을 읽고
행동을 바꿀 수 있으면 DESIGN, 없으면 SOUL.** "따뜻한 느낌"은 렌더러가 못 읽으니
SOUL이고, `--color-accent: #C2410C`는 읽으니 DESIGN이다.

### 4-2. 그래도 남는 문제: 근거는 어디에 쓰는가

`--color-accent`를 왜 그 값으로 골랐는지는 어디에 적나. SOUL에 적으면 값과
근거가 떨어져서 값만 바뀌고 근거는 안 바뀌는 drift가 생긴다. DESIGN이 JSON이면
산문을 넣을 자리가 없다.

**DTCG가 이미 답을 갖고 있다.** `$description` — 토큰 하나에 붙는 평문 설명.
근거는 값 바로 옆, 한 줄. 문단은 안 된다.

```jsonc
{
  "color": {
    "accent": {
      "$type": "color",
      "$value": "#C2410C",
      "$description": "유일한 강조색. 화면당 하나의 액션에만 쓴다."
    }
  }
}
```

한 줄 제약이 실제로 규율로 작동한다. 한 줄에 안 들어가면 그건 토큰의 근거가
아니라 원칙이고, SOUL로 가야 한다.

### 4-3. 경계가 실제로 모호해지는 지점 세 곳

**(a) 글의 어조.** forma에서 이건 이미 정해진 문제다. artifact별 writing
voice가 루트 `DESIGN.md:97-101`에 있다 — Signal Grid는 간결하고 운영적,
Editorial Brief는 완결된 주장. 그런데 이건 렌더러가 못 읽는다. 에이전트가
읽는다. **소비자 기준으로 보면 SOUL 쪽이다.** 현재 위치가 틀린 것이고,
사용자 프로젝트에서 같은 실수를 반복하면 안 된다.
→ 규칙: 어조는 SOUL. 다만 forma 자신의 `DESIGN.md`는 forma 컨트리뷰터용
문서이므로(§4-4) 지금 자리에 있어도 사용자 파일 구조와 충돌하지 않는다.

**(b) 금지 목록.** "보라색 그라데이션 금지"는 시각이니 DESIGN인가, 가치
판단이니 SOUL인가. 소비자 기준으로 답이 나온다 — **lint가 검사할 수 있으면
DESIGN 쪽(정확히는 lint 규칙), 사람만 판정할 수 있으면 SOUL.** forma가 이미
이렇게 갈라놨다: 기계 검사 가능한 것은 `src/qa/design-lint.ts`, 나머지 서술은
`generic-ai-patterns.md`. 사용자 반례 목록도 같은 두 갈래로 내려야 한다(§3-1).

**(c) 밀도·여백 같은 조합 축.** "빽빽하게"는 취향인가 값인가. forma에서는 값이다
— `density`가 `src/renderer/composition.ts:5-10`의 축으로 이미 존재한다. 다만
**"왜 빽빽한가"** 는 SOUL이다("독자가 5초 안에 상태를 파악해야 한다").
이 쌍이 §4-2의 `$description` 한 줄 제약이 통하지 않는 유일한 사례다. 축의
근거는 토큰이 아니라 원칙이므로 SOUL로 간다.

### 4-4. 이름 충돌: forma 루트 `DESIGN.md`와 사용자의 DESIGN

**먼저 사실 확인.** grep으로 확인했다:

- `DESIGN.md`를 참조하는 곳은 `CLAUDE.md:3`, `AGENTS.md:3`, `README.md:216`
  세 곳뿐이다. `src/`, `skills/`, `skills-src/` 어디에도 없다.
- `SOUL`, `.forma/`, `forma.config`, `formarc` — `src/`, `skills/`,
  `skills-src/`, `CLAUDE.md`, `AGENTS.md` 전체에서 **0건**. codex와 claude가
  각각 보고한 "프로젝트 설정 개념이 없다"를 독립적으로 재확인한다.

**따라서 루트 `DESIGN.md`의 정체는 "디자인 시스템 문서"가 아니라 §1-4가 말하는
에이전트 컨텍스트 파일이다.** forma에 기여하는 사람과 에이전트가 읽는
문서고, 코드는 아무도 안 읽는다. `CLAUDE.md`/`AGENTS.md`가 가리키는 대상이라는
사실이 그 성격을 확정한다.

**그리고 충돌의 범위는 생각보다 좁다.** 사용자는 forma 저장소에서 작업하지
않는다. `pnpm forma install-skills`로 스킬을 **자기 저장소**의
`.claude/skills/forma/`에 설치하고 거기서 문서를 만든다. 사용자의 DESIGN은
사용자 저장소에 놓인다. **실제로 두 파일이 같은 디렉터리에서 만나는 경우는
forma가 forma 자신에게 forma를 쓸 때(도그푸딩)뿐이다.**

그래도 이름은 피해야 한다. 이유는 파일 시스템 충돌이 아니라 **개념 충돌**이다.
스킬 문서와 이 조사 문서들이 "DESIGN.md"라고 쓸 때 어느 쪽인지 매번 밝혀야
한다면 그 이름은 이미 실패했다.

**제안 (권고 3의 구체안):**

```
<사용자 저장소>/
  .forma/
    SOUL.md              # 문장. 사람과 에이전트가 읽는다. 짧다.
    design.tokens.json   # 값. 렌더러가 읽는다. DTCG 호환 서브셋.
    dislikes.md          # 반례 목록 중 lint화 안 된 것 (§3-1)
```

근거:

- `.forma/`로 격리 — 프로젝트 설정 개념이 순수 신규이므로
  (`01-feasibility-claude.md:259-264`와 같은 결론), 루트를 어지럽히지 않고
  사용자 저장소의 기존 `DESIGN.md`(있을 수 있다)와도 안 부딪친다.
- `design.tokens.json` — `mood.json`보다 낫다고 보는 이유는 §1-2다. DTCG
  호환을 이름으로 선언해두면 외부 토큰 도구에서 온 파일을 그대로 받을 수 있고,
  `.tokens.json` 확장자는 그 생태계의 관용이다. **[미확인]** DTCG 생태계에서
  `.tokens.json`이 얼마나 확립된 관용인지는 스펙 문서에서 확인하지 않았다.
- 세 파일 다 **없어도 동작해야 한다.** §2-4와 §1-4의 결론이다.

**forma 루트 `DESIGN.md`는 그대로 둔다.** 이름을 바꾸면 `CLAUDE.md`,
`AGENTS.md`, `README.md` 세 곳을 고쳐야 하고 얻는 게 없다. 대신 그 파일
서두에 "이것은 Forma 자체의 시각 언어이며, forma로 문서를 만드는 사용자의
설정은 `.forma/`에 있다"는 한 줄을 넣는 것으로 충분하다.

### 4-5. 자기완결성 문제 (1단계가 미확인으로 남긴 것)

`01-feasibility-claude.md:276-281`이 남긴 질문 — 프로젝트 파일이 렌더에
개입하면 spec의 자기완결성이 깨진다. 같은 spec을 다른 저장소에서 렌더하면
다르게 나온다.

**이 조사의 판단: 렌더 시점에 spec으로 스탬프하는 쪽이 맞다.** 근거는 forma가
이미 그 패턴을 쓰고 있다는 것이다. 폰트가 CDN 참조가 아니라 로컬 서브셋 후
data URI로 산출물에 박히듯이(`src/design/fonts.ts`), 토큰도 `forma render`
시점에 spec 또는 산출물에 인라인되어야 한다. 그래야 산출물 하나가 자기 자신을
설명한다는 forma의 성질이 유지된다. `01-feasibility-claude.md`가 "이쪽이 더
forma답다고 생각하지만 확인은 못 했다"고 적은 것에 근거를 하나 보탠다.
**[미확인]** 구현 비용과 spec 스키마 변경 범위는 확인하지 않았다.

---

## 5. 검증 가능성

### 5-1. 결론부터

**"이 문서가 이 사람의 취향과 철학을 맞게 담았는가"를 판정하는 방법은 없다.**
정답이 문서 바깥에 없기 때문이다 — 대조할 원본은 사람 머릿속에 있고, 그
사람에게 물으면 표명 선호가 돌아온다(§2-1). 이건 영상이 짚은 것과 같은 벽이다:
"RLVR로는 안 된다."

검증할 수 있는 것은 세 가지다. 각각 무엇을 잡고 무엇을 놓치는지 적는다.

### 5-2. 검사 1 — 기계 검증 (DESIGN 값에만 적용)

**잡는 것.** 스키마 위반, WCAG 대비비 미달, 기존 design-lint 규칙 위반,
렌더 후 하드 게이트(외부 요청, overflow, clipped text, axe 오류 —
`src/qa/candidates.ts:124-141`). 전부 자동이고 전부 확실하다.

**놓치는 것.** 값이 **일관되고 안전한지**만 본다. **적절한지**는 전혀 못 본다.
대비비를 통과하는 추한 팔레트는 무수히 많다. 이 검사는 문서가 잘 만들어졌는지가
아니라 문서가 망가지지 않았는지를 본다.

**SOUL에는 적용 불가.** 문장의 품질을 기계가 채점할 방법이 없다. LLM으로
채점하는 것은 §1-4의 결과("LLM 생성 컨텍스트는 사람 것보다 나빴다")를 고려하면
근거 없는 신뢰다.

### 5-3. 검사 2 — 뒤집기 테스트 (SOUL 문장에 적용)

§1-3의 Spool 여섯 테스트, 그중 4번. **각 문장의 반대를 만들어서 "합리적인 팀이
이 반대를 채택할 수 있는가"를 묻는다.** 못 하면 그 문장은 진부한 말이고 지운다.

이건 **부분적으로 자동화할 수 있다.** 반대 문장을 만드는 것은 기계가 하고,
"이게 말이 되는가"의 판정은 사람이 한다. 사람에게 가는 질문이 "이 원칙 좋아요?"가
아니라 "이 반대도 말이 됩니까?"라는 점이 중요하다 — 후자는 답할 수 있고
전자는 못 답한다(§2-2b와 같은 구조).

**잡는 것.** 진부한 문장. SOUL.md가 커지는 주된 경로가 이거다 — "사용자를
존중한다", "명확하게 소통한다". 전부 반대가 성립 안 하므로 전부 탈락한다.
§1-4의 실증 결과를 고려하면 이 필터가 곧 비용 절감이다.

**놓치는 것.** 뒤집을 수 있으면서 **틀린** 문장. "모든 화면에 강조색을 세 개
쓴다"는 반대가 성립하니 테스트를 통과하는데, 나쁜 원칙이다. 뒤집기 테스트는
문장이 결정을 내릴 수 있는 모양인지만 보고, 그 결정이 옳은지는 안 본다.

**나머지 다섯 테스트.** 1(연구에서 나왔는가), 3(경쟁자와 구별되는가),
5(이번 프로젝트에 재평가했는가), 6(의미가 계속 검증되는가)은 사람 판정이고
자동화 여지가 없다. **2번(대부분의 경우 아니오라고 말하게 해주는가)만
사후 측정이 가능하고**, 그게 검사 3이다.

### 5-4. 검사 3 — 결정력 측정 (사후, 라운드 로그에서)

**하는 일.** 각 SOUL 문장에 대해, 그 문장 때문에 탈락한 후보의 수를 센다.
라운드 로그에 "탈락 사유: SOUL #3"을 기록하면 자동으로 나온다.

**판정.** 라운드를 여러 번 돌았는데 한 번도 아무것도 탈락시키지 못한 문장은
장식이다. 지운다. Spool 2번이 요구하는 강도("이전 제안의 약 2/3를 재고하게
만들 정도")까지는 아니어도, 0은 명확한 실패 신호다.

**잡는 것.** 있으나 마나 한 문장. §1-4의 실증 결과가 예측하는 바로 그 비용
발생원이다. 그리고 이건 **유일하게 실제 사용에서 측정되는 검사**다.

**놓치는 것.** 세 가지. (a) 신설 문장은 이력이 없어서 판정 불가 — 시간이
걸린다. (b) 너무 강한 문장(전부 탈락시키는)도 0과 마찬가지로 나쁜데 이
지표로는 반대편 극단으로 보인다. 상한도 같이 봐야 한다. (c) 사람이 탈락
사유를 성실히 기록한다는 전제에 기댄다.

**전제 조건.** 라운드 로그에 후보별 탈락 사유가 SOUL 항목 단위로 남아야 한다.
현재 `src/qa/candidates.ts`에는 그런 필드가 없다. 새로 만들어야 한다.

### 5-5. 유일하게 방향을 주는 것 — 홀드아웃 블라인드 1회

위 셋 중 어느 것도 "문서가 실제로 도움이 되는가"를 답하지 못한다. 그걸 묻는
방법은 하나뿐이다.

**절차.** 같은 원본 자료로 후보를 두 벌 만든다. 한 벌은 SOUL/DESIGN을 준
상태에서, 다른 한 벌은 안 준 상태에서. 라벨을 가리고 사용자에게 보여준다.
사용자가 문서를 준 쪽을 유의하게 더 고르면 문서가 일하고 있는 것이다.

**왜 이게 필요한가.** §1-4의 연구가 정확히 이 실험을 코딩 태스크에 대해 했고,
답이 "일반적으로는 도움이 안 된다"였다. 디자인 문서라고 다를 것이라는 근거가
없다. **홀드아웃 없이 SOUL.md의 효용을 가정하면 안 된다.**

**한계, 정직하게.** n=1이다. 통계적 유의성은 안 나온다. 사용자가 한 번에 8~16개를
보고 판단하는 것이므로 순서 효과와 피로가 섞인다. 그리고 이 검사는 문서 전체의
효과만 보고 어느 문장이 기여했는지는 못 가른다(그건 검사 3의 일이다). 그래도
**방향은 준다** — 문서를 준 쪽이 진다면 그건 명확한 신호이고, 그 신호를 받을
수 있는 다른 장치가 없다.

**선행 조건:** 스타일시트 파라미터화. 후보들이 CSS 6줄만 다르면 이 실험은
아무것도 측정하지 못한다.

### 5-6. 검사할 수 없다고 인정해야 하는 것

- 문서가 사용자의 실제 취향을 담았는지 (대조할 원본이 없다)
- 문서가 좋은 디자인으로 이어지는지 (좋은 디자인의 정의가 없다 — 영상의
  결론과 같다)
- 어떤 문장이 빠졌는지 (반례가 관측되지 않는다. 없는 원칙은 후보를 탈락시키지
  않으므로 로그에 흔적을 안 남긴다)

세 번째가 특히 나쁘다. 검사 3은 있는 문장이 쓸모없음을 잡지만, **필요한 문장이
없다는 것은 어떤 검사도 못 잡는다.** 그래서 §3-1(반례 수집)이 라운드마다 계속
돌아야 한다 — 새 문장이 필요하다는 신호는 사용자가 후보를 탈락시키는데 그
이유가 기존 문장 어디에도 매핑되지 않을 때만 나온다. 이 "매핑 실패" 자체를
로그에 남기는 것이 빠진 문장을 발견하는 유일한 경로다.

---

## 미확인 항목

1. DTCG 13개 타입과 forma의 현재 토큰 사이의 실제 매핑 손실.
   `measure.wide: "min(100%, 72rem)"` 같은 CSS 함수 값을 어떻게 표현할지
   확인하지 않았다.
2. `.tokens.json` 확장자가 DTCG 생태계에서 얼마나 확립된 관용인지.
   스펙 문서에서 확인하지 않았다.
3. arXiv:2602.11988의 본문. 초록은 직접 읽었고, "LLM 생성 -3% / 사람 작성 +4%"
   같은 세부 수치와 "불필요한 요구사항이 성능을 해친다"는 해석은 2차 출처
   (asdlc.io, upsun)에서만 봤다.
4. 삼원 비교를 렌더된 forma 후보에 적용했을 때 실제로 유용한 축이 나오는지.
   문헌은 물리적 제품과 UI 사례이고, 문서 렌더링처럼 변이 폭이 좁은 대상에
   대한 사례는 찾지 못했다.
5. `forma-taste` 스킬을 만들 경우 `~/.agents/skill-targets.json` 동기화
   대상과의 관계.
6. SOUL 항목 단위 탈락 사유를 라운드 로그에 남기는 구현 비용.
   `src/qa/candidates.ts`에 해당 필드가 없다는 것만 확인했다.
7. 검사 3의 "탈락 0"과 "전부 탈락" 임계값을 실제로 어디에 둘지.
   Spool의 "2/3" 수치는 사람 디자인 조직 기준이고 forma 후보 8개에 그대로
   적용될 근거가 없다.

---

## 출처

**저장소 (직접 읽음)**

`DESIGN.md` 전체, `CLAUDE.md`, `AGENTS.md`, `README.md:216`,
`src/design/tokens.ts` 전체, `skills/forma/SKILL.md:1-70`,
`docs/design-pipeline/00-source.md`, `00-transcript-ko.txt`,
`01-feasibility-codex.md`, `01-feasibility-claude.md`,
`~/.claude/skills/process-interviewer/SKILL.md` 전체.
grep 확인: `SOUL`/`.forma/`/`forma.config`/`formarc` 0건,
`DESIGN.md` 참조 3건(전부 문서, 코드 0건).
`src/qa/candidates.ts`, `src/renderer/composition.ts`,
`src/design/foundations-css.ts`는 이 조사에서 직접 읽지 않았고
1단계 문서의 인용(`파일:줄` 포함)을 재사용했다.

**웹**

- [Design Tokens Format Module 2025.10 (초안)](https://www.designtokens.org/tr/drafts/format/) — 직접 읽음
- [W3C DTCG, 첫 안정판 발표 (2025-10-28)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)
- [Gloaguen et al., "Evaluating AGENTS.md" arXiv:2602.11988](https://arxiv.org/abs/2602.11988) — 초록 직접 읽음
- [SRI Lab 게재 페이지](https://www.sri.inf.ethz.ch/publications/gloaguen2026agentsmd)
- [asdlc.io, AGENTS.md Specification](https://asdlc.io/practices/agents-md-spec/) — 직접 읽음 (2차 출처)
- [Upsun, "your AGENTS.md is probably too long"](https://developer.upsun.com/posts/ai/agents-md-less-is-more) — 검색 결과만
- [Augment Code, How to Build Your AGENTS.md](https://www.augmentcode.com/guides/how-to-build-agents-md) — 검색 결과만
- [Center Centre, Creating Great Design Principles: 6 Counter-intuitive Tests](https://articles.centercentre.com/creating-design-principles/) — 직접 읽음
- [Matthew Ström, What makes a good design principle?](https://mattstromawn.com/writing/principles/) — 검색 결과만
- [principles.design — Atlassian Design System](https://principles.design/examples/atlassian-design-system) — 검색 결과만
- [Carbon Design System, What is Carbon](https://carbondesignsystem.com/all-about-carbon/what-is-carbon/) — 검색 결과만
- [EduTech Wiki, Repertory grid technique](https://edutechwiki.unige.ch/en/Repertory_grid_technique) — 검색 결과만
- [Loughborough, Kelly's repertory grid in design and technology](https://repository.lboro.ac.uk/articles/conference_contribution/Kelly_s_repertory_grid_a_technique_for_developing_evaluation_in_design_and_technology/9341825) — 검색 결과만
- [IJDesign, The Repertory Grid Technique as a Method for the Study of Cultural Differences](http://www.ijdesign.org/index.php/IJDesign/article/view/358/274) — 검색 결과만
- [Wikipedia, MaxDiff](https://en.wikipedia.org/wiki/MaxDiff) — 검색 결과만
- [quantilope, MaxDiff Explained](https://www.quantilope.com/resources/maxdiff-explained-how-the-advanced-method-works-non-research-examples) — 검색 결과만
- [Columbia Mailman, Discrete Choice Model and Analysis](https://www.publichealth.columbia.edu/research/population-health-methods/discrete-choice-model-and-analysis) — 검색 결과만
- [Full Stack Researcher, The Most Misunderstood Research Method](https://fullstackresearcher.substack.com/p/the-most-misunderstood-research-method) — 검색 결과만
- [Ziflow, 10 key components of a brand brief](https://www.ziflow.com/blog/brand-brief) — 검색 결과만
- [Bynder, Creative Briefs](https://www.bynder.com/en/blog/find-creative-direction-write-great-creative-brief/) — 검색 결과만
- [Microsoft Learn, Spec-Driven Development with GitHub Spec Kit](https://learn.microsoft.com/en-us/training/modules/spec-driven-development-github-spec-kit-greenfield-intro/) — 검색 결과만
- [github/spec-kit, spec-driven.md](https://github.com/github/spec-kit/blob/main/spec-driven.md) — 검색 결과만

"검색 결과만"으로 표시한 것은 검색 결과의 요약을 읽었고 페이지 전문을 열지
않았다는 뜻이다.
