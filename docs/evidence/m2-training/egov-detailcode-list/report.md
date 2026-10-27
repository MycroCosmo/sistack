> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-trace 실행 결과

상태: PARTIAL. 연결은 정적 소스 근거(증거 2단계)이며 실제 앱/DB 실행을 뜻하지 않는다.

## 개요

공통상세코드 목록은 검색 조건과 페이지를 받아 상세코드·코드명 및 전체 건수를 조회한다.
이 화면의 상세 링크와 등록 화면 진입은 별도 Controller 분기로 이어진다.

## 동작 흐름

목록 폼/페이징 → SelectCcmCmmnDetailCodeList.do → ServiceImpl 목록/count → DAO sqlId → mysql 두 조회 → COMTCCMMNDETAILCODE와 COMTCCMMNCODE.
등록뷰 진입은 분류코드를 읽고 선택된 분류가 있을 때 공통코드도 읽는다. 상세 링크는 별도 상세 조회로 이어진다.

```text
src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_init
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_select_linkPage
      └─ requests [CONFIRMED] → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do
         └─ maps_to [CONFIRMED] → egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList
            └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87
            └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88
            └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList
               └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList
                  └─ executes [CONFIRMED] → CmmnDetailCodeManage.selectCmmnDetailCodeList
                     └─ reads [CONFIRMED] → COMTCCMMNDETAILCODE
                     └─ reads [CONFIRMED] → COMTCCMMNCODE
            └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt
               └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt
                  └─ executes [CONFIRMED] → CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt
                     └─ reads [CONFIRMED] → COMTCCMMNDETAILCODE
                     └─ reads [CONFIRMED] → COMTCCMMNCODE
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_search_code
      └─ requests [CONFIRMED] → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_inquire_codedetail
      └─ requests [CONFIRMED] → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do
         └─ maps_to [CONFIRMED] → egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeDetail
            └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeDetail
               └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeDetail
                  └─ executes [CONFIRMED] → CmmnDetailCodeManage.selectCmmnDetailCodeDetail
                     └─ reads [CONFIRMED] → COMTCCMMNDETAILCODE
                     └─ reads [CONFIRMED] → COMTCCMMNCODE
└─ requests [CONFIRMED] → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do
└─ requests [CONFIRMED] → ANY /sym/ccm/cde/RegistCcmCmmnDetailCodeView.do
   └─ maps_to [CONFIRMED] → egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#insertCmmnDetailCodeView
      └─ calls [CONFIRMED] → egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#selectCmmnClCodeList
         └─ calls [CONFIRMED] → egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#selectCmmnClCodeList
            └─ executes [CONFIRMED] → CmmnClCodeManage.selectCmmnClCodeList
               └─ reads [CONFIRMED] → COMTCCMMNCLCODE
      └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cca.service.impl.EgovCcmCmmnCodeManageServiceImpl#selectCmmnCodeList
         └─ calls [CONFIRMED] → egovframework.com.sym.ccm.cca.service.impl.CmmnCodeManageDAO#selectCmmnCodeList
            └─ executes [CONFIRMED] → CmmnCodeManage.selectCmmnCodeList
               └─ reads [CONFIRMED] → COMTCCMMNCODE
               └─ reads [CONFIRMED] → COMTCCMMNCLCODE
└─ requests [CONFIRMED] → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do
```

