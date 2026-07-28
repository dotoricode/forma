# Sensemark MVP 작업 시작 프롬프트 · v2

첨부하거나 저장소에 추가된 `sensemark-mvp-agent-build-instructions-v2.md`를 이 프로젝트의 권위 있는 제품·구현 명세로 사용해 Sensemark MVP를 구현하라.

먼저 저장소 전체를 조사하고 기존 코드, 패키지 매니저, 라이선스, 테스트, `AGENTS.md`, `CLAUDE.md`, Agent Skill 구조를 파악하라. 그다음 지시서의 Phase 0부터 순서대로 진행하되, 스캐폴딩이나 계획서에서 멈추지 말고 네 가지 데모가 실제로 생성되고 기능·접근성·시각·성능 QA를 통과하는 동작 가능한 MVP까지 완성하라.

다음 원칙을 지켜라.

1. 되돌리기 어렵거나 법률·보안·제품 범위를 크게 바꾸는 결정만 사용자에게 질문한다. 질문은 한 번에 최대 3개로 묶고 각 항목에 권장 기본값을 제시한다.
2. 사소한 선택은 합리적인 기본값으로 진행하고 `docs/decisions.md`에 근거와 함께 기록한다.
3. 구현 시작일 기준으로 Node.js, TypeScript, Vite, Playwright, Vitest, Shiki, Mermaid, Vega-Lite, Zod, axe-core 및 관련 도구의 **최신 안정 버전, 공식 지원 범위, 라이선스**를 확인하고 `docs/technology-audit.md`에 기록한다. 프리릴리스나 실험 채널을 기본값으로 사용하지 않는다.
4. 브라우저 타깃은 해당 시점의 `baseline-widely-available`로 설정한다. Newly Available 기능은 `@supports`, feature detection, progressive enhancement와 fallback이 있을 때만 사용한다.
5. TypeScript strict, modern ESM, semantic HTML, cascade layers, design tokens, logical properties, container query 등 현재 안정적인 현대 웹 기술을 사용한다. ES5, jQuery, 불필요한 CommonJS, 오래된 boilerplate, 무거운 런타임 프레임워크를 결과 HTML에 포함하지 않는다.
6. 정적 콘텐츠는 build-time HTML/SVG로 사전 렌더하고, JavaScript는 필터·탭·복사·테마처럼 필요한 작은 interactive island에만 사용한다. Shiki, Mermaid, Vega-Lite는 가능한 한 build-time에 처리한다.
7. Apple, Microsoft 또는 getdesign.md의 특정 디자인을 복제하지 않는다. 공식 원칙과 공개 분석을 연구한 뒤 Sensemark만의 `DESIGN.md`와 토큰 시스템을 만든다.
8. 디자인 목표는 **simple + refined + modern**이다. 단순하다는 이유로 허술하거나 브라우저 기본 스타일 같은 결과를 만들지 말고, 세련됐다는 이유로 장식과 효과를 과잉 사용하지 않는다.
9. 다음 generic AI 디자인을 금지한다.
   - SaaS 랜딩페이지형 거대 hero와 CTA
   - 모든 내용을 둥근 카드로 나누는 구조
   - 보라색·파란색 gradient, glow, glassmorphism, dot-grid, gradient orb
   - pill·badge·sparkle·AI 아이콘 남발
   - 내용 없는 fade-up·parallax·hover lift
   - **좌측에 `[` 또는 `┌ │ └`처럼 보이는 괄호·브래킷 테두리**
   - `::before`/`::after`로 세로선과 위·아래 갈고리를 그린 장식 프레임
   - oversized `{}`, `[]`, `</>`를 배경 장식으로 사용하는 효과
10. Google Fonts 카탈로그의 최신 현대적 오픈 폰트를 적용한다. 기본 후보는 `Geist` + `IBM Plex Sans KR`, 코드에는 `Geist Mono`다. 구현 시점에 더 적합한 후보를 공식 카탈로그에서 검증할 수 있으나 선택 근거를 `design-audit.md`에 기록한다.
11. 회사 문서 내용을 Google Fonts `text=` 요청으로 외부 전송하지 않는다. 폰트는 공식 배포본을 로컬에서 WOFF2 subset하고 오프라인 결과에 임베딩한다. 실제 사용하는 glyph, weight, variable axis만 포함하고 라이선스를 `THIRD_PARTY_NOTICES.md`에 기록한다.
12. Agent가 매번 전체 HTML과 CSS를 자유 생성하는 구조가 아니라, `sensemark.spec.json`을 결정론적 렌더러가 semantic HTML로 컴파일하는 구조를 구현한다.
13. 결과물은 로컬·오프라인 우선이며 외부 추적기, 임의 CDN, 자체 LLM API를 사용하지 않는다.
14. canonical Agent Skill을 한 곳에서 관리하고 Codex의 `.agents/skills/sensemark/`와 Claude Code의 `.claude/skills/sensemark/`로 동기화한다.
15. 첫 번째 렌더를 최종본으로 제출하지 않는다. 기능 완료 후 최소 두 차례에 걸쳐 1920, 1440, 1024, 390px viewport의 스크린샷을 검토하고 타이포그래피, 간격, 정렬, 밀도, 모바일, 다크 모드, generic AI 패턴을 수정한다.
16. Lighthouse 또는 동급 도구로 성능을 측정한다. 대표 fixture에서 mobile Performance 95+, Accessibility 100, CLS 0.05 이하, TBT 100ms 이하를 목표로 한다. 성능을 이유로 중요한 정보나 디자인 계층을 삭제하지 말고 build-time rendering, subsetting, asset optimization으로 해결한다.
17. 애니메이션은 CSS transition 또는 Web Animations API를 우선하고 `transform`·`opacity` 중심으로 구현한다. View Transition API는 progressive enhancement일 때만 사용한다. `prefers-reduced-motion`을 반드시 지원한다.
18. 테스트하지 않은 기능을 완료했다고 보고하지 않는다. 실제 실행 명령, 사용한 브라우저, 성능 수치, 실패, 남은 제한사항을 기록한다.
19. 각 Phase가 끝날 때 저장소를 동작 가능한 상태로 유지하고, 변경을 작고 설명 가능한 단위로 나눈다.
20. 작업 중 발견한 범위 충돌은 전체 작업을 중단하지 말고 가장 안전한 MVP 기본값을 적용한 뒤 보고한다.

첫 응답에서는 다음만 제공하라.

- 현재 저장소 조사 결과
- 지시서와 저장소 사이의 충돌 여부
- 최신 기술·브라우저·폰트 조사에서 확인할 항목
- Phase 0에서 수행할 구체적인 작업
- 사용자 결정이 반드시 필요한 질문이 있을 경우에만 최대 3개 질문

그 후 바로 구현을 시작하라. 스캐폴딩에서 멈추지 말고 실제 네 가지 예제와 QA 결과까지 완성하라.
