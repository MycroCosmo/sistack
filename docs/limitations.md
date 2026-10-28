# 지원 범위와 한계

## M6 — 통합·설정 인증·CLI

- REQ-001은 합성 SQL 결함 1건의 수정 전후 실측이다. JUnit 48건과 화면 TC 37건을 일반화 성능/현장 검수로 해석하지 않는다. 통합 화면 3건은 BLOCKED, 삭제/다운로드 4건은 SKIP이다.
- 실제 Codex 남은 자동 질문 2개·Claude Code 로딩은 BLOCKED이며 파일 설치/CLI 성공으로 대신하지 않는다. [수동 절차](manual-checks.md)를 따른다.
- 로그인 어댑터는 동일 출처 단순 폼·CSRF·302/303·성공 URL/요소 범위다. SSO/MFA/복합 인증과 암호가 예상치 못한 변환으로 노출되는 모든 서버 동작을 보장하지 않는다. 암호 ENV 참조·본문/쿠키 미저장·알려진 비밀값 제거를 적용한다.
- CLI 모든 출력 모드는 외부 AI 없이 결정적으로 실행된다. 구조/로그 파싱/계획은 원인 확정·실행 PASS가 아니다. 공통 수정안의 호출자는 인덱서가 해석한 Java 메서드 연결 범위다.
- 공개 tree 패턴 검사와 허용 목록 패키지를 확인했지만 회사별 키워드는 미제공이다. 과거 Git 이력의 마스킹 전 경로·대용량 blob은 남아 있어 공개 전 별도 이력 정리/정제 snapshot 결정이 필요하다. 무시된 `.release-assets/` 원본은 별도 백업해야 한다.

## M5b — 화면 기능 테스트

- 두 테스트베드의 실제 팝업 선언은 0개다. 팝업 감지는 합성 파서 단위 테스트 외 실제 테스트베드 표본이 없어 미검증이다. 검증용 화면 추가는 v0.2 백로그이며 이번에 examples를 바꾸지 않는다.
- v3 선택자는 실제 id → name → 정적 href/th:href 해석값 → 유일한 소스 버튼/링크 텍스트 → 소스 id/name으로 확정한 form 범위의 유일한 버튼 텍스트 순서다. 일치 건수가 1개인 근거만 사용한다. 동적 값 미확정·진입 경로 미확정·현재 조건의 미표시는 BLOCKED로 두고 임의 문구/role/nth/URL을 만들지 않는다.
- fragment 선언/포함·숨김 필드는 인벤토리와 covered_by 연결로 유지하며 독립 TC/엑셀 행을 만들지 않는다. 연결은 정적 포함 관계이며 해당 구조 항목의 독립 PASS를 뜻하지 않는다. 연결된 TC가 SKIP/BLOCKED면 미실행 범위도 그대로 남는다.
- 실행 어댑터의 인증/등록/수정 업무 계약은 두 legacy-board 테스트베드 한정이다. 임의 SI 프로젝트의 인증/CRUD 자동 실행을 보장하지 않는다. 정적 인벤토리는 지원 문법 밖의 동적 DOM 전체를 보증하지 않는다.
- 생성/수정 DB와 SQL 덤프를 보존하며 삭제/다운로드는 SKIP이다. 로그 전용 Oracle 사례는 로컬 H2 앱 패치 평가가 불가능해 BLOCKED다. 학습 패치 탐지 결과를 일반화 성능으로 해석하지 않는다.

## M5a — xlsx 양식과 소스 추출