```mermaid
flowchart TD
  n0["COMTCCMMNCLCODE"]
  n1["COMTCCMMNCODE"]
  n2["COMTCCMMNDETAILCODE"]
  n3["egovframework.com.sym.ccm.cca.service.impl.CmmnCodeManageDAO#selectCmmnCodeList"]
  n4["egovframework.com.sym.ccm.cca.service.impl.EgovCcmCmmnCodeManageServiceImpl#selectCmmnCodeList"]
  n5["egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#selectCmmnClCodeList"]
  n6["egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#selectCmmnClCodeList"]
  n7["egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt"]
  n8["egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList"]
  n9["egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeDetail"]
  n10["egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt"]
  n11["egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList"]
  n12["egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeDetail"]
  n13["egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList"]
  n14["egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeDetail"]
  n15["egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#insertCmmnDetailCodeView"]
  n16["CmmnCodeManage.selectCmmnCodeList"]
  n17["CmmnClCodeManage.selectCmmnClCodeList"]
  n18["CmmnDetailCodeManage.selectCmmnDetailCodeList"]
  n19["CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt"]
  n20["CmmnDetailCodeManage.selectCmmnDetailCodeDetail"]
  n21["src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp"]
  n22["src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30"]
  n23["src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_init"]
  n24["src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_select_linkPage"]
  n25["src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_search_code"]
  n26["src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_inquire_codedetail"]
  n27["ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do"]
  n28["ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do"]
  n29["ANY /sym/ccm/cde/RegistCcmCmmnDetailCodeView.do"]
  n30["external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87"]
  n31["external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88"]
  n21 -->|"includes CONFIRMED"| n22
  n21 -->|"requests CONFIRMED"| n27
  n21 -->|"requests CONFIRMED"| n29
  n21 -->|"requests CONFIRMED"| n28
  n22 -->|"includes CONFIRMED"| n23
  n22 -->|"includes CONFIRMED"| n24
  n22 -->|"includes CONFIRMED"| n25
  n22 -->|"includes CONFIRMED"| n26
  n27 -->|"maps_to CONFIRMED"| n13
  n29 -->|"maps_to CONFIRMED"| n15
  n24 -->|"requests CONFIRMED"| n27
  n25 -->|"requests CONFIRMED"| n27
  n26 -->|"requests CONFIRMED"| n28
  n13 -->|"calls UNRESOLVED"| n30
  n13 -->|"calls UNRESOLVED"| n31
  n13 -->|"calls CONFIRMED"| n11
  n13 -->|"calls CONFIRMED"| n10
  n15 -->|"calls CONFIRMED"| n6
  n15 -->|"calls CONFIRMED"| n4
  n28 -->|"maps_to CONFIRMED"| n14
  n11 -->|"calls CONFIRMED"| n8
  n10 -->|"calls CONFIRMED"| n7
  n6 -->|"calls CONFIRMED"| n5
  n4 -->|"calls CONFIRMED"| n3
  n14 -->|"calls CONFIRMED"| n12
  n8 -->|"executes CONFIRMED"| n18
  n7 -->|"executes CONFIRMED"| n19
  n5 -->|"executes CONFIRMED"| n17
  n3 -->|"executes CONFIRMED"| n16
  n12 -->|"calls CONFIRMED"| n9
  n18 -->|"reads CONFIRMED"| n2
  n18 -->|"reads CONFIRMED"| n1
  n19 -->|"reads CONFIRMED"| n2
  n19 -->|"reads CONFIRMED"| n1
  n17 -->|"reads CONFIRMED"| n0
  n16 -->|"reads CONFIRMED"| n1
  n16 -->|"reads CONFIRMED"| n0
  n9 -->|"executes CONFIRMED"| n20
  n20 -->|"reads CONFIRMED"| n2
  n20 -->|"reads CONFIRMED"| n1
```

## 파일 위치

