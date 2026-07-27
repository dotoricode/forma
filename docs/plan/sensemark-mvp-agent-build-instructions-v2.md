# Sensemark MVP 구현 지시서

> 개정판 v2 · 2026-07-27  
> 최신 안정 웹 기술, 성능 예산, 시각 완성도 게이트, Google Fonts 기반 타이포그래피, generic AI 디자인 금지 규칙을 강화한 명세다.

## 0. 역할과 최종 목표

당신은 이 프로젝트의 제품 설계자, 정보 구조 설계자, UI 시스템 설계자, TypeScript 엔지니어, Agent Skill 설계자, QA 엔지니어 역할을 함께 수행한다.

목표는 스캐폴딩이나 개념 증명에 그치지 않고, **복잡한 문서·코드·리뷰 안건·테스트 결과·업무 보고 자료를 읽기 쉽고 세련된 독립형 HTML 문서로 변환하는 실제 동작하는 MVP**를 완성하는 것이다.

프로젝트의 가칭은 **Sensemark**다.

- 제품 정의: Visual sensemaking compiler for technical work
- 영문 태그라인: **Make complex work legible.**
- 한국어 설명: **복잡한 업무를 읽히는 화면으로.**
- CLI 이름: `sensemark`
- Agent Skill 이름: `sensemark`
- 기본 산출물: 오프라인에서 열리는 자체 완결형 `index.html`

`Sensemark`는 아직 법적·상표·패키지명 검토가 완료된 이름이 아니다. 공개 배포 직전에 GitHub 저장소명, npm 패키지명, 도메인, 상표 충돌을 조사하고 결과를 사용자에게 보고한다. 충돌 가능성이 높으면 이름만 바꾸되 제품 철학과 내부 구조는 유지한다.

---

## 1. 작업 원칙

1. 먼저 현재 저장소를 조사한다. 기존 코드, 패키지 매니저, 라이선스, 테스트, Agent 설정 파일이 있으면 존중한다.
2. 사용자가 제공하지 않은 사소한 선택은 합리적인 기본값으로 진행하고 `docs/decisions.md`에 기록한다.
3. 다음과 같이 되돌리기 어렵거나 범위를 크게 바꾸는 사안만 사용자에게 묻는다.
   - 공개/비공개 저장소와 라이선스
   - 회사 기밀 자료의 외부 전송 허용 여부
   - 단일 HTML이 아닌 서버·SaaS가 필요한지
   - MVP에 PDF, GitHub API, 원격 URL 수집이 반드시 포함되어야 하는지
   - 최종 이름을 공개 전에 확정해야 하는 시점
4. 질문이 필요할 때는 최대 3개의 핵심 질문으로 묶어 제시하고, 각 질문마다 권장 기본값을 함께 제시한다.
5. 확인이 필요하지 않은 세부 사항 때문에 구현을 중단하지 않는다.
6. 구현을 시작하는 날을 기준으로 **Node.js, TypeScript, Vite, Playwright, Vitest, Shiki, Mermaid, Vega-Lite, Zod, axe-core 등 모든 핵심 의존성의 최신 안정 버전과 지원 상태를 공식 문서에서 다시 확인**한다. 기억이나 오래된 템플릿에 의존하지 않는다.
7. “최신 기술”은 실험 기능을 무조건 쓰는 뜻이 아니다. 기본 타깃은 해당 시점의 **Baseline Widely Available** 기능이며, Newly Available 기능은 `@supports`, feature detection, progressive enhancement와 fallback이 있을 때만 사용한다.
8. 레거시 호환성을 이유로 ES5, CommonJS 중심 구조, jQuery, 무거운 범용 UI 프레임워크, 불필요한 polyfill을 기본으로 선택하지 않는다. 지원 브라우저 정책이 요구할 때만 예외를 문서화한다.
9. 테스트하지 않은 기능을 완료했다고 말하지 않는다. 실행한 명령, 브라우저, 성능 수치, 실패와 제한사항을 최종 보고서에 기록한다.
10. 처음부터 과도한 추상화나 모노레포를 만들지 않는다. MVP가 실제로 요구하는 경계만 분리한다.
11. 모든 기능은 로컬 우선, 오프라인 우선으로 설계한다. 렌더러 자체는 LLM API를 호출하지 않는다.
12. Apple, Microsoft, Linear, Notion, Vercel 등 특정 제품의 화면을 복제하지 않는다. 공개적으로 관찰 가능한 원칙을 연구해 독립적인 디자인 문법을 만든다.
13. 동작만 하는 첫 번째 렌더를 최종 결과로 간주하지 않는다. 기능 구현 후 **정보 구조 검토 → 타이포그래피·간격 정제 → 반응형 검토 → 성능 정제 → 실제 브라우저 스크린샷 검수**를 최소 두 차례 반복한다.
14. 성능을 이유로 디자인을 조악하게 단순화하지 않고, 디자인을 이유로 불필요한 런타임과 장식을 추가하지 않는다. 목표는 **가볍지만 싼 티가 나지 않는 고품질 결과물**이다.
15. 패키지나 기술을 새로 도입할 때는 “최신인가”뿐 아니라 유지보수 상태, 번들 영향, 접근성, 보안, 오프라인 가능성, 제거 가능성을 함께 평가한다.

---

## 2. 해결하려는 문제

Sensemark는 다음 네 상황을 우선 해결한다.

### A. 이해하기 어려운 자료를 시각적으로 설명

입력 예:

- 설계 문서
- 기술 문서
- 코드베이스 일부
- API 흐름
- 아키텍처 설명
- 복잡한 마크다운

출력 목표:

- 핵심 질문과 결론이 먼저 보인다.
- 개념 관계, 흐름, 상태 전이가 시각화된다.
- 코드와 설명이 연결된다.
- 일반 마크다운보다 정보 계층과 스캔 가능성이 높다.

### B. 코드 리뷰와 회의 안건 자료 생성

입력 예:

- Git diff
- PR 설명
- 여러 대안이 있는 기술 안건
- 설계 변경안
- 회의 메모

출력 목표:

- 참석자가 짧은 시간 안에 배경, 변경점, 위험, 결정할 사항을 파악한다.
- Before/After, 핵심 diff, 영향 범위, 질문, 추천안이 분리된다.
- 회의 중 화면 공유에 적합하다.

### C. 테스트 과정과 결과 시각화

입력 예:

- JUnit XML
- JSON/CSV 테스트 결과
- 수동 테스트 절차
- 단말·환경별 결과
- 로그와 스크린샷
- 성능 수치

출력 목표:

- 무엇을, 왜, 어떤 환경에서 테스트했는지 보인다.
- 과정, 성공/실패, 분포, 추세, 실패 증거가 연결된다.
- 단순 통계가 아니라 검증 흐름을 눈으로 확인할 수 있다.

### D. 상사·동료·외부 대상 보고서 생성

입력 예:

- 업무 메모
- 분석 결과
- 기술 조사
- 이슈 대응 기록
- 개선 제안

출력 목표:

- 대상에 맞는 난이도와 정보량으로 재구성한다.
- 요약, 근거, 영향, 선택지, 추천, 다음 행동이 명확하다.
- 읽는 사람이 문서를 탐색하는 경험 자체가 좋다.

---

