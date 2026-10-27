# 사용자 ID 중복확인 AJAX — held-out 정답 초안

AI의 분석 결과는 PL/PM 승인이나 고객 검수 완료가 아니다. **DRAFT / 사용자 승인 대기**. 인덱서·si-trace·eval을 실행하거나 출력을 참조하지 않고 원문에서 작성했다.

- 고정 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`
- 소스: `.testbeds/egovframe`
- M1 학습 5건과 분리된 held-out 사례. 승인 전 채점·사례 맞춤 수정 금지.

## 흐름과 범위

사용자가 중복 조회 또는 확인을 누르면 checkId를 POST한다. Controller는 같은 ID를 Service→DAO로 넘기고 mysql SQL은 업무사용자·기업회원·일반회원 세 테이블의 ID 중복 건수를 센다. 반환은 JSP가 아니라 jsonView JSON이다.

- 이 초안은 승인 전 정답이 아니며 첫 실행/점수 측정은 사용자 승인 뒤에 한다.
- 17개 edge scope: 5개 JSP의 두 AJAX 함수 requests 10개, endpoint maps_to 1개, 업무 Service/DAO calls 2개, mysql executes 1개, 물리 테이블 reads 3개. 나머지 화면 이벤트·외부 프레임워크 호출·공통 보안 경로는 이 연결 점수의 범위 밖이다.
- 응답 뷰/응답 데이터/역방향 JSP 집합은 supplemental_assertions 및 reverse_expectation으로 별도 판정한다. 스키마에 없는 returns_view/redirect 종류를 만들지 않는다.
- mysql 선택은 mapperLocations 및 등록된 properties의 Globals.DbType에 근거한다. 다른 DB 후보는 실행 정답에서 제외한다. 실제 배포 환경의 override는 미검증이다.

## 연결 정답 초안 (17개)

1. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_check` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:86`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:88`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:89`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
2. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp#fn_id_checkOk` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:112`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:114`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:115`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
3. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp#fn_id_check` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:85`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:87`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:88`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
4. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp#fn_id_checkOk` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:112`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:114`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:115`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
5. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp#fn_id_check` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:85`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:87`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:88`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
6. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp#fn_id_checkOk` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:112`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:114`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:115`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
7. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp#fn_id_check` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:89`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:91`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:92`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
8. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp#fn_id_checkOk` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:115`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:117`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:118`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
9. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp#fn_id_check` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:90`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:92`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:93`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
10. **CONFIRMED** `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp#fn_id_checkOk` —requests→ `ANY /uss/umt/EgovIdDplctCnfirmAjax.do`
   - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:116`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:118`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:119`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`
11. **CONFIRMED** `ANY /uss/umt/EgovIdDplctCnfirmAjax.do` —maps_to→ `egovframework.com.uss.umt.web.EgovUserManageController#checkIdDplctAjax`
   - 근거: `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:403`
12. **CONFIRMED** `egovframework.com.uss.umt.web.EgovUserManageController#checkIdDplctAjax` —calls→ `egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#checkIdDplct`
   - 근거: `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:60`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:61`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:411`, `src/main/java/egovframework/com/uss/umt/service/EgovUserManageService.java:31`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:36`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:37`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:62`
13. **CONFIRMED** `egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#checkIdDplct` —calls→ `egovframework.com.uss.umt.service.impl.UserManageDAO#checkIdDplct`
   - 근거: `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:40`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:41`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:63`, `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:29`, `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:37`
14. **CONFIRMED** `egovframework.com.uss.umt.service.impl.UserManageDAO#checkIdDplct` —executes→ `userManageDAO.checkIdDplct_S`
   - 근거: `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:38`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:160`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:162`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:38`, `src/main/resources/egovframework/spring/com/context-mapper.xml:9`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/egovProps/globals.properties:20`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:261`
15. **CONFIRMED** `userManageDAO.checkIdDplct_S` —reads→ `COMTNEMPLYRINFO`
   - 근거: `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:261`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:267`
16. **CONFIRMED** `userManageDAO.checkIdDplct_S` —reads→ `COMTNENTRPRSMBER`
   - 근거: `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:261`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:271`
17. **CONFIRMED** `userManageDAO.checkIdDplct_S` —reads→ `COMTNGNRLMBER`
   - 근거: `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:261`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:275`

## 역방향 호출 JSP 정답

