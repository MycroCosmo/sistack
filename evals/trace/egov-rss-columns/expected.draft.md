# RSS 태그 관리 — 테이블 컬럼 조회 — 정답 초안

승인 전 초안이며 정확도 판정에 쓰지 않는다. 인덱서 출력이 아닌 대상 소스의 선언·사용을 직접 읽고 작성했다. 기준 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`. 경로 기준: `.testbeds/egovframe/`.

선정 이유: Mapper XML 대신 JDBC prepareStatement와 런타임 테이블 치환을 쓰는 다른 DAO 구조

## 범위와 검토 질문

- JS의 URL+tableName은 M1 규칙에 따라 문자열 조합 UNRESOLVED다. 따라서 endpoint부터 아래 경로는 별도 선언 근거로 이어 붙인 후보 흐름이며, 화면부터 확정된 경로라고 주장하지 않는다.
- DB 종류·선택 테이블은 입력 및 메시지 설정에 의존한다. whitelist가 있어도 실행 대상 테이블은 확정할 수 없다.
- iBatis 2 실제 메뉴는 이 고정 버전에서 확인하지 못했다. 세 번째 메뉴는 직접 JDBC 대안이며 iBatis 검증은 합성 테스트로 제한한다.
- egovMessageSource.getMessage는 설정값 조회용 보조 호출이므로 이 초안의 controller scope는 service 호출 위치 83행에 한정한다.

JSON의 scope에 명시한 출발 노드·연결 종류·화면 위치만 비교한다. DB별 같은 이름의 SQL은 논리 연결 하나로 묶고, 실행 설정 선택은 LIKELY로 남긴다. 범위 밖 호출·보조 화면·런타임 결과를 전체 정확도로 확대하지 않는다.

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp#fn_egov_tableColumn_RssTagManage | requests | unknown(string-url) | UNRESOLVED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:76`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/ion/rss/EgovRssTagManageRegist.jsp:81` | URL 리터럴과 런타임 tableName 문자열 조합 |
| ANY /uss/ion/rss/listRssTagManageTableColumnList.do | maps_to | egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList | CONFIRMED | `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:71`, `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:72` |  |
| egovframework.com.uss.ion.rss.web.EgovRssTagManageController#EgovRssTagManageTableColumnList | calls | egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList | CONFIRMED | `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:56`, `src/main/java/egovframework/com/uss/ion/rss/web/EgovRssTagManageController.java:83`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:29`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:58` |  |
| egovframework.com.uss.ion.rss.service.impl.EgovRssTagManageServiceImpl#selectRssTagManageTableColumnList | calls | egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList | CONFIRMED | `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:34`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/EgovRssTagManageServiceImpl.java:59`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:40`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:98` |  |
| egovframework.com.uss.ion.rss.service.impl.RssTagManageDao#selectRssTagManageTableColumnList | executes | unknown(jdbc-runtime-sql) | UNRESOLVED | `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:100`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:114`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:118`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:126`, `src/main/java/egovframework/com/uss/ion/rss/service/impl/RssTagManageDao.java:128` | 동적 sSQL의 대상 테이블은 사용자 입력과 whitelist·DB 분기에 의존 |
