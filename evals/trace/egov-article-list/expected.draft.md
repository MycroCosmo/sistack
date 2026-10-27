# 게시글 목록 held-out 정답 초안

AI의 분석 결과는 PL/PM 승인이나 고객 검수 완료가 아니다. **사용자 승인 대기 / 미채점**.

## 범위와 작성 통제

소스 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`
시작: `src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:108` → POST `/cop/bbs/selectArticleList.do` → `EgovArticleController#selectArticleList`.

- 소스만 읽어 작성했다. 이 사례 인덱스·trace 출력 미열람/미실행, 미채점. 사용자 승인 전 구현 변경 금지. 승인 후 최초 실행 원본 점수 보존.
- CONFIRMED는 소스상 연결이다. 조건부 경로의 매 요청 실행을 뜻하지 않는다. 인증 실패·방명록·정상 흐름을 분리한다.
- graph 비교는 JSP 목록 form 108행, 명시한 메서드의 calls 호출 위치, DAO executes, mysql SQL reads/writes/includes/resultMap이다. 외부 라이브러리 내부·런타임 조건·forward/view·VIEW 내부 확장은 supplemental_assertions로 별도 보고하고 점수에 합산하지 않는다.
- Controller 이전 필터/인터셉터/AOP, DTO getter/setter/컬렉션/표준 라이브러리 내부, 다른 JSP 버튼 상세·등록·수정·삭제, forward/redirect 도착 URL 이후는 제외한다. 목록에 조회수 UPDATE를 섞지 않는다.
- mapperLocations + Globals.DbType=mysql, Globals.Auth=security와 listener/profile 설정으로 저장소 기본값을 확인한다. 운영 DB/서버·런타임 override·실제 실행은 미검증.
- COMVNUSERMASTER는 VIEW다. 스키마의 table/view 공통 이름으로 SQL→VIEW를 비교하고 mysql DDL/기반 테이블은 별도 보충한다.

## 핵심 흐름

인증 실패는 로그인 URL에서 끝낸다. 인증 통과 후 게시판 마스터와 조건부 추가 옵션을 조회한다. 방명록이면 방명록 URL에서 끝낸다. 일반 게시판은 목록·건수·공지 목록을 조회하여 화면 모델에 담는다. 등록·삭제·조회수 UPDATE와 혼동하지 않는다.

## graph 비교 연결 39건

