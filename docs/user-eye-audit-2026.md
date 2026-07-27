# User Eye 최종 사용자 진단

## 1. 대상과 판단한 역할

대상은 Forma CLI, Agent Skill, 문서, 그리고 렌더링된 정적 HTML이다.
사용자가 역할을 직접 지정하지 않았으므로 다음 두 역할이 모두 핵심이라고
판단했다.

- **비개발자**: 자료를 주고 읽기 쉬운 결과를 얻으려는 사람
- **앱 개발자**: Forma를 설치·실행·검증하거나 스킬을 동기화하는 사람

정적 HTML에는 Playwright 검사가 조건부로 적용된다. 로컬 Rendered Output을
실제로 열 수 있었으므로 브라우저 QA를 실행했다. 인앱 브라우저 자체는 현재
런타임에 노출되지 않아 별도 표시 여부만 확인하지 못했다.

## 2. 결과 요약

- **Critical gate**: P0 `FAIL` 없음
- **검증 커버리지**: 26 / 28 적용 규칙 = **92.9%**
- **확인된 통과율**: 26 / 26 확인 규칙 = **100%**
- **미검증**: 2건 (`UE-C11`의 수동 보조기술 전 범위, `UE-A08`의 다른 OS)
- **N/A**: 6건(정적 문서/로컬 CLI에 없는 상태·권한·SDK 생명주기)

## 3. 규칙별 판정표

### 공통

| ID | 판정 | 증거 | 근거 |
|---|---|---:|---|
| UE-C01 | PASS | E1 | README가 사용자 작업과 성공 결과를 먼저 설명한다. |
| UE-C02 | PASS | E1 | Node, pnpm, 브라우저 조건과 역할 추론을 명시했다. |
| UE-C03 | PASS | E1 | 테마를 simple/workspace/guide/magazine으로 바꿨다. |
| UE-C04 | PASS | E1 | Mode, Theme, Source, Evidence를 CONTEXT와 예시에서 설명한다. |
| UE-C05 | PASS | E2 | 네 테마 스크린샷에서 핵심 요약과 세부 근거가 분리된다. |
| UE-C06 | PASS | E3 | 목차 anchor 존재와 키보드 진입을 모든 fixture·테마에서 실행 확인했다. |
| UE-C07 | PASS | E4 | CLI가 선택 모드, 출력 경로, 성공 여부, 다음 명령을 표시한다. |
| UE-C08 | PASS | E4 | init/generate는 기존 파일을 덮어쓰지 않고 새 경로를 안내한다. |
| UE-C09 | PASS | E4 | 없는 입력·기존 출력 회귀 테스트와 복구 문구를 확인했다. |
| UE-C10 | N/A | E1 | 정적 출력과 즉시 종료 CLI에는 loading/empty/no-permission 상태가 없다. |
| UE-C11 | NOT VERIFIED | E3 | axe 0, 대비, 키보드 진입은 확인했으나 스크린리더·수동 확대 전 범위는 미검증이다. |
| UE-C12 | PASS | E3 | 1920/1440/1024/390 폭에서 넘침과 기능 손실이 없었다. |
| UE-C13 | PASS | E3 | 코드·문서·예시·렌더링 결과가 같은 모드/테마 이름을 쓴다. |
| UE-C14 | PASS | E4 | 빌드, 테스트, QA, Lighthouse 결과로 주장 범위를 제한했다. |

### 비개발자

| ID | 판정 | 증거 | 근거 |
|---|---|---:|---|
| UE-N01 | PASS | E2 | 제품명보다 “복잡한 작업을 읽기 쉬운 HTML로”라는 작업을 먼저 보여준다. |
| UE-N02 | PASS | E1 | 내부 디자인 명칭을 일상 용어로 바꾸고 필요한 용어는 풀이했다. |
| UE-N03 | PASS | E2 | task instruction에서 모드를 자동 선택해 사용자의 선택 부담을 줄였다. |
| UE-N04 | PASS | E2 | 동일 매뉴얼의 네 테마 HTML 예시를 제공한다. |
| UE-N05 | PASS | E4 | 생성 전 결과 경로가 예측 가능하며 기존 파일은 보존된다. |
| UE-N06 | N/A | E1 | 출력 HTML에는 계정·권한 요청이 없고 외부 링크도 자동 접근하지 않는다. |
| UE-N07 | PASS | E4 | render/qa/install 명령이 완료 상태와 다음 행동을 출력한다. |
| UE-N08 | PASS | E3 | doctor, verify-skills, 새 세션 안내와 README 복구 경로를 실행 확인했다. |

