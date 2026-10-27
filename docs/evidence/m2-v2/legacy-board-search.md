> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-trace 실행 결과

상태: PARTIAL. 연결은 정적 소스 근거(증거 2단계)이며 실제 앱/DB 실행을 뜻하지 않는다.

## 개요

게시판 검색 화면은 조건과 페이지를 받아 목록·건수를 조회한다.
로그인 인터셉터가 사용자와 메뉴를 먼저 준비한다. 공유 JSP/JS를 통해 보이는 다른 화면의 handler는 실제 실행과 구별한다.

## 동작 흐름

검색 폼 → /board/list.do → BoardController.list → BoardServiceImpl.list → BoardMapper의 count/selectList → BOARD 조회. Java 페이징 값이 공통 SQL에 전달된다.
각 /board 요청 → LoginInterceptor.preHandle → MenuMapper.selectList → APP_MENU. 인증·권한·CSRF 검사에서 중단될 수 있다.

```text
src/main/webapp/WEB-INF/views/board/list.jsp
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/views/common/header.jspf
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/views/common/header.jspf#inline:7
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/views/common/header.jspf#inline:9
   └─ includes [CONFIRMED] → src/main/webapp/resources/board.js
      └─ includes [CONFIRMED] → src/main/webapp/resources/board.js#listUrl
      └─ includes [CONFIRMED] → src/main/webapp/resources/board.js#handler:18
         └─ requests [UNRESOLVED] → string-url:src/main/webapp/resources/board.js:21
      └─ includes [CONFIRMED] → src/main/webapp/resources/board.js#handler:44
         └─ requests [CONFIRMED] → POST /board/delete.do
            └─ maps_to [CONFIRMED] → kr.sistack.board.web.BoardController#delete
               └─ calls [CONFIRMED] → kr.sistack.board.service.impl.BoardServiceImpl#delete
                  └─ calls [CONFIRMED] → kr.sistack.board.mapper.BoardMapper#delete
                     └─ executes [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.delete
                        └─ writes [CONFIRMED] → BOARD
            └─ intercepted_by [CONFIRMED] → kr.sistack.board.web.LoginInterceptor#preHandle
               └─ calls [CONFIRMED] → kr.sistack.board.mapper.MenuMapper#selectList
                  └─ executes [CONFIRMED] → kr.sistack.board.mapper.MenuMapper.selectList
                     └─ reads [CONFIRMED] → APP_MENU
         └─ requests [UNRESOLVED] → string-url:src/main/webapp/resources/board.js:59
      └─ requests [UNRESOLVED] → string-url:src/main/webapp/resources/board.js:15
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/views/common/menu.jspf
   └─ requests [UNRESOLVED] → dynamic-url:src/main/webapp/WEB-INF/views/common/menu.jspf:5
   └─ requests [CONFIRMED] → POST /auth/logout.do
      └─ maps_to [CONFIRMED] → kr.sistack.board.web.AuthController#logout
      └─ intercepted_by [CONFIRMED] → kr.sistack.board.web.LoginInterceptor#preHandle
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/views/common/paging.jspf
└─ includes [CONFIRMED] → src/main/webapp/resources/board.js
└─ requests [CONFIRMED] → GET /board/list.do
   └─ maps_to [CONFIRMED] → kr.sistack.board.web.BoardController#list
      └─ calls [CONFIRMED] → kr.sistack.board.service.impl.BoardServiceImpl#list
         └─ calls [CONFIRMED] → kr.sistack.board.mapper.BoardMapper#count
            └─ executes [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.count
               └─ reads [CONFIRMED] → BOARD
               └─ includes [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.filters
         └─ calls [CONFIRMED] → kr.sistack.board.mapper.BoardMapper#selectList
            └─ executes [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.selectList
               └─ reads [CONFIRMED] → BOARD
               └─ includes [CONFIRMED] → commonSql.pageStart
               └─ includes [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.filters
               └─ includes [CONFIRMED] → commonSql.pageEnd
               └─ maps_to [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.board
   └─ intercepted_by [CONFIRMED] → kr.sistack.board.web.LoginInterceptor#preHandle
└─ requests [CONFIRMED] → GET /board/detail.do
   └─ maps_to [CONFIRMED] → kr.sistack.board.web.BoardController#detail
      └─ calls [CONFIRMED] → kr.sistack.board.service.impl.BoardServiceImpl#get
         └─ calls [CONFIRMED] → kr.sistack.board.mapper.BoardMapper#selectOne
            └─ executes [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.selectOne
               └─ reads [CONFIRMED] → BOARD
               └─ maps_to [CONFIRMED] → kr.sistack.board.mapper.BoardMapper.board
   └─ intercepted_by [CONFIRMED] → kr.sistack.board.web.LoginInterceptor#preHandle
└─ requests [CONFIRMED] → GET /board/form.do
   └─ maps_to [CONFIRMED] → kr.sistack.board.web.BoardController#form
      └─ calls [CONFIRMED] → kr.sistack.board.service.impl.BoardServiceImpl#get
      └─ calls [CONFIRMED] → kr.sistack.board.service.impl.CommonCodeServiceImpl#list
         └─ calls [CONFIRMED] → kr.sistack.board.dao.CommonCodeDao#count
            └─ executes [CONFIRMED] → commonCode.count
               └─ reads [CONFIRMED] → COMMON_CODE
         └─ calls [CONFIRMED] → kr.sistack.board.dao.CommonCodeDao#selectList
            └─ executes [CONFIRMED] → commonCode.selectList
               └─ reads [CONFIRMED] → COMMON_CODE
               └─ includes [CONFIRMED] → commonSql.pageStart
               └─ includes [CONFIRMED] → commonSql.pageEnd
   └─ intercepted_by [CONFIRMED] → kr.sistack.board.web.LoginInterceptor#preHandle
```

