> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 v4 재검증 — 2026-10-28

상태: **요청한 정답/규칙/파서 보정과 학습 재채점 완료, M3 전체 PARTIAL — held-out 대기.** 첫 8/10은 보존하고 새 기준의 대응 비교를 별도 기록했다.

### 한 일

- 06 승인 정답을 BoardSearch.java **67(getSort) → 78(getSortColumn 반환문)**로 정정했다. [approval amendments](../evals/debug/approval-20261028.json)에 승인 오류·정정 사유·원승인/정정 날짜·전후 위치/해시를 추가했다. [원승인 records 10건 불변](evidence/m3-recheck-v4/approval-history-check.json)을 확인했다.
- 승인 정답 10건의 모든 위치에 enclosing을 기록했다. Java 메서드·XML 요소 등 실제 구조 안의 라인인지 검사하므로 같은 `return sort;`를 다른 메서드에서 골라도 실패한다. `check-expected`와 실제 채점이 같은 검증 함수를 사용한다.
- 삭제형 원인에는 `{file,start,end,enclosing}`을 사용한다. **04는 interceptor 9~13행, 10은 JSP 상단 지시어 삽입 경계 1~1행**이다. 같은 file/status에서 진단 line이 양 끝을 포함한 범위 안일 때 일치한다. 일반 원인은 정확한 line 비교를 유지한다.
- MyBatis 메시지의 반복 `Cause:`·`nested exception is`가 새 root가 되는 일반 파서 결함을 수정했다. 원문은 그대로 두고 줄 시작의 실제 예외 헤더와 Caused by/Suppressed만 체인으로 파싱한다.
- 커밋 **9bd0161f623303bb3d0b5b9ef437a901e80c8899**의 **186개 파일**을 [v4로 재동결](evidence/m3-freeze-v4.json)했다. 승인 정답 JSON도 동결 목록에 포함했다. 이전 v1~v3 동결과 첫 실행 원본은 변경하지 않았다.
- 새 run-id `m3-training-v4-<case-id>`로 임시 복사본 10개를 만들고 파서·인덱스를 새로 실행했다. 첫 진단 위치를 유지한 대응 비교이며, 모든 진단을 [채점 전 해시](evidence/m3-recheck-v4/runs/submitted-before-scoring.json)로 먼저 보존했다.

### 검증

| 실행 | 결과 | 표본·범위 |
|---|---|---|
| 파서 실패 테스트 먼저 | 확인 | [수정 전 2/2 FAIL](evidence/m3-recheck-v4/parser-red.txt). 실제 06 입력과 합성 Cause/독립 스택 |
| 새 회귀 검사 | PASS | 총 6개: 파서 2개, 같은 텍스트/다른 메서드·XML 반복 요소·JS/HTML/JSP·범위 경계/상태/추가 위치 4개 |
| M3 집중 검사 | PASS | 18/18. 승인 거부·독립 설치·원본 보호·첫 held-out 보존도 합성 fixture로 검사 |
| `npm.cmd test` | PASS | [133/133](evidence/m3-recheck-v4/npm-test-final.txt), 실패·스킵 0. 스킬 3개/공통 복사본·기존 trace 및 승인 debug 10건 freshness 포함 |
| v4 학습 대응 재채점 | PASS | **10/10건, 항목 16/16, 누락·추가 0**. [점수 원본](evidence/m3-recheck-v4/runs/summary.json) |
| 저장 증거 검사 | PASS | [142개 파일 마스킹 불변, manifest 10개 유효, 원인/위치 10세트 불변, 정정 정답 10건 해시 일치, 동결 186개 불변](evidence/m3-recheck-v4/runs/verification.json) |

첫 점수와 새 점수는 비교 단위가 일부 달라 별도로 읽어야 한다.

