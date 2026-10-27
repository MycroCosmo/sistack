# 게시판 목록 검색 — 정답 초안

승인 전 초안이며 정확도 판정에 쓰지 않는다. 인덱서 출력이 아닌 대상 소스의 선언·사용을 직접 읽고 작성했다. 기준 revision: `fbffe3be67245ae15015af59597dea4ada200c41`. 경로 기준: `examples/legacy-board/`.

선정 이유: 화면→이름 주입 Service→Mapper 인터페이스→SQL include·테이블의 정상 기준선

## 범위와 검토 질문

- GET 검색과 count/selectList의 주 경로를 검토한다. 검색어·정렬 값의 전체 안전성 증명은 범위 밖이다.
- JS submit 핸들러의 문자열 재조합은 별도 UNRESOLVED 함정이다. 여기서는 JSP form의 선언된 기본 action을 비교한다.
- 인터셉터의 세션→request 전달은 별도 함정 테스트 대상으로, 이 연결 표의 실행 전제다.

JSON의 scope에 명시한 출발 노드·연결 종류·화면 위치만 비교한다. DB별 같은 이름의 SQL은 논리 연결 하나로 묶고, 실행 설정 선택은 LIKELY로 남긴다. 범위 밖 호출·보조 화면·런타임 결과를 전체 정확도로 확대하지 않는다.

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
