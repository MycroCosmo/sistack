> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M5b 종료 보고 — 구현·평가 종료, 결과 PARTIAL

종료 정리일 2026-10-29. 인벤토리 승인일 2026-10-28. 두 로컬 테스트베드와 Claude가 만든 공공 SI 일반 형식 양식으로 **형식 일반성**을 검증했다. 회사 현장 검증을 뜻하지 않는다. M6는 시작하지 않는다.

### 한 일

- 공통 인덱스를 이용해 form, 버튼·핸들러, AJAX, data-url, 링크, fragment, 숨김 필드, 팝업 선언을 파일:라인과 함께 수집했다. 독립 소스 census 및 Ian이 별도 수동 집계한 종류별 개수 47/71과 대조했다. [승인 기록](m5b-inventory-review.md), [정식 기준](../evals/functional/expected.json)에 승인자 Ian·2026-10-28·집계 근거를 남겼다.
- 선언 항목마다 TC 1개와 알려진 기대 URL·메서드를 생성했다. 각 프로젝트에 등록/수정/정렬/페이징/경계/권한/검색/공통코드/오류 보충 TC 9개를 추가했다. 정상 소스의 TC를 먼저 보존하고 학습 패치 사본에 같은 TC를 사용했다.
- 로그인 세션 HTTP와 설치된 Chrome으로 실행하고 검색·공통코드 각 2건을 Edge에서 교차 확인했다. AUTO-UI는 실제 id/name만 사용하고, 동작 뒤의 요청 URL·메서드·응답 코드 및 화면을 함께 판정했다. 통과한 UI 행마다 스크린샷과 요청 기록을 확인했다.
- 제공 양식의 기존 두 시트·열·수식·드롭다운·병합을 유지하고 결과서를 작성·재읽기했다. M4 승인 서버 테스트 48건은 별도 **서버로직검증** 시트에만 연결했다. 모르는 상단 메타데이터는 공란이다. 업무 셀의 AI 문구는 기본 제외했다.
- 최종 미리보기에서 발견한 SKIP 행의 미실행 수행일/계정 표시를 고쳤다. 원래 1차·2차 파일은 그대로 보존하고 **배포본 11개(1차 2개·패치별 2차 9개)**를 별도 생성했다. 배포본의 SKIP 두 칸은 공란이고 상태값은 변하지 않았다. 각 2차 배포본은 대응하는 1차 배포본의 1차 열을 그대로 유지한다. 2차 FAIL의 제품 결함/미확정 분류 근거도 비고에 덧붙였다.

최종 배포 위치는 저장소 기준 다음과 같다. 엑셀·DB·화면 증거는 로컬에만 보존하며 공개 커밋에 넣지 않았다.

| 대상 | 정상 1차 결과서 | 학습 패치별 2차 결과서 |
|---|---|---|
| legacy-board | [.sistack/runs/m5b-evaluation-v2/delivery/legacy-board/first.xlsx](../.sistack/runs/m5b-evaluation-v2/delivery/legacy-board/first.xlsx) | 같은 폴더의 second-01-binding.xlsx ~ second-06-sort-sql.xlsx, second-10-fragment-encoding.xlsx |
| legacy-board-thymeleaf | [.sistack/runs/m5b-evaluation-v2/delivery/legacy-board-thymeleaf/first.xlsx](../.sistack/runs/m5b-evaluation-v2/delivery/legacy-board-thymeleaf/first.xlsx) | 같은 폴더의 second-08-thymeleaf-utilities.xlsx, second-09-view-resolver.xlsx |

원시 실행 결과는 examples/각프로젝트/.sistack/runs/m5b-first-v2/ 및 m5b-second-사례ID-v2/의 cases.json, results-chrome.json, functional-results.xlsx에 있다. 1차 freeze.json, 2차 first-reference.json이 원본 해시와 TC를 잇는다. final 배포본의 연결·해시는 루트 .sistack/runs/m5b-evaluation-v2/delivery-receipts.json에 있다.

### 검증

