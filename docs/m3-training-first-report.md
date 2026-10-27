> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 마스킹 보정·학습 첫 채점 — 2026-10-28

상태: **마스킹 검증 PASS, 학습 첫 채점 FAIL(8/10), M3 전체 PARTIAL — 실제 held-out 대기.** 승인 정답이나 첫 결과를 바꿔 점수를 올리지 않았다.

### 한 일

- 사용자 승인 정답 10건을 [승인 기록](../evals/debug/approval-20261028.json)과 각 expected.json에 고정했다. 검토 초안은 보존했다.
- 공통 마스킹에서 qtp·Tomcat/AJP·JEUS worker/pool·WebLogic ExecuteThread 이름을 보존한다. 세션·비밀값 라벨은 먼저 가려 스레드 예외가 자격값을 노출하지 않도록 했다.
- Windows 슬래시/역슬래시·Linux /home·macOS /Users의 사용자 홈 접두사를 ~/로 일반화했다. 그 뒤 경로·스택 프레임·SQL은 유지한다. 공통 모듈과 스킬 3개의 복사본을 동기화했다.
- 이미 가려진 qtp 숫자는 복구하지 않고 실행 가능 9건의 로그를 [새로 캡처](evidence/m3-mask-v3/README.md)했다. symptom.log 10건·출처 해시·마스킹 사본을 재생성했다. 07은 같은 Oracle 형식 합성 로그라 원문/입력 해시가 같고 출처 메타데이터만 갱신됐다.
- 커밋 **aa0c3bbe296ed5b6e04b47aa92cc73e7ad3c3dd3**의 [173개 파일을 새 동결](evidence/m3-freeze-v3.json)했다. 기존 m3-freeze.json·m3-freeze-v2.json과 과거 증거는 보존했다.
- 동결 후 새 임시 복사본 10개에서 로그·인덱스·소스/설정을 직접 검토했다. 모든 진단·보고서를 [비교 전 해시](evidence/m3-training-first/submitted-before-scoring.json)로 먼저 보존한 뒤 승인 정답과 첫 비교했다. 원본 결과는 커밋 **e136ce1**에 고정했다.

### 검증

| 실행 | 결과 | 표본·범위 |
|---|---|---|
| 마스킹 실패 테스트 먼저 | 확인 | [수정 전](evidence/m3-mask-v3/masking-red.txt): 새 4개 FAIL, 기존 3개 PASS |
| 집중 검사 | PASS | 마스킹·실제 입력 12개. 긴 스레드 번호/인접 개인정보/세션 우선/홈 4종/스택·SQL·진단 해시 보존 |
| `npm.cmd test` | PASS | [127/127](evidence/m3-mask-v3/npm-test.txt), 실패·스킵 0. 승인 정답 freshness·스킬 3개·공통 복사본 검사 포함 |
| 실제 앱 재캡처 | PASS | JDK 17.0.14 / Maven 3.9.10 / Jetty, 결함 증상 9/9. 동결 전 입력 수집 때 실행한 증거이며 수정 후 검증이 아님 |
| 동결 후 학습 첫 채점 | FAIL | **8/10건 전체 적중, 위치 14/16 일치, 누락 2·추가 2**. [첫 점수 원본](evidence/m3-training-first/summary.json) |
| 저장 증거 검사 | PASS | [131개 파일 마스킹 불변, manifest 10개 유효, 제출 진단 10개 불변, 동결 173개 해시/지문 일치](evidence/m3-training-first/verification.json) |
| 06 후속 수정 제안 | PASS(적용 가능성만) | [git apply --check](evidence/m3-training-followup/verification.json), 실제 소스 미변경·재채점 없음 |

첫 채점 세부 결과:

| 사례 | 위치 일치 | 추가 위치 | 채점 | 원인 상태·증거 단계 |
|---|---:|---:|---|---|
| [01 바인딩](evidence/m3-training-first/01-binding/report.md) | 1/1 | 0 | PASS | CONFIRMED · 5 |
| [02 JS URL](evidence/m3-training-first/02-js-url/report.md) | 1/1 | 0 | PASS | CONFIRMED · 5 |
| [03 요청 인코딩](evidence/m3-training-first/03-request-encoding/report.md) | 1/1 | 0 | PASS | CONFIRMED · 5 |
| [04 세션 우회](evidence/m3-training-first/04-session-bypass/report.md) | 1/2 | 1 | FAIL | CONFIRMED · 5 |
| [05 페이지 경계](evidence/m3-training-first/05-paging/report.md) | 1/1 | 0 | PASS | CONFIRMED · 5 |
| [06 정렬 SQL](evidence/m3-training-first/06-sort-sql/report.md) | 0/1 | 1 | FAIL | CONFIRMED · 5, 첫 수정 제안 결함 별도 확인 |
| [07 Oracle](evidence/m3-training-first/07-oracle-log-only/report.md) | 3/3 | 0 | PASS | **UNRESOLVED · 2 · 실제 Oracle 미재현** |
| [08 Thymeleaf 유틸리티](evidence/m3-training-first/08-thymeleaf-utilities/report.md) | 2/2 | 0 | PASS | CONFIRMED · 5 |
| [09 뷰 리졸버](evidence/m3-training-first/09-view-resolver/report.md) | 3/3 | 0 | PASS | CONFIRMED · 5 |
| [10 공통 조각 인코딩](evidence/m3-training-first/10-fragment-encoding/report.md) | 1/1 | 0 | PASS | CONFIRMED · 5 |

