# OnOrca Docs 기반 Forma HTML 디자인 목표

조사 대상: <https://www.onorca.dev/docs>  
조사일: 2026-07-28  
목적: OnOrca Docs의 정보 밀도, 레이아웃, 타이포그래피, 컨트롤 배치를 Forma가 추구할 HTML 디자인 기준으로 번역한다. 색은 OnOrca의 순수 검정 팔레트를 복제하지 않고 VS Code의 공식 **Default Dark Modern / Default Light Modern** 팔레트로 대체한다.

## 1. 결론

Forma가 흡수해야 할 핵심은 다음 다섯 가지다.

1. **56px 고정 상단 바 + 고정 탐색 레일 + 가운데 문서 열**의 명확한 3영역 구조
2. 4px 단위로 정돈된 **촘촘하지만 답답하지 않은 수직 리듬**
3. DM Sans 계열의 부드러운 본문과 JetBrains Mono의 기술 정보 구분
4. 배경 효과보다 선, 투명도, 글자 명도 차이로 만드는 조용한 계층
5. 검색, 현재 위치, 다음 단계처럼 문서 탐색에 직접 필요한 컨트롤만 눈에 띄게 배치하는 절제

Forma에 그대로 복사하지 않을 부분도 명확하다.

- OnOrca의 `#000000` 중심 색은 VS Code 팔레트로 치환한다.
- 마케팅 사이트용 전역 내비게이션은 Forma 문서의 제목, 모드, 검색, 테마 전환 같은 문서 도구로 바꾼다.
- OnOrca의 756px 본문 폭은 긴 영문에서는 한 줄이 길다. Forma의 본문은 현재 672px 안팎을 유지하고 코드·표·다이어그램만 넓게 펼친다.
- Remix를 결과 HTML의 런타임으로 도입하지 않는다. 시각 품질은 프레임워크가 아니라 토큰, 컴포넌트 규칙, 콘텐츠 폭, 상태 설계에서 나온다.

## 2. 조사 방법과 신뢰도

다음 증거를 함께 사용했다.

- Chrome에서 1440×900 데스크톱 상태를 직접 캡처하고 육안 검수
- 브라우저의 실제 렌더 트리에서 `getComputedStyle()`과 `getBoundingClientRect()`로 크기, 좌표, 폰트, 행간, 여백, 색, 테두리, 반경 측정
- 390×844 반응형 뷰포트에서 동일 항목 재측정
- 배포된 CSS의 `@font-face`, 사용자 정의 속성, 미디어 쿼리 확인
- Forma의 현재 `DESIGN.md`, `src/design/tokens.ts`, 렌더러 구조와 비교
- VS Code 공식 저장소의 Dark Modern / Light Modern 테마 JSON을 색의 원본으로 사용

수치는 조사 시점의 배포 결과를 기준으로 하며 서브픽셀은 읽기 쉽게 반올림했다. 배포 CSS 해시나 GitHub 스타 수처럼 바뀔 수 있는 값은 디자인 규칙으로 취급하지 않는다.

## 3. 화면 구성

### 3.1 데스크톱: 1440px

| 영역 | 실제 수치 | 해석 |
|---|---:|---|
| 뷰포트 | 1440×900px | 기준 측정 화면 |
| 상단 바 | x 0, y 0, w 1440, h 약 56px | `position: fixed`, 전체 폭 |
| 상단 내부 컨테이너 | x 120, w 1200px, 좌우 패딩 16px | `max-width: 1200px`, 중앙 정렬 |
| 왼쪽 사이드바 | x 0, y 56, w 268px, h 900px | 상단 바 아래 고정/스티키 레일 |
| 사이드바 내부 컨트롤 | x 약 15, w 236px | 좌우 약 16px 여백 |
| 문서 그리드 | 268px + 1172px | 사이드바와 메인 영역 |
| 메인 래퍼 | x 444, w 820px | `max-width: 820px`, 메인 영역 안에서 중앙 정렬 |
| 메인 래퍼 패딩 | 좌우 32px, 위 24px, 아래 96px | 실제 문서 열을 756px로 제한 |
| 본문 article | x 476, y 80, w 756px | 상단 바 아래 24px부터 시작 |
| 푸터 | y 약 1787, w 1440px, 위 64px/아래 32px | 본문과 선으로 분리 |
| 푸터 내부 | x 80, w 1280px, 좌우 패딩 16px | `max-width: 1280px` |

