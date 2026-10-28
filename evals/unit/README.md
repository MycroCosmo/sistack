# M4 평가 절차

## v2 일반 규칙 보정

첫 held-out 0/3은 `evals/private/m4-heldout-first/`에 그대로 둔다. `skills/si-unit-test/scripts/generate-tests.mjs`로 두 정상 examples 프로젝트에서 `v2/<testbed>/coverage-plan.json`, `test-plan.json`, `generated/`를 만든다. 생성 설정은 `fixtures.json`과 기존 회귀 테스트 경로만 지정하고 패치·해설·사례 ID를 입력하지 않는다. 자동 도출 32개 + 기존 회귀 16개를 함께 실행한다.

실행 설정에 각 프로젝트의 `coverage_plan`과 `plan_file`을 지정하고, evaluation spec의 `generated`를 해당 생성 폴더로 지정한다. `run_prefix: "m4-v2-<case-id>"`로 새 run-id를 사용한다. 기존 학습 13건과 이미 관찰한 held-out 3건의 v2는 결함 수정 확인이고 일반화 성능이 아니다.

후속 신규 3건용 동결은 `node scripts/eval-unit-test.mjs freeze docs/evidence/m4-freeze-v2.json <protocol-config.json>`으로 수행한다. config의 protocol은 `v2/registry.json`의 generations/first_output을 사용한다. 새 첫 결과는 `evals/private/m4-next-heldout-first/`에 생성하며 이전 첫 결과와 v2 재검증을 덮어쓰지 않는다. 도구는 새 동결에 결합된 프로젝트별 생성 테스트·계획을 사용한다. 패치가 제공되고 별도 실행 지시를 받기 전까지 멈춘다.

`cases.json`은 실행 전 분류이고 정답 점수 파일이 아니다. M3 기존 13건은 모두 학습이다. 생성 테스트 16개는 `generated/`의 Java 3개와 `test-plan.json`으로 고정한다. 원본 테스트베드에 복사하지 않고 임시 사본에 설치한다. 목록 조회는 화면이 사용하는 목록 필드, 본문은 상세 조회에서 검증한다.

## 실행 환경

`skills/si-unit-test/references/result-contract.md` 형식의 설정 JSON을 준비한다. test_pattern은 `M4*Test`, plan_file은 이 폴더의 test-plan.json 절대 경로다. 기존 Maven·JDK 경로만 지정하고 다운로드·POM 변경을 하지 않는다. 두 정상 테스트베드에서 각각 16/16 PASS를 먼저 확인한다.

## 학습 평가

`node scripts/eval-unit-test.mjs training <spec.json> <config.json>`

spec은 `id`, `source`(건강한 examples 프로젝트), `output`(존재하지 않는 새 경로), `patch`, `baseline_results`, `eligible`를 포함한다. 탐지 가능한 사례에는 `proposal`(보존된 v5 evidence/diagnosis.json 경로), `parent_run_ids`도 지정한다.

기존 M3 held-out은 제공 사본과 출제 원본의 **공통 src/main 파일** 차이로 로컬 패치를 만들어 private에만 둔다. 제공하지 않은 README/smoke는 포함하지 않는다. 새 held-out을 이 학습 절차로 읽지 않는다. 로그 전용 Oracle은 패치가 없어 실행 BLOCKED다.

실제 패치 적용은 저장소 밖 임시 경로에서 수행하고 대상 파일 해시가 바뀌었는지 확인한다. 평가용 프로젝트와 Maven 실행 작업 사본은 구분한다. 결함→v5 수정 과정에서 생성 테스트는 변경하지 않는다. 수정 후 통과 여부를 보고하며 미탐·빌드 오류·환경 실패를 구별한다. 정상 기준선의 모든 테스트 ID가 결함 실행에도 있어야 탐지로 인정한다.

`weak/WeakReturnTest.java.fixture`는 약한 테스트 재현 자료이며 생성 테스트 집합에 넣지 않는다. 같은 get 반환값 null 변이에서 호출만 확인하는 fixture는 통과하고, 최종 M4ServiceTest는 반환 객체·본문 단언으로 실패해야 한다.

## 신규 held-out 동결 GATE

학습/회귀 완료 후 코드·생성 테스트·계획·평가기를 커밋한다. `node scripts/eval-unit-test.mjs freeze docs/evidence/m4-freeze.json`으로 파일별 해시와 리비전을 기록하고 멈춘다. 이후 Claude가 새 패치 3건을 `evals/private/m4-heldout/<id>/bug.patch`에 제공한다. 패치·해설·정답을 에이전트에게 출력하지 않는다.

별도 사용자 실행 지시 후 `node scripts/eval-unit-test.mjs held-out <private-spec.json> <config.json>`을 사용한다. spec 예시:

```json
{
  "phase": "first",
  "freeze": "<repo>/docs/evidence/m4-freeze.json",
  "output": "<repo>/evals/private/m4-heldout-first",
  "cases": [
    { "id": "new-01", "testbed": "legacy-board", "patch": "<repo>/evals/private/m4-heldout/new-01/bug.patch" },
    { "id": "new-02", "testbed": "legacy-board-thymeleaf", "patch": "<repo>/evals/private/m4-heldout/new-02/bug.patch" },
    { "id": "new-03", "testbed": "legacy-board", "patch": "<repo>/evals/private/m4-heldout/new-03/bug.patch" }
  ]
}
```

이 예시는 빈 형식 안내이며 새 사례를 출제한 것이 아니다. 실제 testbed는 출제자의 메타데이터로 결정한다. 도구는 동결 해시 확인 후 패치를 적용하고, 콘솔에는 사례 ID와 DETECTED/MISSED/BLOCKED만 반환한다. 출력 경로를 고정해 첫 결과 덮어쓰기를 막는다. 부분 실패 기록도 보존하고 첫 점수를 학습과 합산하지 않는다. 신규 패치·테스트·진단을 보며 고치는 것은 첫 결과 보고 이후 별도 승인 대상이다.
