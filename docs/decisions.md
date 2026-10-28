# 설계 결정

## 2026-10-28 — M4 기존 의존성·학습 평가·M5 입력 계약

- 사용자 조건을 `prompts/M4.md`에 반영해 `27f01a8`로 먼저 커밋했다. 두 테스트베드의 JUnit 4.13.2·Mockito 4.11.0·spring-test 5.3.39·H2 2.2.224(test)만 사용하며 pom과 운영 원본은 바꾸지 않는다. 생성 Java 테스트는 `evals/unit/generated/`에 보관하고 임시 사본에만 설치한다.
- Service/유틸 검사는 목 기반 단위 테스트, 실제 Mapper와 인메모리 H2 검사는 좁은 통합 테스트로 구분한다. M3 기존 13건은 모두 학습이다. 실행 전 분류에서 탐지 가능 4건, 웹·템플릿·설정·JS 범위 밖 8건, 실행 패치 없는 Oracle 1건 BLOCKED로 정했다. 학습을 새 held-out 성능으로 보고하지 않는다.
- 반환값·저장 상태를 검증하는 한국어 업무 테스트를 만들고, 같은 테스트를 결함 사본과 v5 수정안 적용 사본에서 실행한다. 기존 M3 heldout-02는 사람의 EQUIVALENT 판정과 실행 근거를 분리한다. private 소스·diff·실패 메시지를 공개하지 않는다.
- Surefire XML을 M5용 `test-results.json`으로 변환한다. 한국어 표시 이름과 대상 메서드는 실행 전 계획에 명시한다. 테스트 누락·중복·집계 불일치·빌드 오류·테스트 0건을 성공이나 탐지로 세지 않는다. 결과는 exclusive run-id로 보존하고 실제 JDK와 POM target을 구분한다. 단일 Maven POM만 자동 실행하며 상속/profile/Gradle/사용자 JVM 설정은 BLOCKED다.
- 초기 실행에서 SQL fixture의 기본 charset과 Surefire 경로 override가 문제였다. SQL에 UTF-8을 지정하고 매 실행을 새 작업 사본에서 수행해 기본 `target/surefire-reports`를 읽는다. 이전 결과를 삭제하거나 POM을 바꾸지 않는다. Surefire의 reportsDirectory/argLine 계약은 [공식 문서](https://maven.apache.org/surefire/maven-surefire-plugin/test-mojo.html#reportsDirectory)와 실제 3.2.5 실행으로 확인했다.
- 학습·약한 테스트 검증 후 구현·테스트·평가 도구를 동결하고 GATE에서 멈춘다. 신규 Claude 패치 3건은 동결 후 별도 지시로 원문을 출력하지 않고 실행한다. 첫 결과 경로를 고정하고 재실행으로 덮어쓰지 않는다. 외부 의존성 추가 없음.

## 2026-10-28 — M3 held-out 정합성 재판정·완료 승인

- Ian의 이번 종료 검토 지시로 정합성 비교 범위를 **제공된 project/에 존재하는 파일 + 제안 대상 파일**로 보정한다. 제공 사본에 없는 출제 원본 파일은 제외 목록에 남긴다. v5의 실행 산출물 디렉터리 제외와 CRLF/LF 정규화는 유지한다. 제공된 파일은 제안 대상이 아니어도 비교하며 원본에 없거나 내용이 다르면 차이로 남긴다.
- heldout-01·03의 기존 FAIL 원인은 출제자 Claude가 제공 project/ 사본에서 `smoke.mjs`, `README.md`를 제외한 **출제 패키징 오류**다. heldout-02에서도 제공하지 않은 `smoke.mjs`는 같은 규칙으로 제외한다. 제안 실패와 패키징 차이를 구별하며, 첫 결과와 v5 판정을 소급 변경하지 않는다.
- 새 정합성 판정은 **EXACT / EQUIVALENT / FAIL**이다. EXACT는 선언한 비교 범위에서 원본과 동일, EQUIVALENT는 원본과 다르지만 사람이 승인한 동등 수정, FAIL은 적용 불가 또는 승인되지 않은 차이다. EQUIVALENT는 자동 추론하지 않는다. 승인자·일시·사유·출처와 승인 대상 run-id·제안 해시·차이 파일 목록을 기록한다. 자동 비교 결과도 별도로 보존한다.
- **heldout-02: Ian 승인, 2026-10-28, 이번 사용자 지시 3항.** 명시 컬럼 투영과 성능 개선 의도를 유지하면서 결과 매핑과 일치시키는 유효한 수정이므로 EQUIVALENT로 기록한다. 사용자가 명시한 실제 별칭·매핑 식별자와 상세 사유는 private `human-approval.json`에 기록한다. 자동 비교 결과 FAIL을 숨기지 않는다.
- 기존 v5 비교기·진단·diff·위치 점수·학습 결과는 보존한다. 별도 `rejudge-debug-proposal.mjs`로 v5 제안만 임시 사본에 다시 적용하고 정합성만 재판정한다. 공개 결과는 EXACT 2/3·EQUIVALENT 1/3·FAIL 0/3이며, 일반화 성능 향상이나 런타임 검증 결과가 아니다.
- [별도 재판정 보고](m3-consistency-rejudgment-report.md)를 M3 완료 기록으로 삼는다. v5 종료 보고는 당시 PARTIAL 기록 그대로 둔다. 사용자 지시에 따라 M3를 완료 처리하고 M4는 시작하지 않는다. 의존성 추가 없음.

## 2026-10-28 — M3 진단 출력·수정안 정합성 v5

- 사용자 승인으로 사용자용 private report.md와 docs/ 공개 평가 보고서를 구분한다. 전자는 실제 필드명·별칭·모델 키·값 및 diff를 담는다. 후자는 held-out 위치·적중과 수정안 정합성만 공개한다. 개인정보·비밀값 마스킹은 모두 유지한다.
- 원인 후보의 identifiers를 필수로 받고 cause에 각 문자열이 그대로 있는지 검사한다. 실제 소스와 대조한 사실은 에이전트가 검토해야 하며 문자열 검사만으로 진실성을 보증하지 않는다. CONFIRMED/LIKELY의 빈 diff를 거부하고 모든 후보가 UNRESOLVED일 때만 보류를 허용한다.
- 진단/보고서 해시에 결합된 채점 기록이 있어야 수정안 정합성 평가를 시작한다. 제안은 OS 임시 복사본에만 적용한다. 학습은 같은 결함 소스에 bug.patch를 역적용한 결과, held-out은 출제 원본과 전체 파일 집합·내용을 비교한다. 체크아웃 CRLF/LF만 정규화하고 다른 공백·문자는 그대로 비교한다. 원본 비교로 진단을 생성하거나 실패한 제안을 정답에 맞춰 재작성하지 않는다.
- 위치 적중과 수정안 정합성을 독립 보고한다. Oracle UNRESOLVED는 수정안 정합성 성공으로 세지 않고 분모에서 제외한다. 정합성은 출제 원본 복원 검사이며 런타임·기능 검증을 대체하지 않는다.
- 첫 held-out 3/3과 private 원본, 학습 첫 8/10 및 v4 대응 10/10은 불변으로 보존한다. 후속 채점은 명시적 follow-up과 새 run-id를 요구하며 첫 실행 파일에 쓰지 않는다. 이미 관찰한 사례의 재검증이므로 새 held-out 일반화 점수라고 부르거나 첫 점수와 합산하지 않는다. 새 의존성은 없다.

## 2026-10-28 — M3 정답 정정·삭제형 범위·파서 v4

- 첫 8/10·위치 14/16 원본과 정답 원승인 records를 보존한다. 사용자 지시로 06의 승인 오류(초안이 getSort:67을 가리킴)를 getSortColumn 반환문:78로 정정하고 approval amendments에 사유·날짜·전후 해시/위치를 추가했다. 소스 결함 수정으로 점수가 오른 것으로 해석하지 않는다.
- 모든 승인 debug 위치에 enclosing을 필수로 넣는다. 기존 Java 메서드·XML 요소 파서를 재사용해 이름/속성으로 소속 구조를 찾고 그 안의 위치인지 확인한다. 이름이 같은 overload/요소는 추측하지 않는다. check-expected의 npm 전체 검사에도 패치 임시 복사본의 debug 정답을 포함한다.
- v4부터 동결 파일 목록에 승인된 학습 expected.json도 포함한다. 정답 승인 후 재동결하는 단계이므로 비교 도중 정답 메타데이터가 바뀌는 것도 차단한다. 비공개 held-out은 동결 목록에 넣거나 열람하지 않는다.
- 원인이 줄 삭제이면 존재하지 않는 줄 하나의 번호보다 소속 블록이 근거다. 이 경우에만 승인된 start..end(양 끝 포함) 안의 실제 진단 line을 일치로 처리한다. 04는 interceptor 9..13, 10은 첫 콘텐츠 앞 JSP 지시어 삽입 경계 1..1이다. 범위를 전체 파일로 느슨하게 바꾸지 않으며 enclosing 밖·다른 파일·상태 불일치·추가 위치는 실패한다. 일반 위치는 정확한 line 비교를 유지한다.
- MyBatis 반복 예외명으로 root가 늘고 프레임 소속이 바뀌는 실제 06 로그와 합성 회귀를 먼저 실패시켰다. 예외 헤더를 줄 시작에 한정해 Cause/nested-exception 메시지는 보존하면서 실제 Caused by·새 독립 스택만 파싱한다. 로그/SQL의 원문 자체는 마스킹 외 변경하지 않는다.
- 코드·지침·테스트·정답 정책 보정 후 새 v4 동결과 run-id로 대응 재검증한다. 첫 진단 위치를 유지하므로 정답/규칙 변화 효과를 분리할 수 있다. 원인 위치를 정답에서 복사해 재작성하거나 held-out을 먼저 열어 맞추지 않는다. 06 제안은 이미 검토한 메서드 문맥 포함 후속 diff를 사용하되 실제 소스에는 적용하지 않는다.

## 2026-10-28 — M3 마스킹 보정과 학습 첫 채점

- 사용자 승인 정답 10건을 expected.json과 approval-20261028.json에 고정했다. held-out은 사례 제공 후 별도 실행 지시를 기다린다.
- 새 실패 테스트 4개를 먼저 실행해 스레드 숫자의 과도한 마스킹과 홈 경로 노출을 확인했다. 세션·비밀번호·명시적 계좌 라벨을 우선 처리하고, 알려진 qtp/Tomcat/AJP/JEUS/WebLogic 스레드 이름을 숫자 개인정보 검사에서 제외한다. 임의 사용자 풀 이름의 의미를 추측해 모든 숫자를 허용하지 않는다.
- Windows 두 구분자·Linux /home·macOS /Users 홈 접두사를 ~/로 일반화하며 뒤쪽 파일 경로와 스택 프레임을 유지한다. 공통 마스킹과 모든 스킬 복사본에 적용했다.
- 이전 캡처의 qtp 숫자는 이미 가려져 복구할 수 없다. 입력 v3용 실제 실행 9건을 새로 수집하고 증상 로그 10건·출처 해시·마스킹 사본을 재생성했다. 07은 승인된 Oracle 합성 형식을 그대로 사용한다.
- 이전 동결과 증거를 보존하고 v3를 새로 동결한 뒤 첫 학습 채점을 수행한다. 진단은 로그/소스 검토로 작성하고 비교할 때만 승인 정답을 사용한다. 결과는 자기 작성 편향이 있는 학습 성능이며 일반화 성능이 아니다.

## 2026-10-27 — M3 입력 현실성 재GATE

- 사용자 검토에 따라 9건의 입력을 임시 테스트베드의 실제 서버 캡처로 교체했다. 공통 예외 처리기와 필터에 출력 계측만 추가하고 Jetty 내장 StdErrLog를 사용했다. 원본 테스트베드·의존성은 변경하지 않았다. 최초 Filter.init 누락 실패 기록은 보존했다.
- 05·10은 예외가 없으므로 접근 로그만 선택했다. 다른 실행 사례는 전체 스택·MyBatis SQL 블록·Spring 초기화·Jetty 줄을 보존한다. 로그의 공백을 포맷 수정하지 않도록 Git whitespace 검사 예외를 해당 캡처 파일에만 둔다.
- 합성 개인정보는 각 입력 중간의 표시된 한 줄뿐이다. 출처·선택 방법·해시·삽입 위치를 provenance로 고정하고, 마스킹 후 이 줄 외의 로그 전체와 진단 해시·트랜잭션 UUID 보존을 비교한다. 실제 개인정보를 넣지 않았다.
- Oracle은 DB 실행 없이 MyBatis PersistenceException → SQLSyntaxErrorException 형식을 재구성했다. 바인딩 SQL의 B.CREATED_AT 세 참조(기간 조건 23·26행, ORDER BY 34행)를 모두 UNRESOLVED 후보로 둔다. 하나만 고르거나 확정하면 비교기 FAIL임을 별도 합성 테스트로 검증한다.
- 현실 로그에서 발견한 파서의 ### Cause 오인과 Jetty의 줄 분리 Caused by 손실을 각각 실패 테스트로 확인한 뒤 수정했다. MyBatis 메시지는 원문에 유지하고 실제 예외 체인·프레임 소속만 올바르게 파싱한다.
- 이전 동결·첫 GATE·실행 증거를 유지하고 입력 v2 동결을 새 파일에 기록한다. 재GATE 전 실제 학습 채점·held-out 열람은 수행하지 않는다. 10건은 자기 작성 편향이 있는 학습 세트이며 일반화 성능이 아니다.

## 2026-10-27 — M3 si-debug 학습 사례·동결 경계

- M2.5 완료를 사용자가 승인했고 M3 시작 전 프롬프트를 10건·held-out 동결·마스킹 조건으로 보강해 `87adf55`로 커밋했다. 외부 의존성은 추가하지 않았다.
- si-debug는 로그 마스킹/Java 예외 체인 파서 → 기존 인덱서 직접 호출 → 소스 기반 후보 소거 → diff 제안의 읽기 전용 경로다. si-trace 실행에 의존하지 않으며 공유 IO를 포함한 공통 모듈·manifest 스키마를 복사해 단독 설치한다.
- 원인 확정은 로그 키워드 자동 분류로 대체하지 않는다. 제출된 원인 위치를 소스 해시·라인으로 검증하고 실행하지 않은 4~5단계는 거부한다. 재현 파일 존재 검사는 실제 실행의 진실성까지 증명하지 않으므로 에이전트가 명령·출력을 확인한다.
- 스택트레이스 회귀에서 JSESSIONID의 해시 값이 남는 실패를 먼저 확인했다. 세션 ID 라벨을 해시 보존보다 먼저 마스킹한다. 정상 클래스 해시와 트랜잭션 UUID는 유지하며 transactionId에 들어간 전화번호·명시적 account 값은 계속 가린다.
- 자체 10건은 자기 작성 편향이 있는 학습 세트다. 패치 9건은 지정 테스트베드의 OS 임시 복사본에만 적용한다. Oracle 로그 전용 1건은 빈 패치와 UNRESOLVED 후보로 두며 H2 재현으로 Oracle 원인을 단정하지 않는다.
- 패치 적용 전에 원본과 패치 해시를 확인하고, 적용 후 원본 해시 불변을 검사한다. Git autocrlf 영향은 임시 변경 파일의 LF 정규화로 제거한다. 원본 테스트베드와 승인된 기존 정답은 수정하지 않는다.
- 3번의 최초 필터 매핑 누락 패치는 Jetty의 기본 UTF-8 처리로 증상을 재현하지 못했다. FAIL 기록을 보존하고 요청 encoding=ISO-8859-1 오설정으로 보강했다. 같은 정상본은 한글 일치, 패치본은 불일치를 확인했다. M3 프롬프트의 인코딩 사례 범주에 값 오설정을 명시했다.
- 실제 사례는 구현 동결 후 Ian이 제공한다. 비교기는 동결된 코드/지침/테스트·소스 freshness·승인 정답을 검사하고 private 경계 안에 첫 실행 원본과 점수를 exclusive 보존한다. 공개 결과는 위치·적중 여부뿐이며 재실행으로 첫 실패를 대체하지 않는다.
- [MyBatis @Param](https://mybatis.org/mybatis-3/java-api.html)을 확인했다. 단일 scalar에서 @Param 삭제만으로 반드시 실패한다고 가정하지 않고 명시적 role/roleKey 불일치를 패치한다.
- [Spring 뷰 리졸버 순서](https://docs.spring.io/spring/reference/web/webmvc/mvc-servlet/viewresolver.html), [Thymeleaf 3.1 튜토리얼](https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html), [3.1 변경 기록](https://github.com/thymeleaf/thymeleaf/blob/3.1-master/ChangeLog.txt), [Oracle ORA-00904](https://docs.oracle.com/en/error-help/db/ora-00904/)를 참고했다. 배포 설정·실제 렌더링을 함께 확인하며 문서만으로 런타임 원인을 확정하지 않는다. 과거 Thymeleaf 3.1 what's-new URL은 이번 조회에서 404였다.

## 2026-10-27 — M2.5 v2 검증·종료

- 최종 구현 `2ff7c22`, 도구 지문 `37f82c6f7d6e535260f1582c2e8d441f48dd8c9adab32e5eafe3f2e2daa6c827`의 새 run-id `m25-v2-{delete,petclinic,search,create,coexist}-20261027-02`로 검증했다. 삭제 screen 4/4·server 9/9, PetClinic screen 6/6·server 3/3, 학습 검색 16/16·7/7/등록 12/12·5/5/공존 해당 없음·1/1 모두 PASS, 각 그룹 오류 0이다. 기존 JSP 8건도 원문을 다시 인덱싱해 개별 PASS다. v2는 결함 수정 확인이며 일반화 성능이 아니다.
- v2 준비에서 같은 루트의 pom/Gradle starter 중복을 상충으로 오인했다. 추가 일반 합성 테스트 1건을 먼저 실패시킨 뒤 build 루트별 정규화로 수정했다. 01은 미채점 준비 자료로 보존하고 02를 새로 실행했다. 최초 일반 합성 10건과 합쳐 최종 npm 108/108·승인 근거 13건·스킬/복사본 검사를 통과했다.
- Java 17/Maven 캐시의 오프라인 JUnit 2건·HTTP smoke·실제 브라우저 레이아웃/data URL 2종/JSP/합성 글 등록·검색·삭제 AJAX 후 재검색 0건을 확인했다. localhost 서버·임시 탭을 종료했다. 샌드박스 임시 Git/localhost 접근 실패는 코드 변경 없이 권한 있는 같은 명령에서 통과했고 실패 로그를 남겼다. SLF4J provider 부재는 승인안대로 유지했다.
- 첫 승인 정답·FAIL·49개 원본·학습 이전 기록·테스트베드 소스는 변경 0개다. v2 native eval 7개·raw full-index/query/trace·검토·manifest·회귀 8건·미채점 준비까지 136개 파일로 별도 보존했다. 원본 전체 인덱스와 scope trace 점수가 같고 기대 도착 노드 여과·수동 연결 추가는 0개다. [원본 검증](evidence/m2.5-v2/README.md).
- M2.5 구현/정적 검증/Java 17 앱 검증은 종료한다. Java 8 런타임은 구성된 환경에 없어 BLOCKED로 이관하고 재실행 명령을 [종료 보고](m2.5-final-report.md)에 남겼다. 분석 manifest 5건의 PARTIAL과 eval PASS를 구분한다. PetClinic 빌드/JPA/운영 DB는 범위 밖이며 M3는 시작하지 않았다.

## 2026-10-27 — M2.5 일반 규칙 v2 수정 승인·실패 테스트 먼저

- 사용자가 첫 FAIL 기준선 보존 후 네 일반 규칙 수정·새 run-id v2·학습/기존 JSP 회귀·M2.5 종료 점검을 승인했다. 첫 승인 정답·도구 지문·점수·49개 원본은 그대로 둔다. v2는 결함 수정 확인이며 일반화 성능이 아니다. M3는 시작하지 않는다.
- 일반 합성 테스트 10건을 먼저 작성·실행해 0/10 PASS, 10 FAIL을 확인하고 `0add4e1`에 보존했다. submit 중복/다른 URL/다른 method·취소 없음, root/인자/자기 참조 fragment·잘못된 식, Maven/Gradle starter·YAML/profile 설정, 상수/private 반환 깊이·순환을 검사한다. 프로젝트/메서드 이름을 수집 규칙에 넣지 않는다.
- submit의 선행 취소·AJAX 종류·URL/HTTP method·폼 ID·스크립트 포함 관계를 함께 보고 같은 요청이면 handler 요청에 양쪽 근거를 합친다. 다른 endpoint/메서드/조건은 기본 action을 차단 이유의 LIKELY로 남긴다. fragment는 최상위 template/selector와 중첩 괄호 인자를 구별한다.
- Boot 기본 뷰는 build 좌표와 application*.properties/yml/yaml의 prefix/suffix만 해석한다. 재정의 없으면 classpath:/templates/+.html, profile 상충/미지원 YAML은 LIKELY다. YAML 들여쓰기/점 키·한 줄 scalar 이외 구문은 실행·완전 해석하지 않는다. Node 외부 의존성은 추가하지 않았다. 같은 클래스 상수/private String 반환은 깊이 2까지, 동적/순환/모호성은 LIKELY이며 redirect/forward는 템플릿이 아니다.
- 수정 후 집중 26/26, 전체 npm test **107/107 PASS**, 정답 근거 13건·스킬·복사본 검사 PASS다. 최초 전체 실행의 임시 Git config 쓰기는 샌드박스 권한으로 1건 실패했고 코드 변경 없이 권한 있는 동일 명령에서 통과했다. Java 17/Maven 오프라인 JUnit 2건도 PASS, 기존 SLF4J provider 부재 경고는 유지한다.

## 2026-10-27 — held-out 확장 승인·수정 전 첫 실행

- 사용자 검토를 반영해 삭제 requests를 detail.html 전체 from.file scope로 넓혔다. POST 정답은 handler 1개이며 성공 GET 이동과 기존 목록/수정 링크도 포함해 screen 4개/server 9개다. PetClinic은 세 endpoint 매핑, Boot 기본 뷰 3개(private helper 경유 포함), 매개변수 layout includes·검색/신규 requests로 확장해 screen 6개/server 3개다. 정답은 소스 사실에 따라 CONFIRMED를 유지하고 `39c30c1`에 먼저 승인 확정했다.
- Boot starter·@SpringBootApplication·application.properties 및 profile properties의 prefix/suffix 재정의 부재·템플릿 파일·WebConfiguration을 확인했다. [공식 MVC 설명](https://docs.spring.io/spring-boot/how-to/spring-mvc.html)의 기본 classpath:/templates/와 .html을 적용했다. Controller의 private addPaginationModel 반환을 뷰 근거로 확인하되 JPA·SQL 분석은 하지 않는다. redirect는 보충 응답 설명이다. LICENSE.txt는 provenance 해시로 보존하며 수집 지원 대상인 실제 근거 파일과 구별했다.
- frozen 비교기 enum(parity/screen)을 바꾸지 않기 위해 screen/server를 report_group으로 고정하고 각 그룹의 승인 scope/edges만 그대로 투영해 동일 evalTrace로 개별 평가했다. 투영은 원본 승인 해시를 포함하며 두 그룹의 완전 분할을 검증했다. actual은 기대 도착 노드로 여과하지 않았고 full-index와 scope trace의 결과가 같음을 확인했다. server를 임의 parity로 바꾸거나 합산 점수를 만들지 않는다.
- 두 사례를 같은 동결 설치본으로 각각 한 번 실행했다. 삭제 screen 4/4·과탐 1/server 9/9, PetClinic screen 2/6·누락 4·과탐 1/server 3/3이다. 상태 불일치는 모두 0이며 두 사례 FAIL이다. 삭제 th:action 중복 POST, PetClinic renders 3개·실제 fragment includes 누락과 unknown includes 과탐을 미수정 상태로 남겼다. [첫 점수 보고](m2.5-heldout-first-report.md).
- first run-id 2개와 native 그룹별 첫 eval 4개·전체 인덱스·query·검토·manifest·보고서·승인본/해시 등 49개 원본을 [아카이브](evidence/m2.5-heldout-first/README.md)에 보존했다. 코드·테스트·스키마·비교기·설치본·테스트베드 변경 0개, 동결 138개 파일·도구 지문은 전후 동일하다. 두 manifest는 PARTIAL, 계약 검증은 PASS다. 실패 원본을 덮어쓰지 않고 「수정 전 첫 점수」 GATE에서 중지한다.

## 2026-10-27 — Thymeleaf 학습 완료·구현 동결·held-out 초안 GATE

- 사용자 승인에 따라 검색·등록·공존 3건을 expected 승인본으로 확정했다(`29a549d`). 최종 구현은 `fd1b93c`이며 npm test 97/97, 설치본 prepare/finish·evalTrace로 검색 parity 16/16·screen 7/7, 등록 12/12·5/5, 공존 parity 적용 없음·screen 1/1을 확인했다. 그룹별 누락·과탐·상태 불일치 모두 0이며 합산 점수는 만들지 않았다. 기존 승인 JSP/eGovFrame 8건도 새 인덱싱 회귀에서 각각 통과했다. [결과·원본](evidence/m2.5-training/README.md).
- 학습 검토는 단일 에이전트가 화면/서버/SQL 역할을 순차 수행했다. source/kind/위치 scope 안 모든 실제 연결을 유지하고 기대 도착 노드로 걸러내지 않았다. 원본 index-query와 scope trace를 함께 보존한다. 실제 앱/DB와 외부 AOP·서버 override를 이번에 재실행·확정하지 않았으므로 manifest 3건은 PARTIAL, 정적 eval PASS와 구별한다.
- 두 신규 흐름 전용 탐색·초안 작성 전에 **2026-10-27T08:25:46.999Z**에 구현·테스트베드 main·학습 승인본 등 138개 파일을 동결했다. 구현 revision `fd1b93c69a64db5e54d72bb8eee0cefb19405f5b`, 도구 지문 `8e5bdc83d9c4da2a4efee1b5d709ff1bb6126ddb9475ae9c7b3d7973a367eec0`와 파일별 해시는 [baseline](evidence/m2.5-heldout/baseline.json), 학습 원본·동결 보존 커밋은 `679396f`다. 동결 이후 코드·테스트·테스트베드를 수정하지 않는다.
- 동결 후 공식 PetClinic을 승인 SHA `500158f732419217507c7656904b8e6aa1bcc0d6`에 detach clone했다. origin·HEAD·깨끗한 작업 트리와 미추적 상태를 확인했다. Apache-2.0, Java 17/Boot 4.1.0/Thymeleaf starter를 pom/LICENSE에서 판정했으며 빌드·의존성 설치·JPA 소스 추적은 하지 않았다. 원문 소스는 저장소에 복사·커밋하지 않는다.
- 삭제 AJAX는 detail.html submit handler의 URL 12행에서 시작하는 POST와 업무 삭제·인증 메뉴 조회 총 10개 연결, 외부 검색은 findOwners.html:9의 GET form→OwnerController 총 2개 연결을 소스만 읽어 별도 expected.draft로 작성했다. 숫자는 초안 범위이지 점수가 아니다. 삭제의 목록 이동·기본 폼 요청, 공개 사례의 Controller 이후 helper/Repository/Entity/SQL은 채점 밖이다.
- 새 두 사례에는 승인 JSP 기준선이 없으므로 학습 parity를 임의 생성하지 않고 독립 scope로 등록 대기한다. datasets의 기존 held-out 배열과 첫 점수는 유지했다. 로컬 삭제 템플릿은 앞선 전체 인덱싱에 포함됐으므로 외부 블라인드 평가로 주장하지 않는다. 개별 흐름 채점·사례 대응 튜닝은 없었다.
- 초안 2건은 해시·근거 라인·계약 검사만 수행했다. 사용자 승인 전 구현 수정·신규 held-out 인덱싱/채점을 하지 않는다. 두 정답 승인 후 같은 동결 구현으로 각각 첫 점수와 실패 원본까지 보존한 뒤 다시 GATE 보고한다. [현재 보고](m2.5-heldout-gate-report.md).

## 2026-10-27 — Thymeleaf 수집기 구현·합성 검증

- 승인된 학습 3건을 expected 승인본과 training 등록으로 확정했다. `.html` 수집, Thymeleaf URL·fragment·Layout Dialect·inline JS·data URL 소비와 XML 뷰 판정을 공통 인덱서의 별도 모듈로 추가했다. 프로젝트/메서드명을 규칙에 하드코딩하지 않는다.
- checkExistence=true·viewNames 무제한의 파일 존재/부재 fallback과 동순위·동적 prefix·조건 미확정 경계를 합성 검증했다. Java/Boot의 임의 자동 설정을 실행해 뷰를 추정하지 않는다. Thymeleaf 3.0 #request/#session 식은 실행하지 않고 정적 URL 부분과 동적 베이스를 구분한다. 렌더링 기준은 기존 3.1.5 검증으로 유지한다.
- fragment 인자를 동적 템플릿명으로 오인한 합성 실패 3건을 재현하고 이름/인자 분리에서 수정했다. fragment 내부 요청의 소속과 동일 파일 fragment 참조도 검사했다. 레이아웃 본문은 화면별 layout_bindings와 decorates 근거로 남겨 여러 화면의 본문이 전역 연결로 섞이지 않게 했다.
- 새 합성 테스트 15건과 승인 학습 3건을 실제 수집하는 테스트 1건을 추가했다. 기존 단독 설치 테스트도 HTML 요청을 실제 CLI로 확인하도록 확장했다. `npm test`는 **97/97 PASS**, 승인 정답 11건·스킬 형식·공통 모듈 복사본 검사도 통과했다. 아직 held-out 새 2건의 흐름은 탐색하지 않았다.

## 2026-10-27 — Thymeleaf 그룹별 채점 구조 재검토

- 사용자가 기존 검색 17개·등록 14개 주 연결을 승인하고 보충 항목을 실제 채점에 포함하도록 지시했다. 기존 주 연결 중 화면 출발 requests 1개·2개는 screen으로, 순수 서버 연결 16개·12개는 parity로 분류했다. parity_reference의 승인 JSP 정답 SHA-256과 from/to/kind/status를 check-expected에서 검증하며 parity 삭제·변형도 차단한다.
- 검색 보충 7개 중 jsp-coexistence를 독립 `legacy-board-thymeleaf-coexist`로 옮기고 나머지 6개를 screen edges/scope로 승격했다. 등록의 보충 3개도 screen으로 승격했다. 결과는 검색 parity 16/screen 7, 등록 parity 12/screen 5, 공존 parity 적용 없음/screen 1이다. 이는 채점 범위의 연결 수이며 새 수집기 점수가 아니다.
- `renders`·`decorates` 종류와 template 노드를 그래프 스키마에 추가했다. data AJAX는 기존 requests(`list.html#요소ID` → GET /code/listJson.do), fragment 연결은 includes(`파일#fragment이름`)로 표현한다. requests의 도착 endpoint만 HTTP 메서드와 쿼리 제외 경로로 비교한다.
- 그룹별 정답 스키마·검증·evalIndex/evalTrace 출력에는 parity와 screen 결과만 제공하며 합산 expected/matched를 생성하지 않는다. 그룹 없는 기존 정답은 이전 점수 형식을 유지한다. 그룹 사이 scope 중복과 중복 연결은 거부한다.
- 보존된 v2-final trace와 같은 현재 승인 정답을 수정 전(7e133f1)·현재 비교기에 입력했다. 기존 8건 모두 상태·일치/정답·누락·과탐·상태 불일치 배열이 동일했다. [회귀 결과](evidence/m2.5-testbed/grouped-eval-regression.json). 이전 평가 원본과 기존 승인 정답은 바꾸지 않았다.
- 새 구조는 expected.draft 3건으로 남긴다. 실제 Thymeleaf 학습 eval·수집기 구현·held-out 탐색은 시작하지 않고 다시 GATE 보고한다.

## 2026-10-27 — M2.5 학습 정답 초안 GATE

- 테스트베드 소스 revision `bfa5098`을 기준으로 Thymeleaf 검색·등록 `expected.draft.json`/`expected.draft.md`를 작성했다. 기존 승인 JSON을 서버 기준선으로 사용하고 새 화면·설정·JS 원문을 직접 대조했다. 인덱서 출력은 사용하지 않았다.
- 주 연결은 검색 17개(화면 1·서버 16), 등록 14개(화면 2·서버 12)로 유지했다. 서버의 from/to/kind/status는 승인본과 정확히 같고 새 화면 파일·라인으로 출발 근거만 교체했다. 숫자는 정답 초안의 비교 범위이며 eval 점수가 아니다.
- 뷰 선택·레이아웃·메뉴/페이징·data AJAX는 검색 7건·등록 3건의 `supplemental_assertions`로 구분했다. 기존 evalTrace가 이 필드를 채점하지 않으므로 수집기 단계에서 별도 검증 결과가 필요하다. 주 연결 PASS를 보충 항목 PASS로 대체하지 않는다. 해당 범위도 이번 정답 GATE에서 함께 검토받는다.
- 초안 2건은 source_files SHA-256과 근거 라인 검사에서 DRAFT_SOURCES_VALID이며 정답 승인·학습 채점은 하지 않았다. 기존 승인 정답·datasets 등록·수집기·held-out 기록은 변경하지 않았다. 사용자 지시에 따라 학습 정답 GATE에서 중지한다.

## 2026-10-27 — M2.5 공존 테스트베드 구축

- 승인된 viewNames 설정으로 `board/*,login,error`는 Thymeleaf(order 1), `code/*`는 JSP(order 2)로 분리했다. Java·main resources·기존 테스트 **30개 파일**은 원본과 바이트가 같다. [대조 기록](evidence/m2.5-testbed/server-parity.json).
- Layout Dialect 공통 레이아웃과 메뉴·페이징 조각을 만들었다. 목록의 두 분류 버튼은 th:data-url/th:attr에서 같은 기존 JSON endpoint를 가리키며 외부 JS가 해당 요소의 data URL을 읽는다. 기존 검색·등록 서버 연결은 바꾸지 않았다. 추가 분류 요청은 새 화면 검토 범위로 별도 기록한다.
- 공통코드 목록과 JSP 조각·기존 JS는 보존했다. `web.xml`이 직접 사용하는 컨테이너 오류 JSP도 유지했다. 이 인프라 오류 응답은 업무 화면 공존 대상과 구별하며 MVC `error` 반환 뷰는 Thymeleaf로 선택된다.
- JDK 17/Maven의 기존 JUnit 2건, HTTP 학습 smoke, 브라우저의 두 data URL AJAX·JSP 공존·등록·검색을 실제 확인했다. SLF4J provider 부재 경고는 승인안대로 기록했고 provider를 추가하지 않았다. Java 8 런타임은 설치된 실행 환경이 없어 BLOCKED로 남긴다. 검증은 Thymeleaf 3.1.5 기준이다.
- checkExistence·3.0 구문 합성 테스트와 수집기 변경은 학습 정답 승인 후 단계다. 삭제 AJAX 템플릿은 테스트베드 구성에 포함하되 새 held-out 정답·수집기 eval·첫 점수는 아직 만들지 않았다.

## 2026-10-27 — M2.5 의존성 승인·실제 tree 확인

- 사용자가 1번 GATE를 승인했다. 새 테스트베드 pom에 thymeleaf-spring5 3.1.5.RELEASE, thymeleaf-layout-dialect 3.4.0과 thymeleaf exclusion, slf4j-api 2.0.17 dependencyManagement를 적용했다. JSP·Thymeleaf 공존 설정도 승인 범위다.
- Maven 3.9.10·JDK 17에서 기존/새 pom의 `dependency:tree -Dverbose`를 실행했다. 선택된 jar 의존성은 기존 26개 → 35개이며 추가 9개(직접 2개·전이 7개)가 승인안과 모두 일치했다. 기존 의존성 제거·버전 변경 0개, 예상 밖 추가·누락 0개다. [원본과 비교 결과](evidence/m2.5-dependencies/comparison.json)를 보존했다. 다운로드된 Maven 플러그인 자체의 도구 의존성과 프로젝트 런타임 의존성을 구별한다.
- Groovy는 **4.0.25**가 선택됐고 extensions의 4.0.21, expression-processor의 4.0.14는 conflict로 제외됐다. SLF4J 2.0.16은 2.0.17로 통일됐다. Thymeleaf는 3.1.5만 선택됐으며 OGNL·Javassist와 제안서에서 제외한 optional 라이브러리는 유입되지 않았다. 예상과 일치하므로 테스트베드 구축을 계속한다.
- 추가 요청인 checkExistence fallback과 Thymeleaf 3.0 유틸 객체 읽기는 수집기 단계의 합성 검증 요구로 프롬프트에 기록했다. 테스트베드는 승인한 viewNames 방식, 렌더링 기준은 3.1.5다. 이번 정지점은 학습 정답 2건 승인 GATE이며 수집기 구현은 그 이후다.

## 2026-10-27 — M2.5 검토 반영·의존성 GATE

- 사용자 검토에 따라 Layout Dialect의 레이아웃/본문 연결, data URL의 외부 JS AJAX 소비, JSP 1개 화면과 Thymeleaf의 리졸버 공존·반환 뷰 판정을 범위에 추가했다. 프롬프트의 「기본 ponytail lite로 필요한 부분만 읽는다」 문장은 삭제했다.
- 삭제 AJAX와 별개로 공개 PetClinic의 화면 → Controller held-out 1건을 추가했다. 두 흐름 탐색 전 구현 동결, 두 정답 승인 후 같은 동결 구현으로 각각 첫 실행·보존·보고하는 규칙을 적용한다. 외부 JPA 구간은 제외한다.
- 1번 GATE 제안은 Thymeleaf Spring5 3.1.5.RELEASE + Layout Dialect 3.4.0이다. 공식 배포 POM·Java 8 빌드 근거, 직접 2개·전이 7개 예상 집합과 라이선스, Thymeleaf 중복 경로 exclusion·SLF4J 버전 고정, JSP 공통코드 유지 설정을 [제안서](m2.5-dependency-proposal.md)에 구체화했다. 아직 승인된 의존성이 아니다.
- 공개 PetClinic의 `500158f732419217507c7656904b8e6aa1bcc0d6` 커밋과 pom·라이선스만 확인했다. Java 17·Boot 4.1.0 환경을 로컬 Java 8 테스트베드와 구별한다. 클론·화면 흐름 탐색·정답 작성은 하지 않았다.
- 이번 변경은 계획·승인 문서에 한정한다. 실제 pom·설정·코드 변경과 의존성 설치는 1번 GATE 승인 후 진행한다.

## 2026-10-27 — M2.5 계획 추가

- 사용자 요청에 따라 M2와 M3 사이에 Thymeleaf 수집기 마일스톤과 `prompts/M2.5.md`를 추가했다. Ian의 JSP → Thymeleaf 이관을 위해 기존 si-trace·공통 인덱서를 확장하는 계획이며 이번 작업은 문서 작성까지만 수행한다.
- 새 테스트베드는 서버 Controller·Service·Mapper·SQL을 유지하고 화면과 뷰 설정만 바꾼다. 검색·등록 승인 정답의 서버 연결 동등성을 비교하고 삭제 AJAX 1건은 별도 held-out으로 둔다.
- `thymeleaf-spring5`는 아직 추가하지 않는다. 구현 착수 후 정확한 Java 8 호환 버전·라이선스·전이 의존성·변경안을 제시하는 승인 GATE를 먼저 둔다. 이 문서 작성은 의존성 승인으로 간주하지 않는다.
- 학습 2건의 새 화면 근거를 승인받고, held-out 초안 작성 전 구현을 동결한다. held-out 정답 승인 전 구현 수정 금지와 승인 후 첫 점수·원본 보존을 명시했다. 첫 점수 보고 후에도 지시를 기다리고 후속 결과는 별도 보존한다.
- JPA(Repository 메서드명·@Query·@Entity/@Table), Vue3+REST(.vue·axios·router·application.yml) 수집기는 v0.2 백로그에만 추가한다. M3의 기술적 선행 조건 M1은 유지하며 예정 작업 순서는 M2 → M2.5 → M3로 기록한다.

## 2026-10-27 — M2 학습 정답 누락 보정 승인

- 사용자가 `egov-clcode-delete`의 Controller#deleteCmmnClCode → EgovUserDetailsHelper#getAuthenticatedUser를 `calls / CONFIRMED`로 추가 승인했다. Controller:184의 실제 호출과 Helper:41의 static 선언을 재확인하고 Helper 소스 SHA-256을 정답 source_files에 추가했다.
- 기존 「held-out 승인 — 정답 작성 공통 기준」의 인증 Helper 진입 깊이에 따른 **정답 누락 보정**이다. Helper 내부 위임은 연결 점수에서 제외하며 수집기·대상 소스·평가 범위는 변경하지 않는다.
- 기존 m2-v2-final 학습 실행 산출물에 보정한 정답으로 `evalTrace`를 재실행했다. 학습 5건 **56/56**, 누락·과탐·상태 불일치 0건이다. 재인덱싱·새 에이전트 소스 검토·앱 실행 결과로 주장하지 않는다.
- 과거 55/55·과탐 1건의 FAIL, held-out 첫 60/66과 v2 66/66, 압축 원본은 그대로 보존한다. 새 결과는 `docs/evidence/m2-training-correction/`에 독립 기록하며 일반화 성능으로 해석하지 않는다.

## 2026-10-27 — M0 공식 문서 확인

- [Agent Skills 명세](https://agentskills.io/specification): name은 1~64자 소문자·숫자·하이픈, 앞뒤 및 연속 하이픈 금지, 디렉터리명과 일치. description은 1~1024자. 선택 필드는 license, compatibility(500자), metadata, allowed-tools. SIStack은 본문 300줄 제한을 추가한다.
- M0의 `_example`은 name 규칙에 어긋나므로 `skills/si-example/`로 대체한다. 기능 없는 설치 검증용 예제이며 네 제품 스킬은 M2~M5에서 만든다.
- [Codex 공식 문서](https://developers.openai.com/codex/skills)는 확인 당시 [Build skills](https://learn.chatgpt.com/docs/build-skills)로 이동한다. 저장소 `.agents/skills/`, 사용자 `~/.agents/skills/`를 사용한다. 이름으로 명시 호출하거나 설명에 맞춰 자동 선택한다. `agents/openai.yaml`은 선택 UI 메타데이터·호출 정책·도구 의존성 설정이다.
- [Claude Code 공식 문서](https://code.claude.com/docs/en/skills): 저장소 `.claude/skills/`, 사용자 `~/.claude/skills/`, `/skill-name` 호출. argument-hint, disable-model-invocation, user-invocable, model, context, agent, hooks 등 확장이 있으나 공통 배포 원본에는 표준 필드만 사용한다.
- [pstack README](https://github.com/backnotprop/pstack), [how 원문](https://github.com/backnotprop/pstack/blob/main/skills/how/SKILL.md): 스킬별 폴더와 짧은 지침·상세 참조 분리 구조를 참고한다. SIStack은 단일 모델, 승인 절차, 문서 산출물, 실행 불가 기록을 우선한다. M0에서 how 워크플로를 실행하지 않는다.

## M0 구현 범위

- Node.js 18+ 표준 라이브러리와 node:test만 사용한다. npm 외부 의존성은 추가하지 않는다.
- manifest 검증기는 저장소 스키마가 사용하는 JSON Schema 키워드만 지원하고, 미지원 키워드는 오류로 처리한다. 범용 JSON Schema 엔진을 구현하지 않는다.
- 스킬 frontmatter는 저장소에서 사용하는 YAML 부분집합(문자열, 접힌/리터럴 블록, metadata 문자열 맵)을 검증한다. 지원하지 않는 YAML 문법은 성공으로 처리하지 않는다. 범용 YAML 라이브러리는 이후 필요 시 승인받는다.
- 설치는 전체 충돌 목록을 먼저 보여주고 `--force` 없이 쓰지 않는다. 심볼릭 링크는 복사·동기화 대상에서 거부한다.
- 공통 모듈은 `lib/mask/`만 각 예제/제품 스킬의 `scripts/lib/mask/`에 복사한다. 복사본을 독립 경로에서 실행해 단독 설치를 확인한다.
- Git 메타데이터가 없는 시작 폴더이므로 로컬 `git init`을 수행한다. 기존 지시 문서는 보존하고 원격은 만들지 않는다.
- Java 테스트베드 의존성은 별도 [승인안](dependency-proposal.md)에 명시하고 사용자 조건부 승인 후 추가했다.

## 2026-10-27 — 승인된 Java 의존성과 실행 구성

Java 의존성은 `examples/legacy-board/pom.xml`에 한정한다. 루트 package.json에는 의존성을 추가하지 않았다.

| 선택 | 이유·라이선스 |
|---|---|
| Spring webmvc/jdbc/test 5.3.39 | Maven Central 메타데이터에서 확인한 5.3의 마지막 공개 패치. Java 8·javax 기반 XML MVC 유지. Apache-2.0 |
| MyBatis 3.5.19, mybatis-spring 2.1.2 | [공식 호환표](https://mybatis.org/spring/)에서 2.1 계열은 Java 8·Spring 5·MyBatis 3.5 지원. Apache-2.0 |
| javax.servlet-api 4.0.1 (provided), JSTL 1.2 | Servlet/JSP javax 네임스페이스 유지. Servlet은 CDDL-1.1 / GPL-2.0+Classpath Exception, JSTL은 CDDL-1.0 / GPL-2.0+Classpath Exception |
| H2 2.2.224 (test) | Java 8 호환과 Oracle 모드. 다운로드한 org/h2/Driver.class의 major 52 확인. MPL-2.0 / EPL-1.0 |
| JUnit 4.13.2, Mockito 4.11.0 (test) | 레거시 테스트 조합, Java 8 유지. 각각 EPL-1.0, MIT |
| jackson-databind 2.20.2 (compile) | 사용자가 승인한 JSON 변환용 2.x. [공식 2.20 호환성 안내](https://github.com/FasterXML/jackson/wiki/Jackson-Release-2.20)에 따라 Java 8 기반을 유지한다. 전이 core 2.20.2·annotations 2.20 포함. Apache-2.0 |
| javax.annotation-api 1.3.2 (compile) | 추가 승인 후 테스트베드 pom에만 추가. JDK 11에서 제거된 javax.annotation의 `@Resource` 사용을 지원한다. CDDL-1.1 / GPL-2.0 with Classpath Exception. jakarta.annotation-api는 사용하지 않는다 |
| jQuery 3.7.1 정적 파일 | Maven 의존성·CDN 없이 로컬 실행. 공식 배포 파일과 MIT LICENSE를 vendor에 보관; NOTICE에 SHA-256 기록 |
| compiler 3.13.0 / surefire 3.2.5 / war 3.4.0 | release 8과 JDK 11/17 빌드. Apache-2.0 |
| Jetty Maven plugin 9.4.57.v20241219 | 구형 javax JSP 로컬 실행. Apache-2.0 / EPL-1.0. 127.0.0.1에만 바인딩 |

- H2·초기 SQL·datasource는 테스트 클래스패스에만 둔다. `mvn jetty:run`은 useTestScope + local 프로필로 실행한다. 일반 WAR에는 H2나 로컬 datasource를 포함하지 않으며 별도 환경 없이 운영 배포하지 않는다.
- 역할 선택 로그인은 합성 테스트용이다. 조회자는 게시판 조회, 관리자는 CRUD·공통코드 접근을 허용한다. 서버가 매칭한 URL 패턴으로 권한을 판정하고 POST에는 세션 CSRF 값을 확인한다.
- BoardSearch가 허용한 두 컬럼만 `${sortColumn}`에 전달한다. 검색어는 `#{}` 바인딩한다. 공통 ROWNUM 페이징 SQL을 게시판·공통코드에 사용한다.
- 한글 SQL 데이터는 JDBC 초기화의 encoding=UTF-8을 명시한다. Windows 기본 인코딩에서 초기 작성자 검색 누락을 재현하고 수정했다.
- [Spring 공식 발표](https://spring.io/blog/2024/08/14/spring-framework-6-1-12-6-0-23-and-5-3-39-available-now/)에 따르면 5.3 OSS 지원은 2024-08-31 종료됐다. 보안 스캔의 EOL·CVE 경고를 숨기거나 안전하다고 간주하지 않는다. 이 테스트베드는 승인 조건에 따라 구버전을 유지하며 운영 용도로 사용하지 않는다.
- [Spring 보안 공지](https://spring.io/security/cve-2026-41852/) 등 이후 공지의 영향 버전 범위에 포함될 수 있다. 이 작업에서 전이 의존성 전체 CVE 감사를 수행한 것은 아니다.

## 외부 테스트베드 고정

- eGovFrame 공식 공통컴포넌트의 v4.2.4, 커밋 `2303751d76c119b56dc2e6b6fe1002adafbef938`을 고정한다. 최신 main은 Jakarta 기반으로 바뀌었으므로 XML·MyBatis 레거시 검증 목적에 맞는 공개 태그를 선택했다.
- `context-mapper.xml`의 SqlSessionFactoryBean·SqlSessionTemplate과 Mapper XML을 확인했다. iBatis 2 지원 검증으로 확대 해석하지 않는다.
- 가져오기 재실행은 출처·HEAD·작업트리 상태를 확인하며 기존 수정본을 리셋하거나 삭제하지 않는다.

## 2026-10-27 — legacy-board GATE 수정

- 인프라·검증 도구 승인은 유지하고 테스트베드만 재검토한다. M1은 시작하지 않는다.
- BoardService와 CommonCodeService를 인터페이스로 만들고 `service/impl/`의 이름 있는 @Service 구현으로 분리했다. Controller→Service는 `@Resource(name=...)`와 `@Autowired` 필드 주입을 혼용한다. 애플리케이션 DI 생성자는 LoginInterceptor 한 곳만 남긴다. UserSession 생성자는 DTO 생성이며 DI가 아니다. 프레임워크 빈 SqlSessionTemplate의 XML constructor-arg는 유지한다.
- 공통코드 서비스가 HashMap에 offset/endRow를 넣고 DAO의 문자열 sqlId와 parameterType="map"으로 전달한다. 기존 목록 결과·페이지 계산은 유지한다.
- 기존 공통코드 HTML 목록은 유지하고 GET `/code/listJson.do`를 추가했다. `$.ajax`가 JSON 목록을 읽어 `.text()`로 셀을 채운다. 게시글 삭제 POST는 `{success:true}` JSON을 반환하며 jQuery가 성공 후 목록으로 이동한다. 오류는 HTTP 상태로 판별한다. 세션·역할·CSRF 보호는 유지한다.
- Java 문장과 메서드, XML 요소, JSP·자체 JS/CSS를 줄 단위로 정리했다. jQuery 배포 파일은 변경하지 않는다. 포맷 변환 시 Java 토큰·XML 내용의 동일성을 확인했다.
- 브라우저 확인 중 공통 JSP 조각의 한글이 ISO 기본 인코딩으로 해석되는 기존 문제를 재현했다. 각 jspf에 pageEncoding=UTF-8을 명시하고 smoke에 로그아웃·페이징 한글 확인을 추가했다.
- Oracle DDL의 물리 컬럼명은 영문을 유지하고 COMMENT에 한글 논리명을 기록한다. H2 schema.sql은 변경하지 않는다. prod datasource는 globals.properties의 자리표시자만 참조한다. Oracle 드라이버·실제 접속·DDL 실행은 추가하지 않았다. Jetty는 local 프로필을 유지한다.
- modern-board는 v0.2 백로그 한 줄만 추가했다. 구현하지 않았다.

## 2026-10-27 — M0 승인·마무리

- 사용자가 legacy-board 구조를 승인하고 M0 완료를 지시했다. M1에는 착수하지 않는다.
- 상세 JSP에서 contextPath를 ctx로 선언하고 삭제 AJAX는 ctx + '/board/delete.do'로 호출한다. SI에서 흔한 확정 가능한 연결 패턴을 추가하며 공통코드 AJAX 문자열 조합은 함정으로 유지한다.
- 함정 목록은 설계 자료이며 구조 승인을 M1 eval 정답 승인으로 확대하지 않는다. 최종 재실행 결과는 m0-final-report.md에 기록한다.

## 2026-10-27 — M1 인덱서와 초안 검토

- Node 표준 라이브러리만 사용한다. Java 전체 파서 대신 주석·문자열을 구분하는 스캐너, 균형 괄호, 제한된 선언 패턴을 조합한다. 외부 의존성을 추가하지 않으며 지원 밖 문법/파일은 skipped와 limitations에 남긴다. 완전한 Java AST나 컴파일러 타입 분석으로 주장하지 않는다.
- 스키마를 먼저 정하고 JSP/JS/Spring/Java/MyBatis/iBatis/SQL 수집기를 나눴다. 이름만 같은 메서드는 연결하지 않고 주입 타입·빈 이름·선언을 함께 사용한다. 중복 구현·DB별 동일 sqlId는 후보와 LIKELY로 표시한다.
- JS 문자열 조합은 UNRESOLVED로 유지한다. 해당 화면에 유일하게 선언된 contextPath 변수, 그 화면이 포함한 JS, 해당 이벤트 대상 요소, 단일 리터럴 경로가 함께 확인되는 경우만 예외로 연결한다. 사용되지 않은 c:url 선언 자체를 요청으로 간주하지 않는다.
- SQL 단어가 문자열·주석 안에 있을 때는 호출/참조 근거에서 제외한다. ANSI JOIN과 단순 콤마 JOIN, MERGE USING을 수집한다. DB 객체 존재나 실행 성공을 보증하지 않는다.
- 반복 초기 데이터 SQL은 같은 from/to/kind/status 연결로 묶고 근거 위치 최대 8개를 보관한다. 더 있으면 evidence_truncated를 표시한다. 첫 대규모 실행에서 66만 개 이상의 반복 연결이 발생해 이 구조를 추가했다. 정확도나 성능 개선율로 해석하지 않는다.
- 노드 id는 내용 식별용 SHA-256으로 만들고, 이름·경로·이유·상수는 lib/mask를 거쳐 저장한다. 해시는 식별자 필드에 한해 보존한다. 원문 코드/로그 본문은 산출물에 저장하지 않는다.
- 출력 파일은 기본적으로 기존 파일을 보존하며 명시적 --force만 덮어쓴다. private/생성물/테스트/벤더 minified/심볼릭 링크를 제외하고, 파일 크기는 2 MiB 이하, 인코딩은 UTF-8로 제한한다. 파싱 오류는 다른 파일 처리를 막지 않는다.
- 정답 초안 5건은 인덱서 출력을 읽지 않고 소스에서 작성했다. 비교 범위와 근거 파일 SHA-256을 포함한다. eval은 draft를 --draft로만 열고 DRAFT_PREVIEW로 표시한다. revision이 달라져도 모든 근거 파일 해시가 일치하는 경우에만 비교를 허용하며 변경 사실을 표시한다.
- 같은 이름의 DB별 SQL 후보는 eval에서 논리 연결 하나로 비교한다. scope의 출발 노드·관계 종류·선택 위치 밖은 과탐으로 세지 않는다. 이 범위를 넓힐지 여부도 GATE에서 검토한다.
- eGovFrame 메뉴는 단순 CRUD인 공통분류코드 삭제, PaginationInfo와 공통코드 JOIN을 거치는 공통상세코드 목록, 직접 JDBC를 쓰는 RSS 컬럼 조회를 선정했다. 고정 버전에서 실제 iBatis 2 메뉴를 확인하지 못했으므로 합성 테스트 범위를 명시한다.
- pstack build-the-lever/encode-lessons-in-structure의 원칙을 적용해 CLI와 테스트를 만들었으며 원문 문장이나 코드를 복제하지 않았다. 제품 스킬과 설치용 indexer 복사는 해당 소비 스킬을 구현하는 이후 마일스톤의 작업이다.

### M1 승인 후 — 구현체 해석
- extends와 implements 절을 각각 해석하고 제네릭 인자를 제거한 타입으로 상속 관계를 연결한다. 두 키워드를 한 타입으로 읽던 오류를 실제 주입 호출 회귀 테스트로 고정했다.

### M1 승인 조건 — 설정·인터셉터·JSP 도달 경로
- `SqlSessionFactoryBean.mapperLocations`의 classpath 패턴과 등록된 PropertyPlaceholderConfigurer/property-placeholder의 properties를 따라 활성 XML을 고른다. eGovFrame은 `Globals.DbType=mysql`이므로 mysql executes를 CONFIRMED로 기록한다. 다른 DB XML은 노드/후보로 보존하되 실행 연결에서 제외한다. 설정을 풀지 못하거나 factory가 여러 개면 단일 SQL 선언도 LIKELY다. 외부 런타임 override는 확인하지 않는다.
- `intercepted_by` 관계를 추가한다. MVC interceptor의 포함·제외 경로를 endpoint에 적용하고 preHandle 선언으로 연결한다. 매핑의 정적 적용과 인증/CSRF 분기에 따른 실제 실행·세션 값 전파는 구별한다.
- JSP의 단순 리터럴 삼항식은 두 분기 모두 도달 가능한 경로로 본다. c:url 변수와 fn:escapeXml을 거친 create/update 요청을 모두 CONFIRMED로 연결하며 선언 위치도 근거로 남긴다. 조건 평가나 어느 분기가 실제 실행됐는지를 뜻하지 않는다. 동적 분기가 섞이면 UNRESOLVED다.
- 소스 읽기로 작성한 5개 정답에 사용자 검토 조건을 적용해 승인본으로 확정한다. RSS 직접 JDBC 선정과 기존 scope 제외는 유지한다. 활성 DB SQL에는 file 선택자를 추가해 다른 DB 선언을 정답으로 대체할 수 없게 한다.
- `check-expected.mjs`는 승인 JSON의 source_root 아래 source_files SHA-256과 모든 중첩 evidence 라인의 존재를 검사한다. npm test에 포함하며, 소스가 없으면 BLOCKED, 변경되면 FAIL이다. 해시를 자동 갱신하지 않는다. eGovFrame 체크아웃은 fetch-testbed로 먼저 준비한다. MD는 승인 JSON의 사람이 읽는 표이며 의미 검수와 PL/PM 승인을 이 검사로 대체하지 않는다.

### M2 — 단독 설치와 소스 확인 단계
- how의 단순/복잡 분기·계층별 읽기 전용 탐색·출력 구조를 SI 문맥으로 재구성했다. 모델 역할 설정은 가져오지 않았으며 구조 출처를 NOTICE에 기록했다.
- 스킬은 prepare로 골격을 만들고 에이전트 원문 확인 후 finish로 보고서를 확정한다. 인덱서의 CONFIRMED를 원문 확인 없이 최종 답으로 복사하지 않는다. 소스 해시·근거 라인·실제 탐색 기록·manifest를 검사한다.
- 캐시 유효성의 불완전한 추정보다 단순한 전체 재생성을 선택했다. prepare는 항상 인덱스를 갱신하므로 Git revision이 같은 미커밋 변경·추가 파일도 반영한다. 큰 프로젝트의 실행 시간은 늘어나며 M2에서 인덱서 자체는 바꾸지 않는다.
- 기존 manifest 검증 구현을 lib/manifest로 옮기고 CLI API를 유지했다. si-trace에 mask/indexer/trace/manifest와 스키마를 sync-shared로 복사해 저장소 밖에서도 단독 실행한다.
- M1의 5건은 training이다. 별도 held-out 3건은 사용자 메뉴 지정 → 소스 기반 expected.draft 작성 → GATE 승인 → 첫 실행 원본·도구/정답 해시·점수 보존 순서다. 승인 전 사례별 튜닝은 금지한다. 결과 기록은 exclusive 생성으로 덮어쓰지 않고 후속 수정 점수와 분리한다.
- 설치 경로는 기존 구현과 공식 문서를 대조했다: Codex https://learn.chatgpt.com/docs/build-skills 의 .agents/skills, Claude Code https://code.claude.com/docs/en/skills 의 .claude/skills. Agent Skills 형식은 https://agentskills.io/specification (2026-10-27 확인). 로컬 설치본은 Git에서 제외한다.

### M2 — 학습 결과와 held-out GATE

- 부분 질의의 executes.candidates가 질의 밖 노드를 가리켜 그래프 검증을 깨뜨리는 문제를 학습 실행에서 재현했다. 전체 인덱스 후보는 보존하고 부분 그래프만 내부 ID로 제한했으며 합성 DB 선택 테스트로 확인했다.
- 학습 5건의 최종 비교는 55개 연결 일치다. 세 복잡 분기에서 실제 Codex 탐색자 3역할을 병렬 수행하고 두 단순 분기는 직접 읽었다. 174개 전체 연결 중 정답 scope 55개를 비교한 수치이며 전체 정확도가 아니다. 미확정 때문에 분석 manifest는 5건 모두 PARTIAL이다.
- eGovFrame 기본 profile의 dummy 인증 인터셉터와 중첩 JSP 상세 링크는 분석 산출물에서 소스로 보완했다. 인덱서 코드는 수정하지 않았다. 공유 JS 함정은 실행 여부와 포함 관계를 구분해 설명했다.
- 사용자가 지정한 held-out은 egov-article-list, egov-user-insert, egov-id-dplct-ajax다. 원문 직접 검토로만 expected.draft JSON/MD를 만들었다. 소스 해시/라인 검증은 DRAFT_SOURCES_VALID이며 정답 승인·eval 점수가 아니다.
- forward/redirect와 응답 view는 현재 그래프 종류로 억지 표현하지 않고 supplemental_assertions로 남긴다. AJAX의 역방향 호출 JSP 집합도 별도 정답이다. 첫 평가에서 연결 누락/과탐/상태와 이 보충 항목의 결과를 분리해 기록한다.
- 구현 동결 파일 해시는 docs/evidence/m2-baseline.json에 남겼다. 사용자 승인 전 held-out 실행·채점·사례 맞춤 수정은 하지 않는다. 승인 후 첫 원본 점수를 저장한 다음에만 수정한다.

### held-out 승인 — 정답 작성 공통 기준

- 외부 주입 필드의 메서드 호출은 구현 소스가 없어도 호출 자체를 정답에서 누락하지 않는다. `calls → unknown:external-injection`, `UNRESOLVED`로 기록하고 실제 호출 위치와 외부 라이브러리 구현 부재를 근거·이유로 남긴다. 게시물 목록의 propertyService.getInt(pageUnit/pageSize)는 공통상세코드와 같은 기준으로 논리 연결 하나에 두 호출 위치를 기록한다. 라이브러리 내부 동작을 확정한 연결로 확대하지 않는다.
- 공통 인증 경로의 연결 점수는 EgovUserDetailsHelper#isAuthenticated / #getAuthenticatedUser로 들어가는 호출까지로 통일한다. Helper에서 EgovUserDetailsSecurityServiceImpl 등으로 이어지는 내부 연결은 supplemental_assertions로 기록하고 점수에서 제외한다. 이후 정답 사례에도 같은 깊이를 적용한다.
- 사용자 조건 2개를 반영해 held-out 3건을 expected.* 승인본으로 확정한다. 동결 구현으로 첫 골격·스킬 결과·역방향 질의와 점수를 보존하고 보고한다. 그 보고 전에는 인덱서나 si-trace의 사례 대응 수정을 하지 않는다.

### held-out 수정 전 첫 실행 기록

- 구현 동결 파일 46개와 설치본을 실행 전후 검증했다. 승인 커밋 c01c908 이후 첫 실행은 게시물 목록 35/38, 사용자 등록 8/11, 중복확인 AJAX 17/17이다. 누락 static 호출 6건을 추가하지 않았고 구현도 수정하지 않았다.
- 전방 AJAX 2함수만의 9/17은 별도 보존한다. 사용자 요구의 첫 --to URL 역방향 결과로 5개 JSP/10개 호출을 포함한 17/17을 보고한다. 전방+역방향은 같은 첫 실행 계획의 결과이며 재학습 후 결과가 아니다.
- 전체 원본 골격과 보고용 요청 범위 그래프를 둘 다 남긴다. 범위 밖 오류는 별도 소스 검토 결함으로 설명하며 승인 scope 과탐 수와 혼합하지 않는다. Helper 내부 위임·응답 view·외부 ID 생성기와 뷰 기반 테이블은 보충 항목으로 보고한다.
- 반복 메타데이터가 큰 원본 59개 파일은 UTF-8 바이트·파일별 SHA-256을 담은 gzip JSON으로 보존했다. Node 표준 라이브러리로 압축 해제·파일 해시·실제 원본 바이트 대조를 수행했다. 보고서·점수·누락은 일반 Markdown/JSON으로도 제공한다.
- 첫 스킬 eval의 AJAX expected_sha256이 일반 마스킹으로 손상된 사실을 무결성 검사에서 확인했다. 첫 레코드를 덮어쓰거나 구현을 고치지 않고 결함 자체를 보존했다. 유효한 해시는 첫 골격 기록과 승인 정답 바이트를 대조해 요약에 별도 기록했으며 출처·마스킹된 기록값을 함께 남겼다. 연결 점수는 바뀌지 않았다.

### M2 v2 — 일반 결함 수정 기준

- static 호출은 import와 같은 패키지의 로컬 클래스 선언으로 연결한다. 메서드의 static 여부·인자 수·직접 파라미터 및 중첩 로컬 호출 반환 타입으로 overload를 좁힌다. 유일한 선언만 CONFIRMED이며 모호한 overload는 LIKELY, 외부 import는 external-static UNRESOLVED다. eGovFrame 메서드명이나 파일명을 규칙에 넣지 않는다.
- JS submit은 같은 함수·같은 폼 수신자의 선행 action만 사용한다. 대입이 없으면 JSP 폼의 기본 action과 onsubmit 바인딩/폼 참조를 확인한다. 다른 함수의 action을 가져오지 않는다. href fragment/javascript:void(0)는 요청에서 제외한다.
- XML 조건부 빈·인터셉터는 profile 상태를 함께 전파한다. 등록된 property-placeholder 위치의 spring.profiles.active/default 및 리터럴 Java System.setProperty를 해석한다. 비활성은 제외하고 미확정 조건은 reason에 적어 LIKELY로 기록한다. 임의 Java 계산과 서버 override를 실행해 추정하지 않는다. eGovFrame의 동적 Java 프로필 계산은 자동 확정 범위 밖이므로 조건부 선언은 LIKELY로 남을 수 있다.
- 개인정보 마스킹 전에 비밀값·명시적 계좌/카드 라벨을 우선 처리한다. 그 밖의 32/40/64자 16진수와 UUID는 식별자로 보존한다. 구조화된 *_sha256/source_hash/tool_fingerprint 필드는 유효한 식별자일 때 일반 마스킹을 생략한다. 원래 개인정보 회귀 테스트도 유지한다.
- 5개 결함에 대한 합성 실패 테스트 8개를 수정 전에 실행해 8개 모두 실패함을 확인했다. 조건부 ref 빈과 비밀 라벨 회귀도 추가 재현했다. 첫 held-out 기준선과 승인 정답은 바꾸지 않고 v2에 새 run-id를 사용한다. v2는 결함 수정 확인이며 일반화 성능 평가가 아니다.
- 첫 v2 시도에서 Object 매개변수의 String 인자 대입 가능성과 HTML 속성명의 대소문자 차이를 추가 발견했다. 두 합성 테스트를 다시 실패시킨 뒤 일반 대입 가능 타입 및 HTML 속성명 정규화로 수정했다. 이 시도 결과는 보존하고 최종 검증에는 v2-final 새 run-id를 사용한다. Java 타입 추론은 전체 컴파일러의 overload/가변인자 분석을 대신하지 않는다.

### M2 종료 — v2 결과와 학습 정답 차이

- 첫 held-out 60/66 기준선·승인 정답·원본 압축 파일은 변경하지 않았다. 최종 ec4da84의 v2-final 3건은 66/66이며 결함 수정 확인이다. 일반화 성능이나 독립 평가로 보고하지 않고 학습 5건/55개와 합산하지 않는다.
- 학습의 기존 55개 연결은 모두 일치했다. static 일반 규칙이 clcode Controller:184 → EgovUserDetailsHelper#getAuthenticatedUser:41의 유효한 호출도 찾아 기존 정답 비교가 과탐 1건/FAIL이다. 호출을 숨기거나 승인 정답을 바꾸지 않고 차이를 설명한다. 정답 추가는 별도 사용자 검토 대상이다.
- M2 완료 기준은 학습 5건의 모든 비교 차이 설명을 허용한다. 74개 테스트, manifest 8개, 단순 3건/복잡 5건 실행, 명시 호출 PASS를 확인해 M2를 종료한다. 자동 활성화는 사용자 확인 1/3 PASS와 나머지 두 문항 미실행을 구분한다. M3는 시작하지 않는다.
- 초기 v2 시도와 최종 v2-final의 원본·해시·점수·실제 탐색 기록을 193개 파일의 gzip JSON으로 보존하고 해제·파일별 해시·원본 바이트를 대조했다. 첫 기준선의 59개 파일 보존 기록과 분리한다.
