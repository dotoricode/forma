# 1단계 가능성 검토: Forma에 제안 파이프라인을 넣을 수 있는가

## 결론

제안 전체를 그대로 Forma에 넣는 것은 불가능하다. `forma.spec.json`만 쓰고
결정론적 오프라인 렌더러가 최종 HTML을 만드는 현재 계약과, 에이전트가
인터랙티브 HTML을 직접 만들어 시안을 무한 생성한다는 계약이 정면으로
충돌한다. 다만 Pinterest와 paper.design은 제품 문서를 보내지 않는
저작 단계의 참고 입력으로 제한하고, 사람이 `DESIGN.md`/`SOUL.md`를 확정한
뒤 Forma가 이해하는 토큰·블록·composition 축으로 번역하면, **Forma에 맞는
부분 파이프라인**은 가능하다.

Forma의 다음 병목은 후보 생성 자체가 아니라 선호를 기록하는 별도 사람
루프다. 현재 후보 계층은 하드 게이트와 lint 감점에는 적합하지만, clean 후보의
취향 차이를 모으거나 다음 라운드에 반영하지 않는다. 따라서 권장 결론은
“저작용 무드/철학 입력 + Forma spec 변환 + 오프라인 렌더 + 별도의 로컬
human-review 루프”이며, 에이전트가 최종 HTML/CSS/셰이더를 직접 쓰는 부분은
버린다.

아래에서 확인된 사실과 제안·추론, 미확인 항목을 구분한다.

## 1. 제약 충돌과 가능한 구조

### 확인된 사실

- 현재 Forma 스킬은 읽기 → artifact 선택 → 블록 선택 → `forma.spec.json`
  작성 → validate → render 순서를 요구한다. 최종 산출물에 HTML/CSS를
  직접 쓰지 말고 spec만 쓰라는 규칙이 있다 (`skills/forma/SKILL.md:8-12,
  42-50, 55-67`). canonical skill의 네 원본도 같은 제약을 반복한다
  (`skills-src/dashboard/instructions.md:68-79`,
  `skills-src/report/instructions.md:68-79`).
- 출처 문서도 “에이전트는 HTML/CSS를 직접 생성하지 않고
  `forma.spec.json`만 쓴다”고 절대 제약으로 정리한다
  (`docs/design-pipeline/00-source.md:62-75`).
- 최종 HTML은 renderer가 inline CSS와 작은 JS를 조립한다. JS는 테마 토글,
  코드 복사, 목차 상태 등 제한된 islands이며 JS 없이도 읽을 수 있어야 한다
  (`src/renderer/interactive.ts:1-5`, `src/spec/artifact.ts:89-95`).
  `interaction: "live"`는 Advanced Room Mode에만 도달한다.
- spec에서 허용되는 composition 축은 `density`, `measure`,
  `figurePlacement`, `typeScale` 네 가지뿐이다
  (`src/renderer/composition.ts:5-10`). 후보는 이 축에서만 달라지고 CSS를
  생성하지 않는다는 원칙도 명시돼 있다 (`src/qa/candidates.ts:1-13`).
- 렌더러는 spec을 읽어 `data-artifact`, `data-variant`, composition
  attributes를 HTML에 넣고 (`src/renderer/shell.ts:32-56`), 토큰과
  artifact CSS를 조립한다. 토큰은 `src/design/tokens.ts`에서 정의되고
  `src/design/foundations-css.ts`에서 방출된다
  (`DESIGN.md:18-23`, `src/design/foundations-css.ts:42-97`).

### 선택지와 대가

