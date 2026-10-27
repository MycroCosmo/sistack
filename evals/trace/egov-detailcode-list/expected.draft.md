# 공통상세코드 목록 — 정답 초안

승인 전 초안이며 정확도 판정에 쓰지 않는다. 인덱서 출력이 아닌 대상 소스의 선언·사용을 직접 읽고 작성했다. 기준 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`. 경로 기준: `.testbeds/egovframe/`.

선정 이유: 공통 PaginationInfo로 firstIndex/recordCountPerPage를 계산하고 공통코드 테이블과 JOIN하는 메뉴

## 범위와 검토 질문

- 공통 페이징 생성·getter 사용은 Controller 91~104행에서 직접 확인했다. 외부 PaginationInfo 구현 자체는 저장소에 없어 내부 호출을 확정하지 않는다.
- scope는 주 조회·건수 조회와 SQL reads다. 외부 propertiesService.getInt 호출은 별도 미확정 지점으로 포함한다.
- Oracle SQL은 콤마 JOIN이며 COMTCCMMNDETAILCODE와 COMTCCMMNCODE를 모두 읽는다. DB별 활성 파일 선택은 미확정이다.

JSON의 scope에 명시한 출발 노드·연결 종류·화면 위치만 비교한다. DB별 같은 이름의 SQL은 논리 연결 하나로 묶고, 실행 설정 선택은 LIKELY로 남긴다. 범위 밖 호출·보조 화면·런타임 결과를 전체 정확도로 확대하지 않는다.

## 연결 근거

| 출발 | 관계 | 도착 | 상태 | 파일:라인 | 이유 |
|---|---|---|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp | requests | ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:68`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82` |  |
| ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | maps_to | egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:83` |  |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | calls | unknown(external-injection) | UNRESOLVED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:63`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88` | propertiesService 구현이 외부 라이브러리에 있음 |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | calls | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:53`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:100`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:31`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:49` |  |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | calls | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:53`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:103`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:41` |  |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList | calls | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:34`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:50`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:47` |  |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt | calls | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt | CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:34`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:42`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:37` |  |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList | executes | CmmnDetailCodeManage.selectCmmnDetailCodeList | LIKELY | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:48`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:8`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:10` | DB별 동일 sqlId의 활성 설정 미확정 |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt | executes | CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | LIKELY | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:38`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:48` | DB별 동일 sqlId의 활성 설정 미확정 |
| CmmnDetailCodeManage.selectCmmnDetailCodeList | reads | COMTCCMMNDETAILCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:22` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeList | reads | COMTCCMMNCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:23` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | reads | COMTCCMMNDETAILCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:52` |  |
| CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | reads | COMTCCMMNCODE | CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_oracle.xml:53` |  |