- 프로그램 목록 기본은 화면 파일/클래스(인터페이스 포함)/SQL 선언별 1행이다. 1.1.0 스키마로 공유 노드를 중복 제거하고 fragment/레이아웃·선택자는 독립 화면에서 제외한다. 기존 endpoint 형식은 명시 옵션으로만 사용한다. 미지원 기술/중첩 클래스/동적 실행의 전수 도출은 보장하지 않는다. 화면명은 정적 title/첫 h1에서 LIKELY로 제안하며 클래스/SQL 업무명은 미확인이다. 프로그램 ID/메타데이터/작성일은 사용자 설정만 사용한다.
- 테이블 정의서는 선택한 DDL/제공 CSV 기준이다. DB 접속·실존 확인은 하지 않는다. 단순 CREATE TABLE/PK/FK/COMMENT만 지원하며 ALTER/CTAS/인용 식별자/생성식 등은 미확인으로 남긴다.
- 검증한 양식 기능: 기본 데이터 유효성(드롭다운), 기본 조건부 서식, 병합, PNG 이미지 바이트/위치, 셀 메모, 수식/캐시, 서식, 다른 시트. 합성 양식 검사이며 모든 Excel 변형과 실제 사용자 양식 보장을 뜻하지 않는다.
- 피벗·차트·매크로·전자서명·외부 연결·도형·스레드 댓글·고급 확장은 보존 보장하지 않는다. 로드 전에 OOXML 부품/확장을 감지해 보고서에 경고하고 PARTIAL로 남긴다. 알 수 없는 기능을 모두 감지하는 검사는 아니다.
- 수식은 계산하지 않는다. 실제 Excel 표시·재계산은 별도 확인이다. 행 이동/삽입·검증/조건부 서식 범위 자동 확장도 하지 않는다. 충분한 빈 영역과 end_row가 필요하다.
- ExcelJS 4.4.0의 기본 인쇄 시작 번호 재직렬화 문제는 비활성 기본값만 저장 중 제외해 보정한다. 사용자 지정 시작 번호는 보존한다.
- buffers@0.1.1은 M5에서 배포본의 라이선스 표시 부족으로 UNRESOLVED였다. M6에서 고정 upstream 커밋의 package.json(MIT/X11)과 설치 index.js의 바이트 일치를 확인해 MIT로 기록했다. README에는 라이선스 문구가 없었다. 근거는 [확인 기록](buffers-license-verification.json)과 [전체 의존성](dependency-licenses.json)에 남긴다.
- 제공된 일반 형식 양식에 대한 검증은 현장 검증을 뜻하지 않는다. M5b 실행/결과서 작성은 별도 단계다. 원래 행 높이/열 너비를 유지하므로 긴 관련 소스·비고는 셀 편집/전체 JSON에서 확인해야 할 수 있다.

## M3 si-debug

- v4 정답 문맥 검사는 Java 메서드/타입, 이름 있는 JS 함수, XML 요소/속성/직접 자식, HTML 시작 태그, JSP 상단 지시어 삽입 경계만 지원한다. 메서드 overload나 중복 요소를 유일하게 좁히지 못하면 실패한다. 범용 컴파일러·XPath·HTML DOM 검증기가 아니며 지원 밖 문맥을 임의로 승인하지 않는다.
- 표준 예외 헤더(줄 시작·Exception in thread 포함), 실제 Caused by/Suppressed 및 줄 분리 헤더를 파싱한다. 임의 WAS 접두사가 각 스택 줄 앞에 붙는 경우는 여전히 정규화가 필요하다. v4의 학습 재채점은 정답/범위 규칙 보정 뒤 대응 평가로 첫 8/10이나 일반화 성능을 대체하지 않는다.

- 마스킹 v3는 알려진 qtp·Tomcat/AJP·JEUS worker/pool·WebLogic ExecuteThread 형식을 보존하고 사용자 홈을 ~/로 치환한다. JEUS/WebLogic 실환경은 실행하지 않았으며 지원 형태는 합성 회귀로 확인했다. 임의 커스텀 풀 이름은 실제 출력 검토가 필요하다. 홈 경로의 나머지 파일명에 있는 개인정보까지 없애는 규칙은 아니다.