| 선택지 | 형태 | 얻는 것 | 잃는 것/위험 |
|---|---|---|---|
| A. **Forma 호환 어댑터 (권장)** | 무드보드와 철학은 저작 단계에서 사람이 정리한다. 에이전트는 그 결과를 읽고 spec만 작성한다. 무드의 특징은 기존 토큰, 블록, artifact, 네 composition 축에 매핑한다. | 오프라인 0 요청, 재현성, 기존 보안·검증·스킬 계약을 유지한다. `DESIGN.md`/`SOUL.md`가 사고의 입력이 되면서도 renderer의 단일 책임이 보존된다. | 영상처럼 임의의 화면 전환, hover, WebGL 셰이더, 완전히 다른 시각 언어를 매 라운드마다 얻을 수 없다. Forma 후보는 “같은 content의 제한된 조합”이다. |
| B. **프로토타입 sidecar** | 별도 명시적 명령에서만 에이전트가 임시 HTML/CSS를 만들고, 이를 사람 평가용 참고물로만 둔다. 최종 문서는 여전히 spec으로 렌더한다. | 영상의 인터랙티브 시안 경험을 빠르게 시험할 수 있다. 최종 파일의 0 외부 요청은 sidecar를 산출물에 포함하지 않는 한 유지할 수 있다. | 두 개의 진실(프로토타입과 Forma spec)이 생긴다. 직접 HTML은 보안·재현성·접근성·QA를 별도 부담으로 만들며, canonical Forma 산출물로 오인되면 현재 hard constraint를 깨뜨린다. 이 모드는 현재 CLI에 없다. |
| C. **선언형 renderer 확장** | 임의 HTML 대신 spec에 사전 정의된 `motion`, `effect`, `surface` 등의 제한된 값과 interaction block을 추가하고 renderer가 이를 구현한다. | 일부 인터랙티브 시안을 결정론적으로 보존하면서 spec-only를 지킬 수 있다. | schema·validator·renderer·QA·성능 예산을 함께 확장해야 한다. arbitrary shader/페이지를 허용하지 않는 순간 영상의 자유도는 다시 제한된다. 구현 비용과 새 보안 표면은 미확인이다. |

A가 현재 Forma에 맞는 결론이다. B는 “Forma artifact를 만드는 방식”이
아니라 별도 디자인 프로토타이핑 도구로만 분리해야 한다. C는 장기 제품
결정으로는 검토할 수 있지만, 1단계에서 바로 제약을 풀 이유가 확인되지
않았다. 직접 HTML/CSS 생성을 최종 Forma 경로에 허용하는 선택은 A보다
많은 표현력을 얻지만, spec이 재현성의 기준이라는 계약과 renderer가
검증 가능한 경계를 잃는다. 그 손실은 단지 구현 취향의 문제가 아니다.

## 2. Pinterest·paper.design과 외부 서비스

### 가능한 경계

저작 시점에 사람이 Pinterest에서 공개 레퍼런스를 고르고 paper.design에서
셰이더/디더링의 시각적 특징을 관찰하는 것 자체는, 그 내용을 최종 HTML의
런타임 요청으로 남기지 않는다면 Forma의 렌더 0 요청과 양립할 수 있다.
무드보드는 “영감을 얻는 입력”으로 취급하고, 최종 spec에는 팔레트·질감의
의도·레이아웃 원칙 같은 텍스트/토큰만 남기는 것이 가장 안전하다. 영상도
Pinterest의 무드 선택과 paper.design 효과 선택을 제품 철학과 함께 준비한
저작 단계로 설명한다 (공유 자막 `docs/design-pipeline/00-transcript-ko.txt:1`,
요약 `docs/design-pipeline/00-source.md:20-26`).

렌더된 HTML은 외부 network request 0건이 계약이고, browser QA의 hard gate도
외부 요청을 탈락시킨다 (`docs/security.md:51-62`,
`src/qa/candidates.ts:124-141`). 기술 정책도 `file://`로 열리고 외부 요청이
없어야 한다고 한다 (`skills-src/_shared/references/technology-policy.md:5-14`).

### 이미지와 셰이더를 산출물에 넣을 때

1. Pinterest 이미지를 실제 산출물에 넣는다면 원격 URL을 그대로 쓰지 말고,
   권리와 출처를 확인한 뒤 로컬로 내려받아 최종 HTML에 허용된 정적 자산
   형식으로 포함해야 한다. 이 경우 네트워크 0은 유지할 수 있지만 파일
   크기, 라이선스, 원본의 악성 SVG/메타데이터, 산출물 공개 범위가 새 위험이
   된다. 성능 예산도 사용자 이미지가 예외적 크기 원인이라고 명시한다
   (`skills-src/_shared/references/performance-budget.md:1-20`).
2. paper.design의 셰이더 코드를 그대로 브라우저에서 실행하면, 기술적으로
   inline으로 묶어 외부 요청을 0으로 만들 수는 있어도 현재 Forma가 허용하는
   작은 islands와 결정론적 build-time SVG/차트 범위를 넘는다
   (`skills-src/_shared/references/technology-policy.md:6-12`,
   `src/renderer/interactive.ts:1-5`). 또한 arbitrary shader는 spec-only와
   접근성/성능/검증 경계를 깨뜨린다.
