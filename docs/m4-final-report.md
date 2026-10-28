> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M4 종료 보고 — 2026-10-28

**상태: M4 완료.** 사용자가 승인한 2차 held-out 첫 3/3을 보존하고, 생성 테스트의 실패 메시지를 정리한 뒤 두 정상 테스트베드만 새 run으로 재확인했다. M5는 시작하지 않았다.

### 한 일

- [별도 최종 template](../skills/si-unit-test/templates/final/)을 추가했다. 기존 template·v2 생성 파일·동결 JSON·held-out 첫 결과를 덮어쓰지 않았다. 생성 CLI는 새 support template을 기본으로 사용한다.
- 모든 JUnit assert에 한국어 업무 메시지를 넣었다. 목록은 null·기대 건수를 단언한 뒤 원소를 읽고, 저장 후 재조회도 한 건인지 단언한 뒤 값을 검증한다. 결과가 누락됐을 때 결과서에 불명확한 원소 접근 예외가 남지 않도록 했다.
- [최종 Service 테스트](../evals/unit/final/legacy-board/generated/M4ServiceTest.java), [최종 Mapper 테스트](../evals/unit/final/legacy-board/generated/M4MapperTest.java)를 포함한 두 프로젝트의 테스트를 새 폴더에 생성했다. 자동 도출 규칙·업무 기대값·의존성·pom·운영 소스는 바꾸지 않았다.
- v0.2 백로그에 **Service↔Mapper map 파라미터 키 정적 대조(Java put 키 vs XML `#{}` / `parameterType=map`)**를 추가했다. 이번에는 구현하지 않았다.

### 검증

최종 변경 이후에는 정상 기준선만 실행했다.

| 테스트베드 | 새 run-id | 결과 | 계획 충족 |
|---|---|---|---|
| legacy-board | `m4-final-legacy-board` | **48/48 PASS** | 28/28 생성·실행·통과, 미해결 0 |
| legacy-board-thymeleaf | `m4-final-legacy-board-thymeleaf` | **48/48 PASS** | 28/28 생성·실행·통과, 미해결 0 |

- 프로젝트마다 생성 Java 5개를 점검했다. **assert 코드 위치 105개 모두 한국어 업무 메시지**가 있고, **정수 인덱스로 목록을 읽는 10곳 모두 사전 건수 단언**이 있다. 배열 입력의 항목 수·값 수와 페이징 표본 수 일치도 단언한다. 이 숫자는 소스 점검 위치 수이며 테스트 건수나 코드 커버리지가 아니다.
- `npm.cmd test`: **160/160 PASS**, 실패·스킵 0. 정답 freshness·스킬 4개·공통 복사본 검사 포함. 새 정상 run 2개의 manifest/test-results 계약과 내보낸 XML 참조도 확인했다.
- 최종 실행 결과·보고서·XML은 실행 원본에서 그대로 내보내 바이트 해시를 대조했다. [최종 검증 기록](evidence/m4-final/verification.json).
- 기존 동결 파일·v2 생성 산출물·두 차례 held-out 첫 결과를 포함한 **1,654개 파일** 해시 불변을 확인했다. M3 자료·두 examples·pom의 기존 보존 해시도 일치했다. held-out은 재실행하지 않았다.

완료 기준 점검:

| 완료 기준 | 판정·근거 |
|---|---|
| 두 테스트베드 Service·Mapper·유틸 실행, pom 불변 | 충족 — 최종 정상 기준선 각 48/48, 기존 test 의존성 유지 |
| 학습 13건 분류·탐지 수·제외/BLOCKED 보고 | 충족 — 가능 4/4 탐지, 범위 밖 8건, Oracle 로그 전용 1건 BLOCKED. [v2 보고](m4-v2-report.md) |
| 탐지한 사례의 v5 수정 후 동일 테스트 통과 | 충족 — 4/4, M3 heldout-02 EQUIVALENT 포함. 테스트/계획 동일성 확인 |
| M5 test-results 스키마 검증 | 충족 — 아래 최종 정상 결과 2개 모두 1.0.0 계약 통과 |
| 약한 테스트 점검 | 충족 — 목 호출만 확인한 테스트는 반환값 null 변이를 놓쳤고 보강 테스트는 실패. [기록](evidence/m4-weak-test/summary.json) |
| 스킬·공통 복사본·전체 회귀 | 충족 — 최종 npm test 160/160 |
| 도출 계획·실제 충족률 | 충족 — 각 28/28, 경계 쌍·SQL 분기·전체 쓰기 컬럼 포함 |
| 동결 이후 블라인드 첫 점수 보존 | 충족 — 첫 세트 0/3과 2차 세트 3/3을 별도 불변 보존 |
| 사용자 종료 요청의 메시지 보강·백로그 | 충족 — 별도 template/정상 run, v0.2 항목만 추가 |