- 입력 v2는 실제 재현 9건과 Oracle 형식 합성 1건이다. 05·10의 로그는 접근 수준이라 화면 오동작의 원인을 자체로 증명하지 못한다. 07은 세 SQL 참조를 모두 UNRESOLVED로 유지하며 실제 Oracle 예외/스키마 증거는 없다. 임시 로깅 계측·선택·마스킹 범위는 [캡처 기록](evidence/m3-input-v2/README.md)에 명시한다.
- MyBatis `###` 설명 블록과 Jetty의 줄 분리 `Caused by:`를 지원한다. 프레임에 사용자 코드가 없는 뷰 렌더링 오류도 있으므로 프로젝트 프레임 부재가 오류 부재를 뜻하지 않는다.

- 표준 Java 예외 체인과 프로젝트 패키지 프레임을 지원한다. WAS별 임의 접두사·JSON 포장·난독화·배포본/소스 라인 불일치는 자동으로 해결하지 않는다. 프레임은 증상 위치 후보이며 원인은 에이전트가 소스로 좁힌다.
- Node 파서·계약 검증은 실제 WAS/DB 실행을 대체하지 않는다. Oracle 로그 전용 사례는 미재현으로 유지하며 사용자에게 실행 SQL·schema 메타데이터를 요청한다.
- 자체 학습 10건과 합성 회귀는 일반화 성능 근거가 아니다. 실제 held-out은 구현 동결 후 Ian이 제공하고 승인 전 정답 초안은 채점하지 않는다.
- 세션 자격값을 먼저 가리고 진단 해시를 보존하지만 자유 형식 로그의 모든 개인정보를 완전히 탐지한다고 보장하지 않는다. 의미 불명 숫자는 보수적으로 가린다. 비공개 첫 실행 보존기는 UTF-8 텍스트 산출물만 지원한다.
- 재현 자동 실행기는 Windows·로컬 8080·JDK/Maven을 전제로 한다. 서버 프로세스 정리 실패나 환경 차이는 PASS로 숨기지 않는다. 기존 Java 8 JVM 미검증 제한은 유지한다.

## M2.5 — Thymeleaf 정적 수집

