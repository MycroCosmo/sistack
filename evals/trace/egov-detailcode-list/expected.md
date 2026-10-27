# 공통상세코드 목록 — 승인 정답

사용자 검토 조건을 반영한 정답이다. 인덱서 출력이 아닌 소스와 검토 지시를 근거로 작성했다. 기준 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`. 경로 기준: `.testbeds/egovframe/`.

선정 이유: 공통 PaginationInfo로 firstIndex/recordCountPerPage를 계산하고 공통코드 테이블과 JOIN하는 메뉴

## 범위와 해석

- 공통 페이징 생성·getter 사용은 Controller 91~104행에서 직접 확인했다. 외부 PaginationInfo 구현 자체는 저장소에 없어 내부 호출을 확정하지 않는다.
- scope는 주 조회·건수 조회와 SQL reads다. 외부 propertiesService.getInt 호출은 별도 미확정 지점으로 포함한다.
- context-mapper.xml의 mapperLocations와 등록된 globals.properties의 Globals.DbType=mysql을 근거로 mysql 매핑을 확정한다. 다른 DB XML은 후보로만 기록한다. 외부 런타임 override와 실제 DB 실행은 검증 범위 밖이다.

JSON scope의 출발 노드·관계 종류·위치만 평가한다. 실제 앱 실행이나 전체 프로젝트 정확도를 뜻하지 않는다. source_files 해시와 모든 evidence 라인은 npm test에서 검사한다.

선택 DB: mysql. 다른 DB 파일은 실행 정답이 아닌 후보다:

- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_altibase.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_cubrid.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_goldilocks.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_maria.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_postgres.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_tibero.xml`

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp | requests | ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:68`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82` |  |
| ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | maps_to | egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:83` |  |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | calls | unknown:external-injection | UNRESOLVED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:63`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88` | propertiesService 구현이 외부 라이브러리에 있음 |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | calls | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:53`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:100`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:31`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:49` |  |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | calls | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:53`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:103`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:41` |  |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList | calls | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:34`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:50`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:47` |  |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt | calls | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:34`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:42`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:37` |  |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList | executes | CmmnDetailCodeManage.selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:48`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:8`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:10`, `src/main/resources/egovframework/spring/com/context-mapper.xml:9`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:9`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |  |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt | executes | CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:38`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:35`, `src/main/resources/egovframework/spring/com/context-mapper.xml:9`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:9`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeList | reads | COMTCCMMNDETAILCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:17` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeList | reads | COMTCCMMNCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:18` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | reads | COMTCCMMNDETAILCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:39` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | reads | COMTCCMMNCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:40` |  |