| 구분 | 전체 사례 적중 | 위치 항목 | 누락/추가 | 비교 기준 |
|---|---:|---:|---:|---|
| 첫 v3 | **8/10** | **14/16** | **2/2** | 최초 승인 정답, 정확한 line 16개 |
| v4 대응 재검증 | **10/10** | **16/16** | **0/0** | 06 정정 + enclosing 검증 + 정확한 line 14개/삭제 범위 2개 |

사례별 차이:

| 사례 | 첫 결과 | v4 | 해석 |
|---|---|---|---|
| 01/02/03/05/08/09 | PASS | PASS | 원인 위치 동일 |
| 04 | FAIL · 1/2 | PASS · 2/2 | 첫 진단의 mapping:10이 승인 interceptor 범위 9~13 안에 있음 |
| 06 | FAIL · 0/1 | PASS · 1/1 | 첫 진단 :78은 유지. 승인 오류 :67을 :78로 정정 |
| 07 | PASS · 3/3 | PASS · 3/3 | **세 후보 모두 UNRESOLVED, 증거 2단계, 실제 Oracle 미재현** |
| 10 | PASS · 1/1 | PASS · 1/1 | 첫 진단 :1을 그대로 사용. 삭제형 1~1 범위로 표현만 바뀜 |

06의 새 parsed.json은 **BadSqlGrammarException root → JdbcSQLSyntaxErrorException cause** 두 예외다. 이전의 메시지 예외 중복 root가 사라지고 프로젝트 프레임은 wrapper(0)에 연결된다. 입력 로그 해시는 첫 실행과 동일하다.

### 결정

- [decisions](decisions.md)에 정답 오류 정정과 삭제형 범위의 근거를 기록했다. 범위는 승인된 소속 구조 안으로 제한하며 본문 전체를 넓혀 통과시키지 않는다. enclosing을 유일하게 찾지 못하는 overload/중복 요소는 실패한다.
- **진단의 원인·상태·구체적 위치는 첫 실행과 10건 모두 동일**하다. 8→10의 차이는 06 정답 정정과 04 범위 규칙 때문이다. 10 범위 전환은 점수에 영향이 없다. 파서 개선은 실제 로그 회귀로 확인했지만 점수 상승을 분석 능력 향상으로 주장하지 않는다.
- 자기 작성 편향이 있는 학습 10건의 대응 재검증이며 블라인드/일반화 성능이 아니다. 첫 8/10은 [원본](evidence/m3-training-first/summary.json)과 e136ce1에 보존했다.
- 06 수정 제안은 첫 제안의 앞쪽 return 선택 문제를 고친 [메서드 문맥 포함 후속 diff](evidence/m3-training-followup/06-sort-sql-proposal.diff)를 새 run에 사용했다. `git apply --check`와 소스 불변만 확인했으며 실제 적용이나 앱 회귀를 수행하지 않았다.

### 남은 문제

- 실제 held-out은 아직 열람·실행하지 않았다. 기존 테스트의 private 보존 검사는 OS 임시 폴더의 합성 fixture이며 사용자 사례가 아니다.
- 앱 증거는 v3 입력 수집 때 실행한 실제 9건을 재사용했다. v4는 같은 로그/소스의 Node 분석·채점 재실행이며 Java 앱·DB 재실행은 아니다. 원인 증거 단계는 기존 9건 5단계, Oracle 1건 2단계를 유지했다.
- 현재 문맥 검사는 지원하는 구조에 한정한다. 이름이 모호하거나 임의 WAS 접두사가 있는 스택은 별도 문맥/정규화가 필요하다. 제안 diff의 의미 정확성과 수정 후 동작은 위치 적중만으로 보증하지 않는다.

### 사용자 확인 필요

이번 요청 1~4는 완료했다. **held-out 대기 상태에서 멈춘다.** Ian이 사례를 넣고 별도로 지시하면 v4 동결 구현으로 첫 실행 원본·점수·리비전을 private 안에 보존한다. 공개 보고에는 위치·적중 여부만 남긴다. M4에는 착수하지 않는다.
