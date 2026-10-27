> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M2 — si-trace 종료 보고

> **후속 갱신 — 2026-10-27:** 사용자가 학습 정답의 Helper 호출 추가를 승인했다. 보정 후 학습 5건 재채점은 **56/56 PASS**, 누락·과탐·상태 불일치 0건이다. [정답 보정 보고](m2-training-correction-report.md)를 참조한다. 아래 내용은 보정 전 종료 기록으로 보존하며, Helper 호출 추가 승인 대기는 해소됐다.

**M2 완료 기준을 충족했다.** 첫 held-out **60/66**과 원본을 보존했고, 일반 결함 수정 후 v2는 **66/66**이다. v2는 **결함 수정 확인이며 일반화 성능이 아니다.** 학습 5건의 기존 55개 연결은 모두 일치하지만, 정답에 없는 유효한 호출 1건 때문에 한 사례의 비교 결과는 FAIL이다. 차이는 아래에 설명했다. M3는 시작하지 않았다.

### 한 일

- static 호출을 import·같은 패키지의 로컬 클래스와 실제 static 선언으로 연결한다. 인자 수·추론 가능한 타입으로 overload를 고르고, 외부 import는 external UNRESOLVED로 기록한다.
- JSP form action을 함수와 수신 폼별로 구분했다. 선행 대입이 없으면 해당 폼의 기본 action·onsubmit을 확인하며, HTML 속성명 대소문자도 처리한다. 다른 함수의 목록 action이 등록 submit으로 섞이지 않는다.
- `<beans profile>`의 조건을 빈·인터셉터에 전파한다. 설정에서 활성 상태를 확정하지 못하면 조건을 reason에 적고 LIKELY로 남긴다. 바깥 `<ref bean>`이 조건부 빈을 참조하는 경우도 포함한다.
- `href="#"`와 `javascript:void(0)`를 요청에서 제외했다. 32/40/64자 16진수·UUID와 구조화된 해시 필드를 보존하되 비밀값·명시적 개인정보 라벨은 먼저 마스킹한다.
- 공통 모듈·스킬 참조 문서를 동기화하고 Codex 저장소 설치본을 갱신했다. `docs/manual-checks.md`에 사용자 확인 결과와 미실행 두 문항을 구분했다.

최종 구현은 `ec4da84`이며 앞선 수정 커밋은 `227155f`다. 최종 도구 지문은 `d2b34b130f79f5577ffce3b8520a0e9266cf2fa9a862c8a85e0f09b99ce87558`이다. 최종 prepare부터 finish·채점까지 동일 지문을 검사했다. 대상 원문과 승인 정답은 바꾸지 않았다.

### 검증

| held-out 사례 | 수정 전 첫 결과 | v2 | v2 누락 | v2 범위 내 과탐 | v2 상태 불일치 |
|---|---:|---:|---:|---:|---:|
| egov-article-list | 35/38 | 38/38 | 0 | 0 | 0 |
| egov-user-insert | 8/11 | 11/11 | 0 | 0 | 0 |
| egov-id-dplct-ajax | 17/17 | 17/17 | 0 | 0 | 0 |
| 합계 | **60/66** | **66/66** | **0** | **0** | **0** |

승인한 source/kind/위치 범위의 연결 비교다. 전체 프로젝트 정확도가 아니다. AJAX는 첫 결과와 같이 전방+역방향 질의를 사용했다. 전방 단독 9/17도 원본에 보존했다. 역방향 호출 집합은 5개 JSP·10개 함수이며 17/17에 포함된다. 인증 Helper는 진입 호출까지만 점수 범위에 두고, 내부 위임은 보충 경계로 유지했다. propertyService 등 외부 주입 호출은 UNRESOLVED를 유지한다.

학습 세트는 M1 수정에 사용한 5건이며 held-out과 합산하지 않는다.

| 학습 사례 | 일치/정답 | 누락 | 범위 내 과탐 | 상태 불일치 | 비교 결과 |
|---|---:|---:|---:|---:|---|
| legacy-board-search | 17/17 | 0 | 0 | 0 | PASS |
| legacy-board-create | 14/14 | 0 | 0 | 0 | PASS |
| egov-clcode-delete | 6/6 | 0 | 1 | 0 | FAIL |
| egov-detailcode-list | 13/13 | 0 | 0 | 0 | PASS |
| egov-rss-columns | 5/5 | 0 | 0 | 0 | PASS |
| 합계 | **55/55** | **0** | **1** | **0** | **4건 PASS·1건 FAIL** |

추가 1건은 `EgovCcmCmmnClCodeManageController#deleteCmmnClCode` → `EgovUserDetailsHelper#getAuthenticatedUser`다. Controller:184의 실제 static 호출과 Helper:41 선언이 근거다. 새 일반 규칙이 이 호출을 찾았지만 기존 승인 정답은 포함하지 않아 비교기가 과탐으로 센다. 유효한 호출을 숨기거나 승인 정답을 자동 변경하지 않았다. [상세 차이](evidence/m2-v2/results.json)의 `training_difference`와 해당 [실행 보고서](evidence/m2-v2/egov-clcode-delete.md)를 함께 보아야 한다.

실패 테스트를 먼저 실행한 기록은 다음과 같다.

| 일반 결함 | 수정 전 재현 | 수정 후 확인 |
|---|---|---|
| static 로컬·외부 호출 | 합성 2건 FAIL | 로컬 선언·외부 경계 PASS |
| 함수별 form action | 합성 1건 FAIL | 다른 함수·폼과 분리 PASS |
| profile 빈·인터셉터 | 합성 2건 FAIL, 바깥 ref 1건 추가 FAIL | 미확정 LIKELY·활성/비활성 분기 PASS |
| fragment/void 링크 | 합성 1건 FAIL | 가짜 요청 제외·실제 링크 유지 PASS |
| 마스킹·eval 해시 | 합성 2건 FAIL, 비밀 라벨 1건 추가 FAIL | 식별자 보존·민감값 제거·실제 eval 저장기 PASS |

