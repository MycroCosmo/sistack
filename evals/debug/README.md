# M3 학습 세트와 비공개 평가

Codex가 만든 아래 10건은 **자기 작성 편향이 있는 학습 세트**다. 증상 재현 성공은 원인 위치 적중이나 일반화 성능이 아니다. Ian이 2026-10-28 정답 10건을 승인했으며 승인본은 각 expected.json이다. [승인 근거](approval-20261028.json)에 기존 초안과 승인본 해시를 기록했다. expected.draft.md/json은 검토 이력으로 보존한다.

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

각 case.json은 대상 테스트베드의 기준 파일 해시와 패치 해시를 고정한다. 7번의 bug.patch는 빈 파일이며 Oracle 결함을 H2로 재현했다고 주장하지 않는다.

입력 v2의 9개 symptom.log는 임시 테스트베드에서 **실제로 캡처한 로그**다. 05·10은 접근 로그만 선택하고 나머지는 Spring 초기화·Jetty·전체 예외 스택과 SQL 블록을 보존한다. 중간의 `[SYNTHETIC MASK FIXTURE]` 한 줄만 마스킹 검사용 합성 데이터다. 07은 실제 Oracle 실행 없이 MyBatis 예외 형식을 재구성했으며 `input-provenance.json`에 합성임을 명시했다. 각 provenance에는 캡처 파일·선택 방법·해시·합성 줄 위치가 있다. 마스킹 결과도 [입력 v2 실행 기록](../../docs/evidence/m3-input-v2/README.md)에 보존했다.

