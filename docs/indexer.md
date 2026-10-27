# M1 인덱서 사용법

Node.js 18 이상. 추가 npm 의존성이나 DB 연결이 필요하지 않다. 기본 JSON 계약은 [index.schema.json](../schemas/index.schema.json)이다. 지원 범위는 [limitations](limitations.md)를 먼저 확인한다.

```sh
node scripts/build-index.mjs examples/legacy-board --summary
node scripts/query-index.mjs examples/legacy-board/.sistack/index/index.json --from /board/list.do --depth 8 --format text
node scripts/query-index.mjs examples/legacy-board/.sistack/index/index.json --to BOARD --depth 8
```

기본 출력 파일은 대상 프로젝트의 `.sistack/index/index.json`이다. 다른 위치는 `--out 파일.json`으로 지정한다. 기존 파일이 있으면 실패하며, 재생성할 파생 결과임을 확인한 뒤에만 `--force`를 붙인다. 원본 파일과 eval 초안은 변경하지 않는다.

`--summary`가 없으면 index JSON을 stdout에도 출력한다. 큰 프로젝트에서는 `--summary`를 사용한다. summary의 skipped는 파일 개수가 아니라 제외 디렉터리·파일·미지원 패턴의 기록 수다. `duration_ms`는 읽기·수집·연결·Git 메타데이터 수집까지이며 최종 마스킹·검증·JSON 직렬화·파일 쓰기는 포함하지 않는다.

질의의 `--from`과 `--to`는 하나만 지정한다. 정확한 JSP 경로, URL 경로, `HTTP /경로`, `전체패키지.클래스#메서드`, `클래스#메서드`, `namespace.id`, DB 객체 이름을 사용한다. 이름이 중복이면 모든 후보를 시작점으로 삼는다. `--depth`는 0~100이며 기본값은 8이다. JSON 출력의 frontier가 있으면 지정 깊이 밖에 연결이 더 있다. DB 객체 이름은 대문자로 정규화한다.

## 초안 비교

```sh
node scripts/eval-index.mjs examples/legacy-board/.sistack/index/index.json evals/trace/legacy-board-search/expected.draft.json --draft
```

초안은 반드시 `--draft`로 실행한다. 결과는 `DRAFT_PREVIEW`, `scoring: false`이며 차이가 있어도 정확도 통과/실패를 선언하지 않는다. 승인 후 `expected.json`과 `review_status: approved`를 사용할 때만 PASS/FAIL을 반환한다. 이번 M1 GATE에서는 승인용 파일을 만들지 않았다.

정답의 scope는 출발 노드·관계 종류·선택적인 근거 위치로 비교 범위를 정한다. 같은 이름의 DB별 SQL은 논리 연결로 비교하며 하나라도 상태가 다르면 상태 불일치로 표시한다. source_revision이 다르거나 작업 트리에 변경이 있으면 모든 정답 근거 파일의 SHA-256이 같아야 비교할 수 있다. 해시 일치는 범위 밖 설정 변경의 무해함을 보증하지 않는다.

## 이번 GATE 재현

```sh
node scripts/fetch-testbed.mjs egovframe
node scripts/build-index.mjs .testbeds/egovframe --out .sistack/m1-egov-index.json --summary --force
node scripts/build-index.mjs examples/legacy-board --out .sistack/m1-legacy-index.json --summary --force
node scripts/eval-index.mjs .sistack/m1-egov-index.json evals/trace/egov-detailcode-list/expected.draft.json --draft
npm test
```

`--force`는 이 예제의 파생 인덱스를 다시 만들 때만 사용한다. eGovFrame은 고정 커밋을 재사용하며 수정한 checkout을 덮어쓰지 않는다. 실제 애플리케이션/DB를 실행하지 않는다. 검사 결과와 한계는 [GATE 보고서](m1-report.md)에 기록했다.