핵심은 사이드바 바로 옆에 본문을 붙이지 않는 것이다. 사이드바 끝은 x=268이지만 실제 본문은 x=476에서 시작한다. 이 208px의 여백과 중앙 정렬이 페이지를 도구 화면처럼 유지하면서도 본문을 차분하게 보이게 한다.

Forma 적용 시 권장 구조:

```text
┌──────────────────────── 56px document bar ────────────────────────┐
├──── 268px navigation rail ────┬──────── centered main ────────────┤
│ search / sections / theme     │ 32px │ 672px prose │ 32px        │
│                               │      │ breakout: up to 1024px     │
└───────────────────────────────┴────────────────────────────────────┘
```

OnOrca의 820px 래퍼와 32px 내부 패딩은 좋은 셸 규칙이다. Forma는 그 안에서 일반 문단을 현재의 약 672px로 유지하고, 표·코드·다이어그램만 별도의 breakout 폭을 사용한다.

### 3.2 모바일: 390px

| 영역 | 실제 수치 | 해석 |
|---|---:|---|
| 상단 바 | 390×56px | 데스크톱과 높이 동일 |
| 로고 | x 16, y 약 15, w 약 86px | 왼쪽 고정 |
| Star 요약 버튼 | x 약 114, y 12, w 약 135, h 32px | 모바일에서 주요 보조 행동만 유지 |
| 메뉴 버튼 | x 338, y 10, 36×36px | 오른쪽 16px, 터치 영역 확보 |
| 사이드바 드로어 | 화면의 85%, 331.5px, 최대 380px | 평소 숨김, 오른쪽에서 열림 |
| 메인 래퍼 | w 390px, 좌우 패딩 16px, 위 24px, 아래 80px | 화면 전체를 사용 |
| 모바일 검색 | x 60, w 314px, h 약 34px | 메뉴용 왼쪽 공간을 남긴 상단 검색 행 |
| article | x 16, w 358px | 좌우 16px |
| article 시작 | 문서 그리드 상단에서 80px | 검색 행 다음에 본문 |
| 다음 문서 카드 | w 358px, h 약 73px | 한 열로 전환 |
| 푸터 | 한 열 적층, 위 64px/아래 32px | 간격 체계는 유지 |

반응형 기준은 배포 CSS상 다음과 같다.

- `sm`: 40rem = 640px
- `md`: 48rem = 768px
- `lg`: 64rem = 1024px
- `xl`: 80rem = 1280px
- `2xl`: 96rem = 1536px
- 사이드바는 767px 이하에서 드로어가 된다.

Forma는 현재 `390 / 1024 / 1440 / 1920px` 기준을 갖고 있다. OnOrca의 동작을 흡수하려면 **640px에서 헤더와 다음/이전 카드의 방향을 바꾸고, 768px에서 사이드바를 고정 레일로 전환**하는 두 단계가 필요하다. 1024px 하나로 모바일과 데스크톱을 가르는 것보다 자연스럽다.

## 4. 타이포그래피

### 4.1 실제 글꼴

| 용도 | 실제 글꼴 | 배포 방식 |
|---|---|---|
| 본문, 제목, 내비게이션, 버튼 | `DM Sans`, fallback 보정 폰트 | 가변 WOFF2, weight 100–1000, `font-display: swap` |
| 코드, 단축키 | `JetBrains Mono`, fallback 보정 폰트 | 가변 WOFF2, weight 100–800 |
| 일부 브랜드/디스플레이 용도 | `Space Grotesk` | 가변 WOFF2, weight 300–700 |

OnOrca는 글꼴 파일을 자체 경로에서 제공한다. Forma도 기존 보안 규칙대로 외부 폰트 요청 없이 WOFF2를 로컬 서브셋으로 인라인해야 한다.

Forma 권장 스택:

