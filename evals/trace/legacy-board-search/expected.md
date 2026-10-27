# 게시판 목록 검색 — 승인 정답

사용자 검토 조건을 반영한 정답이다. 인덱서 출력이 아닌 소스와 검토 지시를 근거로 작성했다. 기준 revision: `fbffe3be67245ae15015af59597dea4ada200c41`. 경로 기준: `examples/legacy-board/`.

선정 이유: 화면→이름 주입 Service→Mapper 인터페이스→SQL include·테이블의 정상 기준선

## 범위와 해석

- GET 검색과 count/selectList의 주 경로를 검토한다. 검색어·정렬 값의 전체 안전성 증명은 범위 밖이다.
- JS submit 핸들러의 문자열 재조합은 별도 UNRESOLVED 함정이다. 여기서는 JSP form의 선언된 기본 action을 비교한다.
- 요청 URL의 인터셉터 매핑과 preHandle→MenuMapper→APP_MENU 경로를 포함한다. 인증·CSRF 분기에 따른 실제 실행 여부와 세션 값 전파는 정적 연결과 구분한다.

JSON scope의 출발 노드·관계 종류·위치만 평가한다. 실제 앱 실행이나 전체 프로젝트 정확도를 뜻하지 않는다. source_files 해시와 모든 evidence 라인은 npm test에서 검사한다.

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/views/board/list.jsp | requests | GET /board/list.do | CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:14`, `src/main/java/kr/sistack/board/web/BoardController.java:36` |  |
| GET /board/list.do | maps_to | kr.sistack.board.web.BoardController#list | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/java/kr/sistack/board/web/BoardController.java:37` |  |
| kr.sistack.board.web.BoardController#list | calls | kr.sistack.board.service.impl.BoardServiceImpl#list | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:20`, `src/main/java/kr/sistack/board/web/BoardController.java:38`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:19` |  |
| kr.sistack.board.service.impl.BoardServiceImpl#list | calls | kr.sistack.board.mapper.BoardMapper#count | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:24`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10` |  |
| kr.sistack.board.service.impl.BoardServiceImpl#list | calls | kr.sistack.board.mapper.BoardMapper#selectList | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:25`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8` |  |
| kr.sistack.board.mapper.BoardMapper#count | executes | kr.sistack.board.mapper.BoardMapper.count | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10`, `src/main/resources/mapper/BoardMapper.xml:37` |  |
| kr.sistack.board.mapper.BoardMapper#selectList | executes | kr.sistack.board.mapper.BoardMapper.selectList | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8`, `src/main/resources/mapper/BoardMapper.xml:30` |  |
| kr.sistack.board.mapper.BoardMapper.count | reads | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:38` |  |
| kr.sistack.board.mapper.BoardMapper.selectList | reads | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:32` |  |
| kr.sistack.board.mapper.BoardMapper.count | includes | kr.sistack.board.mapper.BoardMapper.filters | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:39`, `src/main/resources/mapper/BoardMapper.xml:12` |  |
| kr.sistack.board.mapper.BoardMapper.selectList | includes | kr.sistack.board.mapper.BoardMapper.filters | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:33`, `src/main/resources/mapper/BoardMapper.xml:12` |  |
| kr.sistack.board.mapper.BoardMapper.selectList | includes | commonSql.pageStart | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:31`, `src/main/resources/mapper/CommonSql.xml:4` |  |
| kr.sistack.board.mapper.BoardMapper.selectList | includes | commonSql.pageEnd | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:35`, `src/main/resources/mapper/CommonSql.xml:7` |  |
| GET /board/list.do | intercepted_by | kr.sistack.board.web.LoginInterceptor#preHandle | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` |  |
| kr.sistack.board.web.LoginInterceptor#preHandle | calls | kr.sistack.board.mapper.MenuMapper#selectList | CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:11`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:38`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10` |  |
| kr.sistack.board.mapper.MenuMapper#selectList | executes | kr.sistack.board.mapper.MenuMapper.selectList | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |  |
| kr.sistack.board.mapper.MenuMapper.selectList | reads | APP_MENU | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |  |