3. 따라서 paper 효과는 우선 `SOUL.md`/`DESIGN.md`의 “질감은 어떤 의미로
   쓰는가”라는 문장이나 renderer가 이미 아는 제한 토큰으로 번역한다. 실제
   이미지를 보존해야 한다면 build-time에 크기 제한·sanitize·출처 기록을
   거친 정적 자산으로 처리해야 한다. 현재 `FormaSpecSchema`는 sources와
   sections를 검증하지만 별도의 범용 자산/셰이더 계약은 노출하지 않는다
   (`src/spec/schema.ts:64-80`, `skills-src/_shared/references/spec-reference.md:22-48`).
   범용 이미지·셰이더를 넣을 수 있는 현재 지원 여부는 **미확인**이며,
   신규 schema/block 없이는 지원된다고 가정하면 안 된다.

### 제3자 전송 보장이 깨지는 지점

보장은 “렌더 시점”만으로 충분하지 않다. 다음 중 하나가 일어나면
저작 시점에 깨진다.

- 에이전트가 제품 문서, 녹취, private moodboard, `SOUL.md` 전문을 Pinterest나
  paper.design에 업로드하거나, 그 내용을 포함한 검색/프롬프트를 외부
  엔드포인트로 보낸다.
- 무드보드 이미지에 원문 문서나 내부 화면이 섞여 있고 이를 외부 서비스에
  업로드한다.
- 외부 LLM API에 디자인 철학 또는 문서 내용을 보내 요약·변환한다. 이는
  스킬 hard constraint가 명시적으로 금지한다 (`skills/forma/SKILL.md:59-63`).

반대로 “공개 레퍼런스를 사람이 보고 로컬 메모로 옮기는 것”은 문서 내용의
전송과 다르다. 단, Pinterest/paper의 계정·브라우저·업로드 동작과 실제
저작 도구의 구현은 이 저장소에서 검증하지 않았으므로, 그 외부 서비스의
보존/추적 정책까지 Forma가 보장한다는 주장은 **미확인**이다.

## 3. `DESIGN.md`와 `SOUL.md`의 위치와 책임

### `DESIGN.md`

현재 저장소의 `DESIGN.md`는 루트에 있고 “Forma visual language의 단일
원천”이다 (`DESIGN.md:1-8`). 토큰의 출처, typography, spacing, radius,
motion과 layout grammar, 네 artifact의 방향, 금지 패턴을 담는다
(`DESIGN.md:18-67`, `DESIGN.md:68-110`). 프로젝트 규칙도
`DESIGN.md`를 source of truth로 선언한다 (`AGENTS.md:3`, `CLAUDE.md:3`).

이 구조에서 `DESIGN.md`는 **프로젝트당 하나**가 맞다. 네 artifact는 서로
다른 정보 구조를 가지지만 shared foundation과 토큰을 공유하며, 실제
renderer는 `data-artifact`/`data-variant`를 읽어 해당 CSS를 고른다
(`DESIGN.md:88-110`, `src/renderer/shell.ts:50-56`). artifact마다 별도
`DESIGN.md`를 두면 토큰·접근성·오프라인 보장의 source of truth가 여러 개가
된다. 문서마다 두는 것도 renderer가 문서별 임의 스타일을 읽는 현재 경로가
없어 중복과 drift만 만든다.

단, 이 파일은 현재 renderer가 runtime에 직접 읽는 파일이 아니다. 코드 검색
결과 `src`, `skills-src`, `skills/forma`에서 `DESIGN.md`/`SOUL.md`를 읽는
구현은 없고, `CLAUDE.md`/`AGENTS.md`의 규칙과 `src/design/*.ts`가 각각
사람/에이전트와 renderer의 접점이다. renderer가 실제로 읽는 것은
TypeScript 토큰과 CSS이다 (`DESIGN.md:18-23`). 즉 proposed pipeline에서
에이전트가 DESIGN을 읽어 spec을 쓰는 것은 가능하지만, DESIGN을 저장하면
자동으로 렌더러가 그 스타일을 반영한다고 말할 수 없다.

### `SOUL.md`

현재 저장소에는 `SOUL.md`가 없으며, 이를 읽는 코드/스킬도 확인되지 않았다.
따라서 다음은 제안이다.

- `SOUL.md`는 제품/프로젝트당 하나, `DESIGN.md`와 같은 저작 경계에 둔다.
  제품의 정체성, 목표 사용자, 우선 경험, 기능을 숨기거나 드러내는 원칙,
  “좋은/나쁜” 시안의 이유를 담는다. 영상의 표현대로 철학은 사람이 주고,
  녹음/토론을 사람이 승인 가능한 텍스트로 정제한 뒤에만 쓴다
  (`docs/design-pipeline/00-source.md:24-26`).
