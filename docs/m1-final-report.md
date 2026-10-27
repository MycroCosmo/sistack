> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M1 종료 보고 — 2026-10-27

상태: **PASS — 사용자 정답 검토 조건 1~5를 반영하고 M1 완료 기준을 충족했다.** M2는 시작하지 않았다.

### 한 일

- 첫 수정으로 Java `extends + implements` 구현체 해석을 고쳤다. 실패하던 주입 호출 회귀 테스트가 실제 구현체에 연결되는 것을 확인했다 (`26e0b86`).
- `lib/indexer/config.mjs`: mapperLocations와 properties 위치·값을 해석한다. eGovFrame의 mysql SQL만 executes로 연결하고 다른 DB XML은 후보로 남긴다. 미해결 설정은 단일 후보여도 LIKELY다.
- Spring endpoint의 `intercepted_by`를 추가했다. legacy-board 검색·등록·수정 URL에서 LoginInterceptor → MenuMapper → APP_MENU로 이어진다. 포함·제외 경로를 검사한다.
- JSP c:url 변수·fn:escapeXml·리터럴 삼항식의 두 요청을 추적한다. create/update 모두 CONFIRMED이며 동적 분기는 미확정으로 남긴다. 위 추적 변경은 `51e29a3`에 기록했다.
- 정답 5쌍을 expected.draft.*에서 expected.*로 확정했다. eGovFrame 근거를 mysql 파일의 실제 라인으로 옮겼고 설정 파일과 후보 XML 해시도 고정했다.
- `scripts/check-expected.mjs`와 회귀 테스트를 추가하고 npm test에 포함했다. 모든 source_files 해시와 모든 중첩 evidence 라인의 존재를 검사한다. README·MILESTONES·사용법·한계를 갱신했다.

### 검증

Windows, Node 22.17.0에서 실행했다. 인덱서와 검사기의 실제 실행은 증거 4단계이며, 생성한 연결의 CONFIRMED는 소스 위치·구조 근거인 2단계다. 앱/DB의 실제 요청 실행(5단계)을 주장하지 않는다.

| 명령·검사 | 결과 | 범위 |
|---|---|---|
| `node --test --test-name-pattern="extends와" test/indexer.test.mjs` | 수정 전 FAIL → 수정 후 PASS | 일반 extends와 implements 조합에서 구현체 호출 재현 |
| `npm test` | PASS, 57/57, 실패·스킵 0 | legacy-board 함정 14개 포함, 스킬 1개 형식·공통 복사본 검사 |
| `node scripts/check-expected.mjs` | PASS, 승인본 5건 | source_files 항목 51개, evidence 위치 항목 168개; 사례 간·연결 간 중복 포함 |
| `node scripts/build-index.mjs examples/legacy-board --out .sistack/m1-legacy-final-index.json --summary --force` | PASS | 파일 38개, 노드 154개, 연결 114개; CONFIRMED 110, LIKELY 0, UNRESOLVED 4 |
| `node scripts/build-index.mjs .testbeds/egovframe --out .sistack/m1-egov-final-index.json --summary --force` | PASS | 파일 5,785개, 노드 56,583개, 연결 48,684개 |
| `node scripts/eval-index.mjs <각 최종 index.json> <아래 expected.json>` 각각 5회 | PASS | 승인 범위 55개 연결 일치, 누락 0, 과탐 0, 상태 불일치 0 |

기존 테스트의 임시 Git 저장소 생성·커밋을 위해 권한을 보완한 npm test로 검증했다. eGovFrame은 고정 revision `2303751d76c119b56dc2e6b6fe1002adafbef938`, source_dirty=false다. legacy-board의 기준 revision과 인덱싱 시점 revision이 다르지만 모든 정답 근거 파일 해시는 일치한다.

