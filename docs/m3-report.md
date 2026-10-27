> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 정답 승인 GATE — 2026-10-27

상태: **PARTIAL — 구현·검증 완료, 학습 정답 승인과 실제 held-out 제공 대기.** M3 전체 완료나 원인 적중 평가 통과를 선언하지 않는다. M4에는 착수하지 않았다.

### 한 일

- M2.5 완료 승인을 확인하고 요청한 10건·학습/held-out 구분·스택트레이스 마스킹 조건을 M3 프롬프트에 먼저 반영해 `87adf55`로 커밋했다.
- [si-debug](../skills/si-debug/SKILL.md): 한국어 활성화 설명, 로그 우선 분석·후보 소거·근거 단계·미재현·diff 제안, 기술별 참고 자료와 단독 설치 CLI를 작성했다.
- [분석 도구](../lib/debug/index.mjs): 마스킹한 예외 체인·프로젝트 프레임 추출, 인덱서 직접 호출, 소스 해시/라인·검토 계약 검증, report/manifest 생성. 소스를 자동 수정하지 않는다.
- [학습 사례 10건](../evals/debug/README.md): JSP 테스트베드 8건, Thymeleaf/JSP 테스트베드 2건. 9개 패치와 Oracle 로그 전용 빈 패치 1개이며 모두 expected.draft.md/json이다.
- [평가 도구](../scripts/eval-debug.mjs): 원본 해시 확인 → OS 임시 복사본만 패치 → 승인된 정답과 위치/상태 비교. 코드 동결과 비공개 첫 실행 exclusive 보존, 공개 출력의 위치·적중 여부 제한을 구현했다.
- 로그 회귀에서 발견한 JSESSIONID 누출을 `a844404`에서 수정했다. 클래스 해시·트랜잭션 UUID 보존과 개인정보 마스킹을 함께 검사한다.

### 검증

| 실행 | 결과 | 표본·범위 |
|---|---|---|
| `npm.cmd test` | PASS | Node 118개, 실패·스킵 0. 기존 108개 + M3 10개. 기존 승인 정답 freshness, 스킬 3개 형식·공통 복사본 검사 포함 |
| M3 집중 Node 검사 | PASS | 10개. 마스킹 3개·파서/분석/독립 설치/임시 패치/첫 실행 보호 7개 |
| `reproduce-debug.mjs … baseline`와 패치본 | PASS | JDK 17.0.14 / Maven 3.9.10 / Jetty, 정상 9회·결함 9회 최종 비교. 결함 관측이 패치 실행의 PASS이며 수정 완료나 적중 점수가 아님 |
| `mvn -q -Dtest=M3ExceptionProbeTest -Dm3.case=<id> test` | PASS | 임시 프로젝트 4개에서 각각 JUnit 1개. BindingException·NPE·H2 SQL 예외·TemplateProcessingException의 실제 원인 체인 확인 |
| si-debug 직접 실행 예시 | PASS/PARTIAL | Thymeleaf 실제 재현은 원인 분석 PASS·5단계, Oracle 로그 전용은 UNRESOLVED/PARTIAL·2단계·미재현. manifest 2개 계약 검사 PASS |
| 소스 보호·privacy | PASS | 두 원본 테스트베드 변경 없음. 패치 10건의 원본 불변·적용 소스 위치/해시 검사. 실제 evals/private 내용 읽기·출력·커밋 없음 |
| 원인 위치 적중 채점 | 미실행 | 학습 정답 승인 전. 실제 held-out 미제공·미열람. 적중률/일반화 성능 수치 없음 |

최종 재현 관측:

