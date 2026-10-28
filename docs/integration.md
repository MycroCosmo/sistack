# REQ-001 통합 재실행

승인된 로컬 사본·테스트 실행에만 사용한다. examples 원본과 기존 run을 바꾸지 않고 새 output 경로를 지정한다. JDK/Maven, 설치된 Chrome/Edge, 승인된 결과서 매핑이 필요하며 브라우저를 다운로드하지 않는다.

```json
{
  "allow_execution": true,
  "allow_test_execution": true,
  "source": "examples/legacy-board",
  "output": ".sistack/runs/req001-new-run",
  "maven": "<Maven 실행 파일 절대 경로>",
  "java_home": "<JDK 절대 경로>",
  "auth_settings_file": "examples/configs/legacy-board-docs.json",
  "functional_template": "<사용자 결과서 xlsx 경로>",
  "functional_mapping": "<승인된 1차/2차 결과서 매핑 JSON 경로>"
}
```

환경 경로/원본 양식이 든 설정은 공개 저장소에 커밋하지 않는다. 암호 입력형 인증이면 [auth 설정](auth.md)의 환경 변수 참조만 사용한다.

```sh
node scripts/run-integration.mjs <로컬 설정.json>
node scripts/check-integration.mjs .sistack/runs/req001-new-run <새 검증.json>
node scripts/trace-request.mjs REQ-001 .sistack/runs/req001-new-run/registry.json
```

실행기는 정상 소스에서 테스트를 생성한 뒤 없는 SQL 컬럼 참조 결함을 주입한다. 원인 분석/수정은 이 REQ-001용 합성 시나리오이며 임의 사용자 결함을 자동 해결하는 AI가 아니다. 시나리오 내 수정은 M6 사용자 지시의 승인 범위다. 별도 사본에서 JUnit 수정 전 FAIL·수정 후 PASS와 같은 화면 TC의 1차/2차를 확인한다. 생성/수정 데이터와 DB/SQL 덤프를 보존하며 삭제하지 않는다. 중간 실패도 보존하고 같은 output을 다시 쓰지 않는다.

manifest 체인과 개별 결과는 registry/summary에 남는다. `check-integration`은 보존된 증거를 대조하는 명령이며 앱을 새로 실행하지 않는다. 원시 1차 파일/점수는 보정 결과로 덮어쓰지 않는다.
