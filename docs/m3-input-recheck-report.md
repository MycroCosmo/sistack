> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 입력 현실성 재검토 GATE — 2026-10-27

상태: **PARTIAL — 요청한 입력 보강·검증·새 동결 완료, 10건 재검토 대기.** 원인 위치 채점과 실제 held-out 첫 실행은 하지 않았다.

### 한 일

- 실행 가능한 9건의 symptom.log를 임시 테스트베드에서 새로 캡처했다. 예외 4건은 전체 스택을 포함하고, 06은 실제 MyBatis `### Error querying database / The error may exist in file / The error may involve / SQL:` 블록을 포함한다. 05·10은 접근 로그만 남겼다. 나머지는 Spring 초기화·Jetty 출력도 유지했다.
- symptom.md 10건을 사용자가 화면에서 볼 수 있는 말로 다시 썼다. 원인·내부 구조 힌트와 합성 디버그 줄을 제거했다. 입력 중간의 명시된 합성 개인정보 한 줄만 마스킹 검사에 사용한다.
- 각 사례에 input-provenance.json을 추가해 출처·선택·해시·합성 줄 위치를 기록했다. [실행 및 마스킹 증거](evidence/m3-input-v2/README.md)에 캡처 전체와 마스킹 결과가 있다. 줄바꿈은 LF로 정규화하되 줄 내용·순서·공백은 보존한다.
- 07은 MyBatis PersistenceException → SQLSyntaxErrorException, `###` 블록과 `?` 바인딩 SQL로 재작성했다. **실제 Oracle 캡처는 아니다.** [정답 초안](../evals/debug/cases/07-oracle-log-only/expected.draft.md)은 BoardMapper.xml의 **23·26·34행 모두 UNRESOLVED**이며 한 후보만 제시하거나 확정하면 FAIL이다.
- 실제 입력에서 드러난 MyBatis 메시지 블록 오인과 Jetty 줄 분리 Caused by 처리 결함을 수정하고 단독 설치 복사본에 동기화했다.

### 검증

| 실행 | 결과 | 표본·범위 |
|---|---|---|
| `reproduce-debug.mjs <id> <mvn.cmd> <JAVA_HOME> <새 출력> capture` | PASS | JDK 17.0.14 / Maven 3.9.10에서 결함 9건의 HTTP 증상과 실제 로그 수집. 원인 적중 평가가 아님 |
| `node --test test/debug-inputs.test.mjs` | PASS | 새 검사 5개: 입력 10건 출처/마스킹, 예외 4건, 접근 로그 2건, Oracle 3개 후보 및 채점기 누락/확정 거부 |
| `npm.cmd test` | PASS | [최종 출력](evidence/m3-input-v2/npm-test-portable.txt): 123/123, 실패·스킵 0. 승인 정답 freshness, 스킬 3개, 공통 복사본 검사 포함 |
| Git 저장 로그와 provenance 해시 | PASS | [10/10 일치](evidence/m3-input-v2/checkout-check.json). CRLF/LF 차이로 새 체크아웃 검증이 깨지지 않도록 정규화 |
| 원본·과거 기록 보존 | PASS | examples 두 테스트베드, 이전 m3-freeze.json·m3-report.md·재현 기록 변경 0 |
| 학습 적중 평가 / 실제 held-out | 미실행 | 재GATE 전 학습 정답을 승인 처리하지 않음. private 내용 열람·출력·커밋 없음 |

세션 ID·전화·이메일·계좌는 마스킹되고, 진단 클래스 해시·트랜잭션 UUID·SQL·프레임은 보존되는지 전체 입력을 비교했다. 이메일 마스킹이 `email=` 라벨까지 포함하는 기존 동작은 유지한다. 자유 형식 개인정보 완전 탐지를 보장하는 수치는 아니다.

최초 캡처의 Filter.init 누락 실패 기록은 별도로 보존했다. 초기 파서 회귀 실패도 수정 전에 확인했다. 재현 서버는 종료했고 최종 확인에서 8080 LISTEN은 없었다.

### 결정

- 의존성 추가 없이 임시 복사본에 로깅만 계측했다. 승인된 local H2 외 DB나 외부 서비스는 사용하지 않았다. [결정 기록](decisions.md)에 선택 이유를 남겼다.
- 캡처/입력 보강은 `1b1af63`, 줄바꿈 해시 호환 보정은 `3884a3e`에 커밋했다.
- [새 동결](evidence/m3-freeze-v2.json)은 **3884a3eb1c53f20124254413551c8340805dd08f / 172개 파일**이다. 입력·정답 초안·코드·스킬 지침·평가/재현 도구·테스트를 함께 고정했다. [이전 동결](evidence/m3-freeze.json)은 그대로 보존한다.
- 실제 로그로 바꿔도 10건은 Codex 자기 작성 **학습 세트**다. 자기 작성 편향이 있으며 일반화 성능으로 보고하지 않는다. 이후 승인된 첫 평가는 새 동결을 사용한다.

### 남은 문제

- Oracle 실행 환경·실제 배포 SQL/스키마 근거가 없으므로 07의 원인은 미재현·미확정이다. 소스의 세 참조 위치를 찾았다고 실제 실패 지점을 확정하지 않는다.
- 이번 로그 재수집은 JDK 17·Jetty 기준이다. JDK 11/Java 8·JEUS/WebLogic 실환경은 이번 재수집에서 검증하지 않았다.
- 학습 적중 점수와 held-out 첫 점수는 아직 없다. 기존 첫 GATE의 Oracle 분석 예시는 역사적 기록이며 이번 세 후보 정답을 대체하지 않는다.

### 사용자 확인 필요

[10건 검토 목록](../evals/debug/README.md)의 symptom.md/log와 expected.draft.md/json을 재검토한다. 특히 07의 **기간 조건 2곳 + ORDER BY 1곳, 모두 UNRESOLVED** 기준을 확인한다. 승인 전에는 채점하지 않는다.

재GATE 승인 후 학습 평가를 수행하고, Ian이 새 동결 이후 제공하는 실제 사례는 evals/private 안에서 첫 점수·원본·리비전을 보존한다. 공개 보고에는 위치·적중 여부만 남긴다. `prompts/M3.md`의 **[GATE] 정답 승인 + 실제 사례**에서 멈추며 M4에는 착수하지 않는다.
