> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M2 진행 보고 — held-out 정답 승인 GATE

상태: **PARTIAL**. `si-trace` 공통 구현과 학습 세트 검증을 완료했다. 사용자 지정 held-out 3건은 **미승인 초안**이며 실행·채점하지 않았다. M3는 시작하지 않았다.

## 한 일

- [si-trace](../skills/si-trace/SKILL.md): 한국어 활성화 문구, 범위 설정, 원문 검토, 단순/복잡 분기, 화면·서버·SQL 탐색, 숨은 경로 6종과 보고서 작성 절차.
- `lib/trace/` 및 설치본 CLI: 새 골격 생성 → 소스 검토 기록 → 해시·라인·manifest 검증 → 최종 보고. 미검토 골격은 최종 보고서와 구분한다. 소스는 읽고 결과는 `.sistack/`에만 쓴다.
- 독립 설치에 필요한 indexer/trace/mask/manifest와 스키마를 동기화했다. 저장소 밖으로 스킬 폴더만 복사한 CLI 테스트도 통과했다.
- `scripts/eval-trace.mjs`와 `evals/trace/datasets.json`: training/held-out 분리, 미승인 정답 거부, 원본 결과·도구 지문·정답/보고서 해시 저장, 기존 결과 덮어쓰기 거부.
- held-out은 인덱서 출력 없이 공개 고정 revision의 원문으로만 초안을 작성했다. 초안 근거 검사는 `DRAFT_SOURCES_VALID`로 표시하며 채점·승인을 뜻하지 않는다.

## 검증

`npm test`: **65/65 PASS**, 승인 정답 5건과 초안 3건의 해시·근거 라인 검사 통과, 스킬 2개 형식·공통 복사본 일치 확인. 이번 변경은 Java/JSP 테스트베드 소스를 바꾸지 않아 Maven·브라우저 smoke는 재실행하지 않았다.

학습 세트는 **M1 인덱서 수정에 사용한 5건**이다. 아래 결과는 에이전트가 자기 자신에게 스킬을 적용하고 원문 검토로 골격을 보완한 결과다. 독립 정확도나 전체 프로젝트 정확도로 해석하지 않는다.

| 학습 사례 | 정답 연결 | 일치 | 누락 | 과탐 | 상태 불일치 | 실제 분기 |
|---|---:|---:|---:|---:|---:|---|
| legacy-board-search | 17 | 17 | 0 | 0 | 0 | complex / parallel |
| legacy-board-create | 14 | 14 | 0 | 0 | 0 | complex / parallel |
| egov-clcode-delete | 6 | 6 | 0 | 0 | 0 | simple / direct |
| egov-detailcode-list | 13 | 13 | 0 | 0 | 0 | complex / parallel |
| egov-rss-columns | 5 | 5 | 0 | 0 | 0 | simple / direct |
| 합계 | **55** | **55** | **0** | **0** | **0** | 단순 2 / 복잡 3 |

스킬 결과 전체에는 174개 연결이 있고, 위 표는 승인 정답의 source/kind/위치 범위 55개만 비교한다. 전체 결과의 미확정 경로와 AOP 내부 미검증 때문에 **분석 manifest 5건은 모두 PARTIAL**이다. 비교 점수 PASS와 분석 완결 상태를 혼동하지 않는다. 최종 manifest 5/5 검증 통과.

[기계 판독용 학습 평가](evidence/m2-training-summary.json), [구현 동결 지문](evidence/m2-baseline.json), [실제 실행 스냅샷](evidence/m2-training/)에 근거를 보존했다. 첫 골격 v1은 부분 그래프 후보 참조 오류로 확정하지 못했으며 채점하지 않았다. 수정 후 v2를 새 run-id로 실행했다. 각 원본 평가 JSON은 요약에 적힌 `.sistack/m2-training-results/` 경로와 SHA-256으로 식별한다.

학습 결과 원문 보완은 다음과 같다. 정답 파일은 바꾸지 않았다.