### 앱 개발자

| ID | 판정 | 증거 | 근거 |
|---|---|---:|---|
| UE-A01 | PASS | E4 | install → build → render → qa의 최소 성공 경로를 실행했다. |
| UE-A02 | PASS | E3 | Node 20.19+, pnpm, Playwright Chromium 요구사항과 현재 환경을 확인했다. |
| UE-A03 | N/A | E1 | 현재 패키지는 공개 배포 SDK가 아닌 private 로컬 CLI다. |
| UE-A04 | N/A | E1 | 앱 manifest나 런타임 권한을 추가하지 않는다. |
| UE-A05 | N/A | E1 | 앱 프로세스/Activity 생명주기에 연결되지 않는다. |
| UE-A06 | N/A | E1 | 공개 async SDK 호출 계약이 없다. |
| UE-A07 | PASS | E4 | 52개 테스트, 네 fixture, 네 테마 예시가 실제로 실행됐다. |
| UE-A08 | NOT VERIFIED | E3 | Windows/Node 24에서는 확인했으나 macOS/Linux는 이번 실행 범위 밖이다. |
| UE-A09 | PASS | E4 | missing input, existing output, skill drift 진단과 복구 문구를 확인했다. |
| UE-A10 | PASS | E3 | 모든 fixture가 Lighthouse 성능 0.98–0.99, 접근성 1.00, CLS/TBT 0을 통과했다. |
| UE-A11 | PASS | E4 | 브라우저 QA에서 외부 요청 0건, 문서의 비밀정보·URL 처리 규칙을 확인했다. |
| UE-A12 | PASS | E1 | CHANGELOG에 호환성, 레거시 이름 변환, 롤백 경로를 추가했다. |

## 4. 치명적 실패

현재 P0 `FAIL`은 없다. 초기 진단에서 발견한 덮어쓰기 위험과 설치 후 스킬이
즉시 보일 것처럼 오해할 수 있는 안내 부족은 수정 후 재검증했다.

## 5. 미검증/차단 항목

- `UE-C11`: axe와 키보드 smoke test는 전체 접근성 적합성을 증명하지 않는다.
  실제 스크린리더와 200% 수동 확대 검사가 추가로 필요하다.
- `UE-A08`: macOS와 Linux CI가 없으므로 해당 OS 호환성은 주장하지 않는다.
- 인앱 브라우저 표시: 현재 세션에는 IAB가 없고 Chrome만 노출되어, 사용자가
  요청한 인앱 브라우저로 탭을 여는 작업은 수행하지 않았다.

## 6. 역할별 개선 결과

### 비개발자

1. 테마 이름을 일상 용어로 바꾸고 같은 콘텐츠의 실제 예시를 제공했다.
2. 작업 문장에서 모드를 자동 선택하며 `manual` 절차형을 추가했다.
3. 모바일 목차를 한 줄 가로 탐색으로 고정해 글꼴 로딩 시 재배치와 긴 상단
   점유를 없앴다.
4. 출처 경로가 번호 목록 CSS를 상속해 글자 단위로 접히던 문제를 수정했다.

### 앱 개발자

1. init/generate가 기존 파일을 보존하고 정확한 다음 명령을 출력한다.
2. install-skills가 이미 열린 세션은 새로 시작해야 한다고 명시한다.
3. QA가 깨진 anchor와 키보드 진입까지 검사한다.
4. Lighthouse가 성능 예산을 실제 실패 조건으로 사용하고 Windows 임시 폴더
   정리 지연을 감사 실패와 구분한다.