| 승인 정답 | 일치/표본 | 누락 | 과탐 | 상태 불일치 |
|---|---:|---:|---:|---:|
| [게시판 검색](../evals/trace/legacy-board-search/expected.md) · [JSON](../evals/trace/legacy-board-search/expected.json) | 17/17 | 0 | 0 | 0 |
| [게시글 등록](../evals/trace/legacy-board-create/expected.md) · [JSON](../evals/trace/legacy-board-create/expected.json) | 14/14 | 0 | 0 | 0 |
| [공통분류코드 삭제](../evals/trace/egov-clcode-delete/expected.md) · [JSON](../evals/trace/egov-clcode-delete/expected.json) | 6/6 | 0 | 0 | 0 |
| [공통상세코드 목록](../evals/trace/egov-detailcode-list/expected.md) · [JSON](../evals/trace/egov-detailcode-list/expected.json) | 13/13 | 0 | 0 | 0 |
| [RSS 컬럼 조회](../evals/trace/egov-rss-columns/expected.md) · [JSON](../evals/trace/egov-rss-columns/expected.json) | 5/5 | 0 | 0 | 0 |

연결 정밀도·재현율은 이 승인 scope 안에서 각각 55/55다. 겹치는 메뉴 조회 경로도 사례별로 세므로 독립 표본 55개가 아니다. 사용자 추가 경로로 초안의 45개에서 55개로 표본이 바뀌었으며, 전체 프로젝트 정확도나 보안 검증 결과로 일반화하지 않는다. 잘못된 DB 파일이 같은 sqlId를 가져도 누락·과탐으로 검출하는 테스트를 추가했다.

eGovFrame 최종 실행의 상태 분포는 CONFIRMED 46,764개(96.06%), LIKELY 272개(0.56%), UNRESOLVED 1,648개(3.39%)다. 분모는 중복 연결을 합친 48,684개이며 반올림 오차가 있다. 이는 인덱서의 분류 분포이고 정확도 점수가 아니다. 다른 DB 실행 후보를 제거한 효과가 포함된다.

최종 duration_ms는 59,025ms다. 같은 머신·기존 체크아웃에서 마지막 한 번의 측정으로, 비교 벤치마크가 아니다. 읽기·수집·연결·Git 메타데이터까지 포함하며 최종 마스킹·검증·JSON 직렬화·파일 쓰기는 제외한다. properties 수집 추가로 이전 보고보다 처리 파일이 297개 늘었다.

skipped는 파일 수가 아닌 기록 수 1,338개다. 상위 항목은 JSP scriptlet 571, 미지원 확장자 460, 외부/미수집 스크립트 293이다. 나머지는 내부 Java 타입 4, vendor JS 3, 제외 디렉터리 2, Java 선언 2, 인코딩 1, JS 괄호 1, 인터셉터 런타임 순서 1이다.

재검토 가능한 결과: [최종 인덱스 통계](evidence/m1-final-index-summary.json), [5건 eval 원본 결과](evidence/m1-final-eval.json). 재실행 명령은 [인덱서 사용법](indexer.md)에 있다.

### 결정

- eGovFrame의 저장소 기본 설정을 DB 선택 근거로 사용한다. 설정이 풀리지 않으면 LIKELY로 남긴다. 활성 DB 파일을 정답 selector에도 지정한다.
- 리터럴 삼항식 두 분기는 모두 도달 가능 경로다. 특정 요청에서 두 분기가 동시에 실행된다는 뜻은 아니다.
- RSS 직접 JDBC 선정과 승인된 scope 제외를 유지한다. 정답 해시·근거가 낡으면 자동 갱신 없이 검증을 실패시킨다.
- 추가 외부 의존성 없이 Node 기본 모듈을 사용했다. 상세 판단은 [decisions](decisions.md)에 기록했다.

### 남은 문제

- 직접 JDBC의 런타임 테이블명, 임의 문자열 URL, 외부 주입 구현, scriptlet·복잡한 Java/JS 구문은 여전히 미확정 또는 미지원이다.
- 실제 서버의 properties override·프로필 선택·인증/CSRF 값 전파·인터셉터 실행 순서와 실제 앱/DB 실행은 검증하지 않았다. 이번 M1에서 Java 테스트베드 소스는 변경하지 않았고 Maven/앱 smoke는 재실행하지 않았다.
- 해시·라인 검사는 근거 내용의 의미를 자동 검수하지 않는다. 세부 범위는 [limitations](limitations.md)에 있다. M1 완료 기준의 BLOCKED 항목은 없다.

### 사용자 확인 필요

없음. 검토 조건 반영으로 주어진 승인을 적용해 M1을 종료했다. M2 이후 작업은 시작하지 않았다.
