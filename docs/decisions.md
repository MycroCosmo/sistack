# 설계 결정

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
