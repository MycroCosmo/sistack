> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-trace 실행 결과

상태: PARTIAL. 연결은 정적 소스 근거(증거 2단계)이며 실제 앱/DB 실행을 뜻하지 않는다.

## 개요

게시판 목록은 마스터와 조건부 옵션, 게시물·건수·공지를 조회한다.
인증 실패 redirect와 방명록 forward는 도착 URL에서 끝내며 일반 목록 응답 모델을 구별한다.

## 동작 흐름

POST 목록 폼 → Controller → 마스터 Service/DAO → 조건부 옵션 SQL → 페이지 설정 → 게시물 목록/count/공지 SQL → 모델과 목록 view.

```text
src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail
└─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage
      └─ requests [CONFIRMED] → ANY /cop/bbs/selectArticleList.do
         └─ maps_to [CONFIRMED] → egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList
            └─ calls [CONFIRMED] → egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser
            └─ calls [CONFIRMED] → egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated
            └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf
               └─ calls [CONFIRMED] → egovframework.com.cmm.EgovComponentChecker#hasComponent
               └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail
                  └─ executes [CONFIRMED] → BBSMaster.selectBBSMasterDetail
                     └─ reads [CONFIRMED] → COMTNBBSUSE
                     └─ reads [CONFIRMED] → COMTNBBSMASTER
                     └─ reads [CONFIRMED] → COMTCCMMNDETAILCODE
                     └─ reads [CONFIRMED] → COMTNTMPLATINFO
                     └─ reads [CONFIRMED] → COMVNUSERMASTER
                     └─ maps_to [CONFIRMED] → BBSMaster.boardMasterDetail
               └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf
                  └─ executes [CONFIRMED] → BBSAddedOptions.selectAddedOptionsInf
                     └─ reads [CONFIRMED] → COMTNBBSMASTEROPTN
                     └─ reads [CONFIRMED] → COMVNUSERMASTER
                     └─ maps_to [CONFIRMED] → BBSAddedOptions.boardMasterDetail
            └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171
            └─ calls [UNRESOLVED] → external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172
            └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList
               └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList
                  └─ executes [CONFIRMED] → BBSArticle.selectArticleList
                     └─ reads [CONFIRMED] → COMTNBBS
                     └─ reads [CONFIRMED] → COMVNUSERMASTER
                     └─ reads [CONFIRMED] → COMTNCOMMENT
                     └─ maps_to [CONFIRMED] → BBSArticle.boardList
               └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt
                  └─ executes [CONFIRMED] → BBSArticle.selectArticleListCnt
                     └─ reads [CONFIRMED] → COMTNBBS
                     └─ reads [CONFIRMED] → COMVNUSERMASTER
            └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList
               └─ calls [CONFIRMED] → egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList
                  └─ executes [CONFIRMED] → BBSArticle.selectNoticeArticleList
                     └─ reads [CONFIRMED] → COMTNBBS
                     └─ reads [CONFIRMED] → COMVNUSERMASTER
                     └─ reads [CONFIRMED] → COMTNCOMMENT
                     └─ maps_to [CONFIRMED] → BBSArticle.boardList
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article
      └─ requests [CONFIRMED] → ANY /cop/bbs/selectArticleList.do
   └─ includes [CONFIRMED] → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail
└─ requests [CONFIRMED] → ANY /cop/bbs/selectArticleList.do
```

