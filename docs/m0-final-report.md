> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M0 종료 보고 — 2026-10-27

상태: **PASS — 사용자 legacy-board 구조 승인 및 M0 완료 지시 반영.** M1은 미착수다. 이전 작업의 상세 검증은 [재검토 보고서](m0-recheck-report.md)에 보존한다.

### 한 일

- 상세 JSP에 `var ctx = '${pageContext.request.contextPath}';`를 선언하고 삭제 AJAX URL을 `ctx + '/board/delete.do'`로 변경했다.
- 공통코드 AJAX의 `data-base + '/list' + 'Json.do'` 문자열 조합은 유지했다.
- [함정 목록](../evals/legacy-board-traps.md)에 contextPath 변수 + 리터럴 경로(확정 가능)를 추가했다. 총 14개 항목의 참조 라인을 실제 소스와 대조했다. 선언은 detail.jsp:7, 삭제 URL은 board.js:50이다.
- README와 MILESTONES에 M0 완료·M1 미착수를 기록했다.

### 검증

이번 최종 변경 후 Maven 3.9.10, JDK 17.0.14, Node 22.17.0으로 실행했다.

| 명령·검사 | 결과 | 범위·증거 단계 |
|---|---|---|
| legacy-board에서 `mvn -q test` | PASS | JUnit 2개, 실패·오류·스킵 0; 4단계 |
| `mvn -q jetty:run` 후 `node smoke.mjs` | PASS | localhost 앱 1개: 로그인·권한·JSP·CRUD·검색·JSON GET/POST·map 페이징·CSRF·이스케이프·로그아웃; 5단계(HTTP) |
| 루트에서 `npm.cmd test` | PASS | Node 테스트 8개, 실패·스킵 0 + 예제 스킬 1개 형식·공통 복사본 검사; 4단계 |
| Node vm으로 실제 board.js 삭제 핸들러 실행 | PASS | jQuery 대역 사용. 빈 contextPath와 /legacy-board 2개 조건의 URL·POST·id/csrf 전달 확인; 4단계 |
| 실제 상세 JSP HTTP 응답 | PASS | /legacy-board에서 ctx 값과 board.js보다 앞선 선언 순서 확인; 5단계(HTTP) |
| `git diff --check` 및 소스 대조 | PASS | 변경 범위·함정 참조 라인 확인; 2단계 |

샌드박스의 localhost 연결 제한으로 Jetty와 HTTP 검사는 권한 확장 후 실행했다. 추가 JSP 검사 초안은 로그인 후 세션 쿠키 갱신을 누락해 실패했으나 검사 코드를 바로잡은 뒤 통과했다. 위 테스트 수는 전체 입력 조합의 완전성을 뜻하지 않는다.

### 결정

확정 가능한 contextPath 연결 사례와 공통코드 문자열 조합 사례를 함께 유지한다. [설계 결정](decisions.md)에 기록했다. 구조 승인은 M1 eval 정답 승인과 별개다.

### 남은 문제

이번 변경 후 브라우저 클릭 및 JDK 11 재실행은 하지 않았다. 실제 HTTP 응답과 JS 대역 실행을 분리 검증한 범위다. Oracle/prod 실행, Java 8 JVM 실행 등 기존 미검증 범위는 이전 보고서와 같다.

### 사용자 확인 필요

없음. 사용자 승인에 따라 M0를 종료하며 M1은 시작하지 않는다.
