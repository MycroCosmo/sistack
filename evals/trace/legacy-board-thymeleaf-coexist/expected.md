# 공통코드 JSP 뷰 공존 판정 — 승인 정답

경로 기준: `examples/legacy-board-thymeleaf/`, 소스 revision: `bfa5098ab8ec79b4c9062fc24348c9465456aa27`. 실제 수집기 eval은 미실행이다. JSON이 상세 근거·해시·범위의 기준이다.

| 사례 | parity 일치/정답 | screen 일치/정답 |
|---|---|---|
| legacy-board-thymeleaf-coexist | 적용 대상 없음 (0) | 미실행 / 1 |

## 범위와 해석

- 서버 조회 호출·SQL은 평가하지 않는다. parity는 적용 대상 없음이다.
- order 1 Thymeleaf viewNames는 code/list에 맞지 않고 order 2 JSP code/*와 prefix/suffix·존재 파일이 선택 근거다.
- checkExistence fallback 합성 검증은 이 사례와 별도다.

## parity 그룹

적용 대상 없음.

## screen 그룹

| 출발 | 관계 | 도착 | 상태 | 파일:라인 |
|---|---|---|---|---|
| web.CommonCodeController#list | renders | views/code/list.jsp | CONFIRMED | `src/main/java/kr/sistack/board/web/CommonCodeController.java:25`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:28`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:34`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:35`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:37`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:38`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:39`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:40`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:41`, `src/main/webapp/WEB-INF/views/code/list.jsp:1` |

## 채점 계약

- 두 그룹의 일치/정답·누락·과탐·상태 불일치를 각각 보고하고 합산하지 않는다.
- requests의 도착 endpoint는 HTTP 메서드와 쿼리 파라미터를 제외한 경로로 비교한다.
- renders는 Controller → 템플릿/JSP 파일, decorates는 화면 → 레이아웃, includes는 화면/레이아웃 → `fragment파일#이름`이다.
- screen 연결은 모두 edges/scope에 포함된다. supplemental_assertions로 제외하는 항목은 없다.
- CONFIRMED는 소스 근거 상태다. 실제 앱 동작·수집기 성공을 대신하지 않는다.

## 승인 기록

2026-10-27 사용자가 그룹별 채점 구조와 화면 연결 범위를 승인했다. 수집기 eval 결과는 별도 보고한다.
