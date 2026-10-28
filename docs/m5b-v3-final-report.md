> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M5b v3 완료 보고

2026-10-29. 사용자 승인 보정과 v3 1차·2차 재실행을 마쳐 **M5b 완료**로 처리한다. 실행 결과 상태는 BLOCKED 9건 때문에 **PARTIAL**이다. M6는 시작하지 않는다. 제공 양식은 Claude가 만든 공공 SI 일반 형식이며 **형식 일반성 검증이지 회사 현장 검증은 아니다**.

### 한 일

- 소스 선택자의 우선순위를 id → name → 정적 href/th:href 해석값 → 해당 화면에서 유일한 소스 버튼·링크 텍스트 → 소스 form 범위의 유일한 버튼 텍스트로 바꿨다. 선택 전 일치 건수를 확인하며, 중복·동적 값 미확정·현재 조건에서 미표시는 BLOCKED로 남긴다. 임의 문구·nth·role·URL은 만들지 않는다.
- 선택된 종류/값·실제 일치 건수·소스 파일:라인·화면과 실패한 후보를 results-chrome.json의 selection_evidence 및 TC 비고에 기록했다. 핸들러의 소속 화면을 대조하여 다른 화면의 같은 id/문구를 근거로 사용하지 않는다. 폼 범위는 소스 id/name으로 유일하게 지정할 수 있는 경우에만 사용한다.
- fragment 선언/포함·숨김 필드 48개는 인벤토리에 유지하고 covered_by로 화면 TC에 연결했다. cases.json에는 역방향 covered_inventory_item_ids를 기록하고 coverage-map.json으로 파일:라인과 연결 ID를 남겼다. 독립 TC와 엑셀 행은 만들지 않는다. 기존 선언 TC ID를 유지하므로 번호에는 빈 구간이 있다.
- v3 구현 5c156ab을 커밋한 뒤 두 정상 1차를 보존하고, 같은 TC를 M3 학습 패치별 새 사본에서 2차로 실행했다. v1/v2 원본·점수·보고서는 보존했다. 선택 근거와 2차 FAIL 분류를 포함한 별도 배포본 11개도 생성했다.

### 검증

정상 1차 Chrome 결과와 v2 비교:

| 테스트베드 | TC 수 v2 → v3 (증감) | PASS | FAIL | BLOCKED | SKIP | BLOCKED v2 → v3 |
|---|---:|---:|---:|---:|---:|---:|
| legacy-board | 56 → 36 (-20) | 29 | 0 | 3 | 4 | 16 → 3 |
| legacy-board-thymeleaf | 80 → 52 (-28) | 40 | 0 | 6 | 6 | 25 → 6 |
| 합계 | 136 → 88 (-48) | 69 | 0 | 9 | 10 | 41 → 9 |

136→88의 감소는 JSP fragment 12·숨김 8, Thymeleaf fragment 19·숨김 9의 **독립 행 48개를 연결로 바꾼 결과**다. PASS 81→69와 SKIP 14→10도 분모가 바뀐 값이므로 같은 TC 집합의 성능 변화로 읽으면 안 된다. 삭제·다운로드 이외를 SKIP으로 숨기지 않았다.

| 인벤토리 기준 | 전체 | 누락 / 추가 | covered_by 연결 수 | 연결 대상 TC의 1차 상태 |
|---|---:|---:|---:|---|
| legacy-board | 47 | 0 / 0 | 20 | SKIP 4 · PASS 15 · BLOCKED 1 |
| legacy-board-thymeleaf | 71 | 0 / 0 | 28 | SKIP 4 · PASS 21 · BLOCKED 3 |

covered_by는 **정적 포함/소속 관계**이며 구조 항목을 독립 실행해 PASS했다는 뜻이 아니다. 연결 대상이 SKIP/BLOCKED인 항목도 그대로 표시했다. 승인자 Ian·2026-10-28·종류별 별도 수동 집계 47/71 일치 기준을 유지했다. 실제 팝업 표본은 두 곳 모두 0개로 감지·실행 미검증이다.

