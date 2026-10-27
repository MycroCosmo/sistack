# M3 증상 재현 기록

모두 자체 학습 사례이며 원인 적중 채점이 아니다. JSON의 PASS는 요청한 정상/결함 동작이 관측됐다는 뜻이다.

- 정상 9회: `01`~`06`, `08`, `09`의 `*-baseline.json`과 `10-baseline-retry.json`.
- 결함 최종 9회: `01`, `02`, `08`, `09`, `10`의 `*-patched.json` 및 `03`~`06`의 `*-patched-v2.json`.
- 최초 3번 실패: `03-request-encoding-patched.json`. 필터 매핑 누락만으로 Jetty에서 한글이 깨지지 않았다. 원본 기록을 보존했다.
- 첫 환경 차단: `10-baseline.json.server.txt`. 샌드박스 loopback 권한 오류이며 제한 밖 재실행은 PASS다.
- `*-exception.txt`: 임시 프로젝트에서 실행한 실제 JUnit 예외 타입 검증. 4개 프로젝트에서 각각 1개 테스트 통과.
- `*.server.txt`: 마스킹한 Jetty 출력. 첫 환경 차단 로그는 줄끝 공백만 정리했다. Thymeleaf 테스트베드의 기존 SLF4J provider 없음 경고는 그대로이며 의존성을 추가하지 않았다.

실행기: `scripts/reproduce-debug.mjs`. Java JUnit probe: `evals/debug/repro/M3ExceptionProbeTest.java`.
결과의 project는 실행 때 만든 OS 임시 디렉터리다. 원본 examples 프로젝트에는 패치를 적용하지 않았다. 7번은 Oracle 로그만 있는 사례로 여기서 재현하지 않는다.