- `SOUL.md`는 renderer가 읽는 파일이 아니라, 사람과 에이전트가 다음 spec과
  디자인 결정을 작성할 때 읽는 입력이다. renderer에 넘길 때는 artifact,
  block, narrative, 허용된 token/composition 선택으로 번역한다.
- artifact별 페이지가 철학의 다른 측면을 필요로 하면 `SOUL.md` 안에서
  artifact별 절을 두거나 spec의 narrative/blocks에 반영한다. artifact마다
  별도 SOUL 파일을 만들면 제품의 우선순위가 분기되고, 어떤 철학이
  우선인지 사람이 다시 결정해야 한다.

그러므로 “프로젝트당 DESIGN 하나 + 프로젝트/제품당 SOUL 하나”가 현재
구조에 맞고, “문서당/페이지당/renderer artifact당 하나”는 버린다. 다른
프로젝트의 제품 철학을 Forma 저장소 루트 `DESIGN.md`에 덮어쓰는 것도
버려야 한다. Forma의 `DESIGN.md`는 Forma 자체 renderer의 source of truth다.

## 4. 후보 선별 계층과 사람 루프

### 현재 계층이 하는 일

현재 후보 생성은 첫 후보를 authored spec 그대로 보존하고, 나머지를 네
축에서 seeded random으로 만든다 (`src/qa/candidates.ts:24-87`). 후보의
하드 게이트는 외부 요청, overflow, clipped text, axe 오류, broken anchor,
근거 없는 verified claim을 탈락시킨다 (`src/qa/candidates.ts:124-141`).
soft score는 lint finding별 감점만 수행하며 clean이면 100점이다
(`src/qa/candidates.ts:144-193`). 동점이면 seeded list 순서를 따르고,
사람의 별점·코멘트·선호는 입력으로 존재하지 않는다
(`src/qa/candidates.ts:196-205`).

따라서 `examples/dashboard/forma.spec.json`에 기록된 “8개 후보 중 탈락 0,
점수 차 0, clean 후보 모두 100”은 현재 빈 절반을 정확히 보여준다
(`examples/dashboard/forma.spec.json:278-285`; 같은 관찰의 요약
`docs/design-pipeline/00-source.md:44-55`). 영상의 N개 시안과도 차이가
있다. 영상은 모델/스타일이 다른 인터랙티브 시안을 만들었지만, 현재 Forma
후보는 같은 content와 renderer를 공유하는 제한된 composition 변형이다.
`build --quality advanced`는 8개를 temp 디렉터리에 렌더하고 QA한 뒤
temp 전체를 삭제한다 (`src/cli/index.ts:78-117`). 사람에게 보여 줄 지속
세션이나 평점 입력면도 현재 CLI에 없다.

### 채울 수 있는 방식

채울 수는 있지만 자동 점수 하나에 사람 취향을 섞어서는 안 된다.

1. 하드 게이트와 자동 score는 그대로 둔다. 깨진 후보가 사람 별점이 높다는
   이유로 살아남아서는 안 된다.
2. 후보 렌더를 임시 삭제하지 않고 로컬 review 디렉터리에 보존한다. 후보
   표시명은 `A/B/C`처럼 opaque하게 해 모델/seed bias를 줄인다.
3. 사람은 별점(예: 1–5), pairwise 선택(“A가 B보다 낫다”), 좋은 점/나쁜 점
   코멘트, 다음 라운드에서 없앨 패턴을 로컬 JSON으로 남긴다. 후보 hash,
   spec hash, round를 함께 기록해 다른 spec의 평점을 섞지 않는다.
4. 별점/비교는 clean 후보 사이의 **preference score**로만 집계한다. 자동
   quality score와 별도 컬럼으로 보여 주고, 동점의 deterministic tie-break도
   유지한다. 코멘트는 텍스트 그대로 자동 점수화하지 말고, 에이전트가
   제안한 디자인 delta를 사람이 확인한 뒤 다음 spec/DESIGN/SOUL revision에
   반영한다.
5. 다음 라운드는 같은 피드백 파일과 확정된 spec/design revision을 입력으로
   생성한다. 6라운드를 돌렸다는 영상의 경험은 이 로컬 상태 전이로
   재현할 수 있지만, 현재 renderer가 자동으로 철학을 학습한다는 뜻은
   아니다.

제안하는 CLI 모양은 다음과 같다. 이는 **현재 존재하는 명령이 아니라
필요한 인터페이스 제안**이다.

