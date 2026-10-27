# M1 인덱서 사용법

## M2.5 채점 계약 확장

- 인덱스에 `template` 노드와 `renders`·`decorates` 연결을 허용한다. `requests`·`includes`는 기존 종류를 재사용한다. 이는 그래프 계약 확장이며 Thymeleaf 수집기는 아직 구현 전이다.
- 새 [정답 스키마](../schemas/expected.schema.json)의 `score_groups: ["parity", "screen"]`과 edges/scope의 group을 사용하면 두 그룹을 각각 채점한다. 합산 expected/matched 필드는 출력하지 않는다. 그룹 없는 기존 정답은 이전 점수 형식을 유지한다.
- `parity_reference`는 기존 승인 JSP 정답 파일과 SHA-256이다. check-expected는 기준 승인본의 화면 requests를 제외한 서버 from/to/kind/status와 parity가 같은지 검사한다. 파일/라인·소스 해시도 검사한다. JSON Schema만으로 표현하기 어려운 참조·중복·그룹 범위 불변조건은 `lib/indexer/expected.mjs`와 check-expected가 검증한다.
- screen의 data AJAX 출발은 `list.html#요소ID`, fragment 도착은 `fragment파일#fragment이름`이다. requests의 도착 endpoint만 HTTP 메서드를 보존하고 쿼리·fragment를 제외한 경로로 비교한다. 다른 연결은 선택자를 그대로 비교한다.
- 공존 전용 사례는 parity 0개를 applicable:false로 표시한다. 초안은 기존대로 DRAFT_PREVIEW/scoring:false이며 자동 승인하지 않는다.
- 기존 8건 회귀 재현: `node scripts/check-eval-compat.mjs 7e133f1 .sistack/eval-compat-recheck.json`. 출력은 새 경로를 사용한다. 보존 v2-final trace에 같은 현재 승인 정답을 넣어 이전/현재 비교기를 대조하며 새 수집기 실행 결과가 아니다.

## 기본 사용

Node.js 18 이상. 추가 npm 의존성이나 DB 연결이 필요하지 않다. 기본 JSON 계약은 [index.schema.json](../schemas/index.schema.json)이다. 지원 범위는 [limitations](limitations.md)를 먼저 확인한다.

```sh
node scripts/build-index.mjs examples/legacy-board --summary
node scripts/query-index.mjs examples/legacy-board/.sistack/index/index.json --from /board/list.do --depth 8 --format text
node scripts/query-index.mjs examples/legacy-board/.sistack/index/index.json --to BOARD --depth 8
```

기본 출력 파일은 대상 프로젝트의 `.sistack/index/index.json`이다. 다른 위치는 `--out 파일.json`으로 지정한다. 기존 파일이 있으면 실패하며, 재생성할 파생 결과임을 확인한 뒤에만 `--force`를 붙인다. 원본 파일과 eval 초안은 변경하지 않는다.

`--summary`가 없으면 index JSON을 stdout에도 출력한다. 큰 프로젝트에서는 `--summary`를 사용한다. summary의 skipped는 파일 개수가 아니라 제외 디렉터리·파일·미지원 패턴의 기록 수다. `duration_ms`는 읽기·수집·연결·Git 메타데이터 수집까지이며 최종 마스킹·검증·JSON 직렬화·파일 쓰기는 포함하지 않는다.

질의의 `--from`과 `--to`는 하나만 지정한다. 정확한 JSP 경로, URL 경로, `HTTP /경로`, `전체패키지.클래스#메서드`, `클래스#메서드`, `namespace.id`, DB 객체 이름을 사용한다. 이름이 중복이면 모든 후보를 시작점으로 삼는다. `--depth`는 0~100이며 기본값은 8이다. JSON 출력의 frontier가 있으면 지정 깊이 밖에 연결이 더 있다. DB 객체 이름은 대문자로 정규화한다.

## 승인 정답 비교

```sh
node scripts/eval-index.mjs examples/legacy-board/.sistack/index/index.json evals/trace/legacy-board-search/expected.json
```

승인본 expected.json과 review_status: approved를 사용할 때 PASS/FAIL을 반환한다. 새 초안은 expected.draft.json과 명시적 `--draft`로만 미리보기하며 DRAFT_PREVIEW, scoring: false를 반환한다.

정답의 scope는 출발 노드·관계 종류·선택적인 근거 위치로 비교 범위를 정한다. file 선택자를 지정한 SQL은 해당 DB 파일만 정답으로 인정한다. 이름만 지정한 경우 DB 변형이 논리 연결로 묶이며 하나라도 상태가 다르면 상태 불일치로 표시한다. source_revision이 다르거나 작업 트리에 변경이 있으면 모든 정답 근거 파일의 SHA-256이 같아야 비교할 수 있다. 해시 일치는 범위 밖 설정 변경의 무해함을 보증하지 않는다.

## M1 최종 검증 재현

```sh
node scripts/fetch-testbed.mjs egovframe
node scripts/build-index.mjs .testbeds/egovframe --out .sistack/m1-egov-final-index.json --summary --force
node scripts/build-index.mjs examples/legacy-board --out .sistack/m1-legacy-final-index.json --summary --force
node scripts/eval-index.mjs .sistack/m1-egov-final-index.json evals/trace/egov-detailcode-list/expected.json
npm test
```

`--force`는 이 예제의 파생 인덱스를 다시 만들 때만 사용한다. eGovFrame은 고정 커밋을 재사용하며 수정한 checkout을 덮어쓰지 않는다. 실제 애플리케이션/DB를 실행하지 않는다. 검사 결과와 한계는 [종료 보고서](m1-final-report.md)에 기록했다.

## 정답의 근거 유지

`node scripts/check-expected.mjs`는 evals/trace의 승인 JSON 전체를 검사하며 npm test에도 포함된다. source_root는 저장소 상대 경로, source_files는 원본 바이트의 SHA-256이다. 모든 evidence는 해시가 고정된 파일의 실제 라인을 가리켜야 한다. 소스가 없으면 BLOCKED, 해시/라인이 달라지면 FAIL로 종료하며 정답을 자동 수정하지 않는다. 승인본을 바꾸려면 소스를 다시 읽고 사용자 검토 조건에 따라 수정한다.

정적 endpoint→인터셉터 관계는 intercepted_by다. 세션/CSRF 분기와 실제 요청 성공 여부는 별도 검증 대상이다. mapperLocations로 선택된 SQL의 executes에는 설정 근거를 추가하며, candidates에는 선택되지 않은 동일 sqlId 노드가 남는다. 미해결 설정에서는 가능한 SQL 후보를 LIKELY로 연결한다.