- 최종 v2는 삭제 screen 4/4·server 9/9, PetClinic screen 6/6·server 3/3이며 오류 0건이다. 학습 검색 parity 16/16·screen 7/7, 등록 12/12·5/5, 공존 적용 없음·1/1, 기존 JSP 8건 새 인덱싱 회귀도 PASS다. 선언 scope의 결함 수정 확인이며 일반화 성능이 아니다. 실제 run 5건은 외부 AOP/서버 설정·범위 경계 때문에 PARTIAL이다. [종료 근거](m2.5-final-report.md).
- 첫 구현 `fd1b93c`의 동결 실행은 삭제 screen 과탐 1, PetClinic screen 누락 4/과탐 1로 FAIL이었다. 첫 승인 정답·점수·49개 원본은 그대로 보존한다. screen/server는 승인 라벨을 투영해 같은 비교기로 별도 평가하며 raw full-index/trace 결과 일치도 확인했다. [첫 점수·원본](m2.5-heldout-first-report.md).
- 첫 구현의 submit 중복·Boot 뷰/fragment/private 반환 누락은 사용자 승인 후 일반 규칙으로 수정했다. 수정 전 실패 10건을 먼저 실행·보존했다. 첫 정답·점수·원본은 바꾸지 않는다. v2는 결함 수정 확인이며 일반화 성능이 아니다.
- 삭제 테스트베드는 이전 전체 인덱싱에 포함돼 외부 블라인드 표본과 같다고 주장하지 않는다. PetClinic은 고정 `500158f`·Java 17/Boot 4.1.0 선언 기준이며 빌드·JPA 분석은 수행하지 않았다. JPA 구간은 구현·평가 모두 범위 밖이다. 첫 score FAIL과 실제 스킬 manifest PARTIAL을 구별하며, 보존한 그래프 재검증은 새 평가 실행으로 보지 않는다.
- 테스트베드 렌더링 검증 기준은 Thymeleaf **3.1.5.RELEASE**다. 수집기 요구 범위에는 Thymeleaf 3.0 문법과 3.1에서 제거된 `#request`·`#response`·`#session`·`#servletContext`를 포함하지만, 해당 식을 실행하거나 3.1에서 렌더링 가능하다고 간주하지 않는다. 정적 부분만 확정하고 런타임 값 의존은 미확정으로 남긴다.
- `.html`의 th:action, th:href/th:src URL 식, 경로 변수·쿼리, 정적 이름의 th:replace/insert/include, layout:decorate/fragment, inline JavaScript URL, data URL의 외부 JS 소비를 수집한다. fragment 내부 요청과 같은 파일의 fragment도 연결한다. 레이아웃 본문은 layout_bindings와 decorates 근거에 남기며 여러 화면의 본문을 전역 includes로 연결하지 않는다.
- XML 뷰 판정은 resolver order·viewNames·prefix/suffix·참조·파일 존재를 따른다. Boot는 pom의 org.springframework.boot starter dependency 또는 Gradle의 리터럴 implementation/api/compile/runtimeOnly 좌표를 감지하고 명시적 XML Thymeleaf resolver가 없을 때 기본 구성을 적용한다. Gradle catalog/alias·변수·멀티모듈 의존성 해석, Java 사용자 resolver·자동 구성 제외·환경/서버 override는 지원하지 않는다. 복수 build/config나 profile 재정의가 갈리면 LIKELY로 보수적으로 남긴다.
- Boot 설정은 application*.properties/yml/yaml의 spring.thymeleaf.prefix/suffix만 읽는다. YAML은 들여쓰기 맵과 점 구분 키, 한 줄 리터럴/따옴표 scalar·주석만 지원한다. flow map/list·anchor/alias/tag·block scalar·탭·다중 문서는 확정하지 않는다. profile 문서 활성화/환경 우선순위·import·일반 YAML 병합 파서가 아니며 새 의존성은 없다. 지원 템플릿 확장자는 .html/.htm이다.
- 반환 뷰는 같은 클래스 static final String 리터럴/상수 참조와 private String 반환 메서드 호출 깊이 2까지 확인한다. 인자 값 평가·함수 실행·임의 연산·클래스 밖 상수·오버로드/순환/깊이 초과는 LIKELY다. private helper 경유의 반환 근거를 호출자 renders에 남기며 redirect/forward는 제외한다.
- submit 병합은 화면의 유일한 ID 폼·포함된 스크립트·리터럴 ID .on('submit', function(event))·선행 event.preventDefault·단일 정적 AJAX URL/메서드에 한정한다. 폼과 AJAX 근거를 함께 보존한다. 조건부/다른 endpoint/메서드의 기본 action은 LIKELY이며 복잡한 위임·별칭·반환 false·addEventListener·다중 이벤트 핸들러의 완전 실행 의미를 분석하지 않는다.
- 3.0 유틸 객체가 쿼리 값에 있어도 정적 경로는 읽고, #request.contextPath와 단일 리터럴 루트 경로 조합을 구별한다. #session 등에서 URL 베이스를 얻는 경우는 UNRESOLVED다. 유틸 객체의 임의 메서드 결과나 사용자 값을 실행·추론하지 않는다.
- data URL은 포함된 JS의 리터럴 ID 선택자(쉼표로 여러 ID 가능), .on 이벤트, this 또는 단일 $(this) 별칭, data/attr/dataset 소비에 한정한다. 복잡한 이벤트 위임·클래스 선택자·함수 간 별칭·동적 속성명·JS 재할당/캐시 상태는 완전 분석하지 않는다. 미사용 data 속성을 요청으로 세지 않는다. fragment에 들어 있는 data 요소의 모든 렌더링 문맥 전파도 보장하지 않는다.
- inline JavaScript는 자연 템플릿 주석의 URL과 fallback을 분리하고 단일 리터럴 URL 변수만 추적한다. 임의 JS/OGNL/SpEL 파서가 아니며 복잡한 문자열·리터럴 아닌 동적 URL·템플릿 선택자는 미확정이다. HTML 태그/fragment 범위도 제한된 구조 스캐너이므로 깨진 HTML의 브라우저 복구 동작을 재현하지 않는다.
- viewNames 공존 테스트베드는 이번에도 Java 17/3.1.5 JUnit 2건·HTTP·실제 브라우저의 레이아웃/data AJAX/JSP/등록/검색/삭제를 확인했다. Java 8 런타임은 구성된 환경에 없어 BLOCKED다. 외부 PetClinic·JPA 실행이나 Thymeleaf 3.0 렌더링 성공으로 확대하지 않는다. 검증용 localhost 서버·탭은 종료했고 운영 DB는 사용하지 않았다.