BLOCKED 사유 변화:

| v2 사유 | 건수 |
|---|---:|
| 실제 id/name 없음 | 34 |
| 선택자 비유일 | 3 |
| 직접 요청/진입 미확정 | 4 |
| 합계 | 41 |

| v3 사유 | 건수 |
|---|---:|
| 소스 근거가 있는 선택자가 없습니다 | 5 |
| 화면 진입 요청이 미확정입니다 | 3 |
| 소스 선택자가 현재 화면 조건에서 나타나지 않습니다 | 1 |
| 합계 | 9 |

v2의 id/name 부족은 소스 href/텍스트로 실행 가능해졌고, 비유일한 숨김 필드의 독립 TC도 제거됐다. 남은 동적 링크/메뉴 값은 특정 href나 문구를 만들어 선택하지 않는다. 분모·분류가 달라 위 사유끼리 1:1 감소로 해석하지 않는다. JSP 공존 분류 화면에서 다음 페이지 버튼이 렌더링되지 않는 조건도 별도로 남겼다.

Edge는 같은 검색·공통코드 TC 프로젝트별 2건, **4/4 PASS**다. 전체 TC의 Edge 호환성을 검증한 것은 아니다. AUTO-UI PASS는 실제 요청 URL·메서드·응답 코드와 소스 기반 화면 결과를 모두 확인하고 스크린샷/요청 기록을 보존했다.

M3 학습 패치별 2차:

| 사례 | 판정 | 대표 탐지 TC |
|---|---|---|
| 01-binding | DETECTED | SUP-CREATE, SUP-UPDATE, TC-001 |
| 02-js-url | DETECTED | TC-018, TC-034, TC-035 |
| 03-request-encoding | DETECTED | SUP-CREATE, SUP-UPDATE, TC-009 |
| 04-session-bypass | DETECTED | SUP-CREATE, SUP-UPDATE, TC-001 |
| 05-paging | DETECTED | SUP-PAGING |
| 06-sort-sql | DETECTED | TC-001, TC-013, TC-016 |
| 07-oracle-log-only | BLOCKED | 로그 전용 |
| 08-thymeleaf-utilities | DETECTED | SUP-CREATE, SUP-UPDATE, TC-011 |
| 09-view-resolver | DETECTED | SUP-CREATE, SUP-UPDATE, TC-003 |
| 10-fragment-encoding | DETECTED | SUP-PAGING |

실행 가능 9건 중 **9건 DETECTED**, MISSED 0, Oracle 로그 전용 BLOCKED 1이다. v2 9/9 탐지와 비교하며, 정상에서 PASS한 동일 TC가 패치 사본에서 FAIL한 경우만 탐지로 센다. TC 해시와 1차 열 보존을 확인했다. FAIL 분류는 failure-review.json과 배포본 2차 비고에 남겼으며 기준선 미통과 행의 파생 실패는 미확정으로 제외한다. **학습/회귀 결함 탐지 확인이며 일반화 성능이 아니다.**

- npm test **187/187 PASS**, 승인 인벤토리·스킬·공통 복사본 검사 PASS. 선택 후보/정적 href/covered_by 누락/다른 화면 근거 혼합/진입 권한 회귀를 포함한다.
- node scripts/check-functional-selectors.mjs: 설치된 Chrome·Edge 각각 우선순위·중복 거부·폼 범위·href **4개 검증 PASS**. 브라우저 다운로드 없음.
- node scripts/audit-functional-run.mjs <v3-config> <이전-해시.json> <새-summary.json>: 스키마·누락·TC 연결·1차 불변·동일 TC·UI 증거·DB/덤프·저장 키·배포본 11개 검증 PASS.
- v1/v2의 기존 주요 결과/승인 기준 **101개 해시 동일**. 옛 v1 run에 원래 없던 18개 파일은 별도 기록하며 소급 생성하지 않았다. M4 동결/held-out·examples·양식 원본은 변경하지 않았다.
- 정상 사전 점검 run의 초기 오탐/차단도 보존했다. 진입 화면 권한·문서 title과 본문 구별·취소 링크와 저장 버튼 구별을 일반 규칙으로 고친 후 공식 v3를 시작했다. 패치 사본의 결과를 보고 TC를 바꾸지 않았다.