```css
--font-sans: "DM Sans", "IBM Plex Sans KR", system-ui, sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, monospace;
--font-display: "Space Grotesk", "DM Sans", "IBM Plex Sans KR", sans-serif;
```

DM Sans에는 한글 가독성을 책임질 충분한 글리프가 없으므로 IBM Plex Sans KR을 제거하면 안 된다. 영문 UI와 숫자는 DM Sans, 한글 본문은 IBM Plex Sans KR이 담당하도록 서브셋한다.

### 4.2 크기, 행간, 자간

| 요소 | 데스크톱 | 모바일 | 굵기 | 자간 |
|---|---|---|---:|---:|
| H1 | 36 / 40px | 30 / 36px | 700 | -0.9px / -0.75px |
| 설명형 부제 | 18 / 29.25px | 동일, 필요 시 2줄 | 400 | normal |
| H2 | 20 / 28px | 동일 | 600 | -0.5px |
| 본문/목록 | 15 / 24.375px | 동일 | 400 | normal |
| 본문 strong | 15 / 24.375px | 동일 | 600 | normal |
| 상단 내비게이션 | 13 / 19.5px | 숨김 | 500–600 | normal |
| 사이드바 항목 | 14 / 20px | 드로어에서는 15 / 22.5px | 400 | normal |
| 검색 버튼 | 13 / 약 19px | 13 / 19.5px | 400 | normal |
| 인라인 코드 | 13 / 21.125px | 동일 | 400 | normal |
| 단축키 kbd | 10 / 약 14.3px | 동일 | 400 | normal |
| 이미지 설명 | 12 / 16px | 동일 | 400 | normal |
| 푸터 본문 | 16 / 24px | 동일 | 400 | normal |
| 푸터 섹션 라벨 | 14 / 20px | 동일 | 400 | 1.4px |

Forma에 적용할 때 일반 본문은 한글과 장문 접근성을 위해 **16 / 26px**를 기본으로 삼고, 메타데이터·표·테스트 결과처럼 밀도가 중요한 영역만 15 / 24px를 허용하는 편이 안전하다. H1, H2, 부제의 비율과 자간은 그대로 가져올 수 있다.

## 5. 행간과 수직 리듬

OnOrca는 CSS 변수 `--spacing: .25rem`을 사용한다. 즉 4px가 기본 박자다.

| 간격 | 실제 사용처 |
|---:|---|
| 2px | 연속된 36px 사이드바 행 사이의 시각적 틈 |
| 4px | 콜아웃 제목 아래, 사이드바 그룹 라벨 아래, 작은 radius |
| 6px | 목록 항목 사이 |
| 8px | 버튼 내부 아이콘 간격, 사이드바 행 패딩, 검색 좌우 패딩 |
| 12px | H1/H2 아래 여백, 큰 컴포넌트 radius |
| 16px | 문단 위·아래, 콜아웃/다음 카드 내부 패딩 |
| 20px | 목록의 왼쪽 들여쓰기 |
| 24px | 이미지·콜아웃 위·아래, 메인 래퍼 위 패딩 |
| 32px | 데스크톱 메인 좌우 패딩, 다음 문서 영역의 상단 패딩 |
| 40px | H2 위 여백 |
| 56px | 상단 바 높이 |
| 64px | 다음 문서 영역 위 여백, 푸터 위 패딩 |
| 80px | 모바일 메인 아래 패딩 |
| 96px | 데스크톱 메인 아래 패딩 |

주요 흐름을 실제 좌표로 풀면 다음과 같다.

1. H1: 40px 높이
2. H1 아래: 12px
3. 부제: 29.25px
4. 부제 아래에서 첫 본문까지: 32px
5. 본문: 24.375px 행간, 블록 위·아래 16px
6. 이미지/콜아웃: 블록 위·아래 24px
7. H2: 위 40px, 아래 12px
8. 목록: 위·아래 16px, 항목 사이 6px
9. 마지막 콘텐츠에서 다음 문서 탐색: 위 64px + 구분선 + 안쪽 32px

브라우저의 margin collapse 때문에 H2 아래 12px와 목록 위 16px는 28px로 더해지지 않고 큰 값인 16px가 실제 간격이 된다. Forma에서도 블록 간격을 단순 합산하지 말고, 인접 블록 사이의 최댓값을 쓰는 흐름을 유지해야 과도한 공백이 생기지 않는다.