## 기존 지원 범위

- M0·M1·M2를 완료했다. 첫 held-out 60/66과 원본을 보존했고, 일반 결함 수정 후 v2는 66/66이다. v2는 결함 수정 확인이며 일반화 성능이 아니다. 명시 호출 PASS·자동 활성화 1/3 PASS이고 2문항은 미실행이다. si-debug/si-unit-test/si-docs는 미구현이다.
- 스킬 검증기는 전체 YAML 파서가 아니다. 저장소에서 쓰는 문자열·블록·metadata 맵만 지원하며 앵커·태그·배열과 제품별 확장 필드는 거부한다. 참조 검사는 공백 없는 `references/`·`scripts/` 상대 경로만 지원한다. 본문 경로에 공백·동적 치환을 쓰지 않는다.
- manifest 검증은 스키마에 선언된 자료형·필수 필드·열거값·범위·날짜·중복 등을 확인한다. 증거의 진실성이나 CONFIRMED 판단을 자동 보증하지 않는다. `source_revision: null`이면 unverified에 이유를 기록해야 한다.
- 마스킹은 패턴 기반이다. 비밀값·명시적 개인정보 라벨을 우선 마스킹하고 일반 16진수 32/40/64자·UUID 및 유효한 구조화 해시 필드는 보존한다. 그 밖의 긴 숫자 ID를 계좌로 오인할 수 있고, 라벨 없는 짧은 계좌번호·이름·주소·인코딩/분할된 비밀값은 놓칠 수 있다. 실제 로그 외부 전송을 허용하는 보안 경계로 쓰지 않는다. 산출물 저장 전 마스킹 결과를 검토한다.
- 스킬 설치는 심볼릭 링크를 지원하지 않는다. 기존 스킬 폴더는 --force 없이는 건드리지 않는다. --force는 같은 이름의 파일만 덮어쓰며 사용자 전용 파일을 삭제하지 않는다. 쓰기 도중 디스크 오류가 발생하면 부분 설치가 남을 수 있다.
- 공통 모듈 동기화는 지정된 모듈을 복사한다. si-trace에는 mask/indexer/trace/manifest와 스키마를 포함한다. 원본에 없는 복사본 파일은 자동 삭제하지 않고 검토를 요구한다.
- Java 테스트베드는 Java 8 소스 수준의 구형 SI 재현용이다. EOL 라이브러리를 의도적으로 고정하므로 운영에 사용하지 않는다. localhost·합성 데이터만 사용한다.

## M1 — 정적 분석의 한계

