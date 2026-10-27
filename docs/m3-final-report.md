> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 종료 점검 — 2026-10-28

상태: **요청한 출력 계약 보강·13건 재실행 완료. M3 전체 PARTIAL — held-out 수정안 정합성 3건 FAIL.** 첫 held-out **3/3**과 원본은 보존했으며 후속 점수와 합산하지 않는다. 원본 소스에는 수정안을 적용하지 않았다.

### 한 일

- [si-debug 출력 계약](../skills/si-debug/references/output-format.md)을 보강했다. 원인 문장에는 실제 식별자·값을 그대로 쓰고 identifiers와 대조한다. CONFIRMED/LIKELY의 빈 diff를 거부하며 모든 후보가 UNRESOLVED일 때만 보류한다. 사용자에게 주는 private 진단은 실제 필드명·별칭·모델 키와 제안 diff를 포함한다. docs/의 공개 held-out 보고서에는 위치·적중·정합성 결과만 남긴다. 개인정보·비밀값 마스킹은 유지한다.
- [수정안 정합성 도구](../scripts/verify-debug-proposal.mjs)를 추가했다. 진단·보고서와 일치하는 채점 기록을 확인한 뒤 제안을 임시 복사본에만 적용한다. 학습은 bug.patch 역적용 결과, held-out은 examples/의 출제 원본과 비교한다. 전체 파일 집합과 내용을 비교하며 CRLF/LF만 정규화한다. target·.git·.sistack 등 실행 산출물은 제외한다.
- 후속 held-out 채점은 `follow-up`과 새 run-id를 요구한다. 첫 실행 파일에 쓰지 않는다. 구현 커밋 **6a750e53a575bcf1aa28051b0933030131acdb6b**, [v5 동결](evidence/m3-freeze-v5.json) **190개 파일**을 실행 전후 검사했다. v1~v4와 과거 학습/held-out 원본은 불변이다.
- 새 run-id는 학습 `m3-training-v5-<case-id>`, held-out `m3-heldout-v5-<case-id>`다. 기존 진단의 위치와 근거를 재검토하고 구체적인 원인·diff를 보강한 대응 실행이다. 이미 관찰한 사례이므로 블라인드·새 일반화 성능이 아니다. [13건 위치 채점 완료 기록](evidence/m3-output-v5/all-location-scores-before-comparison.json)을 저장한 뒤 원본 비교를 시작했다. 비교 후 제안을 고쳐 통과시키지 않았다.

### 검증

| 평가 세트 | 위치 적중 | 수정안 정합성 | 구분 |
|---|---:|---:|---|
| 학습 v5 · 10건 | **10/10건, 16/16항목** | **9/9 PASS** | Oracle 1건 UNRESOLVED, 정합성 분모 제외 |
| held-out v5 후속 · 3건 | **3/3건, 3/3항목** | **0/3 PASS · 3 FAIL** | 첫 점수와 별도 보존 |
| held-out v4 최초 · 3건 | **3/3건** | 당시 미검증 | 첫 기준선 확정·불변 |

학습 첫 v3 **8/10·14/16**과 v4 대응 **10/10·16/16**도 그대로 보존했다. 위 숫자들과 합산하지 않는다. 위치 적중은 원인 위치/상태 비교이고, 정합성은 출제 원본 복원 검사다. 두 지표 모두 수정 후 앱 동작을 보증하지 않는다.

학습 사례별 결과와 이번 증거 단계:

| 사례 | 위치 항목 | 증거 단계 | 수정안 정합성 |
|---|---:|---:|---|
| 01-binding | 1/1 | 3 | PASS |
| 02-js-url | 1/1 | 3 | PASS |
| 03-request-encoding | 1/1 | 3 | PASS |
| 04-session-bypass | 2/2 | 3 | PASS |
| 05-paging | 1/1 | 3 | PASS |
| 06-sort-sql | 1/1 | 3 | PASS |
| 07-oracle-log-only | 3/3 | 2 | UNRESOLVED |
| 08-thymeleaf-utilities | 2/2 | 3 | PASS |
| 09-view-resolver | 3/3 | 3 | PASS |
| 10-fragment-encoding | 1/1 | 3 | PASS |

07은 기간 조건 두 곳과 ORDER BY의 세 참조를 모두 UNRESOLVED로 유지했다. 실제 Oracle 환경이 없으므로 배포 SQL·바인딩 타입·스키마/컬럼 메타데이터를 요청하며 수정 diff를 보류한다. 기존 9건의 앱 재현 증거는 이전 기록에 보존되어 있으나 이번에는 WAS/DB를 재실행하지 않아 증거 단계에 재사용하지 않았다.

held-out 공개 결과:

| 사례 | 프로젝트 내 위치 | 위치 적중 | 수정안 정합성 |
|---|---|---|---|
| heldout-01 | `src/main/webapp/WEB-INF/templates/board/form.html:16` | O | FAIL |
| heldout-02 | `src/main/resources/mapper/BoardMapper.xml:32` | O | FAIL |
| heldout-03 | `src/main/webapp/WEB-INF/templates/board/list.html:30` | O | FAIL |