## 6. 버튼과 컨트롤 위치

### 6.1 상단 바

1440px 화면의 1200px 컨테이너 안에서:

| 컨트롤 | 좌표/크기 | 스타일 |
|---|---:|---|
| 로고 | x 136, y 약 15, 86×25px | 왼쪽 고정 |
| Docs | x 약 726 | 현재 위치, 밑줄과 높은 명도 |
| Changelog | x 약 785 | 28px 안팎의 항목 간 거리 |
| Enterprise | x 약 878 | 중간 내비게이션 |
| 소셜 아이콘 | x 약 969, 1013, 각 16px | 28px 안팎의 클릭 간격 |
| Star 상태 | x 약 1057, w 102px | 아이콘 + 라벨 + 작은 배지 |
| Download | x 약 1187, y 12, 117×32px | 오른쪽 끝, 16px 수평 패딩 |

Download 버튼은 흰 배경/검은 글자, 13px medium, 8px radius다. Forma에서는 이를 **문서의 유일한 1차 행동**에만 사용한다. 예: “내보내기”, “검증 결과 보기”. 테마 전환이나 검색 같은 유틸리티가 같은 시각 무게를 가지면 안 된다.

### 6.2 사이드바

| 컨트롤 | 실제 수치 | 스타일 |
|---|---:|---|
| 검색 | 236×약 33px | padding 6×8px, radius 8px, border 1px 미만의 반투명 선 |
| 일반 행 | 236×36px | padding 8px, 14/20px, radius 12px |
| 들여쓴 행 | 236×36px | padding-left 20px |
| 선택 행 | 236×36px | 흰색 10% 배경, 텍스트 `#FAFAFA` |
| 행 사이 | 2px | 36px 높이 + 38px 다음 y 좌표 |
| 테마 컨트롤 | 약 61×26px | 사이드바 하단 오른쪽, 분할형 아이콘 컨트롤 |

선택 상태는 색상 액센트보다 **표면 명도 차이**로 보여 준다. VS Code 팔레트 적용 후에는 선택 행에 Dark `#2B2B2B`, Light `#E8E8E8`을 사용하고, 포커스 링에만 파란 액센트를 쓴다.

### 6.3 콘텐츠 컨트롤

| 요소 | 실제 수치 | 스타일 |
|---|---:|---|
| 이미지 프레임 | 756px 폭, radius 12px | 8% 흰색 선, 2% 흰색 배경 |
| 이미지 캡션 | 12/16px, padding 8×16px | 본문보다 명도 낮음 |
| 콜아웃 | 756px 폭, padding 16px, margin 24px, radius 12px | 10% 선, 3% 배경 |
| 인라인 코드 | padding 2×4px, radius 4px | 7% 배경, 8% 선 |
| 다음 문서 카드 | padding 16px, radius 12px | 데스크톱 오른쪽 정렬, 모바일 한 열 |

상호작용 컴포넌트의 radius는 4/8/12px 세 단계만 사용한다. 버튼을 무조건 pill로 만들거나 카드마다 그림자를 넣지 않는다.

## 7. 색상 분석과 VS Code 팔레트 치환

### 7.1 OnOrca에서 관찰한 색 사용 방식

OnOrca의 현재 다크 화면은 다음 방식이다.

- 실제 body: `#000000`
- Fumadocs 배경 토큰: `#121212`
- 카드: `#191919`
- 기본 전경: `#EBEBEB`
- 약한 전경: `#B3B3B3CC`
- 선택 배경: 흰색 10%
- 검색 배경: 흰색 5%, 선 흰색 16%
- 카드/이미지 배경: 흰색 2–3%, 선 흰색 8–10%
- 본문: 흰색 70%
- 부제: 흰색 55%
- 링크: 흰색 + 30% 명도의 밑줄

우리가 가져올 것은 “검정” 자체가 아니라 **2~3단계 표면, 낮은 채도의 선, 제한된 액센트**라는 원리다.