| 계층 | 위치 | 이름 |
|---|---|---|
| table | `script/ddl/altibase/com_DDL_altibase.sql:791` | COMTCCMMNCLCODE |
| table | `script/ddl/altibase/com_DDL_altibase.sql:806` | COMTCCMMNCODE |
| table | `script/ddl/altibase/com_DDL_altibase.sql:828` | COMTCCMMNDETAILCODE |
| method | `src/main/java/egovframework/com/sym/ccm/cca/service/impl/CmmnCodeManageDAO.java:47` | egovframework.com.sym.ccm.cca.service.impl.CmmnCodeManageDAO#selectCmmnCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/cca/service/impl/EgovCcmCmmnCodeManageServiceImpl.java:50` | egovframework.com.sym.ccm.cca.service.impl.EgovCcmCmmnCodeManageServiceImpl#selectCmmnCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:50` | egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#selectCmmnClCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:55` | egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#selectCmmnClCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:37` | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt |
| method | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:47` | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:56` | egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeDetail |
| method | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:41` | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt |
| method | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:49` | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:58` | egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeDetail |
| method | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:83` | egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList |
| method | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:119` | egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeDetail |
| method | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:152` | egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#insertCmmnDetailCodeView |
| sql | `src/main/resources/egovframework/mapper/com/sym/ccm/cca/EgovCmmnCodeManage_SQL_mysql.xml:10` | CmmnCodeManage.selectCmmnCodeList |
| sql | `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:10` | CmmnClCodeManage.selectCmmnClCodeList |
| sql | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:10` | CmmnDetailCodeManage.selectCmmnDetailCodeList |
| sql | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:35` | CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt |
| sql | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:57` | CmmnDetailCodeManage.selectCmmnDetailCodeDetail |
| jsp | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:1` | src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:30` | src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:34` | src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_init |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:42` | src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_select_linkPage |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:50` | src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_search_code |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:57` | src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_inquire_codedetail |
| endpoint | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82` | ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do |
| endpoint | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:118` | ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do |
| endpoint | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:151` | ANY /sym/ccm/cde/RegistCcmCmmnDetailCodeView.do |
| unknown | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87` | external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87 |
| unknown | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88` | external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88 |

## 연결 근거

