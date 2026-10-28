# 화면 기능 TC

M5b만 Node >=20이다. 설치된 Chrome/Edge와 승인한 playwright-core 1.64.1을 사용하며 브라우저를 다운로드하지 않는다.

```
node <skill>/scripts/functional.mjs plan <project> <new-plan.json>
node <skill>/scripts/functional.mjs run <project> <plan.json> <config.json> <new-run-id>
```

plan은 form/버튼/핸들러/AJAX/data-url/링크/fragment/팝업/숨김 입력 선언을 파일:라인과 연결해 동작 인벤토리와 1:1 TC를 만들고 fragment/숨김 필드는 인벤토리에 유지하면서 covered_by로 화면 TC에 연결한다. 구조 항목의 엑셀 행은 만들지 않는다. URL·메서드를 알면 기대 요청에 포함한다. 모르면 UNRESOLVED다. fragment 선언과 포함 지점, 독립 화면을 구별한다. 별도 source census와 사용자 승인 기준으로 누락을 대조하며 같은 인덱스끼리 비교한 값을 전수성 근거로 쓰지 않는다.

run의 config는 allow_execution=true, round=1 또는 2, java_home/maven, template/mapping, m4(승인된 M4 JSON 경로)를 요구한다. round=2는 first_workbook 경로가 필요하다. 테스트베드 어댑터는 역할 선택형 로그인에 admin=ADMIN, viewer=READER를 사용한다. 사용자 지정 계정이 이 프로필과 다르거나 대상 인증 계약이 다르면 실행 전에 매핑을 확인해야 한다. 다른 프로젝트의 인증/등록 계약을 추정하지 않는다.

- AUTO-API: 쿠키/CSRF를 실제 로그인 세션으로 유지하며 상태 코드와 업무 응답/재조회 값을 확인한다.
- AUTO-UI: 선택 순서는 실제 id → name → 정적 href/th:href 해석값 → 유일한 소스 버튼/링크 텍스트 → 소스 폼 범위의 유일한 버튼 텍스트다. 실제 일치 건수와 근거 파일:라인을 JSON/비고에 쓴다. 동적 값 미확정/중복은 BLOCKED이며 임의 텍스트/role/nth로 대신하지 않는다. 초기 진입이 아니라 동작 후의 URL·메서드·응답과 화면 변화를 확인한다. 케이스별 스크린샷/요청 기록을 저장한다.
- SKIP: 삭제/다운로드만이며 호출하지 않는다. 선택자 부족/권한/미지원은 SKIP으로 숨기지 않는다. 수동 값을 도구가 쓰지 않는다.
- 테스터는 케이스에 실제 사용한 승인 계정 ID다. 1차/2차가 불명확하면 질문한다. 2차는 기존 1차 셀/원본 해시를 검증하고 2차 열에만 쓴다.
- BLOCKED는 결과 빈 칸+해당 차수 비고+JSON BLOCKED다. FAIL은 제품 결함/자동화 오탐/미확정을 구별하며 오탐이라고 PASS로 바꾸지 않는다.
- M4 근거는 서버로직검증 별도 시트에만 추가한다. 기존 사용자 시트/수식/드롭다운/열을 바꾸지 않는다.

실행은 원본을 복사한 새 evidence/project에서만 한다. 해당 사본의 local datasource만 파일 H2로 바꾼다. 생성/수정 데이터를 삭제하지 않고 DB 파일·SCRIPT NOPASSWORDS TO SQL 덤프·확인 테이블/키·실행 사본을 보존한다. 다시 서버를 띄워 초기화 스크립트를 중복 실행하지 않는다. 서버 종료 뒤 저장된 키를 조회해 실제 보존을 확인한다.

현재 실행 어댑터의 업무 요청/검증 계약은 두 legacy-board 테스트베드에 한정된다. 임의 SI 프로젝트의 인증/CRUD를 범용 실행한다고 표현하지 않는다. 정적 스캐너의 지원 문법 밖 동적 DOM/스크립트는 추가 근거가 필요하다. 단일 팝업은 수집하지만 두 테스트베드에는 실행 검증 표본이 없다. 그리드 편집/파일 업로드/드래그/다단계 팝업은 v0.2 범위다.