`--to /uss/umt/EgovIdDplctCnfirmAjax.do`는 승인 이후에만 실행한다. 아래는 소스 검색으로 찾은 5개 JSP/10개 함수이며 임의 동적 URL 구성과 외부 호출자는 범위 밖이다.

- `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp`: `fn_id_check`, `fn_id_checkOk`, POST. `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:86`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:89`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:112`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:115`
- `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp`: `fn_id_check`, `fn_id_checkOk`, POST. `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:85`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:88`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:112`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberSbscrb.jsp:115`
- `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp`: `fn_id_check`, `fn_id_checkOk`, POST. `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:85`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:88`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:112`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovMberInsert.jsp:115`
- `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp`: `fn_id_check`, `fn_id_checkOk`, POST. `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:89`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:92`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:115`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberSbscrb.jsp:118`
- `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp`: `fn_id_check`, `fn_id_checkOk`, POST. `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:90`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:93`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:116`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovEntrprsMberInsert.jsp:119`

## 보충 판정 (연결 점수와 분리)

- **CONFIRMED / response-json-view**: checkIdDplctAjax는 ModelAndView의 viewName을 jsonView로 지정하고 usedCnt/checkId를 모델에 넣어 반환한다. BeanNameViewResolver 우선순위 0과 jsonView MappingJackson2JsonView 빈이 application/json;charset=UTF-8 응답을 선언한다. 주석의 JSP 경로를 응답 뷰로 사용하지 않는다.
  - 근거: `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:399`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:405`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:406`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:412`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:413`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:415`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:78`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:84`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:85`
- **CONFIRMED / request-response-contract**: 화면의 AJAX는 POST/checkId를 보내고 JSON usedCnt와 checkId를 소비한다. 서버 @RequestMapping은 method 제한이 없어 endpoint 표시는 ANY다. usedCnt>0이면 중복이고, 확인 함수의 사용 가능 분기는 입력 ID를 채우고 모달을 닫는다.
  - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:88`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:91`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:93`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:97`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:128`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:129`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:402`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:408`
- **CONFIRMED / union-count-semantics**: mysql checkIdDplct_S는 업무사용자/기업회원/일반회원의 ID를 UNION ALL 한 뒤 checkId와 일치하는 건수를 센다. 파생 테이블 별칭 A는 물리 테이블 정답이 아니다. 쓰기 SQL이 아니다.
  - 근거: `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:263`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:267`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:268`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:271`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:272`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:275`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:276`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:277`
- **CONFIRMED / placeholder-anchor**: EgovUserInsert.jsp 모달 footer의 href="#"는 서버 endpoint 요청이 아니다. 조회/확인 동작은 외곽 onclick의 fn_id_check/fn_id_checkOk AJAX에서 발생한다. 주석 처리된 기존 버튼도 별도 실행 경로가 아니다.
  - 근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:66`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:67`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:68`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:69`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:89`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:115`
- **UNRESOLVED / framework-internals**: ModelAndView/BeanNameViewResolver/MappingJackson2JsonView/EgovAbstractMapper의 외부 라이브러리 내부 구현·실행은 이 저장소 src/main 소스 범위에서 확인하지 않았다. 빈 선언과 호출 계약 이상을 확정하지 않는다. 이유: src/main 파일명 검색에서 해당 클래스의 Java 소스가 없었다. 런타임 classpath·빈 override·HTTP 응답 실측·DB 연결은 확인하지 않았다.
  - 근거: `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:405`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:78`, `src/main/webapp/WEB-INF/config/egovframework/springmvc/egov-com-servlet.xml:84`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:16`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:34`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:162`

## DB 후보

`context-mapper.xml:15` + `context-datasource.xml:12` + `globals.properties:20`으로 mysql을 선택한다. 아래는 실행 연결이 아닌 후보다.

- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_altibase.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_altibase.xml:244` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_cubrid.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_cubrid.xml:244` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_goldilocks.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_goldilocks.xml:244` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_maria.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_maria.xml:261` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_oracle.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_oracle.xml:244` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_postgres.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_postgres.xml:257` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_tibero.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_tibero.xml:244` — Globals.DbType=mysql에 선택되지 않은 다른 DB 후보. 실행 연결 정답에 포함하지 않는다.

## 검증과 한계

JSON source_files에 모든 근거 파일 22개의 SHA-256을 기록하고 근거 라인 범위를 확인했다. 이 검사는 source-only 정답 무결성 확인이며 분석기 실행 결과나 eval 점수가 아니다. 실제 브라우저·HTTP·DB 동작은 검증하지 않았다.