| 사례 | 정상본 | 패치본 |
|---|---|---|
| 1 바인딩 | 목록 200 | 목록 500, BindingException |
| 2 JS URL | list.do 200 | 실제 JS submit이 만든 lists.do 404 |
| 3 요청 인코딩 | 한글 제목 일치 | 제목 불일치 |
| 4 인증 우회 | 익명 접근 302 | 500, NullPointerException |
| 5 페이징 | 11건에서 다음 페이지 링크 있음 | 링크 없음, 직접 2페이지는 200, 예외 없음 |
| 6 정렬 SQL | title/createdAt 모두 200 | title 200, createdAt 500, SQL 예외 |
| 7 Oracle | 로컬 재현 대상 아님 | 원인 후보·추가 SQL/스키마 정보 요청 유지 |
| 8 Thymeleaf utility | 목록 200 | 500, TemplateProcessingException |
| 9 뷰 공존 | 목록 200 | JSP 경로 선택으로 404 |
| 10 공통 조각 | 본문·페이징 한글 정상 | 본문 정상, 페이징 조각 한글 깨짐 |

[재현 기록](evidence/m3-reproduction/README.md)과 [Thymeleaf 분석 예시](evidence/m3-demo/08-thymeleaf-utilities/report.md), [Oracle 미재현 예시](evidence/m3-demo/07-oracle-log-only/report.md)를 확인할 수 있다. 검증 서버는 종료했으며 마지막 확인에서 8080 LISTEN은 없었다.

### 결정

- 외부 의존성을 추가하지 않고 기존 인덱서·마스킹·IO·manifest 검증을 재사용했다. 자세한 이유는 [decisions](decisions.md)의 M3 항목에 기록했다.
- 3번 최초 필터 매핑 누락 패치는 Jetty 기본 UTF-8 때문에 재현 FAIL이었다. 실패 기록을 보존하고 실제 요청 encoding 값 오설정으로 보강했다. 이 변경은 학습 사례 보정이며 held-out 결과 수정이 아니다.
- 첫 Jetty 실행의 샌드박스 loopback 차단과 첫 npm의 임시 Git 쓰기 차단은 실행 권한 범위를 조정해 해결했다. 의존성·네트워크 정책 우회용 다운로드는 추가하지 않았다.
- 모든 10건은 Codex가 직접 만든 **학습 세트**다. 자기 작성 편향이 있으며 실제 사례에 대한 일반화 근거로 쓰지 않는다.
- 동결 범위에는 공통 라이브러리·스킬 본문/참고/CLI·테스트·스키마·평가/재현 스크립트·학습 입력/초안이 포함된다. [동결 기록](evidence/m3-freeze.json)의 파일 해시·revision을 기준으로 후속 첫 평가를 수행한다.
- 동결 구현은 `5fc2b79fd3bfb3833f772c69794181b9214b32a2`이며 **157개 파일**의 해시를 저장하고 다시 확인했다. [전체 Node 검증 출력](evidence/m3-tests.txt)도 보존했다.

### 남은 문제

- 정답 10건은 아직 사용자 승인 전이다. 학습 적중 점수와 실제 held-out 첫 점수는 없다.
- Oracle 접속·실제 실행 SQL·스키마가 없으므로 7번은 미재현이다. 운영·개발 DB에는 접속하지 않았다.
- 이번 재현은 JDK 17·Jetty 기준이다. JDK 11 재실행, Java 8 JVM, JEUS/WebLogic 실환경, Codex 한국어 자동 활성화는 이번 단계에서 확인하지 않았다.
- 자유 형식 로그의 개인정보 완전 탐지는 보장하지 않는다. 지원하는 Java 스택 형식·마스킹 경계와 텍스트 전용 첫 실행 보존 한계는 [limitations](limitations.md)에 기록했다.

### 사용자 확인 필요

1. [10건 정답 초안 목록](../evals/debug/README.md)의 원인 위치·설명·상태를 검토·승인한다. 특히 7번의 위치는 조사 후보이며 확정 원인이 아니다.
2. 구현 동결 후 `evals/private/`에 마스킹한 실제 사례 2~3건과 승인 정답을 준비한다. 구조·명령은 위 평가 절차를 따른다.
3. 승인 후 학습 10건과 실제 held-out을 따로 실행한다. 실제 사례의 첫 점수·원본·동결 revision은 private 안에 보존하고 공개 보고에는 위치·적중 여부만 남긴다. 첫 실행 전에는 사례를 보고 구현을 수정하지 않는다.

`prompts/M3.md`의 **[GATE] 정답 승인 + 실제 사례**에 따라 여기서 멈춘다.
