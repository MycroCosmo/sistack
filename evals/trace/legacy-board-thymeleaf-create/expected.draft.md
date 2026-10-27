# 게시글 등록 — Thymeleaf — 승인 대기 초안

사용자 승인 전이며 eval 점수는 없다. 소스 revision: `bfa5098ab8ec79b4c9062fc24348c9465456aa27`, 경로 기준: `examples/legacy-board-thymeleaf/`. JSON이 상세 범위·파일 해시·보충 검토 계약을 담는다.

## 기존 승인 정답과 대응

- 기준: `legacy-board-create` (14개 연결).
- 화면 출발 2개: `src/main/webapp/WEB-INF/views/board/form.jsp` → `src/main/webapp/WEB-INF/templates/board/form.html:7`.
- 서버 연결 12개: from/to/kind/status가 기존 승인본과 모두 동일하다. 소스 바이트 대조는 docs/evidence/m2.5-testbed/server-parity.json에 있다.
- 실제 렌더링은 3.1.5 기준이다. 3.0 문법·checkExistence·held-out 검증은 이 초안 밖이다.

## 범위와 해석

- Thymeleaf th:action의 리터럴 두 분기를 모두 도달 가능 경로로 보아 create/update 요청을 CONFIRMED로 기록한다. update Controller 이후 업무 흐름은 기존 등록 사례와 같이 범위 밖이다.
- validate의 내부 값 검사는 연결 표 밖이지만 호출 자체는 포함한다.
- selectKey의 DUAL 읽기와 BOARD 쓰기를 구분한다. 실제 운영 Oracle 접속은 하지 않는다.
- 요청 URL의 인터셉터 매핑과 preHandle→MenuMapper→APP_MENU 경로를 포함한다. 인증·CSRF 분기에 따른 실제 실행 여부와 세션 값 전파는 정적 연결과 구분한다.
- CONFIRMED는 소스로 확인한 정답 후보 상태이며 사용자 정답 승인을 뜻하지 않는다. 학습 eval은 아직 실행하지 않았다.

## 주 연결 14개

아래 표의 서버명은 kr.sistack.board 접두사를 생략한다. 상세 근거 전체는 JSON의 evidence를 따른다.

| 출발 | 관계 | 도착 | 상태 | 근거 |
|---|---|---|---|---|
| templates/board/form.html | requests | POST /board/create.do | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/form.html:7`, `src/main/webapp/WEB-INF/templates/board/form.html:7`, `src/main/java/kr/sistack/board/web/BoardController.java:57` |
| templates/board/form.html | requests | POST /board/update.do | CONFIRMED | `src/main/webapp/WEB-INF/templates/board/form.html:7`, `src/main/webapp/WEB-INF/templates/board/form.html:7`, `src/main/java/kr/sistack/board/web/BoardController.java:62` |
| POST /board/create.do | maps_to | web.BoardController#create | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:57`, `src/main/java/kr/sistack/board/web/BoardController.java:58` |
| web.BoardController#create | calls | service.impl.BoardServiceImpl#create | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:20`, `src/main/java/kr/sistack/board/web/BoardController.java:59`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:39` |
| service.impl.BoardServiceImpl#create | calls | service.impl.BoardServiceImpl#validate | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:40`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:64` |
| service.impl.BoardServiceImpl#create | calls | mapper.BoardMapper#insert | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:42`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:14` |
| mapper.BoardMapper#insert | executes | mapper.BoardMapper.insert | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:14`, `src/main/resources/mapper/BoardMapper.xml:44` |
| mapper.BoardMapper.insert | reads | DUAL | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:46` |
| mapper.BoardMapper.insert | writes | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:48` |
| POST /board/create.do | intercepted_by | web.LoginInterceptor#preHandle | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:57`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` |
| POST /board/update.do | intercepted_by | web.LoginInterceptor#preHandle | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:62`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` |
| web.LoginInterceptor#preHandle | calls | mapper.MenuMapper#selectList | CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:11`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:38`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10` |
| mapper.MenuMapper#selectList | executes | mapper.MenuMapper.selectList | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |
| mapper.MenuMapper.selectList | reads | APP_MENU | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |

## 별도 승인할 보충 항목 3건

기존 연결 점수와 합산하지 않는다. 각 항목은 소스로 검토했으며 수집기 출력과 비교한 결과가 아니다. 기존 evalTrace만 실행해 자동 통과했다고 보고할 수 없다.

- **thymeleaf-view / CONFIRMED**: kr.sistack.board.web.BoardController#form → src/main/webapp/WEB-INF/templates/board/form.html. 등록된 빈 참조와 반환 뷰·viewNames·prefix/suffix·존재하는 파일을 함께 확인한다. 등록 사례의 GET form 화면 선택은 기존 POST 등록 서버 점수 밖이다.
  - 근거: `src/main/java/kr/sistack/board/web/BoardController.java:54`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:18`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:20`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:21`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:25`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:26`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:31`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:32`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:34`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:35`, `src/main/webapp/WEB-INF/templates/board/form.html:1`
- **layout-content / CONFIRMED**: src/main/webapp/WEB-INF/templates/board/form.html → src/main/webapp/WEB-INF/templates/layouts/default.html :: content. 등록된 LayoutDialect와 decorate 대상, 같은 이름 content 본문/삽입 위치를 확인한다.
  - 근거: `src/main/webapp/WEB-INF/templates/board/form.html:2`, `src/main/webapp/WEB-INF/templates/board/form.html:5`, `src/main/webapp/WEB-INF/templates/layouts/default.html:14`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:28`
- **shared-menu / CONFIRMED**: src/main/webapp/WEB-INF/templates/layouts/default.html → src/main/webapp/WEB-INF/templates/fragments/common.html :: menu. 정적 fragment 참조의 연결이다. 로그인 조건의 실제 값이나 메뉴의 동적 URL을 확정한다는 뜻은 아니다.
  - 근거: `src/main/webapp/WEB-INF/templates/layouts/default.html:13`, `src/main/webapp/WEB-INF/templates/fragments/common.html:4`

## 사용자 확인 필요

주 연결의 화면 교체·서버 연결 유지와 보충 항목 범위를 승인해 주세요. 승인 후에만 expected.json/expected.md로 확정하고 학습 세트에 등록·채점합니다.