- **조건부 JSP:** c:url 변수와 fn:escapeXml, 단순 리터럴 삼항식의 두 요청을 해석한다. 중첩 삼항식·동적 분기·실제 조건의 참/거짓은 해석하지 않는다.
- Java는 단일 최상위 타입·일반 메서드·필드 주입, 단순 constructor/setter 필드 대입 패턴을 수집한다. ClassName.method는 import·같은 패키지의 static 선언으로 연결하며 외부 import는 external로 남긴다. 직접 인자·중첩 로컬 반환 타입·Object/로컬 상속의 대입 가능성으로 단일 overload를 고르지만 전체 Java 타입 분석은 아니다. 내부 타입·wildcard import·복잡한 generic/record/lambda/프록시·가변인자·shadowing은 미지원 또는 제한적이다. 이름 후보 하나가 실제 런타임 빈이라는 뜻은 아니다.
- Spring은 클래스/메서드 매핑의 리터럴 경로·배열·HTTP method와 일부 XML handler mapping을 지원한다. params/headers/consumes/produces, 패턴 URL의 실제 요청 매칭, interceptor 우선순위·세션 값 전파는 완전히 해석하지 않는다. 리터럴 interceptor 포함·제외 Ant 경로와 수집된 XML 빈 참조는 적용하지만 동적 경로·URI 템플릿·런타임 순서는 미지원이다. beans profile은 등록된 properties의 spring.profiles.active/default·리터럴 System.setProperty로만 판별하며, 미확정 조건은 LIKELY와 이유로 남긴다. 임의 Java 계산·복잡한 profile 표현식·서버 override는 확정하지 않는다.
- JS는 열거된 jQuery/fetch/location/form 호출의 제한된 구문만 다룬다. 임의 변수 값 전파, 모듈 import, 함수 반환 URL, 정규식 리터럴·템플릿 표현식·복잡한 event 위임은 완전한 JS AST 분석이 아니다. 모든 미지원 문법이 skipped로 탐지되는 것은 아니다. form.submit은 같은 함수·같은 폼의 선행 action 또는 바인딩된 기본 action을 사용한다. 복잡한 별칭·분기·함수 간 값 전파는 제한적이다. HTML 속성명 대소문자는 구분하지 않고 href fragment/javascript:void(0)는 요청에서 제외한다.
- JSP include와 JS 파일 포함은 소스 관계다. 함수/handler의 includes 연결은 소속 관계이며 그 함수가 실제로 실행됐다는 증거가 아니다. scriptlet Java를 해석하지 않고 외부/벤더 JS를 내려받거나 실행하지 않는다.
- MyBatis/iBatis namespace·statement·include·resultMap 연결을 수집하지만 동적 SQL 분기·resultMap 중첩 association/collection·provider 생성 SQL·map 값 전파를 완전히 해석하지 않는다. `${}` 위치는 표시하되 허용 목록 검증 성공으로 간주하지 않는다. iBatis 2는 합성 fixture 검증이며 실제 eGovFrame 실행 증거가 아니다.
- SQL은 정적 객체 참조를 수집한다. CTE 별칭의 제한된 제외와 단순 콤마 JOIN을 지원하지만 복합 CTE/서브쿼리 별칭/DB 전용 문법/동적 프로시저 내부 SQL의 완전한 해석은 아니다. DDL 선언이 없는 FROM/JOIN 객체의 table-or-view 구분은 미확정이다. JDBC의 동적 테이블명은 UNRESOLVED다.
- SqlSessionFactoryBean 하나의 mapperLocations와 classpath properties 설정으로 선택된 DB XML은 CONFIRMED로 연결한다. factory가 여러 개이거나 프로퍼티/위치가 미해결·중복이면 LIKELY다. Java 설정·환경변수/서버 override·profiles의 활성 컨텍스트·임의 리소스 루트·properties escape/continuation/복잡한 우선순위는 지원하지 않는다. 현재 판단은 소스에 선언된 기본 구성 기준이다.
- `.git`, `.sistack`, `.testbeds`, 빌드/도구 폴더, `src/test`, `evals/private`, 심볼릭 링크, vendor/minified JS는 제외한다. 2 MiB 초과 파일과 UTF-8이 아닌 파일도 제외한다. 따라서 전체 인덱싱 완료는 전체 트리를 순회하고 제외 사유를 기록했다는 의미다.
- 동일 연결은 묶고 근거 위치를 8개까지만 저장한다. `evidence_truncated: true`면 추가 위치가 있다. 파일별 줄 위치는 파서가 보존한 위치이며 모든 위치의 의미를 검수한 것은 아니다. 대규모 통계에 초기 데이터 SQL도 포함된다.
- validateIndex는 그래프 참조·위치·상태·이유의 필수 불변조건을 검사한다. 범용 JSON Schema 엔진이 아니다. 스키마 파일은 별도 소비자가 사용할 계약이다.
- draft 비교는 기대 연결의 누락·범위 내 과탐·상태 불일치를 분리한다. 사용자 승인 전 정확도 점수나 통과 판정으로 보고하지 않는다. source_revision이 바뀌어도 근거 파일 해시가 모두 같으면 비교를 허용하지만 범위 밖 환경 변경의 영향을 보증하지 않는다.

