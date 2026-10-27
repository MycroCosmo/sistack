> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M1 정답 초안 검토 GATE — 2026-10-27

상태: **PARTIAL — 인덱서·CLI·테스트와 전체 인덱싱을 수행했으며, 정답 초안 5건의 사용자 승인을 기다린다.** M1 완료나 승인된 정확도 달성을 선언하지 않는다. M2 이후에는 착수하지 않았다.

### 한 일

- `schemas/index.schema.json`: 메타데이터, 파일·라인이 있는 노드, 상태·근거·미확정 이유를 가진 연결, unresolved/skipped 계약.
- `lib/indexer/`: JSP, JS, Spring, Java, MyBatis, iBatis 2, SQL 수집기와 연결·질의·eval 모듈. 주석 제외, 이름/타입에 근거한 주입 연결, 중복 후보, 개인정보 마스킹, 실패 격리를 포함한다.
- `scripts/build-index.mjs`, `query-index.mjs`, `eval-index.mjs`: 인덱스 생성, 정방향/역방향 JSON·텍스트 질의, 초안과 승인된 정답을 구분하는 연결 비교.
- `test/indexer*.test.mjs`, `test/eval-index.test.mjs`: 수집기별 동작, legacy-board 함정 14개, 정상 흐름, 다중 후보, 실패/제외 경계, CLI 출력 보존, eval 누락·과탐·상태 불일치 검증.
- 소스를 직접 읽어 작성한 정답 초안 5쌍(JSON/Markdown). 초안 작성에는 인덱서 출력을 사용하지 않았다. 파일·라인과 근거 파일 SHA-256을 저장했고, 승인된 `expected.json`은 만들지 않았다.

### 검증

Windows, Node 22.17.0에서 실행했다. 테스트 개수는 테스트 항목 수이며 입력 조합 전체의 완전성을 뜻하지 않는다. 기존 Git 임시 저장소 테스트는 샌드박스 `.git` 쓰기 제한으로 한 번 실패했고 권한을 보완한 최종 실행에서 통과했다.

| 명령·검사 | 결과 | 범위·증거 단계 |
|---|---|---|
| `npm.cmd test` | PASS | 44개, 실패·스킵 0. 예제 스킬 1개 형식 및 공통 복사본 검사 포함; 4단계 |
| legacy-board 함정 테스트 | PASS | 위 44개에 포함된 함정 14개. 정상 검색 흐름·역방향 질의도 별도 확인; 4단계 |
| `node scripts/fetch-testbed.mjs egovframe` | PASS | 기존 checkout 출처·고정 커밋·변경 없음 확인 |
| `build-index.mjs examples/legacy-board ... --summary` | PASS | 37개 파일 처리, 노드 157개, 연결 104개; 4단계 |
| `build-index.mjs .testbeds/egovframe ... --summary` | PASS(순회·출력 범위) | 5,488개 파일 처리, 노드 56,581개, 연결 56,115개; 제외 사항 아래 참조; 4단계 |
| `query-index --from /board/list.do --depth 8 --format text`, `--to BOARD` | PASS | 실제 legacy-board 인덱스의 정·역방향 질의. CLI fixture도 전체 테스트에 포함; 4단계 |
| `eval-index ... expected.draft.json --draft` | DRAFT_PREVIEW | 5개 초안의 작동 확인. 승인된 정답 채점 아님 |
| `git diff --check` | PASS | 공백 오류 없음 |

Java/JSP 소스를 변경하지 않아 Maven/브라우저 검증은 이번 M1에서 재실행하지 않았다. eGovFrame 애플리케이션이나 DB를 실행한 결과도 아니다.

**전체 실행 통계.** eGovFrame 기준은 `2303751d76c119b56dc2e6b6fe1002adafbef938`, source_dirty=false다. 최종 실행의 읽기·수집·연결·Git 메타데이터 계측은 50,260ms다. 마스킹·검증·직렬화·저장 시간은 제외한다. 같은 checkout으로 개발 중 반복 실행해 파일 캐시가 따뜻한 환경의 최종 1회 측정이며 성능 보장이나 속도 향상률이 아니다.

| eGovFrame 연결 상태 | 개수 | 전체 연결 56,115개 대비 |
|---|---:|---:|
| CONFIRMED | 44,401 | 79.13% |
| LIKELY | 10,068 | 17.94% |
| UNRESOLVED | 1,646 | 2.93% |

이는 인덱서가 부여한 상태 분포이며 정확도가 아니다. 초기 데이터 SQL도 포함하며 동일 연결은 묶고 근거는 최대 8개만 저장한다. unresolved 기록은 1,664개로, 연결 이외 `${}` 치환 위치 등의 기록도 포함하므로 UNRESOLVED 연결 수와 다르다.

skipped는 총 1,635건이며 파일 수와 같지 않다. 상위 항목은 지원 밖 확장자 757건, JSP scriptlet 571건, 외부·벤더·미수집 JS 293건이다. 그 외 내부 Java 타입 4건, vendor JS 3건, 제외 디렉터리 2건, 지원 선언 없는 Java 2건, UTF-8/읽기 실패 1건, JS 중괄호 해석 실패 1건, 인터셉터 실행 순서 미해석 1건이다. UTF-8/읽기 실패는 `src/main/webapp/WEB-INF/jsp/egovframework/com/utl/sys/prm/EgovProcessMon.jsp`, JS 실패는 CKEditor의 `samples/toolbarconfigurator/lib/codemirror/javascript.js`다. 전체 순회 완료를 모든 파일·패턴 해석 성공으로 보지 않는다.

