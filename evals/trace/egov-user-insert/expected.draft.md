# 업무사용자 등록 — held-out 정답 초안

미승인 초안이다. AI의 분석은 PL/PM 승인이나 고객 검수 완료가 아니다. 사례 실행·채점은 하지 않았다.

- 소스 revision: `2303751d76c119b56dc2e6b6fe1002adafbef938`
- 소스 루트: `.testbeds/egovframe`
- 분리: M1 학습 5건과 별도의 사용자 지정 held-out
- GATE: 사용자 승인 후 첫 실행의 원본 점수를 수정 전 점수로 보존한다. 승인 전 사례 맞춤 수정 금지.

## 범위와 읽는 방법

- 이 초안은 원문 소스에서 작성했으며 이 사례에 대해 인덱서/si-trace/채점기를 실행하지 않았다. 승인 전 정답 확정 또는 사례 맞춤 구현 수정 금지.
- 요청은 form의 POST지만 Controller @RequestMapping은 HTTP method를 제한하지 않아 endpoint 선택자는 ANY다.
- scope의 Controller/Service calls는 업무 서비스, 로컬 static 유틸, 주입된 외부 서비스 호출을 포함한다. 단순 VO getter/setter 및 JDK/Servlet/Spring Model/BindingResult의 일반 API 호출은 제외한다.
- 인증 helper, 암호화/문자열 유틸의 호출까지만 연결 점수 범위이며 유틸 내부 JDK/보안 라이브러리까지 확장하지 않는다. 실제 소스로 확인한 유틸 동작과 한계는 supplemental_assertions에서 따로 검토한다.
- forward/view, 검증 분기 및 ID 생성기 설정은 현 그래프 연결 종류로 표현하지 않고 supplemental_assertions에 남긴다. 이 부분은 연결 점수에 섞지 않고 별도 수동 검토한다.
- 등록 준비·사용자 ID 중복확인 AJAX·인증서 팝업·목록 버튼·후속 목록 내부·공통 보안 필터/트랜잭션은 이 저장 경로의 채점 scope 밖이다.
- SQL은 COMTNEMPLYRINFO에 INSERT한다. ID 생성기 설정의 COMTECOPSEQ를 이 INSERT SQL이 직접 읽거나 쓰는 테이블로 합치지 않는다.

## 소스에서 작성한 연결 11건

| 출발 | 관계 | 도착 | 상태 | 근거 |
|---|---|---|---|---|
| src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp | requests | ANY /uss/umt/EgovUserInsert.do | CONFIRMED | `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:209`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:159`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:166`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:182` |
| ANY /uss/umt/EgovUserInsert.do | maps_to | egovframework.com.uss.umt.web.EgovUserManageController#insertUser | CONFIRMED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:182`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:183` |
| egovframework.com.uss.umt.web.EgovUserManageController#insertUser | calls | egovframework.com.cmm.util.EgovUserDetailsHelper#isAuthenticated | CONFIRMED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:27`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:186`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:59` |
| egovframework.com.uss.umt.web.EgovUserManageController#insertUser | calls | unknown:external-injection | UNRESOLVED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:75`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:76`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191`<br>DefaultBeanValidator.validate는 주입된 외부 라이브러리 호출이다. 저장소 src/main/java에 구현 소스가 없어 검증 내부 경로를 확정하지 않는다. |
| egovframework.com.uss.umt.web.EgovUserManageController#insertUser | calls | egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser | CONFIRMED | `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:60`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:201`, `src/main/java/egovframework/com/uss/umt/service/EgovUserManageService.java:45`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:36`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:37`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:96` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser | calls | unknown:external-injection | UNRESOLVED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:52`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:53`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:5`<br>getNextStringId 호출 및 egovUsrCnfrmIdGnrService의 외부 EgovTableIdGnrServiceImpl 설정은 확인되지만 구현 소스가 없다. 내부 SQL과 실제 ID 발급 결과는 미확정이다. |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser | calls | egovframework.com.utl.sim.service.EgovFileScrty#encryptPassword | CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:9`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:101`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:198`, `src/main/java/egovframework/com/uss/umt/service/UserManageVO.java:496`, `src/main/java/egovframework/com/uss/umt/service/UserManageVO.java:286` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser | calls | egovframework.com.utl.fcc.service.EgovStringUtil#isNullToString | CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:8`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:101`, `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:371` |
| egovframework.com.uss.umt.service.impl.EgovUserManageServiceImpl#insertUser | calls | egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser | CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:40`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:41`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:103`, `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:29`, `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:55` |
| egovframework.com.uss.umt.service.impl.UserManageDAO#insertUser | executes | userManageDAO.insertUser_S | CONFIRMED | `src/main/java/egovframework/com/uss/umt/service/impl/UserManageDAO.java:56`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:65`, `src/main/java/egovframework/com/cmm/service/impl/EgovComAbstractDAO.java:67`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:4`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:74`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/egovProps/globals.properties:20`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12` |
| userManageDAO.insertUser_S | writes | COMTNEMPLYRINFO | CONFIRMED | `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:74`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:76`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:105`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:106` |

## 그래프 밖의 별도 검토 항목

### submit-condition — CONFIRMED

POST form의 fnInsert는 사용자 확인, validateUserManageVO, 두 비밀번호 일치 확인 후 form.submit을 호출한다. 사용자 입력/검증의 실제 통과 여부는 미실행이다.

근거: `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:159`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:160`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:161`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:162`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:166`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:209`, `src/main/webapp/WEB-INF/jsp/egovframework/com/uss/umt/EgovUserInsert.jsp:474`

