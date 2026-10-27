# 게시글 등록 — 승인 정답

사용자 검토 조건을 반영한 정답이다. 인덱서 출력이 아닌 소스와 검토 지시를 근거로 작성했다. 기준 revision: `fbffe3be67245ae15015af59597dea4ada200c41`. 경로 기준: `examples/legacy-board/`.

선정 이유: 조건부 JSP 저장 URL과 쓰기 SQL·selectKey를 확인하는 등록 기준선

## 범위와 해석

- 등록 화면의 리터럴 삼항식 두 분기를 모두 도달 가능 경로로 보아 POST /board/create.do와 POST /board/update.do를 CONFIRMED로 기록한다. update의 Controller 이후 업무 흐름은 이 등록 사례의 범위 밖이다.
- validate의 내부 값 검사는 연결 표 밖이지만 호출 자체는 포함한다.
- selectKey의 DUAL 읽기와 BOARD 쓰기를 구분한다. 실제 운영 Oracle 접속은 하지 않는다.
- 요청 URL의 인터셉터 매핑과 preHandle→MenuMapper→APP_MENU 경로를 포함한다. 인증·CSRF 분기에 따른 실제 실행 여부와 세션 값 전파는 정적 연결과 구분한다.

JSON scope의 출발 노드·관계 종류·위치만 평가한다. 실제 앱 실행이나 전체 프로젝트 정확도를 뜻하지 않는다. source_files 해시와 모든 evidence 라인은 npm test에서 검사한다.

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/views/board/form.jsp | requests | POST /board/create.do | CONFIRMED | `src/main/webapp/WEB-INF/views/board/form.jsp:12`, `src/main/webapp/WEB-INF/views/board/form.jsp:13`, `src/main/java/kr/sistack/board/web/BoardController.java:57` |  |
| src/main/webapp/WEB-INF/views/board/form.jsp | requests | POST /board/update.do | CONFIRMED | `src/main/webapp/WEB-INF/views/board/form.jsp:12`, `src/main/webapp/WEB-INF/views/board/form.jsp:13`, `src/main/java/kr/sistack/board/web/BoardController.java:62` |  |
| POST /board/create.do | maps_to | kr.sistack.board.web.BoardController#create | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:57`, `src/main/java/kr/sistack/board/web/BoardController.java:58` |  |
| kr.sistack.board.web.BoardController#create | calls | kr.sistack.board.service.impl.BoardServiceImpl#create | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:20`, `src/main/java/kr/sistack/board/web/BoardController.java:59`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:39` |  |
| kr.sistack.board.service.impl.BoardServiceImpl#create | calls | kr.sistack.board.service.impl.BoardServiceImpl#validate | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:40`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:64` |  |
| kr.sistack.board.service.impl.BoardServiceImpl#create | calls | kr.sistack.board.mapper.BoardMapper#insert | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:42`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:14` |  |
| kr.sistack.board.mapper.BoardMapper#insert | executes | kr.sistack.board.mapper.BoardMapper.insert | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:14`, `src/main/resources/mapper/BoardMapper.xml:44` |  |
| kr.sistack.board.mapper.BoardMapper.insert | reads | DUAL | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:46` |  |
| kr.sistack.board.mapper.BoardMapper.insert | writes | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:48` |  |
| POST /board/create.do | intercepted_by | kr.sistack.board.web.LoginInterceptor#preHandle | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:57`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` |  |
| POST /board/update.do | intercepted_by | kr.sistack.board.web.LoginInterceptor#preHandle | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:62`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` |  |
| kr.sistack.board.web.LoginInterceptor#preHandle | calls | kr.sistack.board.mapper.MenuMapper#selectList | CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:11`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:14`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:38`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10` |  |
| kr.sistack.board.mapper.MenuMapper#selectList | executes | kr.sistack.board.mapper.MenuMapper.selectList | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |  |
| kr.sistack.board.mapper.MenuMapper.selectList | reads | APP_MENU | CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |  |
