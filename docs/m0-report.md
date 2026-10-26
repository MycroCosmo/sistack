> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M0 종료 GATE 보고 — 2026-10-27

이 문서는 첫 GATE의 기록이다. 인프라는 이후 승인됐으며 legacy-board 수정 결과는 [재검토 보고서](m0-recheck-report.md)를 따른다.

상태: **PARTIAL — 구현·아래 실행 검증 완료, Ian의 테스트베드 구조 승인 대기.** M1에는 착수하지 않았다.

### 한 일

- Node.js 표준 라이브러리만 사용해 manifest·스킬 검증, 설치, 공통 모듈 동기화, 마스킹, eGovFrame 가져오기 도구를 구현했다.
- `skills/si-example/` 1개를 Codex/Claude용 별도 임시 경로에 설치하고 공통 모듈을 독립 실행했다. 네 제품 스킬은 아직 구현하지 않았다.
- Spring MVC XML + 어노테이션, MyBatis XML/인터페이스/SqlSessionTemplate, JSP/JSTL/jQuery 게시판을 작성했다. 화면·URL·17개 Java 클래스·Mapper 목록은 [examples/README.md](../examples/README.md)에 있다.
- [함정 목록](../evals/legacy-board-traps.md)에 필수 패턴 6종을 포함해 위치를 정리했다. eval 정답을 생성하거나 승인된 것으로 취급하지 않았다.
- 공식 eGovFrame v4.2.4의 `2303751d76c119b56dc2e6b6fe1002adafbef938`을 `.testbeds/egovframe/`에 받았다. 저장소 커밋 대상에서는 제외했다.
- 로컬 Git 저장소를 초기화하고 검증 단위별로 커밋했다. 원격 저장소·태그·푸시는 만들지 않았다.

### 검증

| 실제 실행/검사 | 결과 | 표본·범위 및 증거 단계 |
|---|---|---|
| `npm.cmd test` | PASS | Node 테스트 8개, 실패·스킵 0; 예제 스킬 1개 형식·공통 복사본 일치; 4단계 |
| JDK 17.0.14, Maven 3.9.10: `mvn -q test` | PASS | JUnit 테스트 2개, 실패·오류·스킵 0; Service 단위 1개와 실제 MVC/Mapper/H2 흐름 1개; 4단계 |
| JDK 11.0.27, Maven 3.9.10: `mvn -q clean test package` | PASS | 같은 테스트 2개와 WAR 생성; 4단계 |
| WAR ZIP 엔트리 검사 | PASS | WAR 1개에 H2·JUnit·Mockito·spring-test·로컬 datasource·초기 SQL 미포함; 4단계 |
| 클래스 헤더 검사 | PASS | 테스트베드 본체 17개 클래스 전부 major 52(Java 8). H2 Driver.class도 major 52; Java 8 JVM 자체 실행은 미검증 |
| `mvn -q jetty:run` + `node smoke.mjs` | PASS | JDK 17 localhost 실제 앱 1개. 로그인·역할·JSP·CRUD·검색·출력 이스케이프·로그아웃; 5단계(HTTP) |
| Codex/Claude CLI 설치 + `scripts/check.mjs` | PASS | `.tmp/m0-codex`, `.tmp/m0-claude`에 각각 예제 1개 설치·실행; 4단계 |
| `node scripts/fetch-testbed.mjs egovframe` | PASS | 공개 저장소 1개 고정 커밋 클론·재실행 확인; 로컬 변경 보호는 별도 합성 Git 테스트 1개로 확인; 4단계 |
| `git diff --check` | PASS | 변경 파일 공백 오류 검사 |

처음 실행에서 재마스킹의 닫는 괄호 중복과 Windows 기본 인코딩에 따른 한글 초기 데이터 검색 실패를 발견해 원인 위치에서 수정했다. 최종 검사에서는 재현되지 않는다. 기본 샌드박스의 임시 `.git` 쓰기·localhost 연결 제한은 해당 실행 권한으로 해결했다. Maven Central 접근은 성공했다.

서버는 검증 후 종료했다. 실행하려면 [테스트베드 실행 절차](../examples/README.md)를 따른다. 현재 머신의 JDK/Maven은 PATH에 없으므로 아래와 같이 실행할 수 있다.

```powershell
$env:JAVA_HOME = 'C:/Users/Ian/.jdks/corretto-17.0.14'
cd examples/legacy-board
& 'C:/Users/Ian/.m2/wrapper/dists/apache-maven-3.9.10-bin/53h08a94dg6djh6umvruv7q564/apache-maven-3.9.10/bin/mvn.cmd' -q test
& 'C:/Users/Ian/.m2/wrapper/dists/apache-maven-3.9.10-bin/53h08a94dg6djh6umvruv7q564/apache-maven-3.9.10/bin/mvn.cmd' jetty:run
```

### 결정

- 사용자가 승인한 Java 의존성은 테스트베드 pom에만 추가했다. H2는 test, jQuery는 MIT 정적 파일, javax 기반과 `<release>8</release>`를 유지한다.
- 공식 명세에 맞지 않는 `_example` 대신 `si-example`을 사용한다. 근거와 한계는 [설계 결정](decisions.md), [한계](limitations.md)에 기록했다.
- [Codex 공식 문서](https://developers.openai.com/codex/skills) 확인 경로: 저장소 `.agents/skills/`, 사용자 `~/.agents/skills/`. `$si-example` 명시 호출, 설명 기반 자동 활성화, 선택 `agents/openai.yaml` 메타데이터.
- [Claude Code 공식 문서](https://code.claude.com/docs/en/skills) 확인 경로: 저장소 `.claude/skills/`, 사용자 `~/.claude/skills/`. `/si-example` 호출. 제품 전용 frontmatter 확장은 공통 원본에 추가하지 않았다.

### 남은 문제

- 브라우저에서 버튼 클릭·JS 실행·시각적 화면 검수는 하지 않았다. HTTP는 실제 JSP를 렌더링했지만 브라우저 조작 검증을 대신하지 않는다.
- 실제 Oracle DB, eGovFrame 자체 빌드·실행, Codex/Claude 제품 내 자동 활성화는 미검증이다. 설치 파일과 Node 실행만 M0에서 확인했다.
- 마스킹은 패턴 기반이며 이름·주소·라벨 없는 짧은 계좌·변형 비밀값의 완전 제거를 보장하지 않는다. YAML/JSON Schema 검증도 문서화된 범위만 지원한다.
- Spring 5.3 등은 의도적으로 구버전을 쓰며 EOL·CVE 경고가 있다. 운영 용도가 아니며 전체 의존성 취약점 감사를 수행하지 않았다.

### 사용자 확인 필요

`prompts/M0.md`의 종료 `[GATE]`에 따라 여기서 멈춘다. [기능·화면·URL·클래스·Mapper 목록](../examples/README.md)과 [함정 목록](../evals/legacy-board-traps.md)이 실제 SI 프로젝트 모양에 적합한지 검토해야 한다. 승인 또는 수정 지시 전에는 다음 마일스톤으로 진행하지 않는다.