### 결정

- 등록/수정/관리 admin, 조회 viewer. 공개 조회 링크라도 관리자 화면에서 실행해야 하면 admin 세션을 쓴다. 로그인은 테스트베드의 역할 선택 방식 admin=ADMIN, viewer=READER에 대응한다. SKIP의 미실행 수행일·테스터는 공란이다.
- 실행 사본의 local datasource만 파일 H2로 바꿨고 DB 파일·SCRIPT NOPASSWORDS TO SQL 덤프·생성/수정 BOARD 키·실행 사본을 보존했다. 삭제·초기화·자동 롤백은 하지 않았다. UI 저장 후 화면 검증이 실패해도 확인된 생성 키를 남긴다.
- 배포본 수행일은 원시 UTC 시각을 Asia/Seoul 날짜로 변환했다. 자정 경계 회귀를 확인했으며 원시 실행 결과서의 날짜·바이너리는 소급 덮어쓰지 않았다. 각 2차 배포본은 같은 한국 시간 표시의 1차 배포본을 그대로 유지한다.
- 기존 시트·열·수식·드롭다운·병합과 1차 열을 보존해 재읽기했다. M4 서버 로직 48건은 별도 서버로직검증 시트에만 연결했다. 수식 원문을 유지했고 Excel 앱 직접 열기는 수행하지 않았다.

최종 1차 배포본:

- [legacy-board](../.sistack/runs/m5b-evaluation-v3/delivery/legacy-board/first.xlsx)
- [legacy-board-thymeleaf](../.sistack/runs/m5b-evaluation-v3/delivery/legacy-board-thymeleaf/first.xlsx)

각 폴더의 second-사례ID.xlsx가 2차 배포본이다. 원시 실행과 DB/화면/요청 증거는 examples/각프로젝트/.sistack/runs/m5b-first-v3/ 및 m5b-second-사례ID-v3/에 있다. 루트 .sistack/runs/m5b-evaluation-v3/의 manifest.json·report.md·completion-audit.json·delivery-receipts.json으로 연결한다. [공개 집계](evidence/m5b-v3/summary.json), [결과 JSON 스키마](../schemas/docs/functional-results.schema.json), [보존된 v2 보고](m5b-final-report.md)를 참고한다. 원본 양식/엑셀/DB/민감한 입력은 공개 커밋하지 않는다.

### 남은 문제

- BLOCKED 9건은 위 사유대로 유지하며 근거 없이 PASS로 바꾸지 않는다.
- 팝업 실제 표본 0개로 감지/실행 미검증. v0.2의 검증용 화면 백로그를 유지한다.
- 실행 어댑터는 두 legacy-board 테스트베드 계약에 한정된다. 동적 href/텍스트를 정적으로 확정하지 못하면 BLOCKED이며 임의 SI 인증·CRUD·동적 DOM 전체를 보장하지 않는다. 그리드 편집·파일 업로드·드래그·다단계 팝업은 v0.2다.
- 제공 일반 양식 검증은 회사 현장 검증이 아니다. 긴 근거는 원래 행 높이에서 잘릴 수 있어 셀 편집과 JSON을 함께 확인해야 한다. 기존 buffers@0.1.1 전이 라이선스 표시는 UNRESOLVED를 유지한다.

### 사용자 확인 필요

v3 배포본과 남은 BLOCKED·팝업 미검증 범위를 검토한다. **M5b를 완료 처리하고 여기서 멈춘다. M6는 시작하지 않았다.**