승인 정답과 현재 소스의 모든 해시·근거 라인은 check-expected로 검사한다. 파일 변경 시 자동 정답 갱신 없이 실패한다. 이 검사는 라인에 적힌 주장의 의미나 범위 밖 설정 변경을 검수하지 않는다.

최종 처리 수·skipped 분포·승인 eval은 [M1 종료 보고](m1-final-report.md), 승인 전 기록은 [GATE 보고](m1-report.md)를 따른다.

## M2 — 스킬 검토와 평가의 한계

- 소스 검토는 에이전트가 수행한다. finish의 해시·라인·검토 파일 목록 검사는 근거의 존재를 확인하며 주장 의미의 진실성을 자동 보증하지 않는다.
- prepare는 매번 전체 인덱스를 다시 만든다. 부분 질의의 비선택 DB 후보 ID는 질의 내부 노드로 제한하며 전체 후보는 원본 전체 인덱스에 남는다.
- profile 조건은 v2 일반 규칙에 포함했다. eGovFrame의 동적 Java profile 계산은 자동 확정 범위 밖이어서 dummy interceptor는 LIKELY로 남고 실제 활성 상태는 미확정이다. 중첩 JSP 태그 href와 뷰 기반 테이블·AOP 부수 SQL 등은 여전히 원문 보완이 필요하다.
- report의 includes는 파일/함수 소속 관계다. 공통 스크립트가 포함됐다는 이유만으로 모든 이벤트 실행을 주장하지 않는다.
- M1에서 수정에 쓴 5건의 55개 연결은 학습 평가다. v2에서 모두 일치했으나 새로 찾은 유효한 인증 Helper 호출을 승인 정답이 포함하지 않아 범위 내 과탐 1건으로 집계됐다. 정답을 바꾸지 않아 해당 비교는 FAIL이다. 별도 held-out 첫 실행은 60/66, v2는 66/66이다. 승인 사례를 본 뒤 수정한 자기 적용 평가이며 일반화 성능이 아니다. 과탐 0건도 선언한 scope 밖 모든 출력의 정확성을 뜻하지 않는다.
- forward/redirect, 응답 view, 외부 라이브러리 경계와 역방향 호출 JSP 집합은 held-out 보충 정답에 있다. 기존 연결 비교만으로 이 항목까지 통과했다고 보고할 수 없다.
- 설치본 CLI를 실행한 사실은 Codex 스킬 활성화 증거가 아니다. 사용자 확인과 로컬 manifest 검증으로 명시 호출·자동 질문 1건은 PASS다. [수동 절차](manual-checks.md)의 자동 질문 2건은 미실행이다.
- 첫 held-out AJAX 레코드의 expected_sha256 마스킹 결함은 v2에서 고쳤다. 기존 레코드는 그대로 보존하며 현재 저장기 해시·일반 UUID/해시 보존과 개인정보 마스킹을 회귀 검증했다. 첫 결과를 새 구현으로 재작성하지 않았다.