```mermaid
flowchart TD
  n0["COMTNBBSMASTER"]
  n1["COMTNBBS"]
  n2["COMTNCOMMENT"]
  n3["COMTCCMMNDETAILCODE"]
  n4["COMTNBBSUSE"]
  n5["COMTNBBSMASTEROPTN"]
  n6["COMTNTMPLATINFO"]
  n7["COMVNUSERMASTER"]
  n8["egovframework.com.cmm.EgovComponentChecker#hasComponent"]
  n9["egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser"]
  n10["egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated"]
  n11["egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf"]
  n12["egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList"]
  n13["egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt"]
  n14["egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList"]
  n15["egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList"]
  n16["egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList"]
  n17["egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail"]
  n18["egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf"]
  n19["egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList"]
  n20["BBSArticle.boardList"]
  n21["BBSArticle.selectArticleList"]
  n22["BBSArticle.selectArticleListCnt"]
  n23["BBSArticle.selectNoticeArticleList"]
  n24["BBSAddedOptions.boardMasterDetail"]
  n25["BBSAddedOptions.selectAddedOptionsInf"]
  n26["BBSMaster.boardMasterDetail"]
  n27["BBSMaster.selectBBSMasterDetail"]
  n28["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp"]
  n29["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35"]
  n30["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init"]
  n31["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage"]
  n32["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article"]
  n33["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail"]
  n34["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64"]
  n35["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init"]
  n36["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage"]
  n37["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article"]
  n38["src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail"]
  n39["ANY /cop/bbs/selectArticleList.do"]
  n40["external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171"]
  n41["external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172"]
  n28 -->|"includes CONFIRMED"| n29
  n28 -->|"includes CONFIRMED"| n34
  n28 -->|"requests CONFIRMED"| n39
  n29 -->|"includes CONFIRMED"| n30
  n29 -->|"includes CONFIRMED"| n31
  n29 -->|"includes CONFIRMED"| n32
  n29 -->|"includes CONFIRMED"| n33
  n34 -->|"includes CONFIRMED"| n35
  n34 -->|"includes CONFIRMED"| n36
  n34 -->|"includes CONFIRMED"| n37
  n34 -->|"includes CONFIRMED"| n38
  n39 -->|"maps_to CONFIRMED"| n19
  n36 -->|"requests CONFIRMED"| n39
  n37 -->|"requests CONFIRMED"| n39
  n19 -->|"calls CONFIRMED"| n9
  n19 -->|"calls CONFIRMED"| n10
  n19 -->|"calls CONFIRMED"| n18
  n19 -->|"calls UNRESOLVED"| n40
  n19 -->|"calls UNRESOLVED"| n41
  n19 -->|"calls CONFIRMED"| n15
  n19 -->|"calls CONFIRMED"| n16
  n18 -->|"calls CONFIRMED"| n8
  n18 -->|"calls CONFIRMED"| n17
  n18 -->|"calls CONFIRMED"| n11
  n15 -->|"calls CONFIRMED"| n12
  n15 -->|"calls CONFIRMED"| n13
  n16 -->|"calls CONFIRMED"| n14
  n17 -->|"executes CONFIRMED"| n27
  n11 -->|"executes CONFIRMED"| n25
  n12 -->|"executes CONFIRMED"| n21
  n13 -->|"executes CONFIRMED"| n22
  n14 -->|"executes CONFIRMED"| n23
  n27 -->|"reads CONFIRMED"| n4
  n27 -->|"reads CONFIRMED"| n0
  n27 -->|"reads CONFIRMED"| n3
  n27 -->|"reads CONFIRMED"| n6
  n27 -->|"reads CONFIRMED"| n7
  n27 -->|"maps_to CONFIRMED"| n26
  n25 -->|"reads CONFIRMED"| n5
  n25 -->|"reads CONFIRMED"| n7
  n25 -->|"maps_to CONFIRMED"| n24
  n21 -->|"reads CONFIRMED"| n1
  n21 -->|"reads CONFIRMED"| n7
  n21 -->|"reads CONFIRMED"| n2
  n21 -->|"maps_to CONFIRMED"| n20
  n22 -->|"reads CONFIRMED"| n1
  n22 -->|"reads CONFIRMED"| n7
  n23 -->|"reads CONFIRMED"| n1
  n23 -->|"reads CONFIRMED"| n7
  n23 -->|"reads CONFIRMED"| n2
  n23 -->|"maps_to CONFIRMED"| n20
```

## 파일 위치