### 7.2 Forma Dark — VS Code Default Dark Modern

원본: [VS Code `dark_modern.json`](https://github.com/microsoft/vscode/blob/main/extensions/theme-defaults/themes/dark_modern.json)

| Forma 의미 토큰 | VS Code 원본 역할 | 값 |
|---|---|---:|
| `--color-canvas` | `editor.background` | `#1F1F1F` |
| `--color-surface` | `sideBar.background` | `#181818` |
| `--color-surface-raised` | `input.background` | `#313131` |
| `--color-surface-hover` | secondary hover / border layer | `#2B2B2B` |
| `--color-text` | `foreground` | `#CCCCCC` |
| `--color-text-strong` | active tab / heading | `#FFFFFF` |
| `--color-text-muted` | inactive panel/title | `#9D9D9D` |
| `--color-border` | workbench border | `#2B2B2B` |
| `--color-border-strong` | input border | `#3C3C3C` |
| `--color-accent` | focus/button/progress | `#0078D4` |
| `--color-accent-strong` | button hover | `#026EC1` |
| `--color-link` | text link | `#4DAAFC` |
| `--color-on-accent` | button foreground | `#FFFFFF` |
| `--color-success` | added gutter | `#2EA043` |
| `--color-danger` | error/deleted gutter | `#F85149` |
| `--color-warning` | find match family | `#9E6A03` |

Dark의 표면 순서는 `#181818` chrome → `#1F1F1F` canvas → `#313131` raised다. OnOrca처럼 완전한 검정과 불투명도만으로 층을 만들지 않기 때문에 장시간 읽기에 더 부드럽다.

### 7.3 Forma Light — VS Code Default Light Modern

원본: [VS Code `light_modern.json`](https://github.com/microsoft/vscode/blob/main/extensions/theme-defaults/themes/light_modern.json)

| Forma 의미 토큰 | VS Code 원본 역할 | 값 |
|---|---|---:|
| `--color-canvas` | `editor.background` | `#FFFFFF` |
| `--color-surface` | `sideBar.background` | `#F8F8F8` |
| `--color-surface-raised` | dropdown/input background | `#FFFFFF` |
| `--color-surface-hover` | list hover | `#F2F2F2` |
| `--color-surface-selected` | active selection | `#E8E8E8` |
| `--color-text` | `foreground` | `#3B3B3B` |
| `--color-text-strong` | heading/activity foreground | `#1F1F1F` |
| `--color-text-muted` | inactive foreground | `#616161` |
| `--color-border` | workbench border | `#E5E5E5` |
| `--color-border-strong` | input border | `#CECECE` |
| `--color-accent` | focus/button/progress | `#005FB8` |
| `--color-accent-strong` | button hover | `#0258A8` |
| `--color-link` | text link | `#005FB8` |
| `--color-on-accent` | button foreground | `#FFFFFF` |
| `--color-success` | added gutter | `#2EA043` |
| `--color-danger` | error/deleted gutter | `#F85149` |
| `--color-warning` | find match family | `#9E6A03` |

Light의 표면 순서는 `#F8F8F8` chrome → `#FFFFFF` canvas이며, raised 요소는 색을 더 밝게 만들 수 없으므로 `#CECECE` 선과 약한 그림자 대신 선명한 경계로 구분한다.

### 7.4 상태 색 사용 규칙

- 파랑은 링크, 포커스, 선택된 핵심 행동에만 사용한다.
- 성공/경고/실패는 테스트, 리스크, diff처럼 의미가 있는 데이터에만 사용한다.
- 현재 사이드바 항목은 파란 채우기 대신 중립 선택 표면을 사용한다.
- H1/H2는 액센트 색이 아니라 강한 전경색을 사용한다.
- 다크/라이트 모두 한 화면에서 표면은 최대 세 단계만 노출한다.
- 텍스트 위계를 불투명도 계산에 의존하지 말고 의미 토큰으로 고정한다. 출력과 스크린샷 비교가 더 안정적이다.

## 8. 구성과 시선 흐름 분석

### Linearity

사용자는 왼쪽 탐색 → 가운데 제목 → 요약 문장 → 설명 → 시각 자료 → 세부 섹션 → 다음 문서 순으로 한 방향으로 이동한다. 오른쪽 TOC를 두지 않아 시선이 갈라지지 않는다.

### Intentionality

강한 표면은 검색, 현재 페이지, 주요 CTA, 콜아웃에만 사용한다. 나머지는 선과 텍스트 명도만 바뀐다. 장식적 카드나 그라데이션이 없기 때문에 기술 문서의 의도가 분명하다.

### Focus

H1 36px와 큰 제품 이미지가 첫 화면의 초점을 만든다. 상단 바 13px, 사이드바 14px, 본문 15px로 주변 UI의 목소리를 낮춘다.

### Tension

왼쪽의 조밀한 탐색 레일과 가운데의 넓은 여백이 대비를 만든다. 본문 자체는 대칭에 가깝지만 전체 화면은 사이드바 때문에 비대칭이며, 이 비대칭이 도구다운 긴장감을 준다.

### Forma에 맞는 번역

- `workspace`: OnOrca 셸을 가장 직접적으로 반영한다. 고정 레일, 56px 문서 바, 조밀한 증거 블록을 사용한다.
- `guide`: 동일한 셸을 쓰되 본문 폭을 더 좁게 하고 단계·검증·문제 해결 탐색을 강화한다.
- `simple`: 사이드바를 축소 가능한 목차로 낮추고 672px 읽기 열을 중심으로 둔다.
- `magazine`: 상단 바 높이와 VS Code 팔레트는 공유하지만 고정 사이드바 대신 비대칭 표지와 섹션 내비게이션을 유지한다.

모든 테마가 같은 색 토큰을 공유하고, 조성·리듬·타입 비율만 달라져야 한다.

## 9. Forma 현행 디자인과의 차이

| 항목 | 현재 Forma | 목표 |
|---|---|---|
| 본문 폰트 | Geist + IBM Plex Sans KR | DM Sans + IBM Plex Sans KR |
| 코드 폰트 | Geist Mono | JetBrains Mono |
| 본문 폭 | 약 672px | 유지 |
| 넓은 콘텐츠 | 최대 약 1024px | 유지 |
| 상단 문서 바 | 테마별 차이 | 56px 공통 셸을 기본 후보로 검토 |
| 사이드바 전환 | 1024px 중심 | 768px 고정 레일 전환 추가 |
| 헤더 반응형 | 단일 모바일 기준 | 640px에서 헤더/카드 방향 전환 |
| 간격 | 이미 4px 기반 토큰 | 값은 유지하고 40px H2, 56px bar 같은 조합을 명시 |
| radius | 4/8/12px | OnOrca와 일치, 유지 |
| 색 | 따뜻한 OKLCH 중립 + ink blue | VS Code Modern의 공식 hex를 의미 토큰으로 매핑 |
| 카드 계층 | 최대 3단계 | 유지 |
| 그림자 | 제한 | 선과 표면 명도로 더 엄격히 제한 |

현재 Forma의 간격 값은 실제로 4px 기반이다. `DESIGN.md`의 “8px-rooted scale” 문구는 구현과 맞지 않으므로 후속 구현 시 설명을 바로잡아야 한다. 값 자체는 OnOrca의 리듬과 잘 맞는다.

## 10. Remix 도입 판단

### 결론: 결과 HTML 런타임으로는 도입하지 않는다

Remix가 자동으로 더 좋은 타이포그래피, 여백, 계층, 버튼 위치를 만들지는 않는다. Remix가 제공하는 장점은 라우팅, 데이터 로딩, 폼 제출, 오류 경계, 중첩 레이아웃 같은 애플리케이션 구조다.

Forma 결과물의 핵심 제약은 다음과 같다.

- 단일 self-contained HTML
- 네트워크 요청 0
- 외부 런타임 없이 열림
- 문서 내용을 외부 서비스로 보내지 않음
- 빠른 첫 렌더와 작은 출력
- 현재도 의미 블록별 순수 렌더 함수와 하나의 CSS 디자인 시스템을 사용

이 조건에서는 Remix 클라이언트 런타임, hydration, route manifest가 비용이 된다. 현재 `src/renderer/blocks.ts`의 의미 블록 렌더러와 `src/design/css.ts`의 공통 CSS를 강화하는 편이 더 직접적이다.

### 프레임워크가 필요해질 때의 경계

다음 요구가 생기면 별도의 Forma 웹 애플리케이션에 Remix를 검토할 수 있다.

- 여러 문서 사이의 실제 라우팅
- 서버 저장, 공동 편집, 로그인
- 장기 실행 데이터 로더
- 폼 제출과 서버 action
- 사용자별 영속 상태

그 경우에도 **생성된 최종 산출물**은 서버 렌더/정적 빌드 결과를 단일 HTML로 직렬화하고, 꼭 필요한 작은 상호작용만 독립 island로 인라인해야 한다. 디자인 품질 개선의 우선순위는 Remix보다 아래 구현 항목이다.

## 11. 구현 우선순위

### P0 — 색과 셸

1. 의미 색 토큰을 VS Code Dark/Light Modern 값으로 교체
2. 56px 문서 바와 268px 탐색 레일을 `workspace` 기준 셸로 구현
3. 820px 래퍼 + 32px 패딩 + 672px prose / 1024px breakout 관계 정리
4. 640px와 768px 반응형 전환 추가

### P1 — 타이포그래피와 리듬

1. DM Sans, JetBrains Mono를 로컬 서브셋 파이프라인에 추가
2. IBM Plex Sans KR 한글 fallback 유지
3. H1 36/40, H2 20/28, 부제 18/29.25 비율 적용
4. 본문 16/26, 밀집 UI 15/24, 사이드바 14/20 역할 분리
5. H2 위 40px, 이미지/콜아웃 24px, 다음 탐색 64+32px 리듬 적용

### P2 — 컨트롤

1. 검색 33px, 일반 행 36px, 주요 CTA 32px 높이 체계화
2. 선택 상태를 중립 표면, 포커스를 파란 링으로 분리
3. 모바일 36px 메뉴 버튼과 85%/380px 드로어 구현
4. 다음/이전 문서를 데스크톱 행, 모바일 열로 전환

### P3 — 검증

1. 390, 640, 768, 1024, 1440px 스크린샷 기준 추가
2. 다크/라이트에서 색 대비와 포커스 링 검증
3. 외부 네트워크 요청 0 유지
4. 한글/영문 혼합 문서에서 줄바꿈과 폰트 fallback 검증
5. 긴 사이드바, 긴 제목, 2줄 버튼, 큰 표·코드 breakout 회귀 테스트

## 12. 완료 기준

구현이 끝났다고 판단하려면 다음을 모두 만족해야 한다.

- 1440px에서 문서 바 56px, 레일 268px, 메인 래퍼 820px의 관계가 유지된다.
- 일반 prose는 672px 안팎이고 넓은 증거 블록만 breakout된다.
- 390px에서 좌우 16px, 메뉴 36px, 드로어 85%/최대 380px가 적용된다.
- H1/H2/부제/본문/메타데이터가 각각 독립된 타입 역할을 가진다.
- Dark/Light가 VS Code Modern 원본 토큰과 일치한다.
- 선택, hover, focus, status가 색만으로 구분되지 않는다.
- 폰트는 로컬 서브셋이며 결과 HTML이 외부 요청을 만들지 않는다.
- `pnpm build`, `pnpm test`, `pnpm lint:design`, `pnpm qa`, `pnpm lighthouse`가 모두 통과한다.
- 결과 HTML에 Remix/React hydration 런타임이 포함되지 않는다.

## 13. 출처

- [OnOrca Docs](https://www.onorca.dev/docs)
- [VS Code Default Dark Modern 테마 원본](https://github.com/microsoft/vscode/blob/main/extensions/theme-defaults/themes/dark_modern.json)
- [VS Code Default Light Modern 테마 원본](https://github.com/microsoft/vscode/blob/main/extensions/theme-defaults/themes/light_modern.json)
- 로컬 디자인 기준: `DESIGN.md`
- 로컬 토큰 구현: `src/design/tokens.ts`
- 로컬 렌더러: `src/renderer/blocks.ts`, `src/design/css.ts`