## 3. 제품 철학

Sensemark는 “예쁜 HTML 생성기”가 아니다. 다음 원칙을 코드와 디자인에 반영한다.

1. **Legibility before decoration**  
   모든 시각 요소는 이해를 돕거나 판단을 빠르게 해야 한다.

2. **Structure before styling**  
   원본 자료의 질문, 주장, 관계, 증거, 결정 구조를 먼저 만든 뒤 스타일을 적용한다.

3. **One source, one narrative**  
   같은 문서 안에서 요약, 다이어그램, 코드, 테스트 수치가 서로 모순되지 않아야 한다.

4. **Progressive disclosure**  
   결론과 핵심 구조를 먼저 보여주고, 세부 근거는 펼치거나 내려가며 확인하게 한다.

5. **Audience-aware, fact-preserving**  
   대상에 맞게 쉽게 설명하되 사실과 위험을 삭제하거나 왜곡하지 않는다.

6. **Calm, precise, distinctive**  
   과장된 장식, 템플릿 냄새, 무의미한 카드 모음 대신 절제된 편집 디자인과 정밀한 기술 시각화를 사용한다.

7. **Offline and inspectable**  
   결과물은 로컬에서 열리고, 원본과 생성 규칙을 추적할 수 있어야 한다.

8. **Modern, not experimental for its own sake**  
   최신 안정 웹 플랫폼을 적극 활용하되, 새 API를 썼다는 사실 자체를 품질로 착각하지 않는다. 새로운 기술은 의미·성능·접근성을 실제로 개선할 때만 채택한다.

9. **Craft over first-pass generation**  
   AI가 처음 만든 구조와 스타일을 그대로 제출하지 않는다. 시각 계층, 글자 리듬, 정렬, 밀도, 상태 표현, 모바일 동작을 사람이 만든 제품 수준으로 다듬는다.

10. **Performance is part of visual quality**  
    빠른 첫 화면, 안정적인 레이아웃, 즉각적인 상호작용, 부드러운 애니메이션을 디자인 품질의 일부로 취급한다.

제품 수준의 최종 판단 문장은 다음과 같다.

> **Simple, refined, fast, and evidence-aware.**  
> 단순하지만 빈약하지 않고, 세련됐지만 과장되지 않으며, 빠르지만 허술하지 않아야 한다.

---

## 4. MVP의 핵심 제품 형태

MVP를 별도 AI 모델이나 SaaS로 만들지 않는다. 다음 두 계층으로 만든다.

### 4.1 Agent Skill 계층

Codex 또는 Claude Code가 원본을 읽고 다음을 수행한다.

- 사용 목적과 독자를 판단한다.
- 네 가지 모드 중 하나를 선택한다.
- 핵심 질문과 내러티브를 설계한다.
- 적절한 시각 블록을 선택한다.
- 구조화된 `sensemark.spec.json`을 작성한다.
- 렌더러와 QA 명령을 실행한다.
- 문제를 발견하면 spec이나 구현을 수정하고 다시 검증한다.

### 4.2 결정론적 HTML 렌더러 계층

순수 로컬 TypeScript 도구가 다음을 수행한다.

- spec 스키마 검증
- 디자인 토큰 적용
- 블록별 HTML/SVG 생성
- 코드 하이라이트와 diff 렌더링
- 차트·다이어그램의 빌드 타임 렌더링
- 단일 HTML 번들 생성
- 접근성·반응형·보안 검증

핵심 원칙은 다음과 같다.

> Agent가 매번 자유롭게 CSS와 전체 HTML을 새로 발명하지 않게 한다.  
> Agent는 **내용, 내러티브, 블록 선택**에 집중하고, 렌더러는 **품질, 일관성, 반응형, 접근성**을 책임진다.

필요한 경우에만 제한된 `custom` 블록을 허용하고, 기본 경로는 정해진 의미 기반 블록을 사용한다.

---

## 5. MVP 범위

### 반드시 포함

- 네 가지 생성 모드: `explain`, `review`, `test`, `report`
- 독립형 단일 HTML 출력
- 한국어와 영어
- 데스크톱, 태블릿, 모바일 반응형
- 라이트 테마 기본, 다크 테마 지원
- 코드 하이라이트
- diff 시각화
- 흐름도 또는 시퀀스 시각화
- 테스트 요약과 결과 매트릭스
- 비교, 타임라인, 발견사항, 결정, 액션 블록
- 로컬 파일 기반 작업
- Codex Agent Skill
- Claude Code Agent Skill
- Playwright 기반 시각 QA
- 접근성 자동 검사
- Lighthouse 또는 동급의 성능 회귀 검사
- 최신 안정 Web Platform/Baseline 타깃
- Google Fonts 기반의 현대적 타이포그래피와 로컬 서브셋 번들링
- generic AI 시각 패턴 정적 lint와 스크린샷 검수
- 네 가지 실제 예제

### MVP에서 제외

- 사용자 계정, 서버, 데이터베이스, 협업 SaaS
- 자체 LLM API 호출
- 영상 렌더링
- 프레젠테이션 파일 생성
- DOCX 생성
- 본격적인 PDF 조판 엔진
- 디자인 템플릿 마켓
- 원격 사이트 크롤러
- GitHub App 또는 OAuth
- 실시간 공동 편집

브라우저 인쇄용 CSS는 제공할 수 있지만 PDF를 공식 출력 형식으로 약속하지 않는다.

---

## 6. 네 가지 모드의 내러티브 문법

### 6.1 `explain`

권장 순서:

1. 이 자료가 답하려는 질문
2. 3줄 이내 핵심 설명
3. 전체 mental model 또는 아키텍처
4. 단계별 흐름
5. 코드 또는 설계의 핵심 지점
6. 예외와 오해하기 쉬운 점
7. 용어 정리
8. 원본 출처

### 6.2 `review`

권장 순서:

1. 이번 리뷰에서 결정하거나 확인할 것
2. 변경 요약
3. Before / After
4. 핵심 diff와 주석
5. 영향 범위
6. 위험과 trade-off
7. 테스트 증거
8. 열린 질문
9. 추천안 또는 결정 요청

### 6.3 `test`

권장 순서:

1. 테스트 목적과 성공 기준
2. 환경과 범위
3. 테스트 과정
4. 전체 결과 요약
5. 환경·케이스별 매트릭스
6. 수치 또는 추세
7. 실패 케이스와 증거
8. 제한사항
9. 다음 테스트 또는 조치

### 6.4 `report`

권장 순서:

1. Executive summary
2. 배경과 문제
3. 핵심 발견
4. 영향
5. 근거
6. 가능한 선택지
7. 추천과 이유
8. 위험과 반대 의견
9. 필요한 결정 또는 다음 행동

모드별 순서는 강제 템플릿이 아니라 기본 문법이다. 자료 특성상 더 나은 순서가 있으면 이유를 기록하고 변경할 수 있다.

---

## 7. Sensemark Spec

### 7.1 기본 형태

`SensemarkSpec`을 Zod와 JSON Schema로 정의한다. canonical 파일은 `sensemark.spec.json`으로 한다.

예시:

```json
{
  "version": "0.1",
  "meta": {
    "title": "VPN 전환 시 DNS 복구 로직 리뷰",
    "mode": "review",
    "audience": "engineering",
    "language": "ko",
    "theme": "light",
    "density": "comfortable",
    "confidentiality": "internal"
  },
  "sources": [
    {
      "id": "diff",
      "label": "Current working tree diff",
      "path": "artifacts/change.diff"
    }
  ],
  "narrative": {
    "question": "이 변경이 VPN 전환 직후의 네트워크 오류를 안전하게 해결하는가?",
    "summary": "네트워크 변경 시 연결 상태를 재초기화하되 중복 재시도를 제한한다.",
    "takeaways": [
      "오류 복구 범위가 명시적으로 분리되었다.",
      "동시성 테스트가 추가로 필요하다."
    ]
  },
  "sections": [
    {
      "id": "overview",
      "type": "summary",
      "title": "변경의 핵심은 연결 상태의 명시적 재초기화다",
      "body": "...",
      "sourceRefs": ["diff"]
    },
    {
      "id": "change-flow",
      "type": "flow",
      "title": "VPN 전환 이후 복구 흐름",
      "nodes": [],
      "edges": []
    },
    {
      "id": "decision",
      "type": "decision",
      "title": "병합 전 동시성 테스트를 추가한다",
      "status": "recommended",
      "rationale": "..."
    }
  ]
}
```

### 7.2 공통 메타데이터

최소 지원:

- `title`
- `subtitle?`
- `mode`: `explain | review | test | report`
- `audience`: `self | engineering | qa | manager | executive | external`
- `language`: `ko | en`
- `theme`: `light | dark | auto`
- `density`: `comfortable | compact`
- `confidentiality`: `public | internal | confidential`
- `createdAt?`: 기본적으로 출력 재현성을 위해 비활성화
- `sources[]`
- `narrative.question`
- `narrative.summary`
- `narrative.takeaways[]`

### 7.3 출처와 불확실성

가능한 블록에는 다음을 지원한다.

- `sourceRefs[]`
- `confidence`: `verified | inferred | unknown`
- `notes?`

`inferred`나 `unknown`을 `verified`처럼 보이게 렌더링하면 안 된다. 출처가 없는데 출처가 있는 것처럼 만들지 않는다.

---

## 8. 초기 블록 라이브러리

MVP에 다음 의미 기반 블록을 구현한다.

1. `cover`
2. `summary`
3. `prose`
4. `key-points`
5. `annotated-code`
6. `diff`
7. `flow`
8. `sequence`
9. `timeline`
10. `comparison`
11. `architecture`
12. `test-summary`
13. `test-matrix`
14. `chart`
15. `finding`
16. `risk`
17. `decision`
18. `actions`
19. `glossary`
20. `source-note`

각 블록에는 다음이 있어야 한다.

- Zod 스키마
- TypeScript 타입
- 렌더 함수
- 기본/경계/오류 테스트
- 접근 가능한 텍스트 구조
- 모바일 표현
- 인쇄 표현
- 예제 fixture

블록을 단순한 카드 컴포넌트 모음으로 만들지 않는다. 콘텐츠 의미에 따라 다음처럼 서로 다른 구조를 사용한다.

- 긴 설명: 문서형 흐름
- 코드: 넓은 breakout 영역
- 주석: 본문 옆 note rail 또는 line annotation
- 테스트 결과: 표와 요약 밴드
- 결정: 명시적인 decision strip
- 위험: 우선순위와 대응이 연결된 구조
- 다이어그램: 전체 폭 캔버스

---

## 9. 디자인 연구와 독립 디자인 시스템

### 9.1 연구 대상

구현 전에 다음을 최신 공식 문서와 공개 자료로 조사한다.

- Apple Human Interface Guidelines의 목적, 단순성, 유연성, 정교함, 익숙함
- Microsoft Fluent 2의 플랫폼 적응성, 집중, 포용성, 토큰 계층
- WCAG 2.2의 대비, 리플로우, 텍스트 확대, 키보드 접근성
- Web Platform Baseline의 Widely Available / Newly Available 구분
- `getdesign.md`의 Apple, Linear, Notion, Mintlify, GitBook, Vercel 등 DESIGN.md 분석
- Google Fonts의 현재 카탈로그, 변수 폰트, 한국어 지원, 라이선스, 로딩 전략
- 최근의 기술 문서, 코드 리뷰 도구, 테스트 리포트, 데이터 스토리텔링 제품의 실제 정보 구조
- 최신 브라우저에서 가능한 container query, subgrid, cascade layer, native popover/dialog, View Transition, Web Animations 등의 적용 가능성

`getdesign.md`는 디자인 원칙을 조사하는 참고 자료로 사용하되, 특정 브랜드 분석 파일을 그대로 제품 디자인으로 채택하지 않는다. 공식 디자인 가이드와 독립 분석을 구분한다.

### 9.2 디자인 연구 산출물

먼저 `docs/design-audit.md`를 작성한다.

포함할 내용:

- 각 레퍼런스에서 배울 원칙
- Sensemark에 적용하지 않을 패턴
- 정보 밀도와 가독성 비교
- 한국어와 영어 타이포그래피 고려
- 코드·표·다이어그램이 긴 경우의 레이아웃
- 라이트/다크 모드 전략
- 브랜드 복제 위험과 회피 기준
- Google Fonts 후보의 글자폭, x-height, 숫자, 한글 조화, 로딩 비용 비교
- 사용하려는 최신 CSS·HTML 기능의 Baseline 상태와 fallback

그다음 동일한 샘플 콘텐츠로 세 개의 정적 프로토타입을 만든다.

1. Quiet Editorial
2. Precision Workbench
3. Technical Manuscript

세 프로토타입은 색만 바꾼 버전이 아니라 정보 계층, 폭, 타이포그래피, 시각 리듬이 달라야 한다. 스크린샷과 장단점을 사용자에게 제시하고 한 방향을 선택받는다. 사용자가 선택하지 않으면 목적 적합성이 가장 높은 방향을 추천하고 그 이유를 기록한다.

선택 후 `DESIGN.md`를 Sensemark 고유 디자인 시스템의 단일 원천으로 작성한다.

### 9.3 디자인 토큰

최소 토큰 계층:

- primitive/global tokens
- semantic/alias tokens
- component tokens는 필요한 경우에만

예시 범주:

- color: canvas, surface, text, muted, border, accent, status
- typography: display, title, heading, body, label, code, metric
- spacing
- measure/content width
- radius
- stroke
- elevation
- motion
- breakpoint
- z-index

렌더러의 CSS에는 임의 hex, 임의 radius, 임의 shadow를 흩뿌리지 않는다. 모든 값은 토큰을 참조한다. 색 토큰은 가능한 경우 OKLCH 기반으로 설계하되, 최종 대비는 실제 렌더에서 검증하고 필요한 fallback을 제공한다.

### 9.4 글꼴: 최신 Google Fonts 기반

기본 타이포그래피는 **Google Fonts 카탈로그에서 제공되는 현대적인 오픈 라이선스 폰트**를 사용한다. 시스템 폰트만 사용한 임시 결과를 최종 디자인으로 제출하지 않는다.

2026-07 기준 기본 후보는 다음과 같다. 구현 시점에 Google Fonts 공식 카탈로그와 라이선스를 다시 확인하고, 더 적합한 최신 후보가 있으면 `docs/design-audit.md`에 비교 근거를 남긴 뒤 교체할 수 있다.

