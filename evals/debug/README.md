# M3 학습 세트와 비공개 평가

Codex가 만든 아래 10건은 **자기 작성 편향이 있는 학습 세트**다. 증상 재현 성공은 원인 위치 적중이나 일반화 성능이 아니다. 정답은 expected.draft.md/json이며 Ian의 승인 전에는 채점하지 않는다.

| 사례 | 테스트베드 | 재현 입력 | 확인할 차이 |
|---|---|---|---|
| [01-binding](cases/01-binding/expected.draft.md) | JSP | ADMIN 로그인 후 목록 | MyBatis role/roleKey 불일치로 500 |
| [02-js-url](cases/02-js-url/expected.draft.md) | JSP | 검색 submit의 JS URL 실행 | lists.do 404 |
| [03-request-encoding](cases/03-request-encoding/expected.draft.md) | JSP | 한글 POST 등록 후 상세 | 요청 인코딩 값 오설정으로 제목 불일치 |
| [04-session-bypass](cases/04-session-bypass/expected.draft.md) | JSP | 익명 목록 접근 | 로그인 이동 대신 currentUser NPE |
| [05-paging](cases/05-paging/expected.draft.md) | JSP | 총 11건 / pageSize 10 | 마지막 페이지 링크 없음, 예외 없음 |
| [06-sort-sql](cases/06-sort-sql/expected.draft.md) | JSP | sort=title와 createdAt 비교 | createdAt만 SQL 오류 |
| [07-oracle-log-only](cases/07-oracle-log-only/expected.draft.md) | JSP 소스 참고 | ORA-00904 로그만 | 실제 DB 없이 원인 단정 금지 |
| [08-thymeleaf-utilities](cases/08-thymeleaf-utilities/expected.draft.md) | Thymeleaf 3.1.5 | 로그인 후 목록 | #request/#session 템플릿 처리 오류 |
| [09-view-resolver](cases/09-view-resolver/expected.draft.md) | Thymeleaf/JSP | board/list 반환 | JSP resolver가 받아 JSP 404 |
| [10-fragment-encoding](cases/10-fragment-encoding/expected.draft.md) | JSP | 목록 렌더링 | 본문 정상·paging.jspf 한글만 깨짐 |

각 case.json은 대상 테스트베드의 기준 파일 해시와 패치 해시를 고정한다. 7번의 bug.patch는 빈 파일이며 Oracle 결함을 H2로 재현했다고 주장하지 않는다. symptom.log는 가짜 개인정보가 들어 있는 **합성 입력**이다. 실제 실행 증거는 docs/evidence/m3-reproduction/에 따로 둔다.

## 임시 복사본과 분석

```sh
node scripts/eval-debug.mjs prepare 08-thymeleaf-utilities
# 출력 project는 OS 임시 폴더다. 두 examples 원본에 패치를 적용하지 않는다.
node skills/si-debug/scripts/debug.mjs prepare <project> --log evals/debug/cases/08-thymeleaf-utilities/symptom.log --symptom "이관 후 화면 오류" --package kr.sistack.board --from /board/list.do --run-id debug-08-first
# 소스를 읽고 evidence/diagnosis.json을 작성한다. expected를 답안으로 복사하지 않는다.
node skills/si-debug/scripts/debug.mjs finish <project> debug-08-first
```

임시 복사본의 변경 파일만 LF로 정규화해 Git autocrlf 설정에 따른 해시 차이를 없앤다. 원본은 바이트 해시로 변경 여부를 검사한다. 기존 파일 수정 패치만 허용하고 생성/삭제/이름 변경·링크·경로 탈출은 거부한다. 임시 폴더는 결과 검토용으로 보존하며 자동으로 원본을 수정하거나 삭제하지 않는다.

## 증상 재현 (승인된 로컬 H2만)

자동 서버 실행은 Windows에서 제공한다. Maven과 JDK 11/17의 절대 경로를 지정한다. 8080이 비어 있어야 하며, 실행 때마다 새 임시 복사본을 만들고 끝나면 자신이 시작한 서버 프로세스 트리를 종료한다.