5단계는 입력 수집 때 실제 앱에서 결함을 재현한 증거와 동결 후 같은 패치 소스의 원인 검토를 연결한 것이다. 동결 후 앱을 또 실행했다거나 제안 수정으로 문제가 해결됐다는 뜻은 아니다. 07은 세 후보를 모두 유지하고 추가 배포 SQL/스키마 정보가 필요하다고 보고해 통과했다.

### 결정

- [결정 기록](decisions.md)에 실패 재현·보존 우선순위·재캡처·재동결 이유를 남겼다. 외부 의존성은 추가하지 않았다.
- 모든 10건은 **Codex 자기 작성 학습 세트**다. 기존 작성 문맥을 아는 에이전트가 수동으로 소스를 검토해 작성한 진단이며 블라인드 평가가 아니다. 이 8/10을 일반화 성능이나 held-out 점수로 보고하지 않는다. 위치 적중은 수정 제안 정확성 전체를 측정하지 않는다.
- 04는 승인 정답 dispatcher-servlet.xml **9행(블록 시작)**, 진단 **10행(첫 mapping)** 차이다. 같은 설정 블록의 원인 설명은 일치하지만 정확한 행 비교에서는 FAIL을 유지한다. Controller:37은 일치했다.
- 06 승인 정답 **67행은 getSort()**다. bug.patch는 getSortColumn()을 바꾸며 그 반환문은 **78행**이다. 진단은 78행을 지목했지만 승인 기준과 달라 FAIL이다. 승인 정답을 자동 보정하거나 재채점하지 않았다.
- 06의 첫 제안 diff는 보조 코드가 동일한 `return sort;` 중 첫 번째를 선택해 67행을 가리켰다. 첫 원본은 보존하고, 메서드 문맥을 포함한 [후속 정정 제안](evidence/m3-training-followup/06-sort-sql-proposal.diff)을 별도로 남겼다. [차이 검토](evidence/m3-training-followup/README.md)에 두 문제를 구분했다.

### 남은 문제

- 실제 held-out 사례는 열람·실행하지 않았다. 사용자 제공 후 별도 실행 지시가 필요하며 M3 전체 완료를 선언하지 않는다.
- 04의 행 위치 표현과 06 승인 정답 행 번호를 재검토할 수 있다. 이후 변경이 승인되더라도 첫 8/10 원본은 유지하고 새 결과로 구분해야 한다.
- 06의 후속 제안은 적용 가능성만 확인했다. 제안 적용·수정 후 앱 회귀 테스트는 미실행이다. 공통 스킬의 finish 계약 검사는 diff의 의미나 적용 위치 정확성을 보증하지 않는다.
- JEUS/WebLogic 스레드 형식은 합성 회귀로 검증했다. 임의 커스텀 풀 이름과 실환경 실행은 미검증이다. 사용자 홈 바깥의 임의 파일명에 포함된 개인정보까지 일반화하는 규칙은 아니다.
- 실제 06 로그의 MyBatis 메시지 안에 반복된 예외명이 별도 root로 추출되는 파서 한계도 보였다. 첫 동결·결과를 유지했으며 이 실행에서 파서를 수정하지 않았다. 원문과 실제 Caused by/SQL은 보존했다.

### 사용자 확인 필요

첫 결과와 04·06의 [행 번호/수정안 차이](evidence/m3-training-followup/README.md)를 확인한다. 현재 요청한 마스킹 수정·재동결·학습 첫 채점은 완료했다.

held-out은 Ian이 사례를 넣고 별도로 지시한 뒤 동결 구현으로 첫 실행한다. 공개 보고에는 위치·적중 여부만 남기고 원문·첫 점수·원본·리비전은 private 안에 보존한다. M4에는 착수하지 않는다.
