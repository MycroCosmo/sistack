# legacy-board 함정 목록 — M0 설계 목록

이 문서는 M1·M2에서 다룰 패턴의 위치 목록이다. 승인된 eval 정답이나 연결 판정 결과가 아니다. 실제 정답 초안은 M1 GATE에서 별도로 검토한다. 테스트베드 소스에는 정답 힌트를 남기지 않는다.

아래 경로는 `examples/legacy-board/` 기준이며 2026-10-27 확인했다.

| 패턴 | 위치 | 검토 시 확인할 내용 |
|---|---|---|
| JS 문자열 조합 URL | `src/main/webapp/resources/board.js:3` | 화면의 data-base와 list + .do 조합; 게시판·공통코드 화면에서 함께 사용 |
| 다른 클래스의 동명 메서드 | `src/main/java/kr/sistack/board/web/BoardController.java:24`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:17` | 둘 다 list 메서드이므로 클래스·매핑·인자와 함께 구분 |
| 공통 페이징 클래스 | `src/main/java/kr/sistack/board/common/Pagination.java:3`, `src/main/webapp/WEB-INF/views/common/paging.jspf:1` | 두 목록 화면의 페이지 조건과 공통 JSP 사용 |
| 공유 SQL include | `src/main/resources/mapper/BoardMapper.xml:19`, `src/main/resources/mapper/CommonCode.xml:5`, `src/main/resources/mapper/CommonSql.xml:4` | namespace가 다른 include와 같은 Mapper 내부 filters include |
| 정렬 컬럼 `${}` | `src/main/resources/mapper/BoardMapper.xml:20`, `src/main/java/kr/sistack/board/domain/BoardSearch.java:34` | 허용 목록을 통해 상수 컬럼명만 선택하며 임의 SQL은 거부 |
| 주석 처리된 옛 호출 | `src/main/webapp/resources/board.js:10` | 실행되는 URL과 주석에만 남은 URL 구분 |
| 세션→request→Controller | `src/main/java/kr/sistack/board/web/LoginInterceptor.java:26`, `src/main/java/kr/sistack/board/web/BoardController.java:24` | 세션의 loginUser를 currentUser request 속성으로 전달 |
| 문자열 sqlId DAO | `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:13`, `src/main/resources/mapper/CommonCode.xml:4` | SqlSessionTemplate 호출과 namespace.statement 연결 |
| XML·어노테이션 Mapper 혼용 | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:7` | 메뉴 어노테이션 SQL과 게시판 XML SQL 구분 |

추가로 공유 코드가 여러 흐름에서 재사용되더라도 실행 경로 전체를 코드 위치와 호출 조건으로 확인해야 한다. 이 목록 자체를 문자열 검색의 정답으로 사용하지 않는다.
