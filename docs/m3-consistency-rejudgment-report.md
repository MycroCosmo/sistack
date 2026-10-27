> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M3 held-out 정합성 재판정·완료 — 2026-10-28

**상태: M3 완료.** Ian의 종료 검토 지시에 따라 held-out 정합성만 재판정했다. **EXACT 2/3·EQUIVALENT 1/3·FAIL 0/3**이며, 02의 EQUIVALENT는 Ian의 명시적 승인이다. M4는 시작하지 않았다.

### 한 일

- [첫 보고](m3-heldout-first-report.md), [v5 종료 보고](m3-final-report.md), v5의 3 FAIL·진단·제안·위치 점수·학습 결과를 그대로 보존했다. 이 보고와 [별도 결과 JSON](evidence/m3-consistency-rejudgment/results.json)만 새 판정을 나타낸다. 진단이나 diff를 다시 작성하지 않았다.
- [별도 재판정 도구](../scripts/rejudge-debug-proposal.mjs)는 기존 v5 비교기를 그대로 호출해 보존 제안을 임시 사본에 적용하고, **제공된 project/에 존재하는 파일 + 제안 대상 파일**로 비교 범위를 제한한다. 제공하지 않은 출제 원본 파일은 제외 목록에 기록한다. 기존 실행 산출물 디렉터리 제외와 CRLF/LF 정규화는 유지한다.
- 판정은 EXACT(비교 범위 내 원본과 동일), EQUIVALENT(원본과 다르지만 사람이 승인한 동등 수정), FAIL(적용 불가 또는 승인되지 않은 차이)이다. 자동 비교는 EXACT/FAIL만 낸다. EQUIVALENT는 승인자·일시·사유·출처를 run-id·제안 해시·차이 파일 목록에 연결해 기록한다. 자동 FAIL도 별도 필드로 보존한다.
- private 최종 기록은 `evals/private/m3-consistency-rejudgment-final/<case-id>/`에 있다. `all-files-comparison.json`, `rejudgment.json`, 02의 `human-approval.json`을 기존 v5 디렉터리와 분리했다. 원문·소스·diff는 공개하지 않는다.

### 검증

| 사례 | v5 정합성(보존) | 재판정 | 비교 파일 수 | 제공 사본에 없어 제외한 출제 원본 파일 |
|---|---|---|---:|---|
| heldout-01 | FAIL | **EXACT** | 50 | README.md, smoke.mjs |
| heldout-02 | FAIL | **EQUIVALENT** · 자동 비교 FAIL | 46 | smoke.mjs |
| heldout-03 | FAIL | **EXACT** | 50 | README.md, smoke.mjs |

파일 수는 사례별 비교 범위의 크기이며 독립 평가 표본 수가 아니다. 평가 표본은 이미 관찰한 held-out **3건**이다. 첫 위치 3/3·v5 위치 3/3을 재채점하거나 합산하지 않았고, 학습 결과도 재판정하지 않았다. 이번 결과는 규칙 보정과 사람의 승인 효과이며 일반화 성능 향상을 뜻하지 않는다.

- 보존된 v5 진단·보고서 해시와 기존 채점 기록이 일치한 상태에서만 비교했다. 최종 기준은 01·03 `examples/legacy-board-thymeleaf`, 02 `examples/legacy-board`다. 각 사례의 전체 파일 비교 차이·비교 파일 수·제안 해시가 **기존 v5 결과와 동일**함을 확인한 후 새 범위를 적용했다.
- [무결성 검사](evidence/m3-consistency-rejudgment/verification.json): 기존 파일 **1,155개**, v5 동결 구현 **190개** 해시 불변. 첫/v5 산출물과 examples/·제공 project/를 보존했다.
- `node --test test/debug-proposal-rejudge.test.mjs`: **4/4 PASS**. 사본 누락 제외, 제안 외 제공 파일 차이 검출, 기존 결과 덮어쓰기 방지, 승인 없는 차이 FAIL, 승인 정보·범위 불일치 거부, 적용 불가 제안의 EQUIVALENT 거부, private 외부 출력 차단을 검증했다.
- `npm.cmd test`: **143/143 PASS**, 실패·스킵 0. 승인 정답 freshness, 스킬 3개 형식, 공통 복사본 검사까지 통과했다. [검증 기록](evidence/m3-consistency-rejudgment/tests.json). 최초 샌드박스 실행은 기존 임시 Git config 쓰기 제한으로 142/143이었고, 동일 명령을 권한 있는 환경에서 재실행했다.
- 재판정 초기 시도는 02에 Thymeleaf 기준을 잘못 지정해 승인 범위 검사에서 중단됐다. 해당 시도는 private `m3-consistency-rejudgment/`에 보존했다. 올바른 JSP 기준으로 새 최종 디렉터리에 실행했고, 위 v5 전체 차이 재현 검사도 통과했다. 이 중단을 제안 실패로 집계하지 않았다.

### 결정

- 01·03의 FAIL 원인은 출제자 **Claude의 패키징 오류**다. 제공 project/에서 README.md·smoke.mjs를 제외했으므로 이를 수정안 결함으로 판정하지 않는다. [decisions.md](decisions.md)에 사용자 승인에 따른 범위 보정과 제외 사유를 기록했다.
- **02 승인자: Ian / 승인일: 2026-10-28 / 근거: 이번 사용자 지시 3항.** 명시 컬럼 투영과 성능 개선 의도를 유지하면서 결과 매핑과 일치시키는 유효한 수정으로 승인했다. 실제 별칭·매핑 식별자를 포함한 승인 사유는 private 승인 파일에 기록했다. 원본 텍스트와 다르므로 EXACT로 올리지 않는다.
- 기존 v5 비교기·스킬 구현과 학습 기준을 바꾸지 않는 별도 도구를 선택했다. 새 결과는 기존 파일에 덮어쓰지 않는다. 새 의존성은 없다.

### 남은 문제

- 이번 검증은 파일 정합성과 승인 기록에 한정한다. 수정 후 앱·브라우저·DB 실행은 하지 않았으며 성능 개선을 실측하지 않았다. EQUIVALENT는 자동 의미 분석이나 런타임 PASS가 아니다.
- 기존 Oracle 미재현·UNRESOLVED 및 Java 8/11·JEUS/WebLogic 미검증 범위는 [v5 종료 보고](m3-final-report.md)의 제한 그대로다. 새 파일·삭제·이름 변경·바이너리 제안은 기존 도구의 지원 범위 밖이다.

### 사용자 확인 필요

추가 승인 요청 없음. 이번 지시의 범위·02 동등 수정·M3 완료 승인을 반영했다. **M4는 별도 지시 전까지 시작하지 않는다.**