- eGovFrame 3건: `dummy` 프로필의 AuthenticInterceptor를 기본 `security` 구성의 활성 경로에서 제외했다. Listener의 프로필 설정, globals와 XML 선언을 함께 확인했다.
- 공통상세코드: 중첩 JSP 태그 때문에 미확정이었던 상세 href를 원문 Controller 매핑과 대조했다. GET fallback과 onclick POST를 구별했다.
- legacy-board: [함정 목록](../evals/legacy-board-traps.md)의 14개 패턴을 두 보고서의 함정 섹션에서 모두 다뤘다. 공유 스크립트의 삭제·공통코드 AJAX는 목록/등록 화면에서 실행됐다고 주장하지 않았다. `${sortColumn}`은 실제 허용 목록 getter를 설명하되 범용 동적 치환 노드 상태를 일괄 확정하지 않았다.

Codex 저장소 설치와 **설치본 CLI** 실행은 통과했다. `$si-trace` 명시 호출과 한국어 3문항 자동 활성화는 **BLOCKED**이며 [수동 절차](manual-checks.md)를 남겼다.

## 결정

- 복잡도는 연결 개수가 아니라 루트에서 도달 가능한 경로를 20개까지 세어 판정한다. 메뉴 범위는 복잡 분기다. 실제 병렬 탐색자는 화면·서버·SQL 역할을 맡고 같은 모델을 사용했다.
- dirty/untracked 소스까지 반영하도록 prepare마다 인덱스를 다시 만든다. 새 의존성은 추가하지 않았다.
- 전체 인덱스의 비선택 DB 후보는 유지한다. 부분 질의에는 내부 노드 ID만 남겨 그래프 참조 계약을 지킨다. `lib/indexer/`의 M1 분석 규칙은 이번 작업에서 수정하지 않았다.
- held-out의 forward/redirect·응답 view·외부 라이브러리 경계와 역방향 JSP 집합은 정답의 보충 항목으로 명시한다. 현재 그래프 종류로 표현하지 못하는 항목을 빼고 성공했다고 하지 않으며 연결 점수와 별도로 검토한다.

## 남은 문제

- held-out은 **실행 0/3, 점수 없음**이다. 초안에는 게시물 목록 39, 사용자 등록 11, 중복확인 AJAX 17개의 연결이 있으나 승인된 정답 수가 아니다.
- self-eval 편향, 정적 분석의 profile·동적 URL·외부 구현 한계가 남는다. 실제 브라우저/HTTP/DB 실행 근거는 없다.
- 예시 스킬과 업무 스킬 설치까지 확인했으나 하네스 활성화는 새 세션에서 수동 확인해야 한다.

## 사용자 확인 필요 — GATE

아래 Markdown과 같은 폴더의 JSON을 검토해 승인 또는 수정사항을 알려 주세요.

1. [게시판 게시물 목록 조회](../evals/trace/egov-article-list/expected.draft.md): 마스터·추가옵션·목록·건수·공지, 인증·forward/redirect 경계.
2. [업무사용자 등록](../evals/trace/egov-user-insert/expected.draft.md): 외부 validator/ID 생성기, 로컬 static 유틸, INSERT와 성공 forward.
3. [아이디 중복확인 AJAX](../evals/trace/egov-id-dplct-ajax/expected.draft.md): 5개 JSP/10개 호출 함수, 사용자 테이블 3종, jsonView, 역방향 호출 집합.

이 중단은 사용자가 추가한 “초안 작성 후 GATE에서 멈춘다. 승인 전에는 이 3건을 보고 인덱서나 si-trace를 수정하지 않는다”는 조건에 따른다. 초안 승인 후 `expected.*`로 확정하고 동결된 구현으로 첫 실행을 한다. **수정 전 held-out 점수·원본을 먼저 보존한 뒤에만** 사례 대응 수정을 검토한다. 역방향 실행과 보충 항목 판정도 첫 결과에 함께 남긴다.

설치: 저장소 루트에서 `node scripts/install.mjs --target codex --scope repo`.
사용: 새 Codex 세션에서 `$si-trace examples/legacy-board의 /board/list.do 흐름을 추적해 줘`.
결과: 대상 프로젝트 `.sistack/runs/<run-id>/report.md`와 `manifest.json` 확인.