실제 식별자·소스·diff·남은 차이는 private 실행의 report.md와 proposal-review.md에 보존했다. 공개 문서에는 인용하지 않는다.

| 실행 검사 | 결과·증거 |
|---|---|
| 실패 테스트 먼저 | [계약 검사](evidence/m3-output-v5/contract-red.txt): 추상 원인·빈 diff 허용을 검출. 실제 식별자 보존 검사는 기존에도 통과. [정합성 검사 3건](evidence/m3-output-v5/proposal-red.txt)은 도구 구현 전 실패. [후속 채점 검사](evidence/m3-output-v5/followup-red.txt)는 첫 원본 보존을 유지한 후속 실행 불가를 재현 |
| `npm.cmd test` | [139/139 PASS, 실패·스킵 0](evidence/m3-output-v5/npm-test-final.txt). 승인 정답 freshness, 스킬 3개, 공통 복사본, 독립 설치 포함 |
| 마스킹 회귀 | 전체 테스트에 원인/diff의 실제 식별자 보존과 개인정보 차단, 실제 symptom.log 10건, 스택 예외·스레드·홈 경로·해시·세션/트랜잭션 문맥 검사 포함 |
| 정합성 부정 검사 | 다른 수정 결과·적용 불가 diff·기준 파일 누락은 FAIL, 경로 탈출·private 외부 출력·채점 전/채점 후 진단 변경은 거부, UNRESOLVED는 성공으로 세지 않음 |
| 원본·동결 불변 | [검증 기록](evidence/m3-output-v5/verification.json): 동결 190개, 이전 학습/동결, 첫 held-out 원본·점수·진단, examples 및 제공 프로젝트 불변 |
| 최종 산출물 확인 | [13건 직접 검사](evidence/m3-output-v5/final-artifact-check.json): manifest 13개 유효, 구체적 원인 13개, 비어 있지 않은 diff 12개, UNRESOLVED 보류 1개, 마스킹 불변·채점 후 진단/제안 불변 |
| 임시 폴더 복원 | [복원 기록](evidence/m3-output-v5/temporary-lifetime-recovery.json): 샌드박스가 OS 임시 폴더를 정리해 채점 전 중단. 동일 해시 소스와 보존 진단을 작업 폴더 임시 경로에 복원해 계속했으며 진단은 변경하지 않음 |

첫 전체 테스트는 새 계약을 반영하지 않은 합성 fixture 2건과 샌드박스의 임시 Git 쓰기 제한 1건으로 실패했다. fixture를 새 계약에 맞추고 Git 쓰기가 필요한 기존 전체 검사를 권한 있는 환경에서 재실행해 위 최종 결과를 얻었다. 이전 실패 기록도 보존한다.

### 결정

- [설계 결정](decisions.md)의 v5 기록을 따른다. 식별자가 있다는 문법 검사는 실제 소스 검토를 대신하지 않는다. 제안의 적용 가능성·출제 원본과의 일치 여부도 위치 점수와 분리한다.
- 정합성은 사전에 정한 전체 파일 비교 결과를 그대로 보고한다. 비교 범위를 사후에 줄이거나 제안을 출제 원본에 맞춰 다시 작성해 PASS로 바꾸지 않는다. 전체 파일 차이가 존재하면 제안의 의미 정확성이나 런타임 실패율로 바로 해석하지 않는다.
- 새 의존성·테스트베드 원본 변경·M4 구현은 없다.

### 남은 문제

- **held-out 수정안 정합성 3건 FAIL**을 보존했다. 제공 프로젝트와 출제 원본의 파일 구성 차이도 포함되어 있어 이 수치를 제안 오류율로 해석할 수 없다. 상세 비교와 제안 대상 파일의 복원 여부는 private proposal-review.md에 기록했다. 엄격한 정합성 기준을 충족했다고 선언하지 않는다.
- 수정 후 앱·브라우저·DB 회귀는 미실행이다. 정합성 도구가 원본 복원을 확인한 학습 9건도 런타임 PASS를 뜻하지 않는다. Java 8/11 및 JEUS/WebLogic 검증 범위를 확대하지 않았다.
- 현재 제안 계약은 기존 텍스트 파일 수정에 한정한다. 신규 파일·삭제·이름 변경·바이너리는 지원하지 않는다.

### 사용자 확인 필요

기존 M3 완료 기준인 학습 위치/증거/편향 보고, 재현 불가 사례의 판단 유보, 마스킹 회귀, 실제 첫 held-out 보존, 스킬/동기화/전체 테스트는 충족했다. 추가된 실제 식별자·필수 diff 계약과 분리 평가도 완료했다. **추가 정합성의 held-out 3건은 FAIL이므로 M3 전체 PASS와 다음 마일스톤 전환은 보류한다.** 이 보고와 private 새 실행의 report.md·proposal-review.md를 검토할 때까지 멈춘다.
