# 게시판 목록 검색 — Thymeleaf — 승인 정답

경로 기준: `examples/legacy-board-thymeleaf/`, 소스 revision: `bfa5098ab8ec79b4c9062fc24348c9465456aa27`. 실제 수집기 eval은 미실행이다. JSON이 상세 근거·해시·범위의 기준이다.

사용자가 승인한 기존 17개 주 연결을 유지했다. 이 중 서버 16개를 parity, 화면 출발 1개를 screen에 배치하고 새 화면 연결을 추가했다.

| 사례 | parity 일치/정답 | screen 일치/정답 |
|---|---|---|
| legacy-board-thymeleaf-search | 미실행 / 16 | 미실행 / 7 |

JSP 승인본과의 정답 계약 대조는 16/16개 동일하다. 이는 from/to/kind/status 검증이며 실제 수집기 채점 점수가 아니다. 기준: `evals/trace/legacy-board-search/expected.json`.

## 범위와 해석

- GET 검색과 count/selectList의 주 경로를 검토한다. 검색어·정렬 값의 전체 안전성 증명은 범위 밖이다.
- Thymeleaf form의 정적 action을 비교한다. 외부 JS 검색 handler는 page만 1로 바꾸며 action을 재조합하지 않는다. 추가 분류 AJAX는 screen 채점 범위다.
- 요청 URL의 인터셉터 매핑과 preHandle→MenuMapper→APP_MENU 경로를 포함한다. 인증·CSRF 분기에 따른 실제 실행 여부와 세션 값 전파는 정적 연결과 구분한다.
- CONFIRMED는 소스로 확인한 정답 후보 상태이며 사용자 정답 승인을 뜻하지 않는다. 학습 eval은 아직 실행하지 않았다.

## parity 그룹

| 출발 | 관계 | 도착 | 상태 | 파일:라인 |
|---|---|---|---|---|
| GET /board/list.do | maps_to | web.BoardController#list | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/java/kr/sistack/board/web/BoardController.java:37` |
| web.BoardController#list | calls | service.impl.BoardServiceImpl#list | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:20`, `src/main/java/kr/sistack/board/web/BoardController.java:38`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:19` |
| service.impl.BoardServiceImpl#list | calls | mapper.BoardMapper#count | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:24`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10` |
| service.impl.BoardServiceImpl#list | calls | mapper.BoardMapper#selectList | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:25`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8` |
| mapper.BoardMapper#count | executes | mapper.BoardMapper.count | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10`, `src/main/resources/mapper/BoardMapper.xml:37` |
| mapper.BoardMapper#selectList | executes | mapper.BoardMapper.selectList | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8`, `src/main/resources/mapper/BoardMapper.xml:30` |
| mapper.BoardMapper.count | reads | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:38` |
| mapper.BoardMapper.selectList | reads | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:32` |
| mapper.BoardMapper.count | includes | mapper.BoardMapper.filters | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:39`, `src/main/resources/mapper/BoardMapper.xml:12` |
| mapper.BoardMapper.selectList | includes | mapper.BoardMapper.filters | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:33`, `src/main/resources/mapper/BoardMapper.xml:12` |
| mapper.BoardMapper.selectList | includes | commonSql.pageStart | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:31`, `src/main/resources/mapper/CommonSql.xml:4` |
| mapper.BoardMapper.selectList | includes | commonSql.pageEnd | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:35`, `src/main/resources/mapper/CommonSql.xml:7` |
| GET /board/list.do | intercepted_by | web.LoginInterceptor#preHandle | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` |
| web.LoginInterceptor#preHandle | calls | mapper.MenuMapper#selectList | CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:11`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:38`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10` |
| mapper.MenuMapper#selectList | executes | mapper.MenuMapper.selectList | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |
| mapper.MenuMapper.selectList | reads | APP_MENU | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |

## screen 그룹

| 출발 | 관계 | 도착 | 상태 | 파일:라인 |
|---|---|---|---|---|
| templates/board/list.html | requests | GET /board/list.do | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/list.html:8`, `src/main/java/kr/sistack/board/web/BoardController.java:36` |
| web.BoardController#list | renders | templates/board/list.html | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:41`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:18`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:20`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:21`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:25`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:26`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:31`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:32`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:34`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:35`, `src/main/webapp/WEB-INF/templates/board/list.html:1` |
| templates/board/list.html | decorates | templates/layouts/default.html | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/list.html:2`, `src/main/webapp/WEB-INF/templates/board/list.html:5`, `src/main/webapp/WEB-INF/templates/layouts/default.html:14`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:28` |
| templates/layouts/default.html | includes | templates/fragments/common.html#menu | CONFIRMED | `src/main/webapp/WEB-INF/templates/layouts/default.html:13`, `src/main/webapp/WEB-INF/templates/fragments/common.html:4` |
| templates/board/list.html | includes | templates/fragments/common.html#paging | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/list.html:39`, `src/main/webapp/WEB-INF/templates/fragments/common.html:11` |
| templates/board/list.html#loadCategories | requests | GET /code/listJson.do | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/list.html:2`, `src/main/webapp/WEB-INF/templates/board/list.html:42`, `src/main/webapp/WEB-INF/templates/layouts/default.html:9`, `src/main/webapp/resources/thymeleaf-board.js:11`, `src/main/webapp/resources/thymeleaf-board.js:12`, `src/main/webapp/resources/thymeleaf-board.js:13`, `src/main/webapp/resources/thymeleaf-board.js:14`, `src/main/webapp/resources/thymeleaf-board.js:15`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:31`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:33` |
| templates/board/list.html#refreshCategories | requests | GET /code/listJson.do | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/list.html:2`, `src/main/webapp/WEB-INF/templates/board/list.html:43`, `src/main/webapp/WEB-INF/templates/layouts/default.html:9`, `src/main/webapp/resources/thymeleaf-board.js:11`, `src/main/webapp/resources/thymeleaf-board.js:12`, `src/main/webapp/resources/thymeleaf-board.js:13`, `src/main/webapp/resources/thymeleaf-board.js:14`, `src/main/webapp/resources/thymeleaf-board.js:15`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:31`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:33` |

## 채점 계약

- 두 그룹의 일치/정답·누락·과탐·상태 불일치를 각각 보고하고 합산하지 않는다.
- requests의 도착 endpoint는 HTTP 메서드와 쿼리 파라미터를 제외한 경로로 비교한다.
- renders는 Controller → 템플릿/JSP 파일, decorates는 화면 → 레이아웃, includes는 화면/레이아웃 → `fragment파일#이름`이다.
- screen 연결은 모두 edges/scope에 포함된다. supplemental_assertions로 제외하는 항목은 없다.
- CONFIRMED는 소스 근거 상태다. 실제 앱 동작·수집기 성공을 대신하지 않는다.

## 승인 기록

2026-10-27 사용자가 그룹별 채점 구조와 화면 연결 범위를 승인했다. 수집기 eval 결과는 별도 보고한다.
