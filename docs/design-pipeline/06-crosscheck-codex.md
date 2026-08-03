# 교차 검증 (codex)

## 결론

**치명 지적은 0건이다.** 상대 조사와 오케스트레이터 문서의 큰 방향 — 저작과
렌더의 분리, 현재 스타일 입력 통로의 부재, correctness gate와 사람 선호의 분리,
반례 우선 수집 — 은 코드와 1차 출처에 대체로 맞는다. 다만 **중간 9건, 경미
3건**이 있다. 가장 중요한 문제는 (1) Zod 스키마를 `strict`라고 잘못 읽은 것,
(2) CSS gradient lint와 CSP가 WebGL 셰이더를 막는다는 잘못된 추론, (3) DTCG와
AGENTS.md 연구의 적용 범위를 넘어 인간용 DESIGN/SOUL 작성법까지 확정한 것,
(4) 05 문서에서 현재 구현 사실을 제품 철학의 증거로 승격한 것이다.

## 중간 지적

### 1. `FormaSpecSchema`는 strict가 아니며 unknown key를 거부하지 않는다

- **대상:** `01-feasibility-claude.md:234-237`.
- **주장:** `FormaSpecSchema`가 strict하고 unknown shape를 거부하므로 산문을
  렌더러 입력과 분리해야 한다.
- **확인:** 실제 정의는 `z.object({...})`일 뿐 `.strict()`가 없다
  (`src/spec/schema.ts:64-70`). 현재 설치된 Zod로
  `z.object({a:z.string()}).parse({a:"x",extra:1})`을 실행하면 실패하지 않고
  `{a:"x"}`가 나온다. 즉 unknown key는 **거부가 아니라 제거**된다.
- **판정:** 산문과 기계 값을 분리하자는 결론은 여전히 합리적이지만, 제시한 코드
  근거는 틀렸다. unknown key 거부가 계약이라면 스키마에 `.strict()`를 넣거나
  별도 테스트가 필요하다.

### 2. paper.design 셰이더가 `gradient-overuse`에 걸린다는 주장은 틀렸다

- **대상:** `01-feasibility-claude.md:195-205`, 이를 결론 근거로 다시 쓴
  `01-feasibility-claude.md:419-425`.
- **주장:** 셰이더 배경은 정의상 gradient이고 Forma lint가 이를 “AI 냄새”로
  판정한다.
- **확인:** `gradient-overuse`는 CSS 텍스트에서 `linear-gradient`와
  `radial-gradient` 문자열의 개수만 센다(`src/qa/design-lint.ts:109-119`).
  Canvas/WebGL fragment shader는 이 문자열을 포함하지 않으므로 이 규칙의 검사
  대상이 아니다. 테스트도 CSS gradient 함수 세 개만 넣는다
  (`tests/unit/design-lint.test.ts:81-83`).
- **판정:** 셰이더를 현재 Forma 산출물에서 제외하자는 결론은 문서 도메인,
  self-contained 번들, snapshot의 no-client-script 계약으로 방어할 수 있지만,
  lint 근거는 제거해야 한다.

### 3. 셰이더를 넣으려면 CSP를 바꿔야 한다는 단정도 성립하지 않는다

- **대상:** `01-feasibility-claude.md:206-208`.
- **확인:** Room CSP는 이미 `script-src 'unsafe-inline'`을 허용하고
  `img-src data:`도 허용한다(`src/room/server.ts:44-53`). 자체 포함된 inline
  JavaScript와 Canvas/WebGL 자체는 `connect-src`를 요구하지 않는다. 외부 모듈,
  이미지, 네트워크 fetch를 쓰는 특정 구현이면 추가 CSP가 필요하지만 “셰이더”라는
  이유만으로 필요한 것은 아니다.
- **판정:** `snapshot.html`의 no-client-script 보장(`docs/security.md:92-96`)과의
  충돌은 맞다. CSP 충돌과 snapshot 계약 충돌을 구분해야 한다.

### 4. Room Mode는 “투표 대상만 바꾸면” 후보 랭킹 UI가 되지 않는다

- **대상:** `01-feasibility-claude.md:347-377`.
- **주장:** 랭킹 UI가 이미 있고 대상만 바꾸면 된다. 같은 절에서 서버 코드를
  읽지 않았다고 인정했다.