```sh
node scripts/reproduce-debug.mjs 08-thymeleaf-utilities <mvn.cmd> <JAVA_HOME> .tmp/08-normal.json baseline
node scripts/reproduce-debug.mjs 08-thymeleaf-utilities <mvn.cmd> <JAVA_HOME> .tmp/08-bug.json
```

baseline은 임시 복사본에 원본 파일을 복사한 정상 실행이다. patched는 결함 상태가 관측돼야 PASS다. 데이터 생성은 local H2에서만 수행하며 probe 종료 시 생성 게시글 삭제를 시도한다. 5번은 초기 데이터 1건인 새 서버가 필요하다. 원인 진단 결과를 채점하지 않는 재현 도구다.
다른 OS에서는 prepare 출력 디렉터리에서 `mvn -q jetty:run`을 실행하고 `probeCase`를 호출한다. Maven Central·JDK·서버 실행이 막히면 BLOCKED로 기록하고 같은 명령을 로컬에서 실행한다. Oracle 7번은 실행하지 않는다.

예외 타입을 추가 확인하려면 `repro/M3ExceptionProbeTest.java`를 패치 임시 프로젝트의 src/test/java/kr/sistack/board/에 복사하고 `mvn -q -Dtest=M3ExceptionProbeTest -Dm3.case=08-thymeleaf-utilities test`를 실행한다. 01-binding/04-session-bypass/06-sort-sql도 같은 방식이다. 예외가 발생해야 통과하는 재현용 검사이며 M4의 수정 후 회귀 테스트와 구분한다.
3번 최초 매핑 누락 패치는 Jetty 기본 UTF-8 때문에 재현 FAIL이었다. 그 기록을 보존하고 값 오설정으로 보강했다. `*-patched-v2.json`은 재현 보강 결과이며 held-out 재평가가 아니다.

## 동결과 승인 후 평가

```sh
node scripts/eval-debug.mjs freeze docs/evidence/m3-freeze.json
```

동결은 구현·테스트·스키마·CLI·스킬 지침의 파일 해시와 Git revision을 저장한다. 수정이 생기면 기존 동결을 덮어쓰지 않고 새 동결·새 run으로 구분한다.
Ian의 승인 뒤에만 expected.draft.json을 expected.json으로 복사하고 review_status=approved, approved_by에 승인 근거를 기록한다. 7번의 위치는 확인할 SQL 후보이며 확정된 실제 원인 위치가 아니다. 상태 UNRESOLVED를 유지하는지 함께 비교한다.

```sh
node scripts/eval-debug.mjs score <run-dir> <expected.json> training <새-score.json> docs/evidence/m3-freeze.json <private-root>
```

스킬 결과와 정답의 file/line/status를 비교한다. 기대 위치를 놓치거나 추가 후보 위치를 단정하면 전체 hit=false다. 파일 해시가 다르면 점수 대신 오류를 낸다. 승인 전 초안을 사용하거나 기존 결과를 덮어쓰는 실행은 거부한다.

## held-out은 Ian의 실제 사례만

현재 실제 사례를 열거나 채점하지 않는다. **구현 동결 후** Ian이 evals/private/<id>/에 마스킹한 symptom, 관련 소스 발췌(project/), 승인한 expected.json을 넣는다. 학습 세트와 동일한 정답 JSON 계약을 쓰되 dataset=held-out, source_files는 제공한 프로젝트 상대 경로·바이트 해시다.
스킬 run도 해당 private/project/.sistack/runs 아래에 둔다. 외부 저장소 소스나 실제 사례를 공개 디렉터리로 복사하지 않는다.

```sh
node scripts/eval-debug.mjs score evals/private/<id>/project/.sistack/runs/<run-id> evals/private/<id>/expected.json held-out evals/private/<id>/score.json docs/evidence/m3-freeze.json evals/private
```

동결 후 생성한 run만 채점한다. 첫 점수와 마스킹된 실행 원본·동결 revision을 private/<id>/first-run.json에 exclusive로 보존한다. 이후 재채점은 차단하며 수정 후 평가에는 별도 지시·별도 실행 계획이 필요하다. 콘솔·공개 보고에는 **위치와 적중 여부만** 출력한다. 실제 로그·소스·진단 내용은 인용·출력·커밋하지 않는다. 원본 실행 파일은 UTF-8 텍스트만 지원한다.