이전 평가 이력은 합산하지 않는다.

| 평가 | 보존 결과 | 해석 |
|---|---|---|
| 첫 held-out | 0/3 | [첫 기록](m4-heldout-first-report.md) |
| 같은 사례의 v2 | 3/3 DETECTED | 결함 수정 확인, 일반화 성능 아님 |
| 2차 신규 held-out | 3/3 DETECTED | [별도 동결 뒤 첫 기록](m4-next-heldout-first-report.md), 표본 3건의 결과 |

### 결정

- 결과서에 필요한 변경이므로 별도 메시지 template과 새 정상 run으로 검증했다. 코드 기준 리비전은 **2d1c4df**다. 기존 동결 `4a584c5/219개`, `2b10f62/245개`와 그때의 점수는 그대로 보존한다. 2차 3/3은 당시 동결 구현의 결과이며 메시지 개정본의 재평가 점수로 옮겨 적지 않는다.
- M5 입력은 아래 **최종 정상 기준선 두 개**로 지정한다. schema_version은 **1.0.0**, 공통 [스키마](../schemas/test-results.schema.json)를 따른다. 생성 테스트·계획과 XML 근거는 각 결과 폴더에서 함께 확인할 수 있다.

| 대상 | M5 입력 위치 | 실행·근거 |
|---|---|---|
| JSP 테스트베드 | [`docs/evidence/m4-final/legacy-board/test-results.json`](evidence/m4-final/legacy-board/test-results.json) | [manifest](evidence/m4-final/legacy-board/manifest.json), [실행 보고](evidence/m4-final/legacy-board/report.md) |
| Thymeleaf 테스트베드 | [`docs/evidence/m4-final/legacy-board-thymeleaf/test-results.json`](evidence/m4-final/legacy-board-thymeleaf/test-results.json) | [manifest](evidence/m4-final/legacy-board-thymeleaf/manifest.json), [실행 보고](evidence/m4-final/legacy-board-thymeleaf/report.md) |

원본 run 디렉터리는 각각 `.tmp/m4-final/<testbed>/.sistack/runs/m4-final-<testbed>/`다. M5 인계 파일에는 클래스·메서드·한국어 표시 이름·대상·PASS/FAIL/ERROR/SKIP·소요 시간·마스킹 실패 메시지·JDK/라이브러리 환경·source_revision이 있다. 정상 PASS 행의 실패 메시지는 빈 문자열을 유지했다.

### 남은 문제

- 새 메시지 버전은 요청 범위에 따라 정상 기준선만 검증했다. 기존 학습/held-out 실패 점수는 다시 실행하지 않았다.
- 실행 환경은 JDK 17.0.14/Maven 3.9.10, POM target 8이다. Java 8/11/21 런타임, 실제 Oracle/Tibero·WAS·브라우저·성능은 이번 검증 범위 밖이다. Oracle 로그 전용 1건의 BLOCKED는 그대로다.
- SQL/Java 자동 도출의 지원 범위와 미해결 처리 한계는 [v2 보고](m4-v2-report.md)를 따른다. 2차 3건만으로 전체 현장의 일반화 성능을 단정하지 않는다. 실제 대화의 한국어 자동 활성화와 다른 build/profile 환경도 별도 미검증이다.

### 사용자 확인 필요

추가 승인 요청 없음. M4 종료 지시를 반영했고 M5용 입력 위치·스키마까지 정리했다. **M5는 시작하지 않았다.**