- 영문/UI/숫자 기본: `Geist`
- 한국어 본문 fallback: `IBM Plex Sans KR`
- 코드/터미널: `Geist Mono`
- 대안 후보: `Instrument Sans`, `Manrope`, `DM Sans`, `Plus Jakarta Sans`

권장 스택 예시:

```css
:root {
  --font-sans: "Geist", "IBM Plex Sans KR", system-ui, -apple-system,
    BlinkMacSystemFont, "Segoe UI", sans-serif;
  --font-mono: "Geist Mono", ui-monospace, "SFMono-Regular", Consolas,
    "Liberation Mono", monospace;
}
```

글꼴 구현 규칙:

1. Google Fonts 원격 CSS를 페이지 실행 시 무조건 호출하지 않는다.
2. 기본 오프라인 프로필은 공식 배포본 또는 검증된 패키지에서 WOFF2를 확보해 **빌드 타임에 로컬 서브셋**하고 결과 HTML에 임베딩한다.
3. 문서 본문을 Google Fonts `text=` 쿼리로 전송하지 않는다. 회사 문서 내용이 외부 요청에 노출될 수 있기 때문이다.
4. 한국어 전체 글리프를 무조건 통째로 포함해 수 MB를 추가하지 않는다. 실제 산출물의 글리프 집합을 추출해 로컬에서 subset한다.
5. 변수 폰트가 실질적으로 파일 수와 품질을 개선하면 사용하되, 사용하지 않는 축과 범위는 포함하지 않는다.
6. `font-display: swap` 또는 프로젝트 성격에 맞는 값을 사용하고, fallback metrics·`size-adjust`·명시적 line-height로 CLS를 줄인다.
7. 본문은 400/450/500 중심, 제목은 600/650/700 범위 등 실제 사용하는 굵기만 포함한다.
8. 숫자·테스트 표에는 `font-variant-numeric: tabular-nums`를 적용한다.
9. 제목에는 지원되는 환경에서 `text-wrap: balance`, 본문에는 `text-wrap: pretty`를 progressive enhancement로 적용한다.
10. Apple SF Pro, Microsoft Segoe UI 등 배포 권한이 없는 폰트 파일을 저장소에 포함하지 않는다.
11. 모든 폰트 라이선스를 `THIRD_PARTY_NOTICES.md`에 기록한다.
12. 한 화면에서 본문 폰트 계열은 원칙적으로 하나, 코드 폰트 계열은 하나만 사용한다. “트렌디함”을 이유로 폰트를 여러 개 섞지 않는다.

### 9.5 시각 완성도 기준

다음 조건을 충족하지 않으면 기능적으로 동작해도 완료가 아니다.

- 타이포그래피 계층이 글자 크기뿐 아니라 weight, measure, line-height, spacing으로 구분된다.
- 8px 또는 이에 준하는 일관된 공간 리듬이 유지된다.
- 본문, 코드, 표, 다이어그램의 정렬 기준이 서로 연결된다.
- 빈 공간은 의도적으로 사용되며, 정보 부족을 숨기기 위한 과도한 여백이 아니다.
- 테두리는 구조를 설명할 때만 사용하고, 임의의 장식 프레임이 없다.
- 라이트 모드와 다크 모드 모두 표면 단계가 2~3개를 넘지 않는다.
- 핵심 결론은 시각적으로 먼저 보이지만 마케팅 문구처럼 과장되지 않는다.
- 전체 화면, 긴 문서 중간, 모바일 끝부분까지 동일한 완성도를 유지한다.
- 첫 번째 스크린샷에서 어색한 정렬·큰 빈 공간·밀도 불균형·잘린 콘텐츠가 하나라도 있으면 재작업한다.

---

## 10. “AI가 만든 흔한 HTML”을 피하기 위한 하드 규칙

다음은 기본 금지 또는 강한 회피 규칙이다.

1. 업무 문서를 SaaS 랜딩페이지처럼 만들지 않는다.
2. 첫 화면을 거대한 마케팅 hero와 CTA로 채우지 않는다.
3. 모든 정보를 둥근 카드 그리드로 분해하지 않는다.
4. 의미 없는 보라색·파란색 그라데이션을 기본값으로 사용하지 않는다.
5. glassmorphism, 과한 blur, neon glow, 깊은 shadow를 기본값으로 사용하지 않는다.
6. 모든 라벨을 pill로 만들지 않는다.
7. 장식용 아이콘, sparkle, 별표, AI magic wand, 로봇 아이콘을 남발하지 않는다.
8. 배지와 상태색은 실제 의미가 있을 때만 쓴다.
9. 한 문서에서 accent color는 원칙적으로 하나만 쓴다. 상태색은 예외다.
10. 카드가 아닌 문단, 구분선, 여백, 정렬로 해결할 수 있으면 카드로 만들지 않는다.
11. 같은 레이아웃을 모든 모드에 반복하지 않는다.
12. 모든 section을 같은 높이와 같은 모서리로 만들지 않는다.
13. 긴 본문을 과도하게 넓히지 않는다. 코드·표·다이어그램만 의도적으로 breakout한다.
14. 대시보드가 아닌데 대시보드처럼 KPI 카드 네 개를 먼저 보여주지 않는다.
15. 애니메이션은 상태 변화나 관계 설명에만 사용한다.
16. `prefers-reduced-motion`을 존중한다.
17. 색만으로 성공/실패를 구분하지 않는다.
18. 본문 제목은 가능하면 “라벨”보다 완결된 주장 또는 결론 문장으로 쓴다.
19. 원본 구조와 상관없는 시각적 장식을 넣지 않는다.
20. 특정 브랜드의 로고, 자산, 독점 폰트, 고유 컴포넌트를 복제하지 않는다.
21. **좌측에 의미 없는 괄호·브래킷 모양 테두리를 사용하지 않는다.** 예를 들어 section 왼쪽에 `[` 또는 `┌ │ └`처럼 보이는 세로선과 위·아래 갈고리를 `::before`/`::after`, border 조합, SVG로 그리는 패턴을 금지한다.
22. oversized `{ }`, `[ ]`, `</>`, terminal prompt 등을 장식 배경이나 문단 프레임으로 사용하지 않는다. 실제 코드 의미가 있을 때만 콘텐츠로 표시한다.
23. 좌측 세로선은 blockquote, timeline, 실제 계층 관계 등 의미가 명확할 때만 사용하고, 단순한 “AI 보고서 느낌”을 내기 위해 사용하지 않는다.
24. 장식용 dot-grid, 무작위 gradient orb, 격자 배경, noise texture, corner glow를 기본값으로 사용하지 않는다.
25. 제목 옆에 무의미한 짧은 선, 점 세 개, 번호 박스, 작은 캡슐을 자동으로 붙이지 않는다.
26. 의미 없는 hover lift, 카드 떠오름, 3D tilt, mouse-follow 효과를 사용하지 않는다.
27. 같은 크기의 아이콘과 짧은 설명을 반복한 3열 feature grid를 업무 문서 기본 구조로 사용하지 않는다.
28. 내용이 적다는 이유로 글자와 여백을 비정상적으로 키우지 않는다.
29. 브라우저 기본 스타일을 거의 그대로 둔 “기능만 동작하는” 결과나, 반대로 장식을 덧댄 저품질 결과를 제출하지 않는다.
30. 첫 렌더 결과를 최종본으로 제출하지 않는다.