| 계층 | 위치 | 이름 |
|---|---|---|
| table | `script/ddl/altibase/com_DDL_altibase.sql:401` | COMTNBBSMASTER |
| table | `script/ddl/altibase/com_DDL_altibase.sql:425` | COMTNBBS |
| table | `script/ddl/altibase/com_DDL_altibase.sql:463` | COMTNCOMMENT |
| table | `script/ddl/altibase/com_DDL_altibase.sql:828` | COMTCCMMNDETAILCODE |
| table | `script/ddl/altibase/com_DDL_altibase.sql:1233` | COMTNBBSUSE |
| table | `script/ddl/altibase/com_DDL_altibase.sql:1881` | COMTNBBSMASTEROPTN |
| table | `script/ddl/altibase/com_DDL_altibase.sql:2135` | COMTNTMPLATINFO |
| view | `script/ddl/altibase/com_DDL_altibase.sql:3294` | COMVNUSERMASTER |
| method | `src/main/java/egovframework/com/cmm/EgovComponentChecker.java:48` | egovframework.com.cmm.EgovComponentChecker#hasComponent |
| method | `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:41` | egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser |
| method | `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58` | egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/BBSAddedOptionsDAO.java:42` | egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:15` | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:19` | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:52` | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:38` | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:125` | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterDAO.java:25` | egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail |
| method | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:64` | egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf |
| method | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:150` | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList |
| resultMap | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:10` | BBSArticle.boardList |
| sql | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208` | BBSArticle.selectArticleList |
| sql | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:246` | BBSArticle.selectArticleListCnt |
| sql | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379` | BBSArticle.selectNoticeArticleList |
| resultMap | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:6` | BBSAddedOptions.boardMasterDetail |
| sql | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:38` | BBSAddedOptions.selectAddedOptionsInf |
| resultMap | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:20` | BBSMaster.boardMasterDetail |
| sql | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:156` | BBSMaster.selectBBSMasterDetail |
| jsp | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:1` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:35` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:39` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:47` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:52` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:57` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:64` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64 |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:68` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:76` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:84` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article |
| js | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:91` | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail |
| endpoint | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149` | ANY /cop/bbs/selectArticleList.do |
| unknown | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171` | external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171 |
| unknown | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172` | external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172 |

## 연결 근거

| 출발 → 도착 | 관계·상태 | 소스 근거 |
|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:35` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64 | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:1`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:64` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp → ANY /cop/bbs/selectArticleList.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:108`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:35`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:39` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:35`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:47` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:35`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:52` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:35 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:35`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:57` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_init | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:64`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:68` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:64`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:76` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:64`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:84` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#inline:64 → src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_inquire_articledetail | includes / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:64`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:91` |
| ANY /cop/bbs/selectArticleList.do → egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | maps_to / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:150`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:73` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_select_linkPage → ANY /cop/bbs/selectArticleList.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:79`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149` |
| src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp#fn_egov_search_article → ANY /cop/bbs/selectArticleList.do | requests / CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:86`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:108` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:151`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:41` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:153`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:163`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:64`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:81` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171 | calls / UNRESOLVED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172 | calls / UNRESOLVED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:184`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:38`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:78` |
| egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:188`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:125`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:78` |
| egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf → egovframework.com.cmm.EgovComponentChecker#hasComponent | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:69`, `src/main/java/egovframework/com/cmm/EgovComponentChecker.java:48` |
| egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf → egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:65`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterDAO.java:25`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:27` |
| egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf → egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:70`, `src/main/java/egovframework/com/cop/bbs/service/impl/BBSAddedOptionsDAO.java:42`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:36` |
| egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList → egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:39`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:15`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:26` |
| egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList → egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:42`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:19`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:26` |
| egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList → egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList | calls / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:126`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:52`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:26` |
| egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail → BBSMaster.selectBBSMasterDetail | executes / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterDAO.java:26`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:156`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf → BBSAddedOptions.selectAddedOptionsInf | executes / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/BBSAddedOptionsDAO.java:43`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:38`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList → BBSArticle.selectArticleList | executes / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:16`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt → BBSArticle.selectArticleListCnt | executes / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:20`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:246`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList → BBSArticle.selectNoticeArticleList | executes / CONFIRMED | `src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:53`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20` |
| BBSMaster.selectBBSMasterDetail → COMTNBBSUSE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:164` |
| BBSMaster.selectBBSMasterDetail → COMTNBBSMASTER | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:168` |
| BBSMaster.selectBBSMasterDetail → COMTCCMMNDETAILCODE | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:171` |
| BBSMaster.selectBBSMasterDetail → COMTNTMPLATINFO | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:173` |
| BBSMaster.selectBBSMasterDetail → COMVNUSERMASTER | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:175` |
| BBSMaster.selectBBSMasterDetail → BBSMaster.boardMasterDetail | maps_to / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:156`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:20` |
| BBSAddedOptions.selectAddedOptionsInf → COMTNBBSMASTEROPTN | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:44` |
| BBSAddedOptions.selectAddedOptionsInf → COMVNUSERMASTER | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:46` |
| BBSAddedOptions.selectAddedOptionsInf → BBSAddedOptions.boardMasterDetail | maps_to / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:38`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:6` |
| BBSArticle.selectArticleList → COMTNBBS | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:215` |
| BBSArticle.selectArticleList → COMVNUSERMASTER | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:217` |
| BBSArticle.selectArticleList → COMTNCOMMENT | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:222` |
| BBSArticle.selectArticleList → BBSArticle.boardList | maps_to / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:10` |
| BBSArticle.selectArticleListCnt → COMTNBBS | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:250` |
| BBSArticle.selectArticleListCnt → COMVNUSERMASTER | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:252` |
| BBSArticle.selectNoticeArticleList → COMTNBBS | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:386` |
| BBSArticle.selectNoticeArticleList → COMVNUSERMASTER | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:388` |
| BBSArticle.selectNoticeArticleList → COMTNCOMMENT | reads / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:393` |
| BBSArticle.selectNoticeArticleList → BBSArticle.boardList | maps_to / CONFIRMED | `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:10` |