| 출발 → 도착 | 관계·상태 | 소스 근거 |
|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:30` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:68`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp → ANY /sym/ccm/cde/RegistCcmCmmnDetailCodeView.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:88`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:151` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:123`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:118` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30 → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_init | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:30`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:34` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30 → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_select_linkPage | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:30`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:42` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30 → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_search_code | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:30`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:50` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#inline:30 → src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_inquire_codedetail | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:30`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:57` |
| ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do → egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList | maps_to / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:83`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:51` |
| ANY /sym/ccm/cde/RegistCcmCmmnDetailCodeView.do → egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#insertCmmnDetailCodeView | maps_to / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:151`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:152`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:51` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_select_linkPage → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:45`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_search_code → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeList.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:52`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:82` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp#fn_egov_inquire_codedetail → ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:62`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:118` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList → external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87 | calls / UNRESOLVED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList → external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88 | calls / UNRESOLVED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList → egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:100`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:49`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:54` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList → egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:103`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:41`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:54` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#insertCmmnDetailCodeView → egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#selectCmmnClCodeList | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:158`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:55`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:57` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#insertCmmnDetailCodeView → egovframework.com.sym.ccm.cca.service.impl.EgovCcmCmmnCodeManageServiceImpl#selectCmmnCodeList | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:172`, `src/main/java/egovframework/com/sym/ccm/cca/service/impl/EgovCcmCmmnCodeManageServiceImpl.java:50`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:60` |
| ANY /sym/ccm/cde/SelectCcmCmmnDetailCodeDetail.do → egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeDetail | maps_to / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:118`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:119`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:51` |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeList → egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:50`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:47`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:35` |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeListTotCnt → egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:42`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:37`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:35` |
| egovframework.com.sym.ccm.ccc.service.impl.EgovCcmCmmnClCodeManageServiceImpl#selectCmmnClCodeList → egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#selectCmmnClCodeList | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:56`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:50`, `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/EgovCcmCmmnClCodeManageServiceImpl.java:39` |
| egovframework.com.sym.ccm.cca.service.impl.EgovCcmCmmnCodeManageServiceImpl#selectCmmnCodeList → egovframework.com.sym.ccm.cca.service.impl.CmmnCodeManageDAO#selectCmmnCodeList | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cca/service/impl/EgovCcmCmmnCodeManageServiceImpl.java:51`, `src/main/java/egovframework/com/sym/ccm/cca/service/impl/CmmnCodeManageDAO.java:47`, `src/main/java/egovframework/com/sym/ccm/cca/service/impl/EgovCcmCmmnCodeManageServiceImpl.java:36` |
| egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeDetail → egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeDetail | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:121`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:58`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:54` |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeList → CmmnDetailCodeManage.selectCmmnDetailCodeList | executes / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:48`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:10`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeListTotCnt → CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt | executes / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:38`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:35`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.sym.ccm.ccc.service.impl.CmmnClCodeManageDAO#selectCmmnClCodeList → CmmnClCodeManage.selectCmmnClCodeList | executes / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/ccc/service/impl/CmmnClCodeManageDAO.java:51`, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:10`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.sym.ccm.cca.service.impl.CmmnCodeManageDAO#selectCmmnCodeList → CmmnCodeManage.selectCmmnCodeList | executes / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cca/service/impl/CmmnCodeManageDAO.java:48`, `src/main/resources/egovframework/mapper/com/sym/ccm/cca/EgovCmmnCodeManage_SQL_mysql.xml:10`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.sym.ccm.cde.service.impl.EgovCcmCmmnDetailCodeManageServiceImpl#selectCmmnDetailCodeDetail → egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeDetail | calls / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:59`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:56`, `src/main/java/egovframework/com/sym/ccm/cde/service/impl/EgovCcmCmmnDetailCodeManageServiceImpl.java:35` |
| CmmnDetailCodeManage.selectCmmnDetailCodeList → COMTCCMMNDETAILCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:17` |
| CmmnDetailCodeManage.selectCmmnDetailCodeList → COMTCCMMNCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:18` |
| CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt → COMTCCMMNDETAILCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:39` |
| CmmnDetailCodeManage.selectCmmnDetailCodeListTotCnt → COMTCCMMNCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:40` |
| CmmnClCodeManage.selectCmmnClCodeList → COMTCCMMNCLCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:16` |
| CmmnCodeManage.selectCmmnCodeList → COMTCCMMNCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cca/EgovCmmnCodeManage_SQL_mysql.xml:16` |
| CmmnCodeManage.selectCmmnCodeList → COMTCCMMNCLCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cca/EgovCmmnCodeManage_SQL_mysql.xml:17` |
| egovframework.com.sym.ccm.cde.service.impl.CmmnDetailCodeManageDAO#selectCmmnDetailCodeDetail → CmmnDetailCodeManage.selectCmmnDetailCodeDetail | executes / CONFIRMED | `src/main/java/egovframework/com/sym/ccm/cde/service/impl/CmmnDetailCodeManageDAO.java:57`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:57`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| CmmnDetailCodeManage.selectCmmnDetailCodeDetail → COMTCCMMNDETAILCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:66` |
| CmmnDetailCodeManage.selectCmmnDetailCodeDetail → COMTCCMMNCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:67` |

## 관련 테이블

- 읽기: COMTCCMMNDETAILCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:17`
- 읽기: COMTCCMMNCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:18`
- 읽기: COMTCCMMNDETAILCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:39`
- 읽기: COMTCCMMNCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:40`
- 읽기: COMTCCMMNCLCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/ccc/EgovCmmnClCodeManage_SQL_mysql.xml:16`
- 읽기: COMTCCMMNCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cca/EgovCmmnCodeManage_SQL_mysql.xml:16`
- 읽기: COMTCCMMNCLCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cca/EgovCmmnCodeManage_SQL_mysql.xml:17`
- 읽기: COMTCCMMNDETAILCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:66`
- 읽기: COMTCCMMNCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:67`

## 함정

- 기본 DB 선택: mapperLocations의 *_{Globals.DbType}.xml과 Globals.DbType=mysql로 mysql 문장을 선택한다. 다른 DB XML은 활성 실행 근거가 아닌 후보다. 외부 override는 미검증. (`src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20`)
- dummy 인증 인터셉터 제외: XML은 dummy 프로필 안에 있다. Listener가 DB와 Globals.Auth로 활성 프로필을 정하고 기본 Auth=security이므로 이 선언을 활성 요청 경로로 보지 않는다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58`, `src/main/resources/egovframework/egovProps/globals.properties:26`)
- 검색은 pageIndex=1로 초기화하고 페이징은 지정한 번호를 사용한다. (`src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:50`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:42`)
- 상세 href의 GET fallback과 onclick의 POST는 두 도달 가능 경로다. 중첩 태그 때문에 골격이 놓친 href를 소스로 보완했다. (`src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:123`, `src/main/webapp/WEB-INF/jsp/egovframework/com/sym/ccm/cde/EgovCcmCmmnDetailCodeList.jsp:57`)
- 테이블 노드의 altibase 대표 선언은 DB 선택을 뜻하지 않는다. mysql DDL에도 세 테이블 선언이 있으며 mysql mapper를 실행 대상으로 선택했다. (`script/ddl/mysql/com_DDL_mysql.sql:1205`, `script/ddl/mysql/com_DDL_mysql.sql:1229`, `script/ddl/mysql/com_DDL_mysql.sql:1263`)

## 숨은 경로 확인

- interceptor: CONFIRMED — 기본 HandlerMapping에 LocaleChangeInterceptor/WebLogInterceptor가 선언된다. 별도 AuthenticInterceptor는 dummy 프로필이므로 기본 security 구성에서 제외했다. 실행 순서·내부 호출 미검증. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:44`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:51`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58`)
- filter: CONFIRMED — Java initializer에서 encoding *.do, security /*, multipart, HTMLTag 필터를 등록한다. Security 내부 필터 체인 동작은 실행하지 않았다. (`src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:66`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:98`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:149`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:159`)
- aop: UNRESOLVED — syslog·privacy AOP의 pointcut 선언은 확인했으나 각 advice 내부와 실제 적용 여부는 미검증이다. (`src/main/resources/egovframework/spring/com/context-syslogaop.xml:13`, `src/main/resources/egovframework/spring/com/context-privacylogaop.xml:24`)
- paging: CONFIRMED — Controller가 pageUnit/pageSize를 읽고 PaginationInfo의 인덱스를 VO에 넣는다. SQL은 LIMIT/OFFSET을 사용한다. properties 라이브러리 내부는 소스에 없다. (`src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:91`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:98`, `src/main/resources/egovframework/mapper/com/sym/ccm/cde/EgovCmmnDetailCodeManage_SQL_mysql.xml:32`, `src/main/resources/egovframework/spring/com/context-properties.xml:8`)
- common-code: CONFIRMED — 등록뷰가 분류코드를 조회하고 선택된 분류가 있을 때 공통코드를 조회한다. (`src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:156`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:164`, `src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:172`)
- exception: CONFIRMED — MVC SimpleMappingExceptionResolver의 예외→뷰 선언을 확인했다. 실제 발생·응답은 미검증이다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:63`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:72`)

## 확정 못 한 경로

- egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList → external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:87: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- egovframework.com.sym.ccm.cde.web.EgovCcmCmmnDetailCodeManageController#selectCmmnDetailCodeList → external-injection:src/main/java/egovframework/com/sym/ccm/cde/web/EgovCcmCmmnDetailCodeManageController.java:88: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- 앱·DB 요청은 실행하지 않았다. 정적 소스의 도달 가능 경로이며 실제 조건 충족을 보증하지 않는다.
- 공유 include 관계는 버튼 실행을 뜻하지 않는다. 외부 라이브러리·환경 override·동적 값은 미검증이다.

## 실행 방식

complex / parallel. Codex 화면·서버·SQL 탐색자 3개 실제 병렬 실행 후 원문과 종합. 동일 소스 해시의 v1 탐색 기록을 v2 골격에 재대조했다.

## 다음 확인

- 미확정 URL/값이 필요한 경우 실제 입력·허용된 로그를 추가로 확인한다.
- 결과의 파일:라인과 사용 범위를 검토하고 운영 반영 판단은 담당 승인 절차를 따른다.