자동 lint에 다음 검사를 추가한다.

- pseudo-element에서 `border-left`와 `border-top`/`border-bottom`을 결합한 장식 bracket 패턴
- 콘텐츠가 아닌 `content: "["`, `content: "{"`, `content: "</>"` 사용
- 과도한 radius·shadow·gradient 사용 횟수
- 의미 없는 pill 비율
- 동일 카드 컴포넌트의 과도한 반복

정적 lint가 놓칠 수 있으므로 데스크톱·모바일 스크린샷을 사람이 직접 보고 최종 판단한다.

---

## 11. 레이아웃 문법

한 개의 고유 디자인 시스템 안에서 모드별 구성만 다르게 한다.

### Editorial

`explain`, 일부 `report`에 사용한다.

- 읽기 폭 중심
- 강한 제목 계층
- note rail
- 다이어그램과 코드만 넓은 breakout
- 충분한 여백과 정교한 구분선

### Workbench

`review`에 사용한다.

- 약간 높은 정보 밀도
- 요약과 결정 사항이 상단에 고정적으로 보임
- Before/After, diff, 위험, 질문을 빠르게 오갈 수 있음
- 2열은 비교 관계가 명확할 때만 사용

### Lab

`test`에 사용한다.

- 결과 band, 환경, 과정, matrix, failure evidence의 순서
- 상태색은 의미 기반으로 제한
- 표는 모바일에서 카드로 붕괴시키기보다 필요한 경우 가로 스크롤과 고정 첫 열을 사용
- 수치만 강조하지 않고 기준과 해석을 함께 표시

### Briefing

`report`에 사용한다.

- 요약, 영향, 선택지, 추천, decision request가 명확함
- 경영진용은 세부 코드를 숨기되 근거 링크는 유지
- 외부용은 기밀 경로와 내부 식별자를 제거

---

## 12. 기술 구성

### 12.1 기술 최신성 정책

구현 시점의 최신 안정 버전과 라이선스를 공식 문서에서 확인한 뒤 정확한 버전을 lockfile에 고정한다. 프리릴리스, canary, experimental 채널은 검증용 브랜치 외에는 기본값으로 사용하지 않는다.

기본 방향:

- 현재 Active LTS Node.js
- 현재 최신 안정 TypeScript, `strict` 및 추가 엄격 옵션
- 현재 최신 안정 Vite, 프로덕션 빌드는 modern ESM과 tree-shaking 사용
- `pnpm`과 lockfile
- 현재 최신 안정 Playwright·Vitest
- 브라우저 타깃은 구현 시점의 `baseline-widely-available`
- 라이브러리는 ESM-first 패키지를 우선

`docs/technology-audit.md`에 다음을 기록한다.

- 조사 날짜
- 선택한 버전
- 공식 릴리스 문서
- Node·브라우저 지원 범위
- 라이선스
- 번들 크기와 제거 가능성
- 대안과 선택 이유

### 12.2 소스 코드 품질 기준

- TypeScript strict를 사용한다.
- 가능하면 `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `useUnknownInCatchVariables` 등을 활성화한다.
- `any`는 경계 어댑터 외에는 사용하지 않고, 사용 시 이유를 주석으로 남긴다.
- ESM을 기본으로 사용하고 CommonJS는 외부 호환 경계에만 격리한다.
- 오래된 target으로 불필요하게 downlevel하지 않는다.
- public API와 spec 타입은 schema에서 파생해 중복 정의를 줄인다.
- HTML 문자열 연결을 여러 곳에 흩뿌리지 않고 escape·sanitization 경계를 중앙화한다.
- DOM 조작 코드는 역할별 모듈로 분리하고 event listener 정리를 보장한다.
- 접근성, 성능, 보안에 영향을 주는 magic value를 직접 넣지 않는다.
- 모든 핵심 renderer와 block에 unit test, fixture test, browser test를 둔다.

### 12.3 현대적 HTML·CSS 기준

최종 HTML은 다음 원칙을 따른다.

- 의미에 맞는 `main`, `nav`, `article`, `section`, `header`, `footer`, `figure`, `figcaption`, `table`, `details`, `summary`, `dialog` 등 native semantic element를 우선한다.
- native element로 해결 가능한 기능을 ARIA와 `div`로 재구현하지 않는다.
- CSS cascade layer(`@layer`)로 reset, tokens, base, layout, components, utilities, overrides의 우선순위를 명시한다.
- CSS custom properties와 semantic tokens를 사용한다.
- logical properties(`margin-inline`, `padding-block` 등)를 우선한다.
- container queries와 subgrid는 Baseline 지원 상태를 확인하고, 실제 레이아웃 단순화에 도움이 될 때 사용한다.
- CSS nesting은 현재 안정 도구 체인과 브라우저 타깃에서 검증된 방식으로 사용한다.
- `clamp()`, `min()`, `max()`, `minmax()`, fluid type/spacing을 제한적으로 사용해 화면 크기별 급격한 변화 대신 자연스러운 스케일을 만든다.
- OKLCH, `color-mix()`, `text-wrap`, `:has()`, `@property` 등은 지원 상태와 fallback을 확인한다.
- `@supports`와 feature detection으로 Newly Available 기능을 progressive enhancement로 제공한다.
- print stylesheet를 별도 품질 기준으로 관리한다.
- 인라인 스타일 남발, `!important` 남발, 과도한 specificity를 금지한다.

### 12.4 렌더링 아키텍처

최종 산출물은 서버 렌더링이 필요한 앱이 아니라 **사전 렌더된 semantic HTML**을 중심으로 한다.

- 정적 콘텐츠는 빌드 타임에 HTML/SVG로 생성한다.
- Shiki는 빌드 타임 코드 하이라이트에 사용한다.
- Mermaid는 빌드 타임에 sanitized SVG로 변환한다.
- Vega-Lite는 가능한 경우 빌드 타임 SVG로 변환한다.
- 정적 block은 hydration하지 않는다.
- JavaScript는 필터, 탭, 복사, 접기, 테마 등 실제 상호작용이 필요한 작은 island에만 포함한다.
- React/Vue/Svelte 런타임을 결과 HTML에 기본 포함하지 않는다.
- Web Components는 재사용 가능한 상태형 UI에 명확한 이점이 있을 때만 사용하며, 모든 block을 custom element로 만들지 않는다.
- JS는 native ESM, tree-shaking, code splitting 또는 기능별 inline chunk를 사용한다.
- event delegation, passive listener, `AbortController` 기반 정리를 사용한다.
- DOM read/write를 배치해 layout thrashing을 피한다.

### 12.5 의존성 기본 제안

현재 안정 버전과 라이선스를 확인한 뒤 설치한다.

- CLI: `commander` 또는 동급의 경량 도구
- schema: `zod` + JSON Schema export
- Markdown parsing: unified/remark 계열 또는 동급 도구
- sanitization: 검증된 HTML sanitizer
- code highlighting: Shiki, build-time
- diff parsing: 검증된 diff 라이브러리
- diagram: Mermaid build-time SVG 또는 제한된 자체 SVG renderer
- chart: Vega-Lite build-time SVG 또는 제한된 자체 chart renderer
- SVG 최적화: SVGO 또는 동급 도구
- browser QA: Playwright
- accessibility: axe-core + Playwright
- tests: Vitest
- CSS 정적 검사: Stylelint 또는 자체 AST lint

의존성 선택 전 다음을 비교한다.

- 유지보수 상태
- 라이선스
- 번들 크기
- Node 호환성
- 오프라인 렌더 가능 여부
- 보안 이슈
- single-file HTML에 미치는 영향
- 대체 가능한 native Web Platform 기능

### 12.6 성능 아키텍처

- critical content를 HTML에 사전 렌더한다.
- 초기 화면에 필요한 CSS를 최소화하고, 사용하지 않는 CSS를 제거한다.
- 사용자 이미지에는 명시적 width/height 또는 aspect-ratio를 넣어 layout shift를 막는다.
- 이미지 변환이 가능하면 SVG, AVIF, WebP를 적절히 사용하고 원본 의미를 훼손하지 않는다.
- 화면 아래의 무거운 이미지와 미디어는 lazy load한다.
- 긴 문서에서 `content-visibility`를 사용할 경우 검색, 인쇄, screenshot, 접근성에 문제가 없는지 검증한다.
- 대규모 테스트 matrix는 전체 DOM을 무조건 생성하지 않고 필터·페이지·가상화 중 가장 접근 가능한 방식을 선택한다.
- 애니메이션은 `transform`과 `opacity` 중심으로 만들고 layout property animation을 피한다.
- 60fps를 목표로 하고 normal interaction에서 50ms를 넘는 long task를 만들지 않는다.
- 불필요한 observer, scroll handler, resize handler를 두지 않는다.
- 성능 최적화 때문에 정보나 시각 계층을 삭제하지 말고, build-time 작업과 progressive rendering으로 해결한다.

### 12.7 모션과 전환

- 기본 모션은 120~240ms 범위의 짧고 낮은 진폭을 사용한다.
- motion token으로 duration, easing, distance를 통제한다.
- Web Animations API 또는 CSS transition을 우선한다.
- View Transition API는 화면 상태 변화의 맥락을 유지하는 데 도움이 되고 fallback이 있을 때만 사용한다.
- 장식적 entrance animation, 스크롤에 따라 요소가 계속 떠오르는 효과, 과한 stagger를 기본값으로 사용하지 않는다.
- `prefers-reduced-motion: reduce`에서는 비필수 모션을 제거한다.

---

## 13. 출력 형식

기본 출력 디렉터리:

```text
sensemark-output/
├── index.html
├── sensemark.spec.json
├── manifest.json
└── qa/
    ├── desktop.png
    ├── tablet.png
    ├── mobile.png
    ├── accessibility.json
    └── performance.json