## 관련 테이블

- 읽기: COMTNBBSUSE — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:164`
- 읽기: COMTNBBSMASTER — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:168`
- 읽기: COMTCCMMNDETAILCODE — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:171`
- 읽기: COMTNTMPLATINFO — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:173`
- 읽기: COMVNUSERMASTER — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:175`
- 읽기: COMTNBBSMASTEROPTN — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:44`
- 읽기: COMVNUSERMASTER — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:46`
- 읽기: COMTNBBS — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:215`
- 읽기: COMVNUSERMASTER — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:217`
- 읽기: COMTNCOMMENT — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:222`
- 읽기: COMTNBBS — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:250`
- 읽기: COMVNUSERMASTER — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:252`
- 읽기: COMTNBBS — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:386`
- 읽기: COMVNUSERMASTER — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:388`
- 읽기: COMTNCOMMENT — CONFIRMED, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:393`

## 함정

- mysql-selection / CONFIRMED: DB 기본 선택은 mapperLocations + Globals.DbType=mysql이다. 다른 DB XML은 후보이며 서버 override는 미검증이다. (`src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20`)
- profile-boundary / UNRESOLVED: AuthenticInterceptor는 dummy 프로필 전용이다. 활성 프로필은 Java Listener의 런타임 계산이라 자동 확정하지 못했다. 후보 연결은 LIKELY, profile=dummy; active=미확정으로 유지한다. Globals.Auth=security는 기본값 근거이며 실제 기동·override·실행 순서는 미확인이다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:43`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58`, `src/main/resources/egovframework/egovProps/globals.properties:26`)
- ddl-location / CONFIRMED: 골격 table/view의 Altibase DDL 위치는 이름 병합 대표 선언이다. 활성 mysql DDL 위치로 해석하지 않으며 선택된 mysql SQL과 별도 mysql DDL을 확인했다. (`script/ddl/mysql/com_DDL_mysql.sql:184`, `script/ddl/mysql/com_DDL_mysql.sql:598`, `script/ddl/mysql/com_DDL_mysql.sql:5050`)
- redirect-unauthenticated / CONFIRMED: 인증 실패는 redirect:/uat/uia/egovLoginUsr.do 도착 URL에서 종료한다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:153`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:156`)
- forward-guest-board / CONFIRMED: 게시판 타입 BBST03이면 forward:/cop/bbs/selectGuestArticleList.do에서 종료하고 그 이후 요청은 범위 밖이다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:166`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:167`)
- view-and-model / CONFIRMED: 기본 응답 view는 egovframework/com/cop/bbs/EgovArticleList이며 resultList/resultCnt/articleVO/boardMasterVO/paginationInfo/noticeList를 모델에 넣는다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:204`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:210`)
- property-service-boundary / UNRESOLVED: propertyService.getInt(pageUnit/pageSize) 두 호출은 확인했으며 외부 구현 내부는 미확정이다. 이 calls는 골격에 UNRESOLVED로 기록돼 있다. 설정 기본값은 각각 10이다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:89`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172`, `src/main/resources/egovframework/spring/com/context-properties.xml:8`, `src/main/resources/egovframework/spring/com/context-properties.xml:9`)
- pagination-boundary / UNRESOLVED: Controller가 PaginationInfo로 first/last/recordCountPerPage를 설정하고 SQL LIMIT/OFFSET으로 전달한다. 외부 PaginationInfo 내부 계산·실행은 미검증이다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:174`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:180`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:242`)
- no-master-exception / UNRESOLVED: 마스터가 null이면 상속 processException(info.nodata.msg)을 throw한다. 외부 상속 구현 내부는 미확정이다. (`src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:66`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:67`)
- security-library-boundary / UNRESOLVED: security 서비스는 org.egovframe.rte.fdl.security.userdetails.util.EgovUserDetailsHelper에 위임한다. 외부 동명 Helper 내부는 미확정이며 로컬 재귀 호출로 해석하지 않는다. (`src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:8`, `src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:40`, `src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:62`)
- component-options-condition / UNRESOLVED: 마스터 추가옵션은 comment 또는 satisfaction 컴포넌트 존재 조건에 달려 있다. hasComponent의 빈 조회 소스는 확인했지만 실제 배포 조건의 참/거짓은 실행하지 않았다. 이 static 호출은 자동 골격에서 누락됐다. (`src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:69`, `src/main/java/egovframework/com/cmm/EgovComponentChecker.java:48`)
- view-base-tables / CONFIRMED: COMVNUSERMASTER는 VIEW이며 COMTNGNRLMBER/COMTNEMPLYRINFO/COMTNENTRPRSMBER를 UNION ALL한다. SQL→VIEW는 그래프에 있고 VIEW 내부 기반 테이블은 보충 근거로 구별한다. (`script/ddl/mysql/com_DDL_mysql.sql:5050`, `script/ddl/mysql/com_DDL_mysql.sql:5053`, `script/ddl/mysql/com_DDL_mysql.sql:5057`, `script/ddl/mysql/com_DDL_mysql.sql:5060`)
- mysql-ddl-location / CONFIRMED: mysql DDL에서 게시판·게시물·댓글·상세코드·사용·옵션·템플릿 선언을 확인했다. table 대표 노드의 다른 DB 위치와 구별한다. (`script/ddl/mysql/com_DDL_mysql.sql:598`, `script/ddl/mysql/com_DDL_mysql.sql:631`, `script/ddl/mysql/com_DDL_mysql.sql:682`, `script/ddl/mysql/com_DDL_mysql.sql:1263`, `script/ddl/mysql/com_DDL_mysql.sql:1882`, `script/ddl/mysql/com_DDL_mysql.sql:2904`, `script/ddl/mysql/com_DDL_mysql.sql:3287`)
- notice-and-count-semantics / CONFIRMED: 목록/공지의 사용자뷰와 댓글 집계 JOIN, 건수 SQL의 댓글 집계 제외를 확인했다. 공지는 NOTICE_AT=Y/USE_AT=Y/LIMIT 5다. 5개 본흐름 statement는 SELECT이며 include와 writes가 없다. (`src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:246`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:404`)
- auth-helper-internal-getAuthenticatedUser / CONFIRMED: 공통 Helper#getAuthenticatedUser → 기본 security 서비스#getAuthenticatedUser의 설정·위임을 보충 근거로만 기록한다. Helper 내부는 연결 점수에서 제외한다. (`src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:27`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:34`, `src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:36`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:42`, `src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:34`)
- auth-helper-internal-isAuthenticated / CONFIRMED: 공통 Helper#isAuthenticated → 기본 security 서비스#isAuthenticated의 설정·위임을 보충 근거로만 기록한다. Helper 내부는 연결 점수에서 제외한다. (`src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:27`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:34`, `src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:36`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:59`, `src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:61`)
- preview-and-scope / CONFIRMED: preview=true 분기는 조회/페이징 함수가 비어 있다. otherwise에서만 요청 코드가 있으며 상세·등록 링크의 SQL과 조회수 UPDATE는 목록 본흐름에서 제외한다. (`src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:34`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:76`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:84`, `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:125`)
- unrepaired-static-gaps / CONFIRMED: v2는 Controller의 인증 Helper 두 호출과 마스터 Service의 ComponentChecker 호출을 소스 기반 CONFIRMED로 연결한다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:151`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:153`, `src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:69`)

