# 게시글 등록 — 정답 초안

승인 전 초안이며 정확도 판정에 쓰지 않는다. 인덱서 출력이 아닌 대상 소스의 선언·사용을 직접 읽고 작성했다. 기준 revision: `fbffe3be67245ae15015af59597dea4ada200c41`. 경로 기준: `examples/legacy-board/`.

선정 이유: 조건부 JSP 저장 URL과 쓰기 SQL·selectKey를 확인하는 등록 기준선

## 범위와 검토 질문

- board.id == 0인 신규 등록 분기를 선택한다. JSP EL의 삼항식과 fn:escapeXml(saveUrl)을 따라가면 POST /board/create.do다. 이 조건부 연결을 CONFIRMED로 평가할지 검토가 필요하다.
- validate의 내부 값 검사는 연결 표 밖이지만 호출 자체는 포함한다.
- selectKey의 DUAL 읽기와 BOARD 쓰기를 구분한다. 실제 운영 Oracle 접속은 하지 않는다.

JSON의 scope에 명시한 출발 노드·연결 종류·화면 위치만 비교한다. DB별 같은 이름의 SQL은 논리 연결 하나로 묶고, 실행 설정 선택은 LIKELY로 남긴다. 범위 밖 호출·보조 화면·런타임 결과를 전체 정확도로 확대하지 않는다.

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/views/board/form.jsp | requests | POST /board/create.do | CONFIRMED | `src/main/webapp/WEB-INF/views/board/form.jsp:12`, `src/main/webapp/WEB-INF/views/board/form.jsp:13`, `src/main/java/kr/sistack/board/web/BoardController.java:57` |  |
| POST /board/create.do | maps_to | kr.sistack.board.web.BoardController#create | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:57`, `src/main/java/kr/sistack/board/web/BoardController.java:58` |  |
| kr.sistack.board.web.BoardController#create | calls | kr.sistack.board.service.impl.BoardServiceImpl#create | CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:20`, `src/main/java/kr/sistack/board/web/BoardController.java:59`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:39` |  |
| kr.sistack.board.service.impl.BoardServiceImpl#create | calls | kr.sistack.board.service.impl.BoardServiceImpl#validate | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:40`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:64` |  |
| kr.sistack.board.service.impl.BoardServiceImpl#create | calls | kr.sistack.board.mapper.BoardMapper#insert | CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:15`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:42`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:14` |  |
| kr.sistack.board.mapper.BoardMapper#insert | executes | kr.sistack.board.mapper.BoardMapper.insert | CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:14`, `src/main/resources/mapper/BoardMapper.xml:44` |  |
| kr.sistack.board.mapper.BoardMapper.insert | reads | DUAL | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:46` |  |
| kr.sistack.board.mapper.BoardMapper.insert | writes | BOARD | CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:48` |  |