```

`index.html` 요구사항:

- 네트워크 연결 없이 핵심 문서가 열림
- 외부 추적 스크립트와 임의 CDN 요청 없음
- Google Fonts는 로컬 서브셋 WOFF2를 data URI 또는 명시된 로컬 asset으로 제공
- 모든 CSS와 필요한 JS는 inline 또는 자체 asset으로 포함
- 절대 로컬 경로 유출 금지
- 브라우저 콘솔 오류 없음
- section deep link 지원
- semantic HTML
- 키보드로 모든 interactive 요소 사용 가능
- 라이트/다크 전환은 선택 기능이며, 인쇄는 항상 명확한 라이트 표현
- `file://` 환경에서도 핵심 기능 작동
- JavaScript가 실패해도 본문, 코드, 표, 다이어그램을 읽을 수 있는 progressive enhancement 구조

출력 프로필:

1. `single-file`  
   CSS·JS·실제 사용 글리프만 subset한 폰트를 `index.html`에 임베딩한다.
2. `portable-dir`  
   `index.html`과 해시가 붙은 로컬 asset으로 구성한다. 매우 긴 한국어 문서나 큰 이미지가 있을 때 기본보다 효율적이다.
3. `public-web`  
   공개 콘텐츠에 한해 명시적 동의가 있으면 Google Fonts CSS API를 사용할 수 있다. 회사 내부 문서의 기본값은 아니다.

성능 예산 기본값:

- 사용자 이미지·폰트 제외 HTML+CSS+JS의 minified 전송 크기: 350KB 이하 목표
- 초기 실행 JavaScript: gzip 80KB 이하 목표
- 초기 CSS: gzip 70KB 이하 목표
- critical path의 외부 요청: 오프라인 프로필 0개
- Lighthouse mobile Performance 95 이상 목표
- Lighthouse Accessibility 100 목표
- CLS 0.05 이하 목표
- 대표 fixture에서 TBT 100ms 이하 목표
- 기본 상호작용 응답 p95 100ms 이하 목표
- 콘솔 error와 unhandled rejection 0개

예산을 넘길 경우 품질을 무작정 낮추지 않는다. 원인이 실제 사용자 자료인지, 폰트인지, 렌더러 런타임인지 분리해 보고하고 build-time 렌더링·서브셋·asset 최적화로 먼저 해결한다.

---

## 14. CLI

최소 명령:

```bash
sensemark init
sensemark render ./sensemark.spec.json --out ./sensemark-output
sensemark validate ./sensemark.spec.json
sensemark preview ./sensemark-output/index.html
sensemark qa ./sensemark-output/index.html
sensemark install-skills
sensemark doctor
```

편의 명령은 구현 난이도를 평가한 뒤 추가한다.

```bash
sensemark generate --mode explain ./docs/architecture.md
sensemark generate --mode review ./artifacts/change.diff
sensemark generate --mode test ./test-results/
sensemark generate --mode report ./notes.md --audience manager
```

`generate`는 자체 LLM을 호출하면 안 된다. Agent Skill이 없는 순수 CLI에서는 구조화된 입력 파서와 기본 템플릿까지만 제공한다. 고급 내러티브 구성은 Codex/Claude Code가 spec을 작성하는 방식으로 처리한다.

---

## 15. Codex와 Claude Code Agent Skill

### 15.1 canonical skill

저장소 내 다음 경로를 canonical source로 둔다.

```text
skills/sensemark/
├── SKILL.md
├── references/
│   ├── modes.md
│   ├── design-grammar.md
│   ├── typography.md
│   ├── generic-ai-patterns.md
│   ├── technology-policy.md
│   ├── performance-budget.md
│   ├── block-selection.md
│   ├── spec-reference.md
│   ├── source-handling.md
│   └── quality-gates.md
├── scripts/
│   ├── render.mjs
│   ├── validate.mjs
│   ├── audit-design.mjs
│   ├── audit-performance.mjs
│   └── qa.mjs
└── assets/
    └── starter-spec.json
```

`SKILL.md`는 Open Agent Skills 공통 형식만 사용하고 500줄 이하로 유지한다. 상세 내용은 references로 분리한다.

초기 frontmatter 예시:

```yaml
---
name: sensemark
description: Create polished, self-contained visual HTML artifacts from complex documents, code, review topics, test results, and stakeholder reports. Use when the user wants to understand, review, verify, present, or explain technical material visually. Do not use for marketing landing pages or general web-app development.
---
```

