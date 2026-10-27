# 공통분류코드 삭제 — 정답 초안

승인 전 초안이며 정확도 판정에 쓰지 않는다. 인덱서 출력이 아닌 대상 소스의 선언·사용을 직접 읽고 작성했다. 기준 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`. 경로 기준: `.testbeds/egovframe/`.

선정 이유: 단순 CRUD 메뉴. delete라는 이름과 실제 UPDATE USE_AT=N SQL의 차이를 확인

## 범위와 검토 질문

- DB별 XML이 공존하므로 활성 Mapper 선택은 LIKELY다. Oracle XML의 실제 쓰기는 DELETE가 아닌 UPDATE다.
- fn_egov_delete_code의 동일 폼 action 할당→submit을 한 흐름으로 본다. 실행 여부는 confirm 입력에 달려 있다.
- 삭제 후 forward로 목록을 다시 읽는 후속 흐름은 범위 밖이다.

JSON의 scope에 명시한 출발 노드·연결 종류·화면 위치만 비교한다. DB별 같은 이름의 SQL은 논리 연결 하나로 묶고, 실행 설정 선택은 LIKELY로 남긴다. 범위 밖 호출·보조 화면·런타임 결과를 전체 정확도로 확대하지 않는다.

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/ccc/EgovCcmCmmnClCodeDetail.jsp#fn_egov_delete_code | requests | ANY /sym/ccm/ccc/RemoveCcmCmmnClCode.do | CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/ccc/EgovCcmCmmnClCodeDetail.jsp:39`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/ccc/EgovCcmCmmnClCodeDetail.jsp:40`, `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:180` |  |
| ANY /sym/ccm/ccc/RemoveCcmCmmnClCode.do | maps_to | egovframework.com.sym.ccm.ccc.web.EgovCcmCmmnClCodeManageController#deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:180`, `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:181` |  |
| egovframework.com.sym.ccm.ccc.web.EgovCcmCmmnClCodeManageController#deleteCmmnClCode | calls | egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:48`, `src/main/java/egovframework/com/sym/ccm/ccc/web/EgovCcmCmmnClCodeManageController.java:187`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:35`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:81` |  |
| egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#deleteCmmnClCode | calls | egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#deleteCmmnClCode | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:38`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:82`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:30`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:78` |  |
| egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#deleteCmmnClCode | executes | CmmnClCodeManage.deleteCmmnClCode | LIKELY | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:31`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:79`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_oracle.xml:8`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_oracle.xml:115` | DB별 동일 namespace.id가 공존하며 런타임 선택은 미확정 |
| CmmnClCodeManage.deleteCmmnClCode | writes | COMTCCMMNCLCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_oracle.xml:118`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_oracle.xml:119` |  |
