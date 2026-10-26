# legacy-board 함정 목록 — M0 재검토 설계 목록

이 문서는 M1·M2에서 다룰 패턴의 위치 목록이며 승인된 eval 정답이 아니다. 연결 판정 정답은 M1 GATE에서 따로 검토한다. 테스트베드 코드에는 정답 힌트를 넣지 않는다.

경로는 examples/legacy-board/ 기준이며 2026-10-27 수정 소스에서 라인 번호를 확인했다.

| 패턴 | 위치 | 검토할 내용 |
|---|---|---|
| JS 문자열 조합 URL | `src/main/webapp/resources/board.js:3` | 화면 data-base와 list + .do 조합; 게시판·공통코드 화면에서 사용 |
| 다른 클래스의 동명 메서드 | `src/main/java/kr/sistack/board/web/BoardController.java:37`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:26` | 같은 list 이름을 클래스·매핑·인자로 구분 |
| 공통 페이징 | `src/main/java/kr/sistack/board/common/Pagination.java:3`, `src/main/webapp/WEB-INF/views/common/paging.jspf:2` | 두 목록 화면에서 공유하는 Java·JSP |
| 공유 SQL include | `src/main/resources/mapper/BoardMapper.xml:31`, `src/main/resources/mapper/CommonCode.xml:5`, `src/main/resources/mapper/CommonSql.xml:4` | 다른 namespace의 include 및 BoardMapper 내부 filters 구분 |
| 정렬 컬럼 ${} | `src/main/resources/mapper/BoardMapper.xml:34`, `src/main/java/kr/sistack/board/domain/BoardSearch.java:77` | 허용 목록 상수만 전달; 검색어 #{...} 바인딩과 구분 |
| 주석 처리된 옛 호출 | `src/main/webapp/resources/board.js:70` | 실행 URL과 주석 URL을 구분 |
| 세션→request→Controller | `src/main/java/kr/sistack/board/web/LoginInterceptor.java:37`, `src/main/java/kr/sistack/board/web/BoardController.java:37` | loginUser 세션 값이 currentUser request 속성으로 전달 |
| 문자열 sqlId DAO | `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:16` | commonCode.selectList 문자열과 XML namespace.statement 연결 |
| XML·어노테이션 Mapper 혼용 | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:7` | 메뉴 어노테이션 SQL과 게시판 XML SQL 구분 |
| 서비스 인터페이스→Impl·이름 주입 | `src/main/java/kr/sistack/board/service/BoardService.java:7`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/web/BoardController.java:20` | 인터페이스 타입과 @Resource 이름을 @Service 구현에 연결. @Autowired 필드와 LoginInterceptor 생성자 DI가 혼재 |
| 공통코드 서비스 구현·map 파라미터 | `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:20`, `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:15`, `src/main/resources/mapper/CommonCode.xml:4` | Pagination getter에서 offset/endRow 키로 변환한 값을 공통 SQL의 #{offset}/#{endRow}로 전달 |
| AJAX GET URL→JSON | `src/main/webapp/resources/board.js:21`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:31` | $.ajax GET → @ResponseBody → 서비스·DAO·map Mapper → codes/page/total JSON → DOM 셀 갱신 |
| AJAX POST URL·요청 데이터 | `src/main/webapp/resources/board.js:50`, `src/main/java/kr/sistack/board/web/BoardController.java:68` | id/csrf POST → 인터셉터 → 서비스 Impl 삭제 → JSON success → JS의 목록 이동. HTTP redirect 응답과 구분 |

추가 분석 자료: src/main/resources/db/oracle/ddl.sql의 테이블·컬럼 한글 COMMENT와 globals.properties/ prod datasource 정의. local 실행에는 H2 test 설정만 사용한다. 정적 설정이 있다는 사실을 실제 운영 DB 연결의 근거로 사용하지 않는다.