symptom.md에는 화면에서 관찰할 수 있는 말만 적는다. 원인·SQL/서비스 구조와 정답 설명은 검토용 expected.draft에만 둔다. 승인 후 스레드 보존·사용자 홈 일반화를 보강하고 **입력 v3**로 9건을 재캡처했다. 07은 같은 Oracle 합성 로그를 사용한다. 최신 출처와 마스킹 결과는 각 input-provenance.json을 따른다. 이전 v2 증거·동결은 보존한다.

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
node scripts/reproduce-debug.mjs 08-thymeleaf-utilities <mvn.cmd> <JAVA_HOME> .tmp/capture/08-thymeleaf-utilities.json capture
```

baseline은 임시 복사본에 원본 파일을 복사한 정상 실행이다. patched는 결함 상태가 관측돼야 PASS다. 데이터 생성은 local H2에서만 수행하며 probe 종료 시 생성 게시글 삭제를 시도한다. 5번은 초기 데이터 1건인 새 서버가 필요하다. 원인 진단 결과를 채점하지 않는 재현 도구다.
capture도 patched 실행이다. 임시 복사본에 접근/미처리 예외 필터를 넣고 기존 공통 예외 처리기에 전체 스택 출력을 추가한다. Jetty 내장 StdErrLog를 사용해 의존성을 추가하지 않는다. 요청 본문·쿼리·쿠키를 별도로 출력하지 않으며 stdout/stderr는 UTF-8 스트림으로 끝까지 수집하고 마스킹 후 저장한다. 계측 경로는 실행 JSON에 기록한다. 원본 테스트베드는 수정하지 않는다.

9건을 같은 새 디렉터리에 `<id>.json`으로 수집한 다음 `node scripts/refresh-debug-inputs.mjs <캡처 디렉터리>`로 학습 입력을 갱신한다. 이 명령은 symptom.log/md와 provenance를 갱신하므로 입력 변경이 승인된 작업에서만 실행한다. 07은 `repro/oracle-format.log`를 사용한다.
다른 OS에서는 prepare 출력 디렉터리에서 `mvn -q jetty:run`을 실행하고 `probeCase`를 호출한다. Maven Central·JDK·서버 실행이 막히면 BLOCKED로 기록하고 같은 명령을 로컬에서 실행한다. Oracle 7번은 실행하지 않는다.

예외 타입을 추가 확인하려면 `repro/M3ExceptionProbeTest.java`를 패치 임시 프로젝트의 src/test/java/kr/sistack/board/에 복사하고 `mvn -q -Dtest=M3ExceptionProbeTest -Dm3.case=08-thymeleaf-utilities test`를 실행한다. 01-binding/04-session-bypass/06-sort-sql도 같은 방식이다. 예외가 발생해야 통과하는 재현용 검사이며 M4의 수정 후 회귀 테스트와 구분한다.
3번 최초 매핑 누락 패치는 Jetty 기본 UTF-8 때문에 재현 FAIL이었다. 그 기록을 보존하고 값 오설정으로 보강했다. `*-patched-v2.json`은 재현 보강 결과이며 held-out 재평가가 아니다.

## 동결과 승인 후 평가

```sh
node scripts/eval-debug.mjs freeze docs/evidence/m3-freeze-v4.json
```

동결은 구현·테스트·스키마·CLI·스킬 지침의 파일 해시와 Git revision을 저장한다. 수정이 생기면 기존 동결을 덮어쓰지 않고 새 동결·새 run으로 구분한다.
2026-10-28 승인을 expected.json의 review_status=approved, approved_by에 기록했다. 7번은 BoardMapper.xml의 23·26·34행을 모두 후보로 남기고 UNRESOLVED를 유지해야 한다. 하나만 제시하거나 확정하면 FAIL이다. 기존 `m3-freeze.json`·`m3-freeze-v2.json`과 GATE 보고를 보존하고 마스킹 보정 후 첫 학습 채점에는 `m3-freeze-v3.json`을 사용한다. 진단은 로그·인덱스·실제 소스를 읽고 작성하며 expected.json에서 답안을 복사하지 않는다.

```sh
node scripts/eval-debug.mjs score <run-dir> <expected.json> training <새-score.json> docs/evidence/m3-freeze-v4.json <private-root>
```

스킬 결과와 정답의 위치/status를 비교한다. 기대 위치를 놓치거나 추가 후보 위치를 단정하면 전체 hit=false다. 파일 해시가 다르면 점수 대신 오류를 낸다. 승인 전 초안을 사용하거나 기존 결과를 덮어쓰는 실행은 거부한다.

## 위치 정정과 삭제형 범위 (v4)

첫 8/10 원본은 docs/evidence/m3-training-first/와 e136ce1에 보존한다. 2026-10-28 사용자 승인으로 06 정답을 getSort():67에서 getSortColumn() 반환문:78로 정정했고, approval-20261028.json의 amendments에 승인 오류·정정 사유·날짜·전후 위치/해시를 추가했다. 처음 records는 바꾸지 않았다.

모든 승인 위치에는 구조 문맥을 뜻하는 enclosing이 필수다. 예:

```json
{"file":"src/main/java/kr/sistack/board/domain/BoardSearch.java","line":78,"enclosing":{"kind":"java-method","name":"BoardSearch#getSortColumn"}}
```

`check-expected.mjs`는 승인 debug 사례도 임시 복사본에 패치를 적용한 상태에서 해시·라인·enclosing을 확인한다. 동일한 return 문장이 다른 메서드에 있어도 거부한다. 지원 문맥은 java-method(클래스#메서드), java-type, javascript-function(이름 있는 함수), xml-element(요소명+attributes 또는 직접 자식 name/text), markup-tag(시작 태그+attributes), jsp-preamble/directives다. 소속이 모호하거나 지원하지 않는 형태는 추정하지 않고 실패한다.

삭제형 원인에만 line 대신 `{file,start,end,enclosing}`을 쓴다. 같은 file/status이고 진단 line이 start..end에 있으면 일치하며 양 끝을 포함한다. 범위는 실제 enclosing 안에 있어야 한다. 04는 mvc:interceptor 블록의 승인 범위 9..13이다. 10은 첫 콘텐츠 앞 지시어 삽입 경계 1..1이며 본문 전체를 허용하지 않는다. 일반 원인은 정확한 line 비교를 유지한다. Oracle 세 UNRESOLVED 후보 조건도 유지한다.

v4 재검증에는 `docs/evidence/m3-freeze-v4.json`과 새 run-id를 사용한다. 첫 진단 위치는 유지한 대응 비교이며 정답 정정/비교 규칙 변경에 따른 점수 차이를 분석 개선으로 주장하지 않는다. held-out 첫 실행도 이후 별도 지시 시 최신 v4 동결을 사용한다.

## held-out은 Ian의 실제 사례만

현재 실제 사례를 열거나 채점하지 않는다. **구현 동결 후** Ian이 evals/private/<id>/에 마스킹한 symptom, 관련 소스 발췌(project/), 승인한 expected.json을 넣고 별도 실행을 지시한다. 학습 세트와 동일한 정답 JSON 계약을 쓰되 dataset=held-out, source_files는 제공한 프로젝트 상대 경로·바이트 해시다.
스킬 run도 해당 private/project/.sistack/runs 아래에 둔다. 외부 저장소 소스나 실제 사례를 공개 디렉터리로 복사하지 않는다.

```sh
node scripts/eval-debug.mjs score evals/private/<id>/project/.sistack/runs/<run-id> evals/private/<id>/expected.json held-out evals/private/<id>/score.json docs/evidence/m3-freeze-v4.json evals/private
```

동결 후 생성한 run만 채점한다. 첫 점수와 마스킹된 실행 원본·동결 revision을 private/<id>/first-run.json에 exclusive로 보존한다. 이후 재채점은 차단하며 수정 후 평가에는 별도 지시·별도 실행 계획이 필요하다. 콘솔·공개 보고에는 **위치와 적중 여부만** 출력한다. 실제 로그·소스·진단 내용은 인용·출력·커밋하지 않는다. 원본 실행 파일은 UTF-8 텍스트만 지원한다.
