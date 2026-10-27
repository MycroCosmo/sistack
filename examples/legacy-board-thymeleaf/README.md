# JSP·Thymeleaf 공존 테스트베드

legacy-board의 Java·Service·Mapper·SQL·기존 JUnit 테스트를 그대로 사용한다. Java 8 소스/API 수준, Spring 5.3.39, Thymeleaf Spring5 3.1.5.RELEASE, Layout Dialect 3.4.0이며 로컬 합성 H2만 사용한다.

```sh
mvn -q test
mvn jetty:run
```

다른 터미널에서 `node smoke.mjs`로 검색·등록 HTTP 검증을 수행한다. 주소는 `http://127.0.0.1:8080/legacy-board-thymeleaf/auth/login.do`다. 종료 시 서버 터미널에서 Ctrl+C를 누른다. 생성한 합성 글은 메모리 DB에 있으며 서버 종료 시 사라진다.

- `board/*`, `login`, `error`: Thymeleaf resolver(order 1), `/WEB-INF/templates/` + `.html`.
- `code/*`: JSP resolver(order 2), `/WEB-INF/views/` + `.jsp`. 공통코드 목록·JSP 조각·기존 JS를 유지한다.
- `web.xml`의 컨테이너 오류 403/404/500에 대한 직접 JSP 오류 페이지는 기존 동작을 보존한다. MVC의 `error` 뷰는 Thymeleaf다.
- 공통 레이아웃은 `layouts/default.html`, 메뉴·페이징은 `fragments/common.html`이다.
- 게시판 목록의 두 분류 버튼은 각각 `th:data-url`·`th:attr`를 쓰며 외부 `thymeleaf-board.js`가 `.data('url')`을 읽어 공통코드를 조회한다.

렌더링은 Thymeleaf 3.1.5 기준이다. 수집기의 3.0 문법 읽기·checkExistence 합성 검증과 실제 렌더링을 구별한다. Java 8 런타임 검증 여부는 마일스톤 보고서를 따른다. 운영 용도로 사용하지 않는다.
