# M3 마스킹 v3 증거

> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

2026-10-28 사용자 지시로 스레드 이름 보존·홈 경로 일반화를 고친 결과다. 이전 m3-freeze.json, m3-freeze-v2.json과 입력 v2 증거는 보존한다.

- `masking-red.txt`: 수정 전 새 테스트 4개 FAIL, 기존 3개 PASS. 기록도 수정 후 마스킹해 홈 경로·합성 개인정보를 제거했으므로 실패 당시 원문과는 표시가 다를 수 있다. 실패 상태와 테스트 이름은 유지했다.
- `runtime/<id>.json`, `.json.server.txt`: JDK 17.0.14 / Maven 3.9.10 / Jetty에서 새로 수집한 9건. 실제 qtp 숫자가 보존되고 홈 경로는 저장 전에 일반화됐다. 실행 JSON의 경로 필드에도 같은 규칙을 적용했다.
- 05·10 입력은 접근 이벤트만 선택한다. 다른 7개 실행 사례는 전체 스택·SQL·Spring/Jetty 메시지를 유지한다. 입력마다 합성 개인정보 한 줄을 중간에 삽입했다. 07은 승인된 Oracle 형식 합성 로그를 사용하며 실제 Oracle 재현이라고 주장하지 않는다.
- `runtime/<id>.masked.txt`: 증상 입력 10건을 다시 마스킹한 사본. input-provenance.json의 masked_output·출처/선택/입력 해시로 대조한다. 이전 qtp의 REDACTED 값을 추정해 되돌리지 않고 새 실제 캡처로 바꿨다.
- `npm-test.txt`: 최종 127/127, 실패·스킵 0. 스킬 3개·공통 코드 복사본·승인 정답 freshness 검사 PASS.
- `freeze-before-commit.json`: 커밋의 원문 공백 검사가 막힌 상태에서 먼저 생성된 준비 기록이다. 채점에는 사용하지 않는다. 공백은 수정하지 않고 검사 예외를 좁혀 커밋한 뒤 정식 v3 동결을 다시 생성한다.

사용한 명령:

```powershell
node --test test/debug-mask.test.mjs
node scripts/reproduce-debug.mjs <id> <mvn.cmd> <JAVA_HOME> docs/evidence/m3-mask-v3/runtime/<id>.json capture
node scripts/refresh-debug-inputs.mjs docs/evidence/m3-mask-v3/runtime
npm.cmd test
node scripts/eval-debug.mjs freeze docs/evidence/m3-freeze-v3.json
```

마스킹 예외는 세션·비밀값 처리 뒤에 적용한다. 같은 스레드의 두 로그 줄을 묶을 수 있는지, 인접한 개인정보·자격값이 계속 가려지는지, 홈 일반화가 반복 적용해도 변하지 않는지 검사했다. JEUS/WebLogic에 대해서는 합성 형식 검증이며 실환경 실행 증거는 없다.
