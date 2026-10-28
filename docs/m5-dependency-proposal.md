# M5a/M5b 통합 의존성 승인안 — 2026-10-28

상태: **승인 대기**. MILESTONES와 M5/M5a/M5b 프롬프트는 먼저 `7d28988`로 커밋했다. 이 문서는 후보 비교와 승인 범위만 다룬다. 설치·package/lock 변경·브라우저 다운로드·M5 구현·실행 검증은 하지 않았다.

## xlsx 후보

| 후보·비교 버전 | 라이선스 | 적합성·선택 이유 | 확인할 한계 |
|---|---|---|---|
| **ExcelJS 4.4.0 — 추천** | MIT | xlsx 데이터/서식을 읽고 쓰며 병합·스타일·수식 값을 다룬다. M5a 양식 채우기와 M5b 결과서에 같은 writer 사용 | 수식 계산기는 아님. 사용자 양식의 임의 기능 보존을 보장하지 않으므로 재읽기·서식 회귀와 실제 양식 검증 필수 |
| SheetJS CE 0.20.3 | Apache-2.0 | 데이터 입출력 대안. 공식 배포는 CDN tarball | npm의 xlsx 0.18.5를 현재 배포와 혼동하지 않는다. 이 프로젝트의 양식 보존은 미검증. ExcelJS와 동시 추가하지 않음 |

ExcelJS의 버전·MIT·Node 선언과 서식 API/수식 계산 한계는 [고정 버전 package](https://github.com/exceljs/exceljs/blob/v4.4.0/package.json), [README](https://github.com/exceljs/exceljs/blob/v4.4.0/README.md#formula-value)를 확인했다. 공개 릴리스 페이지의 안정 버전은 [4.4.0](https://github.com/exceljs/exceljs/releases/tag/v4.4.0)이다. prerelease나 새 버전으로 자동 올리지 않는다.

SheetJS의 버전·CDN/오래된 npm 배포 구분은 [공식 Node 설치 문서](https://docs.sheetjs.com/docs/getting-started/installation/nodejs/), CE 라이선스는 [공식 라이선스 문서](https://docs.sheetjs.com/docs/miscellany/license/)를 확인했다. Pro 기능/라이선스와 CE를 섞어 설명하지 않는다.

유지보수·배포 상태는 위 확인 시점의 정보다. 두 라이브러리 모두 이 저장소에서 아직 설치하거나 실제 양식으로 검증하지 않았다. 전이 의존성은 승인 후 lock으로 고정하고 라이선스 정보를 함께 기록한다.

## Playwright Node 후보

| 후보·고정 버전 | 라이선스·Node 선언 | 적합성 |
|---|---|---|
| **playwright-core 1.64.1 — 추천** | Apache-2.0, Node >=20 | 브라우저 제어 코어만 사용. 기존 node:test/실행 결과 계약과 연결해 별도 runner 없이 구현 |
| playwright 1.64.1 | Apache-2.0, Node >=20 | 더 넓은 CLI/runner 배포가 필요할 때의 대안. 이번 범위에서는 core에 더해 사용할 이유가 적음 |
| @playwright/test 1.64.1 | Apache-2.0, Node >=20 | 전용 테스트 runner/fixture를 쓸 때의 대안. 기존 node:test 외 실행 체계를 추가하므로 이번에는 선택하지 않음 |

버전·라이선스·Node 요구는 [core 고정 버전 package](https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright-core/package.json), [playwright package](https://github.com/microsoft/playwright/blob/v1.64.1/packages/playwright/package.json), [공식 npm 메타데이터](https://registry.npmjs.org/@playwright/test/latest), [라이선스](https://github.com/microsoft/playwright/blob/v1.64.1/LICENSE)를 확인했다. 버전 1.64.1을 승인 대상으로 고정하며 latest 태그를 설치 명세로 쓰지 않는다.

설치된 Chrome/Edge를 쓰는 방식은 [공식 브라우저 문서](https://playwright.dev/docs/browsers#google-chrome--microsoft-edge)의 `chrome`/`msedge` 채널을 따른다. 브라우저 설치 명령·다운로드·기존 브라우저 교체를 실행하지 않는다. 실제 호환성은 승인 후 로컬 실행으로 검증한다.

## 한 번에 승인받을 범위

1. **exceljs@4.4.0 + playwright-core@1.64.1** 두 직접 의존성과 필요한 전이 의존성을 추가하고 lock/라이선스를 보존한다. SheetJS·playwright·@playwright/test는 함께 추가하지 않는다.
2. **M5b 브라우저 실행은 Node >=20**을 요구한다. M5a와 기존 기능의 Node >=18 기준은 유지하고, M5b 진입 시 버전/패키지 부족을 BLOCKED로 안내한다. 사용자 프로젝트의 pom/Gradle이나 전역 Node를 바꾸지 않는다.
3. **브라우저 다운로드 없음**. 현재 설치된 Chrome/Edge 채널만 쓴다. 미설치/정책/호환성 문제를 새 브라우저 설치로 우회하지 않는다.
4. 승인 후 M5a부터 구현하며 M5b 실행에는 계정 ID·1차/2차·데이터 보존 등 별도 실행 선행조건을 확인한다. 이번 의존성 승인을 임의 계정/차수의 실행 승인으로 해석하지 않는다.

읽기 전용 환경 확인: Node **22.17.0**, Chrome **156.0.8078.48**, Edge **156.0.4314.50**가 있다. 브라우저를 실행하지 않았고 Playwright 연동 PASS를 주장하지 않는다.

## 참고 스킬 확인 범위

다른 대화에서 사용자가 공유한 test-scenario-v2 본문을 확인했다. 연결된 상세 가이드와 실제 도구는 제공되지 않았다. 스킬 원문·회사/프로젝트 식별자·현장 파일명/계정/코드 예시는 저장소에 저장하지 않고 일반화한 실행/보존/차수/판정 규칙만 M5b 프롬프트에 반영했다. Python 도구와 고정 열 위치는 가져오지 않는다.

## 검증과 중지 지점

문서 링크·요구사항·범위 연결과 git diff를 확인한다. 코드 변경이 없는 범위 조정이므로 기존 실행 테스트를 새 구현 검증처럼 재보고하지 않는다. **이번 사용자 요청 7항의 통합 의존성 승인 GATE에서 멈춘다.**