### 15.2 실행 워크플로

Skill은 다음 순서로 동작한다.

1. 요청과 접근 가능한 파일을 확인한다.
2. 독자, 목적, 결정할 사항을 파악한다.
3. 치명적으로 모호한 경우에만 최대 3개 질문을 한다.
4. `explain`, `review`, `test`, `report` 중 모드를 선택한다.
5. 원본을 읽고 사실, 추정, 미확인을 구분한다.
6. narrative plan을 짧게 작성한다.
7. 의미 기반 블록을 선택한다.
8. `sensemark.spec.json`을 생성한다.
9. schema validation을 실행한다.
10. renderer를 실행한다.
11. Playwright로 1920, 1440, 1024, 390px 네 viewport를 캡처한다.
12. overflow, 대비, console error, 접근성, generic AI 패턴, 성능 예산을 검사한다.
13. 실패하면 자동 수정 후 다시 검사한다.
14. 결과 경로, 모드, 핵심 가정, 검증 결과를 사용자에게 보고한다.

### 15.3 설치

`install-skills`는 canonical skill을 다음 위치에 복사한다.

- Codex 프로젝트: `.agents/skills/sensemark/`
- Claude Code 프로젝트: `.claude/skills/sensemark/`

symlink를 기본으로 사용하지 않는다. Windows와 저장소 공유를 고려해 copy + checksum 방식을 사용한다. 생성된 사본에는 직접 수정 금지 주석을 넣고, CI에서 canonical source와 동기화 여부를 확인한다.

사용 예:

```text
Codex: $sensemark 현재 설계 문서를 이해하기 쉬운 HTML로 시각화해줘
Codex: $sensemark 현재 diff를 내일 코드리뷰 회의용으로 만들어줘
Claude Code: /sensemark 이 테스트 결과 폴더를 시각 리포트로 만들어줘
Claude Code: /sensemark 이 분석 메모를 팀장 보고용으로 변환해줘
```

루트 `AGENTS.md`와 `CLAUDE.md`에는 긴 지시를 복제하지 않는다. 다음만 기록한다.

- `DESIGN.md`가 디자인의 단일 원천임
- canonical skill 위치
- 빌드·테스트 명령
- 기밀·보안 원칙

---

## 16. 입력 처리

MVP에서 우선 지원할 로컬 입력:

- Markdown
- plain text
- JSON
- YAML
- CSV
- XML, 특히 JUnit 계열
- unified diff/patch
- 코드 파일
- 로컬 이미지

보안 원칙:

- 분석 대상 코드를 실행하지 않는다.
- Markdown의 raw HTML과 모든 사용자 입력을 sanitize한다.
- SVG를 그대로 신뢰하지 않는다.
- 스크립트, event handler, 위험한 URL scheme을 제거한다.
- 토큰, 비밀번호, private key, 세션 값 패턴을 검사한다.
- 의심되는 비밀값은 기본적으로 마스킹하고 경고한다.
- 사용자의 home directory 절대 경로는 결과에 넣지 않는다.
- 네트워크 요청은 기본 차단한다.

---

## 17. 인터랙션

MVP에서 허용되는 인터랙션:

- 목차 이동
- section 접기/펼치기
- code copy
- Before/After 또는 대안 탭
- 테스트 결과 필터
- 관련 source note 표시
- light/dark 전환
- 큰 다이어그램의 접근 가능한 확대 보기
- 키보드 기반 빠른 섹션 이동

구현 규칙:

- 기본 콘텐츠는 JavaScript 없이도 읽혀야 한다.
- native `details`, `dialog`, `popover` 등은 Baseline 상태와 접근성을 검토한 뒤 사용한다.
- focus 이동, ESC 닫기, focus return, ARIA name을 실제 브라우저에서 검증한다.
- hover는 보조 피드백일 뿐 필수 정보를 숨기는 수단이 아니다.
- 상호작용 상태는 URL hash 또는 명확한 DOM 상태로 설명 가능해야 한다.

금지하거나 후순위로 둘 것:

- 의미 없는 scroll animation
- 과한 parallax
- canvas particle background
- hover하지 않으면 정보를 볼 수 없는 구조
- 자동 재생 애니메이션
- 모바일에서 사용할 수 없는 포인터 전용 UX
- mouse-follow spotlight
- card tilt
- 좌측 bracket border가 움직이는 장식
- 화면 진입 때 모든 section이 순차 fade-up되는 generic effect

---

## 18. QA와 품질 게이트

### 18.1 자동 QA

Playwright로 최소 다음 viewport를 검증한다.

- 1920 × 1080
- 1440 × 900
- 1024 × 768
- 390 × 844

검사 항목:

- 수평 overflow
- 잘린 heading, code, table, diagram
- 요소 겹침
- console error와 unhandled rejection
- failed network request
- 키보드 focus와 tab order
- semantic heading 순서
- 이미지 대체 텍스트
- 색 대비
- 200% 확대 시 사용 가능성
- reduced motion
- print preview 기본 품질
- JavaScript 비활성화 상태의 읽기 가능성
- font fallback 시 layout shift
- 긴 한국어 제목과 긴 영문 식별자

### 18.2 성능 게이트

대표 fixture를 로컬 HTTP 서버로 제공한 뒤 Lighthouse와 Playwright trace를 실행한다.

필수 목표:

- Lighthouse mobile Performance 95 이상
- Accessibility 100
- Best Practices 95 이상
- CLS 0.05 이하
- TBT 100ms 이하
- normal interaction long task 50ms 초과 없음 또는 명시적 사유
- 4개 fixture 모두 console error 0
- 불필요한 런타임 framework chunk 0
- 외부 네트워크 요청 0, `public-web` profile 제외

LCP·INP·CLS의 공식 good threshold를 최소 기준으로 사용하되, 정적 보고서라는 특성을 고려해 내부 목표는 더 엄격하게 둔다. 성능 결과는 `qa/performance.json`과 PR 요약에 남긴다.

### 18.3 시각 회귀 테스트

네 가지 예제 각각 golden screenshot을 관리한다.

- explain architecture
- review PR/diff
- test results
- stakeholder report

변경 시 픽셀 diff만으로 통과시키지 않는다. 의도적 디자인 변경은 스크린샷과 이유를 PR에 기록한다.

다음 generic AI 패턴을 스크린샷 검수 항목으로 명시한다.

- 좌측 괄호·브래킷 테두리
- 카드 과잉
- 보라색/파란색 gradient hero
- pill 과잉
- 무의미한 glow·dot-grid·orb
- 내용보다 큰 장식 숫자
- 섹션마다 반복되는 동일 fade-up
- 어색한 빈 공간과 비대칭 정렬

### 18.4 시각 refinement loop

기능 완료 후 다음 루프를 최소 두 번 수행한다.

1. 네 viewport screenshot 생성
2. 제목만 읽고 정보 흐름 검토
3. paragraph measure, line-height, 간격, 정렬 검토
4. 코드·표·다이어그램의 균형 검토
5. generic AI 패턴 검사
6. 모바일과 다크 모드 검토
7. 수정 후 screenshot 재생성

첫 렌더와 최종 렌더의 차이를 `docs/design-iterations.md`에 간단히 기록한다.

### 18.5 콘텐츠 QA