초기 v2 시도에서 Object 매개변수 대입과 `onSubmit` 대소문자 처리를 추가 발견했다. 기존 합성 테스트 두 개로 먼저 FAIL을 재현한 뒤 일반 규칙을 고쳤다. 초기 `m2-v2-*` 실행도 보존하고 최종 검증에는 별도 `m2-v2-final-*` run-id를 사용했다. 초기 결과를 지우거나 최종 결과로 덮어쓰지 않았다.

- `npm.cmd test`: **74/74 PASS**. 승인 정답 8건의 모든 근거 라인·source_files 해시, 스킬 2개 형식, 공통 모듈 복사본 검사 통과. [구현 동결 시 로그](evidence/m2-v2/npm-test-final.txt), [종료 문서·세트 기록 갱신 후 재검증](evidence/m2-v2/closure-npm-test.txt).
- 설치본 `trace.mjs prepare` / `finish`: **8/8 종료 코드 0**, manifest 계약 **8/8 PASS**. 분석 manifest 자체는 **8건 모두 PARTIAL**이다. 외부 구현·동적 조건·런타임 경계가 남아 있어 eval PASS를 분석 전체 PASS로 바꾸지 않았다.
- 단순 **3건**, 복잡 **5건**을 실제 실행했다. 복잡 실행은 동일 모델의 화면·서버·SQL 탐색자가 원문과 최종 골격을 병렬 재대조했다. 정답·점수는 탐색자에게 주지 않았다. 주 에이전트는 정답을 알고 있는 자기 적용 평가자이므로 독립 블라인드 평가가 아니다.
- 명시 호출 **PASS**(`trace-list-explicit-20261027-01`), 자동 활성화 **1/3 PASS**(`trace-board-list-20261027`), 나머지 **2/3 미실행**. 사용자 실행 보고와 로컬 manifest 계약·PASS 검증을 구분해 [기록](evidence/m2-v2/activation.json)했다. 같은 새 세션 호출을 이 작업에서 재실행했다고 주장하지 않는다.
- 첫 기준선 압축 원본 SHA-256 `27961c682b1745602049b1e652f7e793ed599b5dafb728e2689bf4ccb8118dee` 불변을 확인했다. 첫 결과 파일과 승인 정답에도 Git 차이가 없다.
- v2 압축 원본 **193개 파일**, **5,596,170바이트**의 해제·파일별 해시·원본 바이트 대조 PASS. 초기 시도·최종 골격·역방향·검토·manifest·보고서·점수·TDD 로그·승인 정답을 포함한다. [기계 판독 결과](evidence/m2-v2/results.json), [압축 원본](evidence/m2-v2/originals.json.gz), [검증 방법](evidence/m2-v2/README.md).

### 결정

첫 60/66을 수정 전 기준선으로 유지하고 이후 결과를 별도 run-id에 기록했다. v2의 66/66은 사용자가 지정한 일반 결함의 수정 확인이다. 같은 승인 사례를 본 뒤 개선했으므로 일반화 점수로 사용할 수 없다. 학습 비교의 유효한 추가 호출은 차이로 설명하며 정답 변경은 별도 검토 대상으로 남긴다. 기준은 [decisions.md](decisions.md)에 기록했다.

| M2 완료 기준 | 확인 |
|---|---|
| validate-skills·sync-shared·npm test | PASS |
| 학습 정답 5건 eval 및 차이마다 원인 설명 | 완료: 55개 일치, 비교 FAIL 1건의 실제 추가 호출 설명 |
| 단순/복잡 분기 각각 실제 실행 | 완료: 3/5건 |
| Codex 명시 호출 확인 | PASS |
| 모든 실행 결과 manifest 계약 검증 | PASS: 8/8건 |

자동 활성화는 전체 PASS가 아니며, 프롬프트가 허용한 미검증 기록·수동 절차를 남겼다. M2 구현·검증 종료와 활성화 3문항 전체 확인을 혼동하지 않는다.

### 남은 문제

- 자동 활성화 두 질문은 새 세션에서 미실행이다. [수동 절차](manual-checks.md)를 따른다.
- `egov-clcode-delete` 정답에 유효한 Helper 호출을 추가할지는 별도 승인 대상이다. 현재 비교 FAIL 기록과 정답 해시는 유지한다.
- 동적 Java profile 계산, 복잡한 overload/가변인자, 동적 URL·JDBC 테이블은 완전히 해석하지 않는다. eGov dummy interceptor는 활성 미확정 LIKELY로 남는다.
- 중첩 JSP href·뷰 기반 테이블·AOP 부수 SQL 등은 소스 검토로 보완한다. 실제 앱·HTTP·DB 실행은 하지 않았다. [지원 한계](limitations.md)를 따른다.

### 사용자 확인 필요

M2 종료를 위해 추가 승인을 요청하지 않는다. 미실행 활성화 두 문항과 학습 정답 추가 후보는 위 기록에 남겼다. **M3는 시작하지 않았다.**

- 설치: `node scripts/install.mjs --target codex --scope repo` (기존 설치 갱신은 `--force`).
- 사용: 새 Codex 세션에서 `$si-trace examples/legacy-board의 /board/list.do 흐름을 추적해 줘`.
- 결과: 대상 프로젝트 `.sistack/runs/<run-id>/report.md`와 `manifest.json` 확인.
