# M5 단위테스트 결과서 입력

`scripts/schemas/test-results.schema.json`을 따른다. 모든 테스트에 클래스·메서드·한국어 업무 표시 이름·대상 클래스/메서드·PASS/FAIL/ERROR/SKIP·밀리초·마스킹 실패 메시지·XML 상대 경로가 있다. 실행 환경·source_revision·run-id·생성 시각과 전체 집계를 보존한다.

test-plan.json은 `{"패키지.클래스#메서드":{"display_name":"게시글 조회 결과를 전달한다","target_class":"대상 클래스","target_method":"get"}}` 형식이다. 선택한 테스트마다 하나를 명시한다. Surefire XML에 계획이 없거나 계획의 테스트가 빠지면 BLOCKED다. JUnit 4의 실제 메서드명은 유지한다.

실행 설정 JSON:

```json
{
  "run_id": "unit-001",
  "test_pattern": "BoardUnitTest",
  "plan_file": "C:/project/test-plan.json",
  "maven": "C:/tools/apache-maven/bin/mvn.cmd",
  "java_home": "C:/tools/jdk-17",
  "allow_test_execution": true,
  "parent_run_ids": ["debug-001"]
}
```

`allow_test_execution`은 실제 사용자 실행 승인을 반영할 때만 설정한다. fresh run 디렉터리에 XML을 생성하므로 과거 target/surefire-reports를 성공 근거로 가져오지 않는다. `execution_status`는 SUCCESS/TEST_FAILURE/BUILD_FAILURE/BLOCKED다. 빌드 오류·테스트 0건·누락·타임아웃은 탐지가 아니며 BLOCKED로 보고한다. 건너뛴 테스트가 있으면 전체 PASS로 기록하지 않는다.

독립 XML 변환: `node <skill>/scripts/surefire-to-json.mjs <report.xml> <plan.json>`은 마스킹된 테스트 행을 표준 출력한다. 실제 실행 근거·환경을 갖춘 M5 입력은 run-tests가 만든 test-results.json을 사용한다. M5에서는 `validateTestResults`로 스키마·집계·중복을 검사한다.
