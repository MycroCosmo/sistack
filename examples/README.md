# M0 테스트베드

legacy-board는 **의도적으로 구버전을 쓰는 테스트베드이며 운영 용도가 아님**을 명시합니다. Spring 5.3 OSS 지원은 2024-08-31 종료됐습니다. EOL·CVE 경고를 문서화하고 승인된 버전을 유지합니다. 전체 보안 감사나 운영 적합성을 보증하지 않습니다.

## 실행

JDK 11 또는 17, Maven 3.9.x를 사용합니다. 컴파일러 `<release>8</release>`로 Java 8 소스·API 수준을 고정합니다.

```sh
cd examples/legacy-board
mvn -q test
mvn -q package
mvn jetty:run
```

[로컬 로그인](http://127.0.0.1:8080/legacy-board/auth/login.do)에서 조회자 또는 관리자 역할을 선택합니다. 실제 인증 시스템이 아닌 합성 역할 선택입니다. 관리자만 등록·수정·삭제·공통코드 화면을 이용합니다. 다른 터미널에서 `node smoke.mjs`로 실제 HTTP 흐름을 확인하고, 종료할 때 서버 터미널에서 Ctrl+C를 누릅니다. 서버 재시작 시 메모리 데이터는 초기화됩니다.

H2 2.2.224는 **test 스코프**이고 Oracle 모드로 실행합니다. `src/test/resources/spring/local-datasource.xml`과 초기 SQL 역시 테스트 클래스패스에만 있습니다. Jetty 플러그인의 useTestScope·local 프로필을 통해 로컬 실행합니다. 기본 WAR에는 H2가 포함되지 않고, 독립 운영 배포용 datasource는 제공하지 않습니다. Oracle 실제 DB 호환성은 검증하지 않았습니다.

Maven Central이 차단되거나 JDK/Maven이 없으면 검증은 BLOCKED입니다. 접근 가능한 개발 환경에서 위 명령을 그대로 실행하며, 실패한 다운로드·검증을 성공으로 간주하지 않습니다.

## 화면과 URL

경로는 `/legacy-board` 컨텍스트 기준입니다. Controller 패키지는 `kr.sistack.board.web`, JSP 기준 경로는 `src/main/webapp/WEB-INF/views/`입니다.

| 화면/동작 | HTTP URL | Controller 메서드 | JSP |
|---|---|---|---|
| 역할 선택 로그인 | GET/POST `/auth/login.do` | AuthController.login / signIn | login.jsp |
| 로그아웃 | POST `/auth/logout.do` | AuthController.logout | redirect |
| 게시판 목록·제목/작성자/기간 검색 | GET `/board/list.do` | BoardController.list | board/list.jsp |
| 상세 | GET `/board/detail.do?id=...` | BoardController.detail | board/detail.jsp |
| 등록/수정 화면 | GET `/board/form.do[?id=...]` | BoardController.form | board/form.jsp |
| 등록 | POST `/board/create.do` | BoardController.create | 상세 redirect |
| 수정 | POST `/board/update.do` | BoardController.update | 상세 redirect |
| 삭제 | POST `/board/delete.do` | BoardController.delete | 목록 redirect |
| 분류 공통코드 | GET `/code/list.do` | CommonCodeController.list | code/list.jsp |
| 공통 오류 | HTTP 400/403/404/500 | CommonExceptionHandler·web.xml | error.jsp |

공통 조각: `common/header.jspf`, `common/menu.jspf`, `common/paging.jspf`. 목록 두 화면은 `resources/board.js`와 Pagination을 함께 사용합니다.

## 클래스·Mapper 목록

Java 기준 경로: `legacy-board/src/main/java/kr/sistack/board/`.

| 계층 | 클래스/파일 | 역할 |
|---|---|---|
| web | AuthController, BoardController, CommonCodeController | 로그인·게시판·공통코드 요청 |
| web | LoginInterceptor, UserSession, CommonExceptionHandler | 세션→request, 권한·CSRF, 오류 응답 |
| service | BoardService, CommonCodeService, NotFoundException | 목록·CRUD·입력 검증·미존재 처리 |
| dao | CommonCodeDao | SqlSessionTemplate의 문자열 sqlId 호출 |
| mapper | BoardMapper | XML Mapper 인터페이스 |
| mapper | MenuMapper | `@Select` 어노테이션 Mapper |
| domain | Board, BoardSearch, CommonCode, Menu | 게시글·검색 조건·코드·메뉴 |
| common | Pagination | 공통 페이지 번호·전체 건수·행 범위 |
| XML | mapper/BoardMapper.xml | selectList, count, selectOne, insert, update, delete; filters 조각 |
| XML | mapper/CommonCode.xml | commonCode.selectList, commonCode.count |
| XML | mapper/CommonSql.xml | pageStart, pageEnd 공통 SQL 조각 |

테이블: BOARD, COMMON_CODE, APP_MENU. 시퀀스: BOARD_SEQ. 기본 Service 단위 테스트 1개와 MVC→Service→실제 Mapper/H2 통합 테스트 1개만 둡니다. `smoke.mjs`는 실행된 서버에 로그인·권한·JSP·CRUD·검색·HTML 이스케이프를 확인합니다.

함정 위치는 [evals/legacy-board-traps.md](../evals/legacy-board-traps.md)에만 기록합니다. M1/M2 eval 정답이 아니며 연결 판정 정답은 별도 사용자 승인을 받아야 합니다.

## 외부 eGovFrame

| 항목 | 고정 값 |
|---|---|
| 공식 저장소 | https://github.com/eGovFramework/egovframe-common-components |
| 라이선스 | Apache-2.0 (`LICENSE`, `pom.xml`에서 확인) |
| 태그 | v4.2.4 |
| 기준 커밋 | `2303751d76c119b56dc2e6b6fe1002adafbef938` |
| 로컬 위치 | `.testbeds/egovframe/` (gitignore) |
| 확인 기술 | Spring XML, MyBatis SqlSessionFactoryBean/SqlSessionTemplate, JSP, Maven |
| 근거 파일 | `src/main/resources/egovframework/spring/com/context-mapper.xml`, `context-datasource.xml`, `pom.xml` |

루트에서 `node scripts/fetch-testbed.mjs egovframe`을 실행합니다. 재실행 시 HEAD·origin·로컬 변경 여부를 검사하고 변경된 폴더를 덮어쓰지 않습니다. 이 고정 버전은 MyBatis 테스트 대상이며 iBatis 2 지원을 검증한 것은 아닙니다. 이 작업에서 eGovFrame 자체 빌드·실행은 하지 않았습니다.