```mermaid
flowchart TD
  n0["kr.sistack.board.dao.CommonCodeDao#selectList"]
  n1["kr.sistack.board.dao.CommonCodeDao#count"]
  n2["kr.sistack.board.mapper.BoardMapper#selectList"]
  n3["kr.sistack.board.mapper.BoardMapper#count"]
  n4["kr.sistack.board.mapper.BoardMapper#selectOne"]
  n5["kr.sistack.board.mapper.BoardMapper#delete"]
  n6["kr.sistack.board.mapper.MenuMapper#selectList"]
  n7["kr.sistack.board.service.impl.BoardServiceImpl#list"]
  n8["kr.sistack.board.service.impl.BoardServiceImpl#get"]
  n9["kr.sistack.board.service.impl.BoardServiceImpl#delete"]
  n10["kr.sistack.board.service.impl.CommonCodeServiceImpl#list"]
  n11["kr.sistack.board.web.AuthController#logout"]
  n12["kr.sistack.board.web.BoardController#list"]
  n13["kr.sistack.board.web.BoardController#detail"]
  n14["kr.sistack.board.web.BoardController#form"]
  n15["kr.sistack.board.web.BoardController#delete"]
  n16["kr.sistack.board.web.LoginInterceptor#preHandle"]
  n17["COMMON_CODE"]
  n18["APP_MENU"]
  n19["BOARD"]
  n20["kr.sistack.board.mapper.BoardMapper.board"]
  n21["kr.sistack.board.mapper.BoardMapper.filters"]
  n22["kr.sistack.board.mapper.BoardMapper.selectList"]
  n23["kr.sistack.board.mapper.BoardMapper.count"]
  n24["kr.sistack.board.mapper.BoardMapper.selectOne"]
  n25["kr.sistack.board.mapper.BoardMapper.delete"]
  n26["commonCode.selectList"]
  n27["commonCode.count"]
  n28["commonSql.pageStart"]
  n29["commonSql.pageEnd"]
  n30["src/main/webapp/resources/board.js"]
  n31["src/main/webapp/resources/board.js#listUrl"]
  n32["src/main/webapp/resources/board.js#handler:18"]
  n33["src/main/webapp/resources/board.js#handler:44"]
  n34["src/main/webapp/WEB-INF/views/board/list.jsp"]
  n35["src/main/webapp/WEB-INF/views/common/header.jspf"]
  n36["src/main/webapp/WEB-INF/views/common/header.jspf#inline:7"]
  n37["src/main/webapp/WEB-INF/views/common/header.jspf#inline:9"]
  n38["src/main/webapp/WEB-INF/views/common/menu.jspf"]
  n39["src/main/webapp/WEB-INF/views/common/paging.jspf"]
  n40["POST /auth/logout.do"]
  n41["GET /board/list.do"]
  n42["GET /board/detail.do"]
  n43["GET /board/form.do"]
  n44["POST /board/delete.do"]
  n45["kr.sistack.board.mapper.MenuMapper.selectList"]
  n46["dynamic-url:src/main/webapp/WEB-INF/views/common/menu.jspf:5"]
  n47["string-url:src/main/webapp/resources/board.js:21"]
  n48["string-url:src/main/webapp/resources/board.js:59"]
  n49["string-url:src/main/webapp/resources/board.js:15"]
  n34 -->|"includes CONFIRMED"| n35
  n34 -->|"includes CONFIRMED"| n38
  n34 -->|"includes CONFIRMED"| n39
  n34 -->|"includes CONFIRMED"| n30
  n34 -->|"requests CONFIRMED"| n41
  n34 -->|"requests CONFIRMED"| n42
  n34 -->|"requests CONFIRMED"| n43
  n35 -->|"includes CONFIRMED"| n36
  n35 -->|"includes CONFIRMED"| n37
  n35 -->|"includes CONFIRMED"| n30
  n38 -->|"requests UNRESOLVED"| n46
  n38 -->|"requests CONFIRMED"| n40
  n30 -->|"includes CONFIRMED"| n31
  n30 -->|"includes CONFIRMED"| n32
  n30 -->|"includes CONFIRMED"| n33
  n30 -->|"requests UNRESOLVED"| n49
  n41 -->|"maps_to CONFIRMED"| n12
  n41 -->|"intercepted_by CONFIRMED"| n16
  n42 -->|"maps_to CONFIRMED"| n13
  n42 -->|"intercepted_by CONFIRMED"| n16
  n43 -->|"maps_to CONFIRMED"| n14
  n43 -->|"intercepted_by CONFIRMED"| n16
  n40 -->|"maps_to CONFIRMED"| n11
  n40 -->|"intercepted_by CONFIRMED"| n16
  n32 -->|"requests UNRESOLVED"| n47
  n33 -->|"requests CONFIRMED"| n44
  n33 -->|"requests UNRESOLVED"| n48
  n12 -->|"calls CONFIRMED"| n7
  n16 -->|"calls CONFIRMED"| n6
  n13 -->|"calls CONFIRMED"| n8
  n14 -->|"calls CONFIRMED"| n8
  n14 -->|"calls CONFIRMED"| n10
  n44 -->|"maps_to CONFIRMED"| n15
  n44 -->|"intercepted_by CONFIRMED"| n16
  n7 -->|"calls CONFIRMED"| n3
  n7 -->|"calls CONFIRMED"| n2
  n6 -->|"executes CONFIRMED"| n45
  n8 -->|"calls CONFIRMED"| n4
  n10 -->|"calls CONFIRMED"| n1
  n10 -->|"calls CONFIRMED"| n0
  n15 -->|"calls CONFIRMED"| n9
  n3 -->|"executes CONFIRMED"| n23
  n2 -->|"executes CONFIRMED"| n22
  n45 -->|"reads CONFIRMED"| n18
  n4 -->|"executes CONFIRMED"| n24
  n1 -->|"executes CONFIRMED"| n27
  n0 -->|"executes CONFIRMED"| n26
  n9 -->|"calls CONFIRMED"| n5
  n23 -->|"reads CONFIRMED"| n19
  n23 -->|"includes CONFIRMED"| n21
  n22 -->|"reads CONFIRMED"| n19
  n22 -->|"includes CONFIRMED"| n28
  n22 -->|"includes CONFIRMED"| n21
  n22 -->|"includes CONFIRMED"| n29
  n22 -->|"maps_to CONFIRMED"| n20
  n24 -->|"reads CONFIRMED"| n19
  n24 -->|"maps_to CONFIRMED"| n20
  n27 -->|"reads CONFIRMED"| n17
  n26 -->|"reads CONFIRMED"| n17
  n26 -->|"includes CONFIRMED"| n28
  n26 -->|"includes CONFIRMED"| n29
  n5 -->|"executes CONFIRMED"| n25
  n25 -->|"writes CONFIRMED"| n19
```