### authentication-and-validation-branches — CONFIRMED

insertUser는 인증 실패 시 index view, binding 오류 시 등록 view를 반환한다. 서비스 등록은 인증/검증 통과 경로에서만 도달한다. 빈 조직/그룹 ID는 null로 정규화한다.

근거: `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:186`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:188`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:191`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:193`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:195`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:198`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:201`

### auth-helper-boundary — UNRESOLVED

로컬 static 인증 helper는 egovUserDetailsService에 위임한다. 본 사례 범위는 helper 호출과 등록 성공/실패 분기까지이며 인증 백엔드 선택 및 런타임 인증값은 별도 확인 대상이다.

인증 helper의 하위 보안 서비스 전체는 등록 저장 경로 범위에서 제외하며 실제 인증 상태를 실행하지 않았다.

근거: `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:27`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:33`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:34`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:58`, `src/main/java/egovframework/com/cmm/util/EgovUserDetailsHelper.java:59`

### id-generation-config — CONFIRMED

고유 ID는 외부 테이블형 ID 생성기에서 받는다. 설정은 table COMTECOPSEQ, tableName USRCNFRM_ID, blockSize 10, prefix USRCNFRM_, cipers 11, fillChar 0이다. 이 설정을 Oracle 시퀀스 또는 확인된 SQL 실행으로 바꾸어 표현하지 않는다.

근거: `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:99`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:5`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:8`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:9`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:10`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:13`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:14`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:15`

### id-generator-sql-boundary — UNRESOLVED

COMTECOPSEQ는 생성기 설정상 대상 후보이며 본 소스만으로 실제 SELECT/UPDATE SQL, 락 방식, 호출마다 DB 접근 여부를 확정하지 않는다. 생성기→SQL→COMTECOPSEQ의 executes/reads/writes 정답 연결을 만들지 않는다.

외부 EgovIdGnrService/EgovTableIdGnrServiceImpl 구현 소스가 src/main/java 파일 목록에 없다.

근거: `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:98`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:5`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:8`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:9`, `src/main/resources/egovframework/spring/com/idgn/context-idgn-UsrCnfrm.xml:10`

### password-transform — CONFIRMED

서비스는 비밀번호와 null을 빈 문자열로 바꾸는 사용자 ID를 encryptPassword(String,String)에 전달한다. 로컬 구현은 SHA-256 MessageDigest에 ID bytes를 먼저 넣고 비밀번호를 digest한 뒤 Base64로 반환한다. 실제 비밀번호·해시 값은 출력/실행하지 않는다.

근거: `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:101`, `src/main/java/egovframework/com/uss/umt/service/impl/EgovUserManageServiceImpl.java:102`, `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:371`, `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:374`, `src/main/java/egovframework/com/utl/fcc/service/EgovStringUtil.java:375`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:198`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:205`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:208`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:210`, `src/main/java/egovframework/com/utl/sim/service/EgovFileScrty.java:212`

### mysql-selection — CONFIRMED

PropertyPlaceholderConfigurer의 globals.properties와 Globals.DbType=mysql을 mapperLocations의 *_${Globals.DbType}.xml에 적용해 mysql XML을 선택한다. 다른 DB XML은 비선택 후보이고 executes 정답에 포함하지 않는다. 외부 배포 설정 재정의는 미확인이다.

근거: `src/main/resources/egovframework/spring/com/context-datasource.xml:9`, `src/main/resources/egovframework/spring/com/context-datasource.xml:12`, `src/main/resources/egovframework/spring/com/context-mapper.xml:13`, `src/main/resources/egovframework/spring/com/context-mapper.xml:15`, `src/main/resources/egovframework/egovProps/globals.properties:20`, `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_mysql.xml:74`

### success-forward — CONFIRMED

서비스 호출이 예외 없이 끝나면 resultMsg를 설정하고 forward:/uss/umt/EgovUserManage.do를 반환한다. 도착 URL까지만 범위에 넣으며 목록 처리 내부는 제외한다. 현 연결 종류에 forward/view가 없어 supplemental assertion으로 유지한다.

근거: `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:201`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:203`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:205`, `src/main/java/egovframework/com/uss/umt/web/EgovUserManageController.java:86`

## 비선택 Mapper 후보

- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_altibase.xml`
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_cubrid.xml`
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_goldilocks.xml`
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_maria.xml`
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_oracle.xml`
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_postgres.xml`
- `src/main/resources/egovframework/mapper/com/uss/umt/EgovUserManage_SQL_tibero.xml`

## 소스 무결성

JSON의 source_files에 근거 파일 15개의 원본 바이트 SHA-256을 기록했다. 모든 근거의 파일 존재·라인 범위를 작성 중 검사했다. 전체 파일 내용을 산출물에 복사하지 않았다.
