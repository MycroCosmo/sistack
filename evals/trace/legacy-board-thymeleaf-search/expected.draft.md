# 게시판 목록 검색 — Thymeleaf — 승인 대기 초안

사용자 승인 전이며 eval 점수는 없다. 소스 revision: `bfa5098ab8ec79b4c9062fc24348c9465456aa27`, 경로 기준: `examples/legacy-board-thymeleaf/`. JSON이 상세 범위·파일 해시·보충 검토 계약을 담는다.

## 기존 승인 정답과 대응

- 기준: `legacy-board-search` (17개 연결).
- 화면 출발 1개: `src/main/webapp/WEB-INF/views/board/list.jsp` → `src/main/webapp/WEB-INF/templates/board/list.html:8`.
- 서버 연결 16개: from/to/kind/status가 기존 승인본과 모두 동일하다. 소스 바이트 대조는 docs/evidence/m2.5-testbed/server-parity.json에 있다.
- 실제 렌더링은 3.1.5 기준이다. 3.0 문법·checkExistence·held-out 검증은 이 초안 밖이다.

## 범위와 해석

- GET 검색과 count/selectList의 주 경로를 검토한다. 검색어·정렬 값의 전체 안전성 증명은 범위 밖이다.
- Thymeleaf form의 정적 action을 비교한다. 외부 JS 검색 handler는 page만 1로 바꾸며 action을 재조합하지 않는다. 추가 분류 AJAX는 별도 보충 검토 범위다.
- 요청 URL의 인터셉터 매핑과 preHandle→MenuMapper→APP_MENU 경로를 포함한다. 인증·CSRF 분기에 따른 실제 실행 여부와 세션 값 전파는 정적 연결과 구분한다.
- CONFIRMED는 소스로 확인한 정답 후보 상태이며 사용자 정답 승인을 뜻하지 않는다. 학습 eval은 아직 실행하지 않았다.

## 주 연결 17개

아래 표의 서버명은 kr.sistack.board 접두사를 생략한다. 상세 근거 전체는 JSON의 evidence를 따른다.

| 출발 | 관계 | 도착 | 상태 | 근거 |
|---|---|---|---|---|
| templates/board/list.html | requests | GET /board/list.do | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/list.html:8`, `src/main/java/kr/sistack/board/web/BoardController.java:36` |
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

## 별도 승인할 보충 항목 7건

기존 연결 점수와 합산하지 않는다. 각 항목은 소스로 검토했으며 수집기 출력과 비교한 결과가 아니다. 기존 evalTrace만 실행해 자동 통과했다고 보고할 수 없다.

- **thymeleaf-view / CONFIRMED**: kr.sistack.board.web.BoardController#list → src/main/webapp/WEB-INF/templates/board/list.html. 등록된 빈 참조와 반환 뷰·viewNames·prefix/suffix·존재하는 파일을 함께 확인한다. 등록 사례의 GET form 화면 선택은 기존 POST 등록 서버 점수 밖이다.
  - 근거: `src/main/java/kr/sistack/board/web/BoardController.java:41`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:18`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:20`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:21`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:25`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:26`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:31`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:32`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:34`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:35`, `src/main/webapp/WEB-INF/templates/board/list.html:1`
- **layout-content / CONFIRMED**: src/main/webapp/WEB-INF/templates/board/list.html → src/main/webapp/WEB-INF/templates/layouts/default.html :: content. 등록된 LayoutDialect와 decorate 대상, 같은 이름 content 본문/삽입 위치를 확인한다.
  - 근거: `src/main/webapp/WEB-INF/templates/board/list.html:2`, `src/main/webapp/WEB-INF/templates/board/list.html:5`, `src/main/webapp/WEB-INF/templates/layouts/default.html:14`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:28`
- **shared-menu / CONFIRMED**: src/main/webapp/WEB-INF/templates/layouts/default.html → src/main/webapp/WEB-INF/templates/fragments/common.html :: menu. 정적 fragment 참조의 연결이다. 로그인 조건의 실제 값이나 메뉴의 동적 URL을 확정한다는 뜻은 아니다.
  - 근거: `src/main/webapp/WEB-INF/templates/layouts/default.html:13`, `src/main/webapp/WEB-INF/templates/fragments/common.html:4`
- **jsp-coexistence / CONFIRMED**: kr.sistack.board.web.CommonCodeController#list → src/main/webapp/WEB-INF/views/code/list.jsp. code/list는 Thymeleaf viewNames에 맞지 않고 JSP code/*에 맞는다. JSP 존재도 확인한다.
  - 근거: `src/main/java/kr/sistack/board/web/CommonCodeController.java:25`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:28`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:34`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:35`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:37`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:38`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:39`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:40`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:41`, `src/main/webapp/WEB-INF/views/code/list.jsp:1`
- **paging-fragment / CONFIRMED**: src/main/webapp/WEB-INF/templates/board/list.html → src/main/webapp/WEB-INF/templates/fragments/common.html :: paging. 정적 th:replace 대상과 th:fragment 선언 연결이다.
  - 근거: `src/main/webapp/WEB-INF/templates/board/list.html:39`, `src/main/webapp/WEB-INF/templates/fragments/common.html:11`
- **data-ajax-loadCategories / CONFIRMED**: src/main/webapp/WEB-INF/templates/board/list.html#loadCategories → GET /code/listJson.do. 해당 요소의 URL 선언 → 레이아웃의 외부 JS 포함 → 두 ID 선택자 → this/button → data(url) → GET AJAX 소비 → Controller 매핑. 미사용 data 속성을 요청으로 세지 않는다. 이후 공통코드 서비스/DB는 추가 화면 범위 밖이다.
  - 근거: `src/main/webapp/WEB-INF/templates/board/list.html:2`, `src/main/webapp/WEB-INF/templates/board/list.html:42`, `src/main/webapp/WEB-INF/templates/layouts/default.html:9`, `src/main/webapp/resources/thymeleaf-board.js:11`, `src/main/webapp/resources/thymeleaf-board.js:12`, `src/main/webapp/resources/thymeleaf-board.js:13`, `src/main/webapp/resources/thymeleaf-board.js:14`, `src/main/webapp/resources/thymeleaf-board.js:15`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:31`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:33`
- **data-ajax-refreshCategories / CONFIRMED**: src/main/webapp/WEB-INF/templates/board/list.html#refreshCategories → GET /code/listJson.do. 해당 요소의 URL 선언 → 레이아웃의 외부 JS 포함 → 두 ID 선택자 → this/button → data(url) → GET AJAX 소비 → Controller 매핑. 미사용 data 속성을 요청으로 세지 않는다. 이후 공통코드 서비스/DB는 추가 화면 범위 밖이다.
  - 근거: `src/main/webapp/WEB-INF/templates/board/list.html:2`, `src/main/webapp/WEB-INF/templates/board/list.html:43`, `src/main/webapp/WEB-INF/templates/layouts/default.html:9`, `src/main/webapp/resources/thymeleaf-board.js:11`, `src/main/webapp/resources/thymeleaf-board.js:12`, `src/main/webapp/resources/thymeleaf-board.js:13`, `src/main/webapp/resources/thymeleaf-board.js:14`, `src/main/webapp/resources/thymeleaf-board.js:15`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:31`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:33`

## 사용자 확인 필요

주 연결의 화면 교체·서버 연결 유지와 보충 항목 범위를 승인해 주세요. 승인 후에만 expected.json/expected.md로 확정하고 학습 세트에 등록·채점합니다.