```text
forma candidates <spec> --count 8 --round 1 --out .forma/review/r1
forma review .forma/review/r1 --blind --open
forma review .forma/review/r1 --export .forma/review/r1/ratings.json
forma candidates <spec> --round 2 --feedback .forma/review/r1/ratings.json \
  --design-revision DESIGN.md --soul-revision SOUL.md --out .forma/review/r2
```

`review`는 인터넷이 아닌 localhost의 정적 후보 페이지를 열고, 제출된
ratings는 로컬에만 쓴다. 여러 사람이 동시에 평가할 필요가 생기면
Advanced Room Mode를 재사용할 수 있지만, 그것은 live decision room이고
외부 요청 0과 로컬 네트워크 traffic을 별도로 기록해야 한다
(`docs/security.md:64-80`, `skills-src/advanced/instructions.md:64-88`).
따라서 이 review CLI를 곧바로 `advanced --room`과 같은 것으로 부르면 안
된다. 단일 사용자/오프라인 우선이라면 정적 review 페이지가 더 단순하다.

### 영상과 같은 선별을 어디까지 재현하는가

- 별점·코멘트·라운드 반복·블라인드 A/B는 위 인터페이스로 재현 가능하다.
- “왜 좋은지/나쁜지”를 말로 써 다음 생성에 반영하는 핵심은 사람 승인
  단계가 있어야 한다. 영상 자막도 단순히 `해줘`라고 하는 것보다 좋은 점과
  나쁜 점을 말로 적는 것이 중요하다고 한다 (`docs/design-pipeline/00-transcript-ko.txt:1`).
- 현재 `candidates.ts`만 확장한다고 모델 간 다른 디자인이 생기지는 않는다.
  모델별/스타일별 N개를 비교하려면 별도 spec 집합 또는 sidecar가 필요하고,
  그 경계를 추가하는 설계는 **미확인**이다.

## 5. Forma에 맞지 않아 버릴 부분

다음은 제안에서 수용하지 않는다.

- 에이전트가 최종 산출물의 HTML/CSS를 직접 생성하게 하는 것.
- paper.design 셰이더를 최종 HTML의 원격 runtime 의존성으로 남기는 것.
  로컬 inline shader를 허용하는 것도 현재 renderer/보안/성능 계약을 바꾸는
  일이므로, 1단계 기본안에서는 정적 효과 또는 선언형 토큰으로 제한한다.
- Pinterest 이미지나 paper 결과를 원격 URL로 spec에 박아 넣는 것.
  필요하면 권리 확인·로컬화·sanitize·크기 제한·출처 기록을 거친 정적
  자산으로 별도 설계한다. 현재 범용 자산 계약이 있다고 가정하지 않는다.
- 제품 문서, 녹음 원문, `SOUL.md`를 Pinterest/paper/외부 LLM에 보내는 것.
  저작 시점이라는 이유로 이 금지선이 없어지지 않는다.
- 영상의 모델별 완전히 다른 시안을 현재 `candidates.ts`의 4개 축 후보와
  동일하다고 부르는 것. 현재 축 후보는 Forma가 원래 만들기로 한 문서의
  조합 변형이며, arbitrary design generator가 아니다.
- clean 후보의 별점을 hard gate나 자동 score에 덮어쓰는 것. 사람이 좋아한
  후보라도 접근성·overflow·외부 요청 실패는 탈락해야 한다.
- artifact/문서마다 `DESIGN.md`와 `SOUL.md`를 복제해 renderer가 선택하게
  하는 것. 프로젝트 수준의 단일 원천과 spec-level narrative/variant의
  구분을 유지한다.

## 미확인 항목과 다음 판단에 필요한 것

아래는 이 조사에서 코드를 통해 확인하지 못한 부분이다.

1. Pinterest/paper.design에서 실제로 어떤 자산을 어떤 라이선스로
   다운로드·재배포할 수 있는지.
2. 현재 Forma schema/block registry에 로컬 raster/SVG asset을 self-contained
   output으로 넣는 공식 경로가 있는지. 범용 asset/shader 경로는 확인되지
   않았다.
3. review 세션 JSON의 스키마, 별점 대 pairwise 집계 방식, 코멘트를 다음
   라운드의 design delta로 번역하고 승인하는 UX.
4. 모델별 여러 spec을 Forma의 hard gate/후보 디렉터리/QA로 통합하는 범위와
   비용.
5. 선언형 motion/effect를 도입할 경우의 브라우저 QA, 접근성, 성능 예산,
   deterministic seed 계약 영향.

이 항목들이 확정되기 전에는 외부 서비스 연동, arbitrary HTML 허용,
셰이더 runtime 도입을 Forma 기능으로 약속하지 않는 것이 안전하다.