## 파일 위치

| 계층 | 위치 | 이름 |
|---|---|---|
| method | `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:15` | kr.sistack.board.dao.CommonCodeDao#selectList |
| method | `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:19` | kr.sistack.board.dao.CommonCodeDao#count |
| method | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8` | kr.sistack.board.mapper.BoardMapper#selectList |
| method | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10` | kr.sistack.board.mapper.BoardMapper#count |
| method | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:12` | kr.sistack.board.mapper.BoardMapper#selectOne |
| method | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:18` | kr.sistack.board.mapper.BoardMapper#delete |
| method | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10` | kr.sistack.board.mapper.MenuMapper#selectList |
| method | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:19` | kr.sistack.board.service.impl.BoardServiceImpl#list |
| method | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:29` | kr.sistack.board.service.impl.BoardServiceImpl#get |
| method | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:58` | kr.sistack.board.service.impl.BoardServiceImpl#delete |
| method | `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:18` | kr.sistack.board.service.impl.CommonCodeServiceImpl#list |
| method | `src/main/java/kr/sistack/board/web/AuthController.java:41` | kr.sistack.board.web.AuthController#logout |
| method | `src/main/java/kr/sistack/board/web/BoardController.java:37` | kr.sistack.board.web.BoardController#list |
| method | `src/main/java/kr/sistack/board/web/BoardController.java:45` | kr.sistack.board.web.BoardController#detail |
| method | `src/main/java/kr/sistack/board/web/BoardController.java:51` | kr.sistack.board.web.BoardController#form |
| method | `src/main/java/kr/sistack/board/web/BoardController.java:70` | kr.sistack.board.web.BoardController#delete |
| method | `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18` | kr.sistack.board.web.LoginInterceptor#preHandle |
| table | `src/main/resources/db/oracle/ddl.sql:1` | COMMON_CODE |
| table | `src/main/resources/db/oracle/ddl.sql:6` | APP_MENU |
| table | `src/main/resources/db/oracle/ddl.sql:15` | BOARD |
| resultMap | `src/main/resources/mapper/BoardMapper.xml:4` | kr.sistack.board.mapper.BoardMapper.board |
| fragment | `src/main/resources/mapper/BoardMapper.xml:12` | kr.sistack.board.mapper.BoardMapper.filters |
| sql | `src/main/resources/mapper/BoardMapper.xml:30` | kr.sistack.board.mapper.BoardMapper.selectList |
| sql | `src/main/resources/mapper/BoardMapper.xml:37` | kr.sistack.board.mapper.BoardMapper.count |
| sql | `src/main/resources/mapper/BoardMapper.xml:41` | kr.sistack.board.mapper.BoardMapper.selectOne |
| sql | `src/main/resources/mapper/BoardMapper.xml:53` | kr.sistack.board.mapper.BoardMapper.delete |
| sql | `src/main/resources/mapper/CommonCode.xml:4` | commonCode.selectList |
| sql | `src/main/resources/mapper/CommonCode.xml:9` | commonCode.count |
| fragment | `src/main/resources/mapper/CommonSql.xml:4` | commonSql.pageStart |
| fragment | `src/main/resources/mapper/CommonSql.xml:7` | commonSql.pageEnd |
| js | `src/main/webapp/resources/board.js:1` | src/main/webapp/resources/board.js |
| js | `src/main/webapp/resources/board.js:3` | src/main/webapp/resources/board.js#listUrl |
| js | `src/main/webapp/resources/board.js:18` | src/main/webapp/resources/board.js#handler:18 |
| js | `src/main/webapp/resources/board.js:44` | src/main/webapp/resources/board.js#handler:44 |
| jsp | `src/main/webapp/WEB-INF/views/board/list.jsp:1` | src/main/webapp/WEB-INF/views/board/list.jsp |
| jsp | `src/main/webapp/WEB-INF/views/common/header.jspf:1` | src/main/webapp/WEB-INF/views/common/header.jspf |
| js | `src/main/webapp/WEB-INF/views/common/header.jspf:7` | src/main/webapp/WEB-INF/views/common/header.jspf#inline:7 |
| js | `src/main/webapp/WEB-INF/views/common/header.jspf:9` | src/main/webapp/WEB-INF/views/common/header.jspf#inline:9 |
| jsp | `src/main/webapp/WEB-INF/views/common/menu.jspf:1` | src/main/webapp/WEB-INF/views/common/menu.jspf |
| jsp | `src/main/webapp/WEB-INF/views/common/paging.jspf:1` | src/main/webapp/WEB-INF/views/common/paging.jspf |
| endpoint | `src/main/java/kr/sistack/board/web/AuthController.java:40` | POST /auth/logout.do |
| endpoint | `src/main/java/kr/sistack/board/web/BoardController.java:36` | GET /board/list.do |
| endpoint | `src/main/java/kr/sistack/board/web/BoardController.java:44` | GET /board/detail.do |
| endpoint | `src/main/java/kr/sistack/board/web/BoardController.java:50` | GET /board/form.do |
| endpoint | `src/main/java/kr/sistack/board/web/BoardController.java:68` | POST /board/delete.do |
| sql | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` | kr.sistack.board.mapper.MenuMapper.selectList |
| unknown | `src/main/webapp/WEB-INF/views/common/menu.jspf:5` | dynamic-url:src/main/webapp/WEB-INF/views/common/menu.jspf:5 |
| unknown | `src/main/webapp/resources/board.js:21` | string-url:src/main/webapp/resources/board.js:21 |
| unknown | `src/main/webapp/resources/board.js:59` | string-url:src/main/webapp/resources/board.js:59 |
| unknown | `src/main/webapp/resources/board.js:15` | string-url:src/main/webapp/resources/board.js:15 |

## 연결 근거

| 출발 → 도착 | 관계·상태 | 소스 근거 |
|---|---|---|
| src/main/webapp/WEB-INF/views/board/list.jsp → src/main/webapp/WEB-INF/views/common/header.jspf | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:6`, `src/main/webapp/WEB-INF/views/common/header.jspf:1` |
| src/main/webapp/WEB-INF/views/board/list.jsp → src/main/webapp/WEB-INF/views/common/menu.jspf | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:10`, `src/main/webapp/WEB-INF/views/common/menu.jspf:1` |
| src/main/webapp/WEB-INF/views/board/list.jsp → src/main/webapp/WEB-INF/views/common/paging.jspf | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:70`, `src/main/webapp/WEB-INF/views/common/paging.jspf:1` |
| src/main/webapp/WEB-INF/views/board/list.jsp → src/main/webapp/resources/board.js | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/common/header.jspf:9`, `src/main/webapp/resources/board.js:1` |
| src/main/webapp/WEB-INF/views/board/list.jsp → GET /board/list.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:14`, `src/main/java/kr/sistack/board/web/BoardController.java:36` |
| src/main/webapp/WEB-INF/views/board/list.jsp → GET /board/detail.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:51`, `src/main/java/kr/sistack/board/web/BoardController.java:44`, `src/main/webapp/WEB-INF/views/board/list.jsp:45` |
| src/main/webapp/WEB-INF/views/board/list.jsp → GET /board/form.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/views/board/list.jsp:72`, `src/main/java/kr/sistack/board/web/BoardController.java:50` |
| src/main/webapp/WEB-INF/views/common/header.jspf → src/main/webapp/WEB-INF/views/common/header.jspf#inline:7 | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/common/header.jspf:1`, `src/main/webapp/WEB-INF/views/common/header.jspf:7` |
| src/main/webapp/WEB-INF/views/common/header.jspf → src/main/webapp/WEB-INF/views/common/header.jspf#inline:9 | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/common/header.jspf:1`, `src/main/webapp/WEB-INF/views/common/header.jspf:9` |
| src/main/webapp/WEB-INF/views/common/header.jspf → src/main/webapp/resources/board.js | includes / CONFIRMED | `src/main/webapp/WEB-INF/views/common/header.jspf:9`, `src/main/webapp/resources/board.js:1` |
| src/main/webapp/WEB-INF/views/common/menu.jspf → dynamic-url:src/main/webapp/WEB-INF/views/common/menu.jspf:5 | requests / UNRESOLVED | `src/main/webapp/WEB-INF/views/common/menu.jspf:5` |
| src/main/webapp/WEB-INF/views/common/menu.jspf → POST /auth/logout.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/views/common/menu.jspf:9`, `src/main/java/kr/sistack/board/web/AuthController.java:40` |
| src/main/webapp/resources/board.js → src/main/webapp/resources/board.js#listUrl | includes / CONFIRMED | `src/main/webapp/resources/board.js:1`, `src/main/webapp/resources/board.js:3` |
| src/main/webapp/resources/board.js → src/main/webapp/resources/board.js#handler:18 | includes / CONFIRMED | `src/main/webapp/resources/board.js:1`, `src/main/webapp/resources/board.js:18` |
| src/main/webapp/resources/board.js → src/main/webapp/resources/board.js#handler:44 | includes / CONFIRMED | `src/main/webapp/resources/board.js:1`, `src/main/webapp/resources/board.js:44` |
| src/main/webapp/resources/board.js → string-url:src/main/webapp/resources/board.js:15 | requests / UNRESOLVED | `src/main/webapp/resources/board.js:15` |
| GET /board/list.do → kr.sistack.board.web.BoardController#list | maps_to / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/java/kr/sistack/board/web/BoardController.java:37`, `src/main/java/kr/sistack/board/web/BoardController.java:19` |
| GET /board/list.do → kr.sistack.board.web.LoginInterceptor#preHandle | intercepted_by / CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:9`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13` |
| GET /board/detail.do → kr.sistack.board.web.BoardController#detail | maps_to / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:44`, `src/main/java/kr/sistack/board/web/BoardController.java:45`, `src/main/java/kr/sistack/board/web/BoardController.java:19` |
| GET /board/detail.do → kr.sistack.board.web.LoginInterceptor#preHandle | intercepted_by / CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:44`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:9`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13` |
| GET /board/form.do → kr.sistack.board.web.BoardController#form | maps_to / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:50`, `src/main/java/kr/sistack/board/web/BoardController.java:51`, `src/main/java/kr/sistack/board/web/BoardController.java:19` |
| GET /board/form.do → kr.sistack.board.web.LoginInterceptor#preHandle | intercepted_by / CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:50`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:9`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13` |
| POST /auth/logout.do → kr.sistack.board.web.AuthController#logout | maps_to / CONFIRMED | `src/main/java/kr/sistack/board/web/AuthController.java:40`, `src/main/java/kr/sistack/board/web/AuthController.java:41`, `src/main/java/kr/sistack/board/web/AuthController.java:13` |
| POST /auth/logout.do → kr.sistack.board.web.LoginInterceptor#preHandle | intercepted_by / CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:12`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18`, `src/main/java/kr/sistack/board/web/AuthController.java:40`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:9`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13` |
| src/main/webapp/resources/board.js#handler:18 → string-url:src/main/webapp/resources/board.js:21 | requests / UNRESOLVED | `src/main/webapp/resources/board.js:21` |
| src/main/webapp/resources/board.js#handler:44 → POST /board/delete.do | requests / CONFIRMED | `src/main/webapp/resources/board.js:50`, `src/main/java/kr/sistack/board/web/BoardController.java:68`, `src/main/webapp/WEB-INF/views/board/detail.jsp:7` |
| src/main/webapp/resources/board.js#handler:44 → string-url:src/main/webapp/resources/board.js:59 | requests / UNRESOLVED | `src/main/webapp/resources/board.js:59` |
| kr.sistack.board.web.BoardController#list → kr.sistack.board.service.impl.BoardServiceImpl#list | calls / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:38`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:19`, `src/main/java/kr/sistack/board/web/BoardController.java:21` |
| kr.sistack.board.web.LoginInterceptor#preHandle → kr.sistack.board.mapper.MenuMapper#selectList | calls / CONFIRMED | `src/main/java/kr/sistack/board/web/LoginInterceptor.java:38`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:11` |
| kr.sistack.board.web.BoardController#detail → kr.sistack.board.service.impl.BoardServiceImpl#get | calls / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:46`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:29`, `src/main/java/kr/sistack/board/web/BoardController.java:21` |
| kr.sistack.board.web.BoardController#form → kr.sistack.board.service.impl.BoardServiceImpl#get | calls / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:52`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:29`, `src/main/java/kr/sistack/board/web/BoardController.java:21` |
| kr.sistack.board.web.BoardController#form → kr.sistack.board.service.impl.CommonCodeServiceImpl#list | calls / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:53`, `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:24` |
| POST /board/delete.do → kr.sistack.board.web.BoardController#delete | maps_to / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:68`, `src/main/java/kr/sistack/board/web/BoardController.java:70`, `src/main/java/kr/sistack/board/web/BoardController.java:19` |
| POST /board/delete.do → kr.sistack.board.web.LoginInterceptor#preHandle | intercepted_by / CONFIRMED | `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18`, `src/main/java/kr/sistack/board/web/BoardController.java:68`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:9`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:13` |
| kr.sistack.board.service.impl.BoardServiceImpl#list → kr.sistack.board.mapper.BoardMapper#count | calls / CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:24`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:16` |
| kr.sistack.board.service.impl.BoardServiceImpl#list → kr.sistack.board.mapper.BoardMapper#selectList | calls / CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:25`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:16` |
| kr.sistack.board.mapper.MenuMapper#selectList → kr.sistack.board.mapper.MenuMapper.selectList | executes / CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:10`, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |
| kr.sistack.board.service.impl.BoardServiceImpl#get → kr.sistack.board.mapper.BoardMapper#selectOne | calls / CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:30`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:12`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:16` |
| kr.sistack.board.service.impl.CommonCodeServiceImpl#list → kr.sistack.board.dao.CommonCodeDao#count | calls / CONFIRMED | `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:19`, `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:19`, `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:15` |
| kr.sistack.board.service.impl.CommonCodeServiceImpl#list → kr.sistack.board.dao.CommonCodeDao#selectList | calls / CONFIRMED | `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:23`, `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:15`, `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:15` |
| kr.sistack.board.web.BoardController#delete → kr.sistack.board.service.impl.BoardServiceImpl#delete | calls / CONFIRMED | `src/main/java/kr/sistack/board/web/BoardController.java:71`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:58`, `src/main/java/kr/sistack/board/web/BoardController.java:21` |
| kr.sistack.board.mapper.BoardMapper#count → kr.sistack.board.mapper.BoardMapper.count | executes / CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:10`, `src/main/resources/mapper/BoardMapper.xml:37`, `src/main/resources/spring/root-context.xml:8` |
| kr.sistack.board.mapper.BoardMapper#selectList → kr.sistack.board.mapper.BoardMapper.selectList | executes / CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:8`, `src/main/resources/mapper/BoardMapper.xml:30`, `src/main/resources/spring/root-context.xml:8` |
| kr.sistack.board.mapper.MenuMapper.selectList → APP_MENU | reads / CONFIRMED | `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9` |
| kr.sistack.board.mapper.BoardMapper#selectOne → kr.sistack.board.mapper.BoardMapper.selectOne | executes / CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:12`, `src/main/resources/mapper/BoardMapper.xml:41`, `src/main/resources/spring/root-context.xml:8` |
| kr.sistack.board.dao.CommonCodeDao#count → commonCode.count | executes / CONFIRMED | `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:20`, `src/main/resources/mapper/CommonCode.xml:9`, `src/main/resources/spring/root-context.xml:8` |
| kr.sistack.board.dao.CommonCodeDao#selectList → commonCode.selectList | executes / CONFIRMED | `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:16`, `src/main/resources/mapper/CommonCode.xml:4`, `src/main/resources/spring/root-context.xml:8` |
| kr.sistack.board.service.impl.BoardServiceImpl#delete → kr.sistack.board.mapper.BoardMapper#delete | calls / CONFIRMED | `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:59`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:18`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:16` |
| kr.sistack.board.mapper.BoardMapper.count → BOARD | reads / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:38` |
| kr.sistack.board.mapper.BoardMapper.count → kr.sistack.board.mapper.BoardMapper.filters | includes / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:39`, `src/main/resources/mapper/BoardMapper.xml:12` |
| kr.sistack.board.mapper.BoardMapper.selectList → BOARD | reads / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:32` |
| kr.sistack.board.mapper.BoardMapper.selectList → commonSql.pageStart | includes / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:31`, `src/main/resources/mapper/CommonSql.xml:4` |
| kr.sistack.board.mapper.BoardMapper.selectList → kr.sistack.board.mapper.BoardMapper.filters | includes / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:33`, `src/main/resources/mapper/BoardMapper.xml:12` |
| kr.sistack.board.mapper.BoardMapper.selectList → commonSql.pageEnd | includes / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:35`, `src/main/resources/mapper/CommonSql.xml:7` |
| kr.sistack.board.mapper.BoardMapper.selectList → kr.sistack.board.mapper.BoardMapper.board | maps_to / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:30`, `src/main/resources/mapper/BoardMapper.xml:4` |
| kr.sistack.board.mapper.BoardMapper.selectOne → BOARD | reads / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:42` |
| kr.sistack.board.mapper.BoardMapper.selectOne → kr.sistack.board.mapper.BoardMapper.board | maps_to / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:41`, `src/main/resources/mapper/BoardMapper.xml:4` |
| commonCode.count → COMMON_CODE | reads / CONFIRMED | `src/main/resources/mapper/CommonCode.xml:10` |
| commonCode.selectList → COMMON_CODE | reads / CONFIRMED | `src/main/resources/mapper/CommonCode.xml:6` |
| commonCode.selectList → commonSql.pageStart | includes / CONFIRMED | `src/main/resources/mapper/CommonCode.xml:5`, `src/main/resources/mapper/CommonSql.xml:4` |
| commonCode.selectList → commonSql.pageEnd | includes / CONFIRMED | `src/main/resources/mapper/CommonCode.xml:7`, `src/main/resources/mapper/CommonSql.xml:7` |
| kr.sistack.board.mapper.BoardMapper#delete → kr.sistack.board.mapper.BoardMapper.delete | executes / CONFIRMED | `src/main/java/kr/sistack/board/mapper/BoardMapper.java:18`, `src/main/resources/mapper/BoardMapper.xml:53`, `src/main/resources/spring/root-context.xml:8` |
| kr.sistack.board.mapper.BoardMapper.delete → BOARD | writes / CONFIRMED | `src/main/resources/mapper/BoardMapper.xml:54` |

## 관련 테이블

- 읽기: APP_MENU — CONFIRMED, `src/main/java/kr/sistack/board/mapper/MenuMapper.java:9`
- 읽기: BOARD — CONFIRMED, `src/main/resources/mapper/BoardMapper.xml:38`
- 읽기: BOARD — CONFIRMED, `src/main/resources/mapper/BoardMapper.xml:32`
- 읽기: BOARD — CONFIRMED, `src/main/resources/mapper/BoardMapper.xml:42`
- 읽기: COMMON_CODE — CONFIRMED, `src/main/resources/mapper/CommonCode.xml:10`
- 읽기: COMMON_CODE — CONFIRMED, `src/main/resources/mapper/CommonCode.xml:6`
- 쓰기: BOARD — CONFIRMED, `src/main/resources/mapper/BoardMapper.xml:54`

## 함정

- JS 문자열 조합 URL: listUrl은 data-base와 문자열로 action을 만들므로 미확정이다. form의 리터럴 기본 action과 구분한다. (`src/main/webapp/resources/board.js:3`, `src/main/webapp/resources/board.js:9`)
- contextPath 변수 + 리터럴 경로: 상세 JSP의 ctx 선언과 삭제 AJAX /board/delete.do는 확정 가능하다. 공유 JS 포함만으로 목록·등록에서 삭제가 실행된다고 보지 않는다. (`src/main/webapp/WEB-INF/views/board/detail.jsp:7`, `src/main/webapp/resources/board.js:50`)
- 다른 클래스의 동명 list: BoardController와 CommonCodeController의 매핑·주입 서비스가 다르다. (`src/main/java/kr/sistack/board/web/BoardController.java:36`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:26`)
- 공통 페이징: BoardSearch가 Pagination을 상속하며 offset/endRow를 사용한다. 페이징 JS는 page를 유지하고 검색 submit은 1로 초기화한다. (`src/main/java/kr/sistack/board/domain/BoardSearch.java:7`, `src/main/java/kr/sistack/board/common/Pagination.java:18`, `src/main/webapp/resources/board.js:7`, `src/main/webapp/resources/board.js:12`, `src/main/webapp/WEB-INF/views/common/paging.jspf:2`)
- 공유 SQL include: BoardMapper와 CommonCode는 CommonSql 페이징을 함께 사용하며 BoardMapper.filters는 로컬 검색 조건이다. (`src/main/resources/mapper/BoardMapper.xml:31`, `src/main/resources/mapper/CommonCode.xml:5`, `src/main/resources/mapper/CommonSql.xml:4`)
- 정렬 컬럼 ${}: 이 조회의 BoardSearch getter는 b.TITLE/b.CREATED_AT 허용 목록을 반환한다. 일반적인 문자열 치환 노드를 안전하다고 일괄 확정하지 않는다. (`src/main/resources/mapper/BoardMapper.xml:34`, `src/main/java/kr/sistack/board/domain/BoardSearch.java:70`)
- 주석 처리된 옛 호출: oldList.do는 실행 연결에 포함하지 않는다. (`src/main/webapp/resources/board.js:70`)
- 세션→request→Controller: LoginInterceptor가 loginUser를 currentUser로 넣고 Controller가 @RequestAttribute로 받는다. 로그인·권한·CSRF에서 먼저 종료할 수 있다. (`src/main/java/kr/sistack/board/web/LoginInterceptor.java:20`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:37`, `src/main/java/kr/sistack/board/web/BoardController.java:37`)
- 문자열 sqlId DAO: CommonCodeDao의 commonCode.selectList 문자열은 CommonCode.xml namespace.statement로 연결된다. (`src/main/java/kr/sistack/board/dao/CommonCodeDao.java:16`, `src/main/resources/mapper/CommonCode.xml:3`)
- XML·어노테이션 Mapper 혼용: BoardMapper XML과 MenuMapper @Select(APP_MENU)가 공존한다. 메뉴 조회는 요청 인터셉터 경로다. (`src/main/java/kr/sistack/board/mapper/MenuMapper.java:9`, `src/main/java/kr/sistack/board/mapper/BoardMapper.java:7`, `src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`)
- 서비스 인터페이스→Impl·이름 주입: @Resource boardService가 @Service 이름과 implements 선언을 통해 BoardServiceImpl로 연결된다. 인터셉터의 MenuMapper는 생성자로 주입된다. (`src/main/java/kr/sistack/board/web/BoardController.java:20`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:13`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:13`)
- 공통코드 서비스 구현·map 파라미터: Pagination 값이 offset/endRow 키로 바뀌어 SQL에 전달된다. 등록 화면 옵션 목록은 prepareForm에서 별도 조회한다. (`src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:20`, `src/main/java/kr/sistack/board/dao/CommonCodeDao.java:15`, `src/main/resources/mapper/CommonCode.xml:4`, `src/main/java/kr/sistack/board/web/BoardController.java:53`)
- AJAX GET URL→JSON: 코드 화면의 loadCodes가 문자열 URL을 사용한다. JSON codes/page/total을 DOM에 반영하지만 목록·등록 화면에 이 버튼은 없다. (`src/main/webapp/resources/board.js:21`, `src/main/webapp/resources/board.js:27`, `src/main/java/kr/sistack/board/web/CommonCodeController.java:31`, `src/main/webapp/WEB-INF/views/code/list.jsp:15`)
- AJAX POST URL·요청 데이터: 상세의 id/csrf POST 삭제 후 JSON success에 따라 JS가 목록으로 이동한다. HTTP redirect 응답과 구별한다. (`src/main/webapp/resources/board.js:50`, `src/main/webapp/resources/board.js:55`, `src/main/java/kr/sistack/board/web/BoardController.java:68`)
- 등록 form 삼항식은 create/update 두 리터럴 POST 모두 도달 가능 경로다. 등록 시 BOARD_SEQ를 먼저 읽고 BOARD에 INSERT하며 수정은 UPDATE다. (`src/main/webapp/WEB-INF/views/board/form.jsp:12`, `src/main/resources/mapper/BoardMapper.xml:44`, `src/main/resources/mapper/BoardMapper.xml:50`)

## 숨은 경로 확인

- interceptor: CONFIRMED — /board/**에 LoginInterceptor 적용. 인증·ADMIN·POST CSRF 검사 후 currentUser와 menus를 넣는다. (`src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:18`, `src/main/java/kr/sistack/board/web/LoginInterceptor.java:38`)
- filter: CONFIRMED — web.xml의 CharacterEncodingFilter가 /*에 UTF-8을 강제한다. (`src/main/webapp/WEB-INF/web.xml:12`, `src/main/webapp/WEB-INF/web.xml:24`)
- aop: CONFIRMED — transactionManager와 tx:annotation-driven, 쓰기 Service의 @Transactional 선언을 확인했다. 실제 프록시 실행은 미검증. (`src/main/resources/spring/root-context.xml:16`, `src/main/resources/spring/root-context.xml:19`, `src/main/java/kr/sistack/board/service/impl/BoardServiceImpl.java:37`)
- paging: CONFIRMED — Pagination getter와 JSP 공통 include, SQL include를 따라 offset/endRow를 확인했다. (`src/main/java/kr/sistack/board/common/Pagination.java:18`, `src/main/webapp/WEB-INF/views/common/paging.jspf:2`, `src/main/resources/mapper/CommonSql.xml:4`)
- common-code: CONFIRMED — prepareForm→CommonCodeServiceImpl→문자열 sqlId→COMMON_CODE 목록 조회가 있다. (`src/main/java/kr/sistack/board/web/BoardController.java:53`, `src/main/java/kr/sistack/board/service/impl/CommonCodeServiceImpl.java:20`, `src/main/resources/mapper/CommonCode.xml:6`)
- exception: CONFIRMED — ControllerAdvice는 NotFound 404, 입력 오류 400, RuntimeException 500을 처리한다. web.xml 오류 페이지도 존재한다. (`src/main/java/kr/sistack/board/web/CommonExceptionHandler.java:12`, `src/main/java/kr/sistack/board/web/CommonExceptionHandler.java:26`, `src/main/webapp/WEB-INF/web.xml:49`)

## 확정 못 한 경로

- src/main/webapp/WEB-INF/views/common/menu.jspf → dynamic-url:src/main/webapp/WEB-INF/views/common/menu.jspf:5: UNRESOLVED — 상대/동적/외부 URL은 배포 기준 경로 확정 불가
- src/main/webapp/resources/board.js → string-url:src/main/webapp/resources/board.js:15: UNRESOLVED — URL 문자열 조합/변수/폼 action은 확정하지 않음; contextPath 선언과 단일 리터럴 조합만 예외
- src/main/webapp/resources/board.js#handler:18 → string-url:src/main/webapp/resources/board.js:21: UNRESOLVED — URL 문자열 조합/변수/폼 action은 확정하지 않음; contextPath 선언과 단일 리터럴 조합만 예외
- src/main/webapp/resources/board.js#handler:44 → string-url:src/main/webapp/resources/board.js:59: UNRESOLVED — URL 문자열 조합/변수/폼 action은 확정하지 않음; contextPath 선언과 단일 리터럴 조합만 예외
- 실제 앱·HTTP·DB 실행은 하지 않았다. 정적 소스 증거 2단계이며 외부 라이브러리·조건 참/거짓·서버 override는 미확정이다.
- v2는 승인된 사례를 본 뒤 일반 결함을 고친 확인 결과다. 일반화 성능으로 해석하지 않는다.
- 동적 Java profile 계산·복잡한 overload/가변인자·동적 URL/테이블은 자동 확정하지 않는다.

## 실행 방식

complex / parallel. 동일 모델의 화면/서버/SQL 탐색자가 초기 v2와 최종 v2-final 골격·원문을 실제 병렬 재확인했다.

## 다음 확인

- 자동 활성화 미실행 두 질문은 docs/manual-checks.md 절차로 확인한다.
- 학습 정답과 새 인증 Helper 호출의 차이는 source 근거와 함께 별도로 검토한다.