승인 기준 대비 인벤토리와 선언 TC는 각각 47/71개, 누락·추가·TC 누락·중복·고아 0개다. 이 수치는 실행 성공률이 아니라 지원 문법 내 선언 대조다. 팝업 실제 표본은 양쪽 모두 0개로 **감지/실행 미검증**이다.

| 정상 1차 v2 (Chrome) | TC 수 | PASS | FAIL | BLOCKED | SKIP |
|---|---:|---:|---:|---:|---:|
| legacy-board | 56 | 34 | 0 | 16 | 6 |
| legacy-board-thymeleaf | 80 | 47 | 0 | 25 | 8 |
| 합계 | **136** | **81** | **0** | **41** | **14** |

| 유형 | PASS | FAIL | BLOCKED | SKIP |
|---|---:|---:|---:|---:|
| AUTO-API | 52 | 0 | 4 | 0 |
| AUTO-UI | 29 | 0 | 37 | 0 |
| SKIP | 0 | 0 | 0 | 14 |

Edge는 같은 검색·공통코드 TC만 프로젝트별 2건, 합계 **4/4 PASS**다. 전체 136건의 Edge 호환성을 검증한 것은 아니다. 삭제 관련 14건은 호출하지 않았다. BLOCKED는 결과 공란+비고 사유이며 JSON 상태는 BLOCKED로 유지했다. 미실행 BLOCKED는 화면 증거가 없을 수 있다.

M3 학습 패치 평가 v2는 실행 가능 **9/9 DETECTED**, 로그 전용 **1 BLOCKED**, MISSED 0이다. 탐지는 같은 TC가 정상에서 PASS이고 패치 사본에서 FAIL인 경우만 인정했다. 정상에서 이미 BLOCKED였던 행의 파생 실패 4건은 미확정으로 남겨 탐지 근거에서 제외했다. 각 패치 사본의 TC 해시는 해당 정상 1차와 같다.

| M3 학습 사례 | 판정 | 대표 탐지 TC |
|---|---|---|
| 01-binding | DETECTED | SUP-CREATE |
| 02-js-url | DETECTED | SUP-SEARCH, TC-042 |
| 03-request-encoding | DETECTED | SUP-CREATE |
| 04-session-bypass | DETECTED | SUP-ANONYMOUS |
| 05-paging | DETECTED | SUP-PAGING |
| 06-sort-sql | DETECTED | SUP-SORT |
| 07-oracle-log-only | BLOCKED | 로컬 앱 패치 없음 |
| 08-thymeleaf-utilities | DETECTED | 정상 PASS 후 화면 FAIL |
| 09-view-resolver | DETECTED | 정상 PASS 후 화면 FAIL |
| 10-fragment-encoding | DETECTED | SUP-PAGING |

이는 **관찰한 학습 결함에 대한 확인이며 일반화 성능이 아니다**. 최초 v1의 Chrome 정상 FAIL 18건(8/10), 학습 DETECTED 8·MISSED 1·BLOCKED 1도 보존했다. 진입 권한·CSRF·화면 전환 대기 등 실행기 오탐을 분리하고 원래 FAIL 상태를 유지했다. v1 Edge의 검색 TC FAIL 2건도 화면 전환 컨텍스트 소멸 오탐으로 sidecar에 분류하고 원래 상태를 보존했다. 원인 보정 뒤 새 run v2로 실행했으며 점수를 합산하지 않았다. [두 버전 집계](evidence/m5b-final/summary.json), [FAIL 분류 집계](evidence/m5b-final/failure-review.json)를 따른다.