| # | 시작 | 관계 | 도착 | 상태 | 근거 |
|---|---|---|---|---|---|
| 1 | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp | requests | ANY /cop/bbs/selectArticleList.do | CONFIRMED | src/main/webapp/WEB-INF/jsp/egovframework/com/cop/bbs/EgovArticleList.jsp:108, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149 |
| 2 | ANY /cop/bbs/selectArticleList.do | maps_to | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:149, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:150 |
| 3 | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | calls | egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf | CONFIRMED | src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:163, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:80, src/main/java/egovframework/com/cop/bbs/service/EgovBBSMasterService.java:16, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:23, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:64 |
| 4 | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | calls | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:184, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:77, src/main/java/egovframework/com/cop/bbs/service/EgovArticleService.java:10, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:22, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:38 |
| 5 | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | calls | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:188, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:77, src/main/java/egovframework/com/cop/bbs/service/EgovArticleService.java:20, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:22, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:125 |
| 6 | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | calls | egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser | CONFIRMED | src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:151, src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:41 |
| 7 | egovframework.com.cop.bbs.web.EgovArticleController#selectArticleList | calls | egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated | CONFIRMED | src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:153, src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58 |
| 8 | egovframework.com.cmm.util.EgovUserDetailsHelper#getAuthenticatedUser | calls | egovframework.com.sec.ram.service.impl.EgovUserDetailsSecurityServiceImpl#getAuthenticatedUser | CONFIRMED | src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:42, src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:33, src/main/java/egovframework/com/cmm/service/EgovUserDetailsService.java:11, src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:34, src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:36, src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:38, src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:41, src/main/resources/egovframework/egovProps/globals.properties:26, src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58, src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:61, src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:76 |
| 9 | egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated | calls | egovframework.com.sec.ram.service.impl.EgovUserDetailsSecurityServiceImpl#isAuthenticated | CONFIRMED | src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:59, src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:33, src/main/java/egovframework/com/cmm/service/EgovUserDetailsService.java:24, src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:61, src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:36, src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:38, src/main/resources/egovframework/spring/com/context-egovuserdetailshelper.xml:41, src/main/resources/egovframework/egovProps/globals.properties:26, src/main/java/egovframework/com/cmm/context/EgovWebServletContextListener.java:58, src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:61, src/main/java/egovframework/com/cmm/config/EgovWebApplicationInitializer.java:76 |
| 10 | egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf | calls | egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:65, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:26, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterDAO.java:14, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterDAO.java:25 |
| 11 | egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf | calls | egovframework.com.cmm.EgovComponentChecker#hasComponent | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:69, src/main/java/egovframework/com/cmm/EgovComponentChecker.java:48 |
| 12 | egovframework.com.cop.bbs.service.impl.EgovBBSMasterServiceImpl#selectBBSMasterInf | calls | egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:70, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:69, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:35, src/main/java/egovframework/com/cop/bbs/service/impl/BBSAddedOptionsDAO.java:25, src/main/java/egovframework/com/cop/bbs/service/impl/BBSAddedOptionsDAO.java:42 |
| 13 | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList | calls | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:39, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:25, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:12, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:15 |
| 14 | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectArticleList | calls | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:42, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:25, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:12, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:19 |
| 15 | egovframework.com.cop.bbs.service.impl.EgovArticleServiceImpl#selectNoticeArticleList | calls | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:126, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleServiceImpl.java:25, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:12, src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:52 |
| 16 | egovframework.com.cop.bbs.service.impl.EgovBBSMasterDAO#selectBBSMasterDetail | executes | BBSMaster.selectBBSMasterDetail | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterDAO.java:26, src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:156, src/main/resources/egovframework/spring/com/context-mapper.xml:15, src/main/resources/egovframework/spring/com/context-datasource.xml:12, src/main/resources/egovframework/egovProps/globals.properties:20, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:34, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:38 |
| 17 | BBSMaster.selectBBSMasterDetail | reads | COMTNBBSUSE | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:164 |
| 18 | BBSMaster.selectBBSMasterDetail | reads | COMTNBBSMASTER | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:169 |
| 19 | BBSMaster.selectBBSMasterDetail | reads | COMTCCMMNDETAILCODE | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:171 |
| 20 | BBSMaster.selectBBSMasterDetail | reads | COMTNTMPLATINFO | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:173 |
| 21 | BBSMaster.selectBBSMasterDetail | reads | COMVNUSERMASTER | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:175 |
| 22 | BBSMaster.selectBBSMasterDetail | maps_to | BBSMaster.boardMasterDetail | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:156, src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_mysql.xml:20 |
| 23 | egovframework.com.cop.bbs.service.impl.BBSAddedOptionsDAO#selectAddedOptionsInf | executes | BBSAddedOptions.selectAddedOptionsInf | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/BBSAddedOptionsDAO.java:43, src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:38, src/main/resources/egovframework/spring/com/context-mapper.xml:15, src/main/resources/egovframework/spring/com/context-datasource.xml:12, src/main/resources/egovframework/egovProps/globals.properties:20, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:34, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:38 |
| 24 | BBSAddedOptions.selectAddedOptionsInf | reads | COMTNBBSMASTEROPTN | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:45 |
| 25 | BBSAddedOptions.selectAddedOptionsInf | reads | COMVNUSERMASTER | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:46 |
| 26 | BBSAddedOptions.selectAddedOptionsInf | maps_to | BBSAddedOptions.boardMasterDetail | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:38, src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_mysql.xml:6 |
| 27 | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleList | executes | BBSArticle.selectArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:16, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208, src/main/resources/egovframework/spring/com/context-mapper.xml:15, src/main/resources/egovframework/spring/com/context-datasource.xml:12, src/main/resources/egovframework/egovProps/globals.properties:20, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:34, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:38 |
| 28 | BBSArticle.selectArticleList | reads | COMTNBBS | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:216 |
| 29 | BBSArticle.selectArticleList | reads | COMVNUSERMASTER | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:218 |
| 30 | BBSArticle.selectArticleList | reads | COMTNCOMMENT | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:222 |
| 31 | BBSArticle.selectArticleList | maps_to | BBSArticle.boardList | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:10 |
| 32 | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectArticleListCnt | executes | BBSArticle.selectArticleListCnt | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:20, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:246, src/main/resources/egovframework/spring/com/context-mapper.xml:15, src/main/resources/egovframework/spring/com/context-datasource.xml:12, src/main/resources/egovframework/egovProps/globals.properties:20, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:34, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:38 |
| 33 | BBSArticle.selectArticleListCnt | reads | COMTNBBS | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:251 |
| 34 | BBSArticle.selectArticleListCnt | reads | COMVNUSERMASTER | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:253 |
| 35 | egovframework.com.cop.bbs.service.impl.EgovArticleDAO#selectNoticeArticleList | executes | BBSArticle.selectNoticeArticleList | CONFIRMED | src/main/java/egovframework/com/cop/bbs/service/impl/EgovArticleDAO.java:53, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379, src/main/resources/egovframework/spring/com/context-mapper.xml:15, src/main/resources/egovframework/spring/com/context-datasource.xml:12, src/main/resources/egovframework/egovProps/globals.properties:20, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:34, src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:38 |
| 36 | BBSArticle.selectNoticeArticleList | reads | COMTNBBS | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:387 |
| 37 | BBSArticle.selectNoticeArticleList | reads | COMVNUSERMASTER | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:389 |
| 38 | BBSArticle.selectNoticeArticleList | reads | COMTNCOMMENT | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:393 |
| 39 | BBSArticle.selectNoticeArticleList | maps_to | BBSArticle.boardList | CONFIRMED | src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:10 |