- 요약이 원본과 모순되지 않는가
- 숫자가 원본과 같은가
- 추정을 사실로 표시하지 않았는가
- audience에 필요한 위험이 삭제되지 않았는가
- 같은 정보를 여러 블록에서 다르게 쓰지 않았는가
- 제목만 읽어도 문서 흐름을 이해할 수 있는가
- 시각 요소마다 설명하려는 질문이 있는가
- 최신 기술을 사용했다는 이유로 불필요하게 복잡해지지 않았는가
- 성능 최적화 과정에서 중요한 근거가 제거되지 않았는가

---

## 19. 저장소 구조

MVP는 우선 단일 패키지로 시작한다.

```text
sensemark/
├── src/
│   ├── cli/
│   ├── spec/
│   ├── ingest/
│   ├── narrative/
│   ├── renderer/
│   ├── blocks/
│   ├── design/
│   ├── security/
│   └── qa/
├── skills/
│   └── sensemark/
├── examples/
│   ├── explain-architecture/
│   ├── review-diff/
│   ├── test-results/
│   └── stakeholder-report/
├── tests/
│   ├── unit/
│   ├── fixtures/
│   ├── visual/
│   └── e2e/
├── docs/
│   ├── product-brief.md
│   ├── decisions.md
│   ├── design-audit.md
│   ├── design-iterations.md
│   ├── technology-audit.md
│   ├── architecture.md
│   └── security.md
├── DESIGN.md
├── AGENTS.md
├── CLAUDE.md
├── README.md
├── package.json
└── tsconfig.json
```

패키지 경계가 실제로 필요해질 때만 monorepo로 전환한다.

---

## 20. 네 가지 데모 fixture

모든 예제는 공개 가능한 합성 데이터로 만든다.

### Example 1: Explain

- 주제: 모바일 SDK 초기화와 서버 정책 확인 흐름
- 포함: mental model, sequence, annotated code, edge cases, glossary

### Example 2: Review

- 주제: 네트워크 재연결 로직 변경
- 포함: before/after, diff, impact, risks, tests, decision request

### Example 3: Test

- 주제: 여러 Android 버전과 단말에서 수행한 탐지 테스트
- 포함: environment, process, pass/fail matrix, chart, failure evidence, limitations

### Example 4: Report

- 주제: 장애 원인 분석과 개선 제안
- 포함: executive summary, timeline, findings, options, recommendation, actions

각 데모에 다음을 포함한다.

- input 자료
- spec
- output HTML
- 세 viewport screenshot
- README의 짧은 설명

---

## 21. 구현 단계

### Phase 0: Discovery

- 현재 저장소 조사
- 최신 공식 문서와 Web Platform Baseline 조사
- 핵심 패키지·Google Fonts·브라우저 지원에 대한 `technology-audit.md` 작성
- 제품 brief 확정
- 이름·라이선스 상태 기록
- 디자인 audit
- 3개 프로토타입 생성
- generic AI 패턴과 좌측 bracket border 금지 기준을 프로토타입에 적용
- 사용자 또는 근거 기반 선택

### Phase 1: Compiler core

- spec schema
- validation
- design token loader
- HTML shell
- summary, prose, source-note 블록
- single-file output
- modern ESM·Baseline target
- Google Fonts 로컬 subset/embedding pipeline

### Phase 2: Core visual blocks

- code, diff
- flow, sequence, timeline
- comparison, architecture
- test summary, matrix, chart
- finding, risk, decision, actions

### Phase 3: Four modes

- mode별 composition planner
- audience별 정보량 조절 규칙
- 한국어/영어
- density/theme

### Phase 4: QA and security

- sanitizer
- secret redaction
- Playwright QA
- axe
- Lighthouse/performance budget
- generic AI design lint
- visual regression과 두 차례 refinement loop
- offline/network test

### Phase 5: Agent Skills

- canonical SKILL.md
- references
- scripts
- Codex/Claude installer
- invocation tests

### Phase 6: Documentation and release

- README
- gallery
- architecture/security docs
- changelog
- license/third-party notices
- release checklist

각 Phase가 끝날 때 동작 가능한 상태를 유지하고 커밋을 작게 나눈다.

---

## 22. 완료 기준

다음을 모두 만족해야 MVP 완료로 본다.

1. 네 가지 fixture가 실제 HTML로 생성된다.
2. 동일 spec은 timestamp를 제외하면 동일한 결과를 만든다.
3. HTML이 외부 네트워크 없이 열린다.
4. 세로·가로 주요 viewport에서 핵심 콘텐츠가 잘리지 않는다.
5. 자동 접근성 검사에서 심각한 오류가 없고 Lighthouse Accessibility 100을 목표로 충족한다.
6. 코드, diff, 흐름, 테스트 matrix, 보고 블록이 실제로 동작한다.
7. 한국어와 영어가 모두 자연스럽게 렌더링된다.
8. Google Fonts 기반 본문·코드 타이포그래피가 실제 산출물에 적용되고, 오프라인 프로필에서는 로컬 subset으로 제공된다.
9. 디자인이 하나의 고유한 `DESIGN.md`와 토큰 시스템을 따른다.
10. 좌측 괄호·브래킷 테두리, 카드 과잉, gradient hero, pill 과잉 등 금지된 generic AI 패턴이 기본 예제에 나타나지 않는다.
11. 첫 렌더 이후 최소 두 차례 시각 refinement를 수행하고 기록한다.
12. 현재 안정 TypeScript·Vite·Playwright 등 선택한 기술의 버전과 근거가 `technology-audit.md`에 기록된다.
13. 결과 HTML이 modern ESM과 Baseline 타깃을 사용하고 ES5·jQuery·불필요한 런타임 framework에 의존하지 않는다.
14. 대표 fixture가 성능 예산을 통과하거나, 초과 이유와 개선 근거가 명시된다.
15. 네 fixture 모두 console error와 unhandled rejection이 없다.
16. Codex에서 `$sensemark`로 사용할 수 있다.
17. Claude Code에서 `/sensemark`로 사용할 수 있다.
18. canonical skill과 설치 사본의 동기화 테스트가 통과한다.
19. `SKILL.md`와 supporting files가 Open Agent Skills 구조를 따른다.
20. README 첫 화면에서 입력과 네 가지 결과를 즉시 이해할 수 있다.
21. 실행한 테스트와 남은 제한사항을 최종 보고서에 정직하게 기록한다.

---

## 23. 최종 보고 형식

작업 완료 후 다음 순서로 보고한다.

1. 구현된 제품 요약
2. 사용자에게 확인받은 결정과 자동 적용한 기본값
3. 최종 디자인 방향과 선택 이유
4. 주요 아키텍처
5. 지원 입력·블록·모드
6. Codex와 Claude Code 설치·사용법
7. 생성된 데모 경로
8. 실행한 기능·접근성·시각·성능 테스트와 결과
9. 최종 패키지·브라우저 타깃·Google Fonts 선택과 근거
10. 첫 렌더 대비 시각 refinement 내용
11. 알려진 제한사항
12. 다음 우선순위 3개
13. 변경 파일과 커밋 또는 PR 정보

완료했다고 말하기 전에 실제로 네 가지 예제를 생성하고 브라우저 QA를 실행한다.