## 숨은 경로 확인

- interceptor: UNRESOLVED — 기본 locale/web-log 선언은 확인했다. dummy 전용 AuthenticInterceptor의 활성 프로필·실행 순서는 미확정이다. 조건부 후보는 LIKELY와 이유를 유지하며 무조건 활성/제외로 확정하지 않는다. (`src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:44`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-interceptor.xml:19`, `src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:43`)
- filter: CONFIRMED — Java initializer가 인코딩·security 조건·multipart·HTMLTag·session timeout 필터를 등록한다. 내부실행은 미검증이다. (`src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:66`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:98`, `src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:149`)
- aop: CONFIRMED — transaction REQUIRED/Exception rollback, syslog/개인정보/예외 AOP 선언을 확인했다. 조건부 로그의 DB 접근을 본 업무 SQL과 합산하지 않는다. (`src/main/resources/egovframework/spring/com/context-transaction.xml:13`, `src/main/resources/egovframework/spring/com/context-syslogaop.xml:19`, `src/main/resources/egovframework/spring/com/context-privacylogaop.xml:24`, `src/main/resources/egovframework/spring/com/context-aspect.xml:8`)
- paging: CONFIRMED — 외부 PropertyService 호출→PaginationInfo 설정→LIMIT/OFFSET. 외부 계산 내부는 미검증이다. (`src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171`, `src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:180`, `src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:242`)
- common-code: CONFIRMED — 마스터 SQL 내부의 COMTCCMMNDETAILCODE JOIN이며 별도 공통코드 Service 호출과 구별한다. (`src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:171`)
- exception: CONFIRMED — Service after-throwing AOP와 MVC 예외별 view mapping이 있다. 실제 예외 발생·응답은 실행하지 않았다. (`src/main/resources/egovframework/spring/com/context-aspect.xml:8`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:63`)

## 확정 못 한 경로

- egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList → external-injection:src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172: UNRESOLVED — 주입 필드의 호출 대상 구현이 소스 범위에 없음
- 실제 앱·HTTP·DB 실행은 하지 않았다. 정적 소스 증거 2단계이며 외부 라이브러리·조건 참/거짓·서버 override는 미확정이다.
- v2는 승인된 사례를 본 뒤 일반 결함을 고친 확인 결과다. 일반화 성능으로 해석하지 않는다.
- 동적 Java profile 계산·복잡한 overload/가변인자·동적 URL/테이블은 자동 확정하지 않는다.

## 실행 방식

complex / parallel. 동일 모델의 화면/서버/SQL 탐색자가 초기 v2와 최종 v2-final 골격·원문을 실제 병렬 재확인했다.

## 다음 확인

- 자동 활성화 미실행 두 질문은 docs/manual-checks.md 절차로 확인한다.
- 학습 정답과 새 인증 Helper 호출의 차이는 source 근거와 함께 별도로 검토한다.