## graph 점수와 별도인 보충 정답

### redirect-unauthenticated — CONFIRMED

인증 실패 시 redirect:/uat/uia/egovLoginUsr.do. 도착 URL 이후 로그인 흐름 제외.

근거: src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:153, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:155, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:156

### forward-guest-board — CONFIRMED

게시판 유형 BBST03이면 forward:/cop/bbs/selectGuestArticleList.do. 도착 URL 이후 제외.

근거: src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:163, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:166, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:167

### view-and-model — CONFIRMED

기본 view egovframework/com/cop/bbs/EgovArticleList. resultList/resultCnt/articleVO/boardMasterVO/paginationInfo/noticeList를 모델에 넣는다.

근거: src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:204, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:205, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:206, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:207, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:208, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:209, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:210

### property-service-boundary — UNRESOLVED

propertiesService.getInt(pageUnit/pageSize) 호출과 기본 설정 10은 확인. 내부 구현은 미확정.

EgovPropertyServiceImpl 구현 소스가 대상 src/main/java에 없다. 외부 라이브러리 내부를 graph 점수에서 제외하고 미확정 경계로 기록.

근거: src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:89, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:171, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:172, src/main/resources/egovframework/spring/com/context-properties.xml:5, src/main/resources/egovframework/spring/com/context-properties.xml:8, src/main/resources/egovframework/spring/com/context-properties.xml:9

### pagination-boundary — UNRESOLVED

PaginationInfo 생성 후 first/last/recordCountPerPage를 boardVO에 설정하며 목록 SQL은 LIMIT/OFFSET 사용.

외부 PaginationInfo 구현 소스 부재. 내부 계산/실제 결과 미검증.

근거: src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:174, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:176, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:180, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:181, src/main/java/egovframework/com/cop/bbs/web/EgovArticleController.java:182, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:242

### no-master-exception — UNRESOLVED

마스터 조회가 null이면 상속 processException(info.nodata.msg)을 호출하여 throw.