기계 판독 자료: [실행 통계·skipped 예시](evidence/m1-index-summary.json), [초안 차이 상세](evidence/m1-draft-preview.json). 전체 인덱스는 Git에서 제외한 `.sistack/m1-legacy-index.json`, `.sistack/m1-egov-index.json`에 있다.

### 결정

외부 의존성을 추가하지 않고 제한된 구조 스캐너를 선택했다. 불확실한 연결은 후보·이유와 함께 남기며 동적 URL/JDBC를 억지로 확정하지 않는다. 사용되지 않은 c:url 선언은 요청 연결로 취급하지 않는다. 반복 SQL 연결 합치기·해시 식별자·초안 채점 차단을 코드와 테스트로 고정했다. [설계 결정](decisions.md)과 [사용법](indexer.md)에 상세 내용을 기록했다.

메뉴 선택과 초안:

| 초안 | 선정 이유 | 검토 파일 |
|---|---|---|
| legacy-board 목록 검색 | 이름 주입→Mapper 인터페이스→공유 SQL 조각을 거치는 정상 읽기 흐름 | [Markdown](../evals/trace/legacy-board-search/expected.draft.md) · [JSON](../evals/trace/legacy-board-search/expected.draft.json) |
| legacy-board 게시글 등록 | 조건부 JSP 저장 URL과 selectKey·쓰기 SQL | [Markdown](../evals/trace/legacy-board-create/expected.draft.md) · [JSON](../evals/trace/legacy-board-create/expected.draft.json) |
| eGovFrame 공통분류코드 삭제 | 단순 CRUD. 삭제 이름과 실제 UPDATE USE_AT='N' 동작 구분 | [Markdown](../evals/trace/egov-clcode-delete/expected.draft.md) · [JSON](../evals/trace/egov-clcode-delete/expected.draft.json) |
| eGovFrame 공통상세코드 목록 | 공통 PaginationInfo, 목록/건수 조회, 공통코드 테이블 JOIN | [Markdown](../evals/trace/egov-detailcode-list/expected.draft.md) · [JSON](../evals/trace/egov-detailcode-list/expected.draft.json) |
| eGovFrame RSS 컬럼 조회 | 일반 Mapper 경로와 다른 직접 JDBC·런타임 테이블 SQL | [Markdown](../evals/trace/egov-rss-columns/expected.draft.md) · [JSON](../evals/trace/egov-rss-columns/expected.draft.json) |

### 남은 문제

초안과의 차이 미리보기다. 정답 판정이나 승인된 정확도 점수가 아니다. 비교는 각 JSON의 scope에 한정하며 DB별 동일 이름 SQL은 논리 연결로 묶었다.

| 초안 | 기대 연결 | 일치 | 누락 | 범위 내 추가 연결 | 상태 불일치 |
|---|---:|---:|---:|---:|---:|
| 게시판 검색 | 13 | 13 | 0 | 0 | 0 |
| 게시글 등록 | 8 | 7 | 1 | 1 | 0 |
| 공통분류코드 삭제 | 6 | 5 | 1 | 1 | 0 |
| 공통상세코드 목록 | 13 | 11 | 2 | 2 | 0 |
| RSS 컬럼 조회 | 5 | 4 | 1 | 1 | 0 |
| 합계 | 45 | 40 | 5 | 5 | 0 |

- 등록 화면의 EL 삼항식·escapeXml 변수 전파를 못 해 확정 요청 대신 unknown 연결이 생긴다.
- eGovFrame 서비스의 `extends ... implements ...` 조합을 완전히 구분하지 못해 4개 호출이 구현체 대신 인터페이스에 연결된다. 소스에서 구현체를 확인한 초안과의 차이다. 정답 승인 후 수정·회귀 검증 단계에서 처리할 항목으로 남겼다.
- scope 밖 경로, 실제 주입/프로필 선택, 동적 SQL 결과, 브라우저 실행, 세션 데이터 전파는 완전성 검증을 하지 않았다. iBatis 2는 합성 fixture만 확인했다. [제한 사항](limitations.md)을 함께 검토해야 한다.

### 사용자 확인 필요

[prompts/M1.md](../prompts/M1.md)의 **“정답 초안 5건을 작성한 뒤 멈추고 보고한다”**에 따라 여기서 멈춘다. 위 5개 초안의 연결·상태·scope를 검토해 승인 또는 수정 지시가 필요하다.

특히 다음 판단을 요청한다.

- 등록 화면을 `board.id == 0` 분기로 한정했을 때, form→POST create를 CONFIRMED로 둘지.
- 활성 DB를 선택하지 않은 eGovFrame 동일 sqlId의 여러 XML 후보를 LIKELY로 두는 범위가 적절한지.
- 공통 모듈의 외부 구현, 삭제 후 forward, RSS의 보조 설정 조회 등을 제외/미확정으로 구분한 scope가 적절한지.
- iBatis 메뉴 대신 직접 JDBC인 RSS 메뉴를 세 번째 구조 차이 사례로 사용하는지.

승인 전에는 `expected.draft.*`를 `expected.*`로 바꾸거나 정식 정확도를 채점하지 않는다. 이후 승인된 정답 대비 수정·최종 eval을 수행해야 M1 완료 기준을 충족한다.