- **확인:** 현재 wire protocol은 block별 `for | against | abstain`, 자유 comment,
  simulation input, freeze만 받는다(`src/room/protocol.ts:22-59`). 상태와 tally도
  participant/block 단위의 찬반 투표다(`src/room/state.ts:18-53, 103-161`). 후보
  1~5점, pairwise choice, 축별 이유 코드, round 승격은 없다.
- **판정:** 서버의 loopback·token·memory-only·freeze 기반은 재사용 가능하지만,
  panel, protocol, state, freeze record가 모두 바뀐다. Codex의 정적 review와
  Claude의 Room 재사용 중 어느 쪽이 싼지는 **구현량 추정과 단일/다중 사용자 요구**가
  있어야 판정할 수 있다.

### 5. DTCG 표준은 “값 파일에 철학을 섞지 말라는 업계 합의”를 증명하지 않는다

- **대상:** `02-authoring-claude.md:127-139`, 그리고 `02-authoring-claude.md:75-78`의
  “claude 쪽이 옳다” 판정.
- **확인:** 2025.10이 첫 안정판이고 교환용 JSON 포맷, modern color, alias 등을
  정의한다는 사실은 공식 발표와 규격에서 확인된다
  (<https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/>,
  <https://www.w3.org/community/reports/design-tokens/CG-FINAL-format-20251028/>).
  그러나 규격의 범위가 값 교환인 것은 **인간용 rationale 문서를 두지 말라는
  결정**이 아니다. 규격 자체도 `$description`과 extension metadata를 허용한다.
- **판정:** 기계 값은 DTCG-compatible JSON으로 두는 쪽이 근거가 강하다. 하지만
  인간용 `.forma/DESIGN.md`를 별도로 둘지까지 DTCG가 판정하지 않는다. 이 갈림은
  “사람이 round의 이유·예·반례를 다시 읽어야 하는가”와 JSON round-trip 실험이
  있어야 판정 가능하다.

### 6. AGENTS.md 연구에서 SOUL 작성 규칙까지 끌어낸 부분은 외삽이다

- **대상:** `02-authoring-claude.md:34-37, 192-224`,
  `05-authoring-inputs.md:63-67, 93-96`.
- **확인:** 논문은 context file이 평균 성공률을 일반적으로 높이지 않고 추론 비용을
  20% 넘게 늘렸으며, 에이전트는 지시를 대체로 따르고 탐색·테스트를 더 했다고
  보고한다(<https://arxiv.org/abs/2602.11988>). 즉 “무시해서 실패”가 아니라
  **불필요한 repository overview/requirements가 비용을 만든다**는 뉘앙스는 맞다.
- **문제:** 논문은 디자인 철학, reversibility test, 녹취 정제, 반례 문서의 효과를
  실험하지 않았다. 따라서 “LLM이 정리한 SOUL은 정의상 더 나쁘다”
  (`02-authoring-claude.md:222-224`)나 “뒤집을 수 있는 문장만 넣는다”를 이 논문이
  뒷받침한다는 05의 서술은 증거 범위를 넘는다. `05-authoring-inputs.md:95-96`의
  “개요 산문은 따르지 않는다”도 부정확하다. 논문은 지시는 따랐지만 개요가
  **도움이 되지 않았다**고 했지, 개요를 따르지 않았다고 하지 않았다.
- **판정:** “짧게 하고 효과를 실험하라”까지는 근거가 있다. 문장 형식과 생성
  프로토콜은 별도 사용자 실험이 필요한 **[판단]**이다.

### 7. `--shadow` 토큰 인용은 존재하지 않는 코드를 가리킨다

- **대상:** `03-antipattern-claude.md:483-490`.
- **주장:** `foundations-css.ts:33`에 `--shadow` 토큰이 있지만 shadow lint가 없다.
- **확인:** `src/design/foundations-css.ts:33`은 `--color-info-text`이고,
  `src/design` 전체에 `--shadow` 토큰이 없다. 반면 `src/qa`에 shadow 검사 규칙이
  없다는 부분은 맞다. `generic-ai-patterns.md:17-20`이 존재하지 않는
  `scripts/audit-design.mjs`와 shadow 자동 검사를 약속한다는 핵심 지적도 맞다.
- **판정:** “문서가 실제 집행보다 앞서 있다”는 결론은 유지되지만, 토큰 인용과
  그 토큰을 전제로 한 설명은 삭제해야 한다.

### 8. `paragraph-density`를 실제 집행 규칙으로 다시 세었다

- **대상:** `03-antipattern-claude.md:515-525`.
- **주장:** 목록에는 없지만 코드가 `prose-run`, `orphan-heading`,
  `paragraph-density`를 잡는다.
- **확인:** `paragraph-density`와 `heading-overflow`는
  `src/qa/candidates.ts:176,179`의 감점 switch에만 있고 finding을 생성하는 규칙은
  없다. 이는 같은 문서의 앞선 조사인 `01-feasibility-claude.md:318-323`도 정확히
  확인했던 사실이다.
- **판정:** `paragraph-density`를 집행 목록에서 빼야 한다. 05의 17종 집계에는 이
  두 dead case가 들어가지 않아 그 숫자는 맞다.

### 9. 05의 [증거]가 현재 구현과 제품 철학을 여러 곳에서 혼합한다

- **대상:** `05-authoring-inputs.md:29-41, 142-155, 166-176`.
- **확인된 사실:** README는 deterministic design system과 offline HTML을 명시한다
  (`README.md:10-17, 31-49`). 8개 canonical fixture 중 6개가 `internal`이고,
  dashboard만 `compact`다. CSS 34.7%도 거짓이 아니다. 현재 dashboard HTML
  224,985 bytes에서 font-face를 뺀 CSS가 78,281 bytes로 34.79%이며 원 수치도
  `examples/dashboard/forma.spec.json:257-264`에 있다.
- **증거를 넘은 부분:**
  - example report의 자기서술형 decision matrix
    (`examples/report/forma.spec.json:161-175`)는 “현재 예제가 그렇게 말한다”는
    증거이지, 사용자가 그 가중치를 제품 철학으로 승인했다는 증거는 아니다.
  - “현재 raster block이 없다”(`src/blocks/report.tsx:476-500`)는 능력의 현재
    상태이지 “제품은 이미지를 원하지 않는다”는 취향 증거가 아니다.
  - “완결 문장”에서 특정 제목 조판·measure를, “의미 있는 장식”에서 표면 3단계
    제한을 **연역**한다는 `05-authoring-inputs.md:148-155`는 독립적인 DESIGN 규칙을
    한 철학 문장의 결과로 다시 포장한다. 특히 claim heading 규칙은
    `DESIGN.md:52-55`, measure 규칙은 `DESIGN.md:46-48`에 서로 별개로 있다.
- **판정:** 05는 저장소의 현재 관성을 역추출한 초안으로는 유용하다. 하지만 위
  항목은 [증거]가 아니라 **[판단/현재 상태]**로 내려야 하며, 사용자가 승인하기
  전에는 SOUL의 확정 입력으로 쓰면 안 된다.

## 경미 지적

1. `03-antipattern-claude.md:647-650`은 호출부를 `shell.ts:41`로 적었지만 실제
   호출은 `src/renderer/shell.ts:42`다. 내용은 맞고 줄 번호만 한 줄 어긋났다.
2. `05-authoring-inputs.md:11`은 [증거]에 파일·코드·커밋을 댔다고 정의하지만,
   `05-authoring-inputs.md:54, 73, 174-176`처럼 파일:줄 없이 측정명, rule 이름,
   `qa/dark-1440.png`, “1단계 claude”만 적은 항목이 있다. 이번 교차 검증에서는
   대부분 실제 근거를 찾았지만 제3자가 재현하기에는 locator가 부족하다.
3. `02-authoring-claude.md:348-351`의 “5~8회면 축 목록이 나온다”와
   `02-authoring-claude.md:341`의 “첫 목록은 15분”은 출처가 없는 운영 추정이다.
   repertory grid의 triadic elicitation 자체는 확인된다
   (<https://www.ijdesign.org/index.php/IJDesign/article/view/358/274>).
   1차 연구의 종료 조건은 고정 횟수보다 새 속성이 더 나오지 않는지에 가깝다.

## 두 조사 사이 갈림 판정

| 갈림 | 판정 |
|---|---|
| 사람용 DESIGN Markdown 유지 vs 기계 JSON만 | **부분 판정.** 기계 값은 DTCG JSON이 우세하지만, rationale·예·반례용 인간 문서를 없앨 근거는 없다. Codex의 “인간 문서 + typed profile” 절충이 현재 증거에 가장 안전하다. |
| 1차 병목이 사람 루프인가 스타일 파라미터 통로인가 | **판정 불가.** 코드상 둘 다 실제 결손이다. 현재 네 축에도 사람 선호는 존재할 수 있으므로 루프가 완전히 무의미한 것은 아니지만, palette/type/surface 취향을 고르려면 통로가 먼저다. 구현 순서는 사용자가 원하는 첫 실험의 범위로 정해야 한다. |
| 자유 코멘트 수집 vs 구조화 질문 우선 | **실질 합의.** Codex도 자유 코멘트를 자동 점수화하지 않고 보조로 두며, Claude도 선택 필드로 남긴다. 대립이라기보다 우선순위 표현 차이다. |
| 정적 review vs Room Mode 재사용 | **판정 불가.** 단일 사용자·오프라인이면 정적 review가 작고, 다중 참여·freeze 감사 기록이 필요하면 Room 기반이 유리하다. 현재 Room은 후보 랭킹 protocol이 아니므로 “이미 있다”로 계산하면 안 된다. |
| Color.js vs culori | **판정 불가/낮은 중요도.** 둘 다 dev/QA 한정, 색 과학이 실제 필요할 때만이라는 데 합의한다. 동일 fixture·bundle·API spike가 없으면 라이브러리 취향 이상으로 판정할 근거가 없다. |

## 맞다고 확인한 핵심 주장

- stylesheet의 문서별 함수 입력은 font CSS뿐이고
  (`src/design/foundations-css.ts:47`, `src/renderer/shell.ts:38-42`),
  `artifactCss()`와 `blockCss()`에는 인자가 없다
  (`src/design/artifact-css.ts:13`, `src/design/block-css.ts:9`).
- 후보의 `<style>` 텍스트는 동일하고 차이는 density·measure·typeScale 속성과
  figure 순서에서 해석된다(`src/renderer/composition.ts:18-24`,
  `src/renderer/shell.ts:52-56,94`, `src/design/foundations-css.ts:174-179`).
- raster image block은 없고 report `figure`에는 caption/of/reading만 있다
  (`src/blocks/report.tsx:476-500`). `src`의 실제 `<img>` 출력은 Pages gallery
  (`src/pages/build.ts:59-70`)뿐이다.
- `confidentiality`는 현재 동작을 바꾸지 않고 schema default와 화면 label에만
  쓰인다(`src/spec/schema.ts:61`, `src/renderer/shell.ts:88,99`).
- `paragraph-density`와 `heading-overflow`는 dead scoring branch이며, clean
  candidate가 100점이 되는 감점 전용 구조도 맞다
  (`src/qa/candidates.ts:144-193`).
- 03의 외부 연구 핵심 수치는 1차 출처에서 확인됐다. Design Theater는 24개 과제,
  5개 도구, 120개 UI, rationale 미구현 약 25%(기능 34%), UIClip/CIELCh+EMD/
  tree-edit-distance를 쓴다(<https://arxiv.org/html/2607.22928>). TextFake는
  20,000장 중 real 10,000장, 그중 screenshot 8,002장을 명시한다
  (<https://arxiv.org/html/2606.01050>). “Usable but Conventional”도 92명과
  pragmatic 양호/hedonic originality 저조를 초록에서 확인했다
  (<https://arxiv.org/abs/2605.15124>).

## 미확인

- 영상과 `00-transcript-ko.txt`의 인용은 로컬 자막에서 문구를 대조했지만, 영상의
  시각 장면·순서까지 재생 검증하지는 않았다.
- CHI 2021의 “2010–2019 44% 감소” 세부 수치는 이번에는 원문 표까지 재계산하지
  않았다. 초록의 “2007년 이후, layout 평균 거리 30% 이상 감소”는 확인했다
  (<https://doi.org/10.1145/3411764.3445156>).
- GitHub/npm의 모든 날짜·push 시각을 전수 재조회하지는 않았다. 이번 결론을
  바꾸는 `culori`, `@projectwallace/css-analyzer`, `apca-w3`, `chroma-js`의 현재
  version/license/dependency는 npm registry로 표본 확인했고 03의 표와 일치했다.
