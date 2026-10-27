> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-trace 실행 결과

상태: PARTIAL. 연결은 정적 소스 근거(증거 2단계)이며 실제 앱/DB 실행을 뜻하지 않는다.

## 개요

RSS 등록 화면은 선택한 테이블의 컬럼 목록을 AJAX로 가져온다.
이 기능은 MyBatis XML 대신 직접 JDBC와 ResultSet 메타데이터를 사용한다.

## 동작 흐름

화면 handler의 문자열 조합 URL은 UNRESOLVED로 유지했다. 알려진 서버 URL을 별도 시작점으로 추적했으며 끊긴 구간을 임의로 연결하지 않았다.
URL → Controller → egovRssManageService 구현 → RssTagManageDao → whitelist 검사 → 동적 SQL/JDBC → 컬럼 메타데이터. 실제 선택 테이블과 DB 실행은 미확정이다.

```text
src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp#fn_egov_tableColumn_RssTagManage
└─ requests [UNRESOLVED] → string-url:src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81
ANY /uss/ion/rss/listRssTagManageTableColumnList.do
└─ maps_to [CONFIRMED] → egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList
   └─ calls [CONFIRMED] → egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList
      └─ calls [CONFIRMED] → egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList
         └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114
         └─ executes [UNRESOLVED] → jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126
         └─ executes [UNRESOLVED] → jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128
```

```mermaid
flowchart TD
  n0["src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp#fn_egov_tableColumn_RssTagManage"]
  n1["string-url:src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81"]
  n2["egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList"]
  n3["egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList"]
  n4["egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList"]
  n5["ANY /uss/ion/rss/listRssTagManageTableColumnList.do"]
  n6["external-injection:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114"]
  n7["jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126"]
  n8["jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128"]
  n0 -->|"requests UNRESOLVED"| n1
  n5 -->|"maps_to CONFIRMED"| n4
  n4 -->|"calls CONFIRMED"| n2
  n2 -->|"calls CONFIRMED"| n3
  n3 -->|"calls UNRESOLVED"| n6
  n3 -->|"executes UNRESOLVED"| n7
  n3 -->|"executes UNRESOLVED"| n8
```

## 파일 위치

| 계층 | 위치 | 이름 |
|---|---|---|
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:69` | src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp#fn_egov_tableColumn_RssTagManage |
| unknown | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81` | string-url:src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81 |
| method | `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:58` | egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList |
| method | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:98` | egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList |
| method | `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:72` | egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList |
| endpoint | `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:71` | ANY /uss/ion/rss/listRssTagManageTableColumnList.do |
| unknown | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114` | external-injection:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114 |
| unknown | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126` | jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126 |
| unknown | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128` | jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128 |

## 연결 근거

| 출발 → 도착 | 관계·상태 | 소스 근거 |
|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp#fn_egov_tableColumn_RssTagManage → string-url:src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81 | requests / UNRESOLVED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81` |
| ANY /uss/ion/rss/listRssTagManageTableColumnList.do → egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList | maps_to / CONFIRMED | `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:71`, `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:72`, `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:46` |
| egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList → egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList | calls / CONFIRMED | `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:83`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:58`, `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:57` |
| egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList → egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList | calls / CONFIRMED | `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:59`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:98`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:35` |
| egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList → external-injection:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114 | calls / UNRESOLVED | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114` |
| egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList → jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126 | executes / UNRESOLVED | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126` |
| egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList → jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128 | executes / UNRESOLVED | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128` |

## 관련 테이블

확인된 읽기/쓰기 대상 0건. 동적 대상은 확정 못 한 경로를 확인한다.

## 함정

- 기본 DB 선택: mapperLocations의 *_{Globals.DbType}.xml과 Globals.DbType=mysql로 mysql 문장을 선택한다. 다른 DB XML은 활성 실행 근거가 아닌 후보다. 외부 override는 미검증. (`src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20`)
- dummy 인증 인터셉터 제외: XML은 dummy 프로필 안에 있다. Listener가 DB와 Globals.Auth로 활성 프로필을 정하고 기본 Auth=security이므로 이 선언을 활성 요청 경로로 보지 않는다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58`, `src/main/resources/egovframework/egovProps/globals.properties:26`)
- URL에 tableName 값을 붙이는 표현식은 contextPath+단일 경로 예외와 다르다. 요청 구간은 미확정으로 남겼다. (`src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81`)
- DAO는 table whitelist를 검사한 뒤 DB 종류별 LIMIT/ROWNUM SQL을 만든다. 설정의 후보 두 테이블과 런타임에 선택된 실제 테이블을 혼동하지 않는다. (`src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:116`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126`, `src/main/resources/egovframework/spring/com/context-whitelist.xml:22`)
- prepareStatement와 executeQuery가 두 위치로 기록되어도 승인 정답의 동적 JDBC 논리 연결 하나로 비교한다. (`src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128`)

## 숨은 경로 확인

- interceptor: CONFIRMED — 기본 HandlerMapping에 LocaleChangeInterceptor/WebLogInterceptor가 선언된다. 별도 AuthenticInterceptor는 dummy 프로필이므로 기본 security 구성에서 제외했다. 실행 순서·내부 호출 미검증. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:44`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:51`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58`)
- filter: CONFIRMED — Java initializer에서 encoding *.do, security /*, multipart, HTMLTag 필터를 등록한다. Security 내부 필터 체인 동작은 실행하지 않았다. (`src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:66`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:98`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:149`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:159`)
- aop: UNRESOLVED — syslog·privacy AOP의 pointcut 선언은 확인했으나 각 advice 내부와 실제 적용 여부는 미검증이다. (`src/main/resources/egovframework/spring/com/context-syslogaop.xml:13`, `src/main/resources/egovframework/spring/com/context-privacylogaop.xml:24`)
- paging: NOT_FOUND — 이번 단일 삭제/컬럼 조회 범위에는 공통 목록 페이징 호출이 없다. 프로젝트 전체 부재를 뜻하지 않는다.
- common-code: NOT_FOUND — 이번 단일 삭제/컬럼 조회 메서드에서 별도 공통코드 조회는 발견하지 못했다.
- exception: CONFIRMED — MVC SimpleMappingExceptionResolver의 예외→뷰 선언을 확인했다. 실제 발생·응답은 미검증이다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:63`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:72`)

## 확정 못 한 경로

- src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp#fn_egov_tableColumn_RssTagManage → string-url:src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81: UNRESOLVED — URL 문자열 조합/변수/폼 action은 확정하지 않음; contextPath 선언과 단일 리터럴 조합만 예외
- egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList → external-injection:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList → jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126: UNRESOLVED — JDBC SQL/메타데이터 대상은 런타임 값이며 정적 테이블 확정 불가
- egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList → jdbc-runtime-sql:src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128: UNRESOLVED — JDBC SQL/메타데이터 대상은 런타임 값이며 정적 테이블 확정 불가
- 앱·DB 요청은 실행하지 않았다. 정적 소스의 도달 가능 경로이며 실제 조건 충족을 보증하지 않는다.
- 공유 include 관계는 버튼 실행을 뜻하지 않는다. 외부 라이브러리·환경 override·동적 값은 미검증이다.

## 실행 방식

simple / direct. 주 에이전트가 JSP·Java·설정·SQL 원문을 직접 읽고 검토했다.

## 다음 확인

- 미확정 URL/값이 필요한 경우 실제 입력·허용된 로그를 추가로 확인한다.
- 결과의 파일:라인과 사용 범위를 검토하고 운영 반영 판단은 담당 승인 절차를 따른다.