EgovAbstractServiceImpl 소스 부재. 예외 생성 내부·후속 처리 확정 불가.

근거: src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:24, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:65, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:66, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:67

### security-library-boundary — UNRESOLVED

security 구현은 org.egovframe.rte.fdl.security.userdetails.util.EgovUserDetailsHelper에 위임한다. 로컬 동명 helper로 재귀 호출하는 것이 아니다.

외부 helper 소스 부재. 내부 서비스/DAO/SQL 유무·인증 결과 확정 불가.

근거: src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:8, src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:39, src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:40, src/main/java/egovframework/com/sec/ram/service/impl/EgovUserDetailsSecurityServiceImpl.java:62

### component-options-condition — UNRESOLVED

EgovBBSCommentService 또는 EgovBBSSatisfactionService 컴포넌트 존재 시 추가 옵션 조회. hasComponent는 context.getBean으로 조회.

소스상 호출은 CONFIRMED이나 실제 배포 context에서 조건의 참/거짓은 실행하지 않았다.

근거: src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:69, src/main/java/egovframework/com/cop/bbs/service/impl/EgovBBSMasterServiceImpl.java:70, src/main/java/egovframework/com/cmm/EgovComponentChecker.java:48, src/main/java/egovframework/com/cmm/EgovComponentChecker.java:51

### view-base-tables — CONFIRMED

COMVNUSERMASTER는 mysql VIEW이며 COMTNGNRLMBER, COMTNEMPLYRINFO, COMTNENTRPRSMBER의 UNION ALL이다. SQL→VIEW와 VIEW의 기반 테이블을 구분한다.

근거: script/ddl/mysql/com_DDL_mysql.sql:5050, script/ddl/mysql/com_DDL_mysql.sql:5053, script/ddl/mysql/com_DDL_mysql.sql:5057, script/ddl/mysql/com_DDL_mysql.sql:5060

### mysql-ddl-location — CONFIRMED

mysql 테이블 선언 근거. 다른 DB의 동명 DDL을 활성 DB 선언으로 오인하지 않는다.

근거: script/ddl/mysql/com_DDL_mysql.sql:598, script/ddl/mysql/com_DDL_mysql.sql:631, script/ddl/mysql/com_DDL_mysql.sql:682, script/ddl/mysql/com_DDL_mysql.sql:1263, script/ddl/mysql/com_DDL_mysql.sql:1882, script/ddl/mysql/com_DDL_mysql.sql:2904, script/ddl/mysql/com_DDL_mysql.sql:3287

### notice-and-count-semantics — CONFIRMED

목록은 사용자 view 및 댓글 집계 LEFT JOIN+페이징. 건수에는 댓글 집계가 없다. 공지는 NOTICE_AT=Y, USE_AT=Y, LIMIT 5. 다섯 statement는 SELECT이며 writes/include 없음.

근거: src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:208, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:222, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:242, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:246, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:251, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:253, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:379, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:400, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:401, src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_mysql.xml:404

## 다른 DB XML 후보

mysql만 설정에서 선택된다. 아래는 executes 근거가 아닌 후보다.

- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_altibase.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_cubrid.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_goldilocks.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_maria.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_oracle.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_postgres.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovArticle_SQL_tibero.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_altibase.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_cubrid.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_goldilocks.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_maria.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_oracle.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_postgres.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSAddedOptions_SQL_tibero.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_altibase.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_cubrid.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_goldilocks.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_maria.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_oracle.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_postgres.xml
- src/main/resources/egovframework/mapper/com/cop/bbs/EgovBBSMaster_SQL_tibero.xml

## 사용자 확인 필요

조건부 옵션·인증 profile·범위 제외·보충 정답 분리를 검토 후 승인해야 한다. 승인 전 구현 변경이나 채점 없이 GATE에서 멈춘다.

## 소스 해시

JSON source_files에 46개 SHA-256을 기록했다. 모든 근거 라인의 존재는 소스만으로 확인했다. 인덱스 비교·채점은 하지 않았다.
