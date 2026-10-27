# M3 입력 v2 실행 증거

> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

입력 현실성 재검토를 위한 실행 기록이다. JDK 17.0.14 / Maven 3.9.10 / Jetty 9.4, 승인된 임시 local H2 테스트베드만 사용했다. 이전 정상/결함 비교는 `../m3-reproduction/`에 보존했다. 이번에는 결함 상태 9건을 실제 HTTP로 다시 실행했다.

## 수집 방법

```powershell
node scripts/reproduce-debug.mjs <case-id> <mvn.cmd> <JAVA_HOME> docs/evidence/m3-input-v2/runtime/<case-id>.json capture
node scripts/refresh-debug-inputs.mjs docs/evidence/m3-input-v2/runtime
npm.cmd test
```

`runtime/<id>.json`은 실제 관측과 임시 계측 경로, `runtime/<id>.json.server.txt`는 서버 stdout/stderr 전체를 최초 마스킹한 기록이다. 로그를 자르거나 예외·SQL 줄을 수작업으로 보충하지 않았다. JVM의 `... N more` 축약과 Jetty 중복 출력도 그대로 둔다. 공통 예외 처리기에 잡힌 예외와 Thymeleaf 렌더링 예외가 출력되도록 **임시 복사본에만** 로깅 계측을 추가했다. Spring 초기화는 Jetty ServletContext 로그로 출력된다. SLF4J provider를 추가하지 않았다.

05·10의 입력은 위 기록에서 접근 이벤트만 선택한다. 나머지 7개 실행 사례의 입력은 전체 기록이다. 캡처된 요청 경로에는 쿼리·본문·쿠키가 없다. 예외 없는 사례에는 관측 assertion이나 `displayedLastPage` 같은 원인 힌트를 넣지 않았다. HTTP 검증 결과는 입력 밖의 실행 JSON에만 있다.

각 입력 중간에 합성 개인정보 한 줄을 삽입했다. `runtime/<id>.masked.txt`는 그 입력을 다시 마스킹한 결과다. 회귀 검사는 합성 줄 외의 캡처 전체, SQL·스택 프레임·클래스 해시·트랜잭션 UUID가 그대로인지 바이트 해시로 비교한다. 이메일 패턴은 `email=` 접두사도 함께 가리는 기존 동작을 유지한다. 세션 ID는 해시 모양이어도 가린다.

07의 출처는 `evals/debug/repro/oracle-format.log`다. **Oracle DB를 실행한 로그가 아니라** MyBatis 예외 형식을 재구성한 합성 입력이다. 날짜 조건 2개와 ORDER BY의 같은 식별자 참조를 한 SQL에 담았으며 바인딩 값은 `?`로 남긴다.

## 실행 결과

| 사례 | 실제 관측 | 입력 줄 수 (합성 줄 포함) |
|---|---|---:|
| 01 | 목록 500, BindingException | 202 |
| 02 | JS가 만든 lists.do 요청 404 | 122 |
| 03 | 저장한 한글 제목 불일치, HTTP 200 | 124 |
| 04 | 익명 목록 500, NullPointerException | 182 |
| 05 | 11건에서 다음 링크 없음, 직접 2페이지 200 | 27 |
| 06 | 제목순 200, 등록일순 500, MyBatis/H2 예외 | 308 |
| 07 | 실제 DB 미실행, 합성 Oracle 형식 | 41 |
| 08 | 목록 500, TemplateProcessingException | 479 |
| 09 | 목록 404 | 124 |
| 10 | 본문 한글 정상, 공통 조각 불일치, HTTP 200 | 5 |

9건의 재현 PASS는 **결함이 관측됐음**을 뜻하며 원인 적중률이 아니다. 10건 모두 Codex 자기 작성 학습 세트다.

## 실패 이력과 검증

- `01-binding.json.server.txt`: 최초 계측의 `Filter.init` 누락으로 AbstractMethodError가 발생했다. Jetty의 Servlet 런타임에 맞춰 init/destroy를 명시한 뒤 `runtime/`에 새 실행을 남겼다. 이 실패 기록은 덮어쓰지 않았다.
- 새 MyBatis 입력 테스트는 처음에 실패했다. `### Cause:`를 root 예외로 오인하던 파서를 수정해 실제 `PersistenceException → SQLSyntaxErrorException` 체인과 프레임 소속을 보존했다. 실제 Jetty 로그의 줄 분리 `Caused by:`도 실패를 확인한 뒤 지원했다.
- `npm-test.txt`는 첫 전체 통과 기록, `npm-test-final.txt`는 Jetty 줄 분리 처리까지 포함한 최종 전체 검사 출력이다. Node 123/123, 실패·스킵 0, 스킬 3개 및 공통 코드 복사본 검사 PASS.
- 추가 5개 테스트는 입력 10건의 출처/마스킹, 실제 예외 4건, 예외 없는 2건, Oracle 초안의 세 후보, 채점기의 누락/확정 거부를 검증한다. 채점기 테스트는 별도 합성 fixture이며 실제 학습 정답을 승인하거나 채점한 것이 아니다.
