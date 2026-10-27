# 공통분류코드 삭제 — 승인 정답

사용자 검토 조건을 반영한 정답이다. 인덱서 출력이 아닌 소스와 검토 지시를 근거로 작성했다. 기준 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`. 경로 기준: `.testbeds/egovframe/`.

선정 이유: 단순 CRUD 메뉴. delete라는 이름과 실제 UPDATE USE_AT=N SQL의 차이를 확인

## 범위와 해석

- 2026-10-27 사용자 추가 승인으로 Controller:184 → Helper:41 호출을 보정했다. [공통 인증 Helper 기준](../../../docs/decisions.md)에 따른 정답 누락 보정이며 구현 변경이 아니다. Helper 진입까지만 채점하고 내부 위임은 연결 점수에서 제외한다.
- fn_egov_delete_code의 동일 폼 action 할당→submit을 한 흐름으로 본다. 실행 여부는 confirm 입력에 달려 있다.
- 삭제 후 forward로 목록을 다시 읽는 후속 흐름은 범위 밖이다.
- context-mapper.xml의 mapperLocations와 등록된 globals.properties의 Globals.DbType=mysql을 근거로 mysql 매핑을 확정한다. 다른 DB XML은 후보로만 기록한다. 외부 런타임 override와 실제 DB 실행은 검증 범위 밖이다.

JSON scope의 출발 노드·관계 종류·위치만 평가한다. 실제 앱 실행이나 전체 프로젝트 정확도를 뜻하지 않는다. source_files 해시와 모든 evidence 라인은 npm test에서 검사한다.

선택 DB: mysql. 다른 DB 파일은 실행 정답이 아닌 후보다:

- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_altibase.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_cubrid.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_goldilocks.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_maria.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_oracle.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_postgres.xml`
- `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_tibero.xml`

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| egovframework.com.sym.ccm.ccc.web.EgovCcmCmmnClCodeManageController#deleteCmmnClCode | calls | egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:184`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:41` | 실제 static 호출·선언 확인, 인증 Helper 진입까지 채점 |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/ccc/EgovCcmCmmnClCodeDetail.jsp#fn_egov_delete_code | requests | ANY /sym/ccm/ccc/RemoveCcmCmmnClCode.do | CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/ccc/EgovCcmCmmnClCodeDetail.jsp:39`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/ccc/EgovCcmCmmnClCodeDetail.jsp:40`, `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:180` |  |
| ANY /sym/ccm/ccc/RemoveCcmCmmnClCode.do | maps_to | egovframework.com.sym.ccm.ccc.web.EgovCcmCmmnClCodeManageController#deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:180`, `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:181` |  |
| egovframework.com.sym.ccm.ccc.web.EgovCcmCmmnClCodeManageController#deleteCmmnClCode | calls | egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:48`, `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:187`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:35`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:81` |  |
| egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#deleteCmmnClCode | calls | egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:38`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:82`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:30`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:78` |  |
| egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#deleteCmmnClCode | executes | CmmnClCodeManage.deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:31`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:79`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:8`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:103`, `src/main/resources/egovframework/spring/com/context-mapper.xml:9`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:9`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |  |
| CmmnClCodeManage.deleteCmmnClCode | writes | COMTCCMMNCLCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:106`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:107` |  |