- npm test: **185/185 PASS**, 승인 인벤토리 freshness·스킬 5개·공통 복사본 검사 PASS. 미실행 SKIP의 수행일/계정 공란과 2차 TC 불일치 거부 회귀를 포함한다.
- node scripts/audit-functional-completion.mjs: 승인 인벤토리, v1/v2 원본 해시, 동일 TC, UI 증거 존재, DB 보존 및 v2 키 재조회, 배포본 11개·1차 열 보존 PASS.
- 제공 양식 원본 해시 불변, 생성 후 재읽기 검증 PASS. 첫 시트/요약/서버로직검증의 읽기 전용 미리보기를 확인했다. Excel 앱 자체에서 여는 검증은 수행하지 않았고 수식 원문을 보존했다.
- 정상 v2 두 사본과 패치 사본 9개 모두 파일 DB·SQL 덤프·생성/수정 키 재조회 및 examples 원본 불변을 확인했다. 확인할 테이블 BOARD와 ID는 생성/수정 TC 비고에 기록했다. v1은 파일/덤프 보존 확인이며 강화된 키 재조회 검증과 구별한다.

### 결정

- 실행 승인에 따라 admin은 등록·수정·관리, viewer는 조회에 사용했다. 테스트베드는 계정 문자열 입력 대신 역할 선택 로그인 방식이므로 admin=ADMIN, viewer=READER로 대응한다. 실제 시도한 케이스의 계정 ID를 결과서에 썼고 SKIP에는 쓰지 않았다.
- 원본 examples는 변경하지 않고 실행 사본의 local datasource만 jdbc:h2:file:<run>/evidence/db/application;MODE=Oracle로 바꿨다. 서버 종료 후 SCRIPT NOPASSWORDS TO 덤프와 SELECT를 수행했다. evidence/db/application.mv.db, snapshot.sql, db-preservation.json 및 실행 사본을 남기며 생성·수정 자료를 삭제하지 않았다.
- 이미 보존한 run의 manifest에는 실행 당시 초안 상태가 남아 있다. 이를 소급 덮어쓰지 않고 최종 aggregate manifest와 completion-audit.json에 승인 해시와 재대조를 연결했다. 배포본의 메타데이터 보정은 원시 결과를 바꾸지 않는다.
- JSON 계약은 [functional-results.schema.json](../schemas/docs/functional-results.schema.json): round(1/2), channel, records(케이스 ID·유형·계정·상태·시각·사유·요청/화면 경로), created(테이블·키·유지 자료), cleanup_performed=false다. M4 입력은 기존 [test-results.schema.json](../schemas/test-results.schema.json)과 docs/evidence/m4-final/각프로젝트/test-results.json을 사용하며 변경하지 않았다.
- 재작성은 node scripts/finalize-functional-delivery.mjs <실행-config.json>으로 새 delivery 경로에서만 수행한다. 기존 출력이 있으면 덮어쓰지 않는다. 구현·승인 근거는 [decisions.md](decisions.md)에 기록했다.

### 남은 문제

- BLOCKED 41건: 실제 id/name 없음 34, 유일하지 않은 선택자 3, 직접 요청/진입 미확정 4. 원본 화면에 식별자를 추가하거나 추측 선택자를 쓰지 않았으므로 전체 실행 PASS가 아니며 상태 PARTIAL이다.
- **팝업 감지/실행은 실제 표본 0개로 미검증**이다. 검증용 테스트베드 화면 추가는 v0.2 백로그에 기록했다. 합성 파서 테스트로 이 한계를 대체하지 않는다.
- 실행 업무 어댑터는 두 legacy-board 테스트베드에 한정된다. 임의 SI 인증/CRUD·동적 DOM 전체를 보장하지 않는다. 그리드 셀 편집·파일 업로드·드래그·다단계 팝업은 v0.2 범위다.
- Oracle 로그 전용은 로컬 H2 앱으로 실행할 수 없다. 제공 일반 양식 검증은 실제 회사 양식 현장 검증이 아니다. 긴 근거·비고는 원래 행 높이/열 너비에서 잘릴 수 있어 셀 편집과 JSON을 함께 확인해야 한다.
- 기존 전이 의존성 buffers@0.1.1 라이선스 표시는 UNRESOLVED를 유지한다. 신규 의존성이나 브라우저 다운로드는 추가하지 않았다.

### 사용자 확인 필요

최종 배포본과 BLOCKED 41건·팝업 미검증 범위를 검토한다. 추가 실행·화면 수정·M6 진행은 하지 않고 **M5b 종료 보고에서 멈춘다**.
