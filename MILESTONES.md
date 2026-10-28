# SIStack 마일스톤

## v0.1 목표

한국 SI 개발자가 매일 하는 네 가지 일, **코드 흐름 파악 · 에러 원인 분석 · 단위 테스트 · 산출물 작성**을 Codex/Claude Code에서 스킬 하나씩으로 처리할 수 있게 한다.

성공 기준은 기능 개수가 아니라 다음 두 가지다.

1. 공개 레거시 코드(eGovFrame)와 실제 업무 사례에서 결과가 사람이 승인한 정답과 맞는다.
2. Ian이 실무에서 일주일 이상 직접 쓰고, 동료 1명 이상이 써본다.

## 전체 흐름

```text
M0 기반 ──▶ M1 공통 인덱서 ──┬──▶ M2 si-trace ──▶ M2.5 Thymeleaf ──────────────┐
                            └──▶ M3 si-debug ──▶ M4 si-unit-test ──▶ M5a ──▶ M5b ──▶ M6 통합·릴리스
```

- M1 인덱서는 네 스킬이 모두 쓰는 공통 부품이다 (흐름 골격, 에러 위치 찾기, 테스트 대상 선정, 프로그램 목록).
- M2와 M3는 M1 이후 순서 무관.
- M2.5는 M2 완료 후 수행한다. 이번 작업 순서는 M2 → M2.5 → M3이며 M3의 기술적 선행 조건은 M1로 유지한다.
- M4는 M3의 버그 패치로 "테스트가 실제로 버그를 잡는지"를 검증하므로 M3 이후.
- M5a는 프로그램 목록·테이블 정의서, M5b는 화면/프로그램 단위 기능 테스트(TC) 결과서다. M4 JUnit 결과는 M5b의 서버 로직 검증 근거 보조 열에만 연결한다.

## 테스트베드

| 이름 | 위치 | 용도 |
|---|---|---|
| legacy-board | `examples/legacy-board/` (M0에서 생성) | 빌드·실행 가능한 소형 레거시 프로젝트. Spring MVC + MyBatis + JSP + jQuery, 테스트용 H2. 모든 스킬의 기본 테스트 대상 |
| legacy-board-thymeleaf | `examples/legacy-board-thymeleaf/` (M2.5 종료) | 같은 서버 코드·Thymeleaf/JSP 공존. 학습/삭제 v2 PASS·Java 17 브라우저 삭제 확인. 첫 FAIL 보존, Java 8 런타임 BLOCKED |
| Spring PetClinic | `.testbeds/spring-petclinic/` (고정 SHA, 소스 커밋 금지) | `500158f` 화면·Controller·기본 뷰·layout v2 PASS. 첫 FAIL 보존, JPA 제외 |
| 버그 케이스 | `evals/debug/cases/<id>/` | 두 legacy-board 테스트베드의 임시 복사본에만 적용하는 학습 패치 9건 + Oracle 로그 전용 1건. 자기 작성 편향 명시 |
| eGovFrame 공통컴포넌트 | 외부 클론 (`scripts/fetch-testbed.mjs`) | 실제 규모의 공개 레거시. 인덱서·si-trace 현실성 검증. 저장소에 커밋하지 않음 |
| 실제 업무 사례 | `evals/private/` (gitignore) | Ian이 직접 넣는 마스킹된 실제 에러·코드 사례. 자기채점 방지용 |

---

## M0 — 저장소 기반

**상태: 완료 — 2026-10-27 사용자 legacy-board 구조 승인.** 최종 검증은 [M0 종료 보고](docs/m0-final-report.md)를 따른다.

**목표:** 이후 모든 마일스톤이 올라설 뼈대와 검증 도구.

**산출물**
- 저장소 구조, `README.md` 초안, `LICENSE`(MIT), `NOTICE`, `.gitignore`
- `schemas/manifest.schema.json` + `scripts/validate-manifest.mjs`
- `scripts/validate-skills.mjs` — Agent Skills 형식 검증
- `scripts/install.mjs` — Codex/Claude Code 경로로 스킬 설치
- `scripts/sync-shared.mjs` — 공통 코드를 각 스킬로 복사
- `lib/mask` — 개인정보·비밀값 마스킹
- `examples/legacy-board/` — 빌드 가능한 테스트베드
- `scripts/fetch-testbed.mjs` — eGovFrame 클론 (기준 커밋 고정)
- `npm test`

**완료 기준**
- `npm test` 통과
- `examples/legacy-board`에서 `mvn -q test` 성공 (JDK·Maven 없으면 BLOCKED + 실행 명령 기록)
- 빈 예시 스킬 하나가 `validate-skills`를 통과하고 `install.mjs`로 설치됨

**[GATE]** legacy-board의 기능 목록과 구조를 Ian이 확인

**Ian 할 일:** legacy-board 구조가 실제 SI 프로젝트 모양과 비슷한지 검토 (30분)

---

## M1 — 공통 인덱서

**상태: 완료 — 2026-10-27 사용자 검토 조건 반영 및 정답 5건 승인 확정.** 55개 연결 일치, 누락·과탐·상태 불일치 0건. 전체 인덱싱과 npm test 통과. [종료 보고서](docs/m1-final-report.md).

**목표:** SI 코드에서 grep이 멈추는 연결(문자열 URL, sqlId, include 등)을 이어주는 인덱서.

**산출물**
- `lib/indexer/` + `scripts/build-index.mjs`
- `schemas/index.schema.json`
- 함정 케이스 단위 테스트
- `docs/limitations.md`

**완료 기준**
- legacy-board 함정 케이스를 모두 올바른 상태(CONFIRMED/LIKELY/UNRESOLVED)로 분류
- eGovFrame 전체 인덱싱이 끝까지 돌고 소요 시간·처리 못 한 패턴을 보고
- 승인된 정답 대비 정확도 보고 (누락/과탐 분리)

**[GATE]** eGovFrame 메뉴 3개 + legacy-board 흐름 2개의 정답 초안을 Ian이 검토·승인

**검토 완료:** DB 설정 선택, 인터셉터 경로, JSP 리터럴 분기 및 정답 freshness 검사를 반영한 승인본 5건.

---

## M2 — si-trace (← pstack `how`)

**상태: 완료 — 2026-10-27 일반 결함 수정 및 v2 확인.** 첫 held-out 60/66과 원본은 그대로 보존했다. v2는 66/66이며 일반화 성능이 아니다. 학습 55개 연결 일치·누락 0개, 정답에 없는 실제 Helper 호출 1건의 비교 FAIL을 설명했다. npm test 74건, manifest 8건 검증 통과. 명시 호출 PASS, 자동 활성화 1/3 PASS·2/3 미실행을 구분한다. [종료 보고서](docs/m2-final-report.md), [첫 평가 보고서](docs/m2-heldout-first-report.md), [이전 GATE 기록](docs/m2-report.md). M3는 시작하지 않았다.

**목표:** "이 버튼 누르면 뭐가 실행돼?"에 근거 달린 흐름으로 답한다.

**학습 정답 보정 — 2026-10-27:** 사용자 승인으로 공통분류코드 삭제의 인증 Helper 진입 호출을 추가했다. 기존 v2-final 산출물로 학습 eval을 재실행해 **5건 56/56, 누락·과탐·상태 불일치 0건**을 확인했다. 위 종료 당시 55/55·과탐 1건과 첫 held-out 60/66 기록은 보존한다. [보정 보고](docs/m2-training-correction-report.md).

**완료 기준**
- M1에서 승인된 정답 5건과 비교한 eval 통과 또는 차이 설명
- 단순/복잡 분기 동작 확인
- Codex에서 `$si-trace`로 호출되고, 한국어 질문으로 자동 활성화됨

**추가 [GATE]:** egov-article-list / egov-user-insert / egov-id-dplct-ajax의 소스 기반 초안을 승인받는다. 승인 후 첫 실행을 수정 전 held-out 점수로 보존한 뒤에만 사례 대응을 수정한다. M1의 5건은 학습 세트로 별도 보고한다.

**GATE 통과:** 외부 주입 호출 기록과 공통 인증 Helper 진입 깊이를 통일해 승인본으로 확정했다. 첫 실행·역방향·누락·보충 항목과 압축 원본을 보존했다.

**Ian 할 일:** 실무 코드 화면 1~2개에 로컬로 써보고 피드백

---

## M2.5 — Thymeleaf 수집기

**사용자 완료 승인: 2026-10-27.** 아래 종료 검증 기록을 승인받고 M3를 별도 지시로 시작했다.

**상태: 종료 — 승인 범위 구현·정적 검증·Java 17 앱 검증 완료, Java 8 런타임 BLOCKED.** 일반 규칙의 실패 테스트 후 v2를 새 run-id로 실행했다. 삭제 screen 4/4·server 9/9, PetClinic screen 6/6·server 3/3, 학습 3건·기존 JSP 8건 회귀 모두 PASS다. npm test 108/108, Java JUnit 2건·HTTP·실제 브라우저 삭제도 통과했다. 첫 FAIL/원본은 그대로 보존했고 **v2는 결함 수정 확인이며 일반화 성능이 아니다**. [M2.5 종료 보고](docs/m2.5-final-report.md)를 따른다. M3는 시작하지 않았다.

**목표:** Ian의 JSP → Thymeleaf 이관 업무에서 to-be 화면의 이벤트부터 기존 서버 흐름까지 추적한다.

**산출물**
- `examples/legacy-board-thymeleaf/`: legacy-board의 Controller·Service·Mapper를 동일하게 유지하고 화면을 Thymeleaf로 변환하되 공통코드 목록 1개는 JSP로 유지. 두 뷰 리졸버의 order·viewNames·prefix/suffix를 근거로 반환 뷰를 판정하고 불확실하면 LIKELY
- 수집 대상: `th:action`, `th:href`/`th:src`의 `@{...}`(경로 변수·쿼리 파라미터 포함), `th:replace`/`th:insert`/`th:include` 프래그먼트, `th:inline="javascript"`의 AJAX URL
- 추가 수집: `layout:decorate`/`layout:fragment`의 레이아웃·본문 연결, `th:data-*`/`th:attr`의 data URL을 외부 JS가 읽어 AJAX 하는 흐름. 테스트베드 공통 레이아웃과 화면 1개 이상에 적용
- 수집기 단계의 추가 검증: viewNames 무제한 + `checkExistence=true`의 템플릿 존재/fallback 합성 사례, Thymeleaf 3.0 유틸 객체 구문 읽기. 테스트베드는 viewNames 방식과 3.1.5 렌더링을 유지
- 승인된 그룹별 학습 3건: 검색(parity 16/screen 7), 등록(parity 12/screen 5), 독립 공존(parity 해당 없음/screen 1). 기존 화면 요청도 screen에 포함하고 보충 항목을 채점에서 제외하지 않음
- held-out 2건(자체 삭제 AJAX·외부 PetClinic 화면 → Controller)은 개별 등록·채점. 외부 JPA 구간은 범위 밖

**완료 기준**
- 승인된 legacy-board 검색·등록 2건과 비교해 화면 노드만 달라지고 서버 연결·상태는 동일함을 검증
- 사례별 parity·screen 일치/정답을 따로 보고하고 합산하지 않음. 서버 parity의 from/to/kind/status는 JSP 승인본과 동일해야 함
- 수집 범위의 확정·미확정 패턴 검증, 기존 JSP 승인 8건 회귀 확인(학습·held-out 구분), `npm test` 및 단독 설치 복사본 검사 통과
- held-out 2건의 흐름 탐색·정답 작성 전 구현 동결, 정답 승인 전 구현 수정 금지. 두 사례 모두 같은 동결 구현으로 첫 점수·원본·해시를 개별 보존·보고한 뒤 지시가 있을 때만 수정 가능
- 테스트베드 빌드·렌더링·AJAX 동작 확인. 실행 환경이 없으면 BLOCKED와 재실행 명령 기록

**GATE 이력:** 의존성/공존 설정·학습 3건·held-out 2건 승인과 수정 전 첫 점수 보고를 완료했다. 사용자가 일반 규칙 수정·v2·종료 점검을 추가 승인해 모두 수행했다. 첫 결과는 보존한다.

**Ian 할 일:** 종료 보고와 Java 8 런타임 제약을 확인한다. Java 8 환경이 준비되면 재실행할 명령을 보고서에 남겼다. M3는 별도 지시 후 진행한다.

---

## M3 — si-debug (← pstack bug-fix, fix-root-causes)

**상태: 완료 — 2026-10-28 사용자 종료 승인 및 held-out 정합성 재판정.** 제공 project/ 파일 + 제안 대상 파일만 비교하고 누락된 출제 원본 파일은 패키징 오류로 제외 기록했다. 보존된 v5 제안 3건의 새 정합성은 **EXACT 2/3·EQUIVALENT 1/3·FAIL 0/3**이다. 02는 Ian의 명시적 동등 수정 승인이고 자동 판정이 아니다. 첫 결과·v5의 3 FAIL·원본·학습 결과는 그대로 보존하며 위치 재채점·앱 재실행은 하지 않았다. [별도 재판정·완료 보고](docs/m3-consistency-rejudgment-report.md). **M4는 시작하지 않는다.** 아래 기록은 당시 상태를 보존한 이력이다.

**종료 점검 PARTIAL — 2026-10-28:** 사용자 승인으로 실제 식별자·필수 diff 계약과 채점 후 임시 복사본 수정안 정합성 검증을 실패 테스트부터 추가했다. npm test **139/139**, v5 동결 **6a750e5 / 190개 파일**. 새 실행의 학습 위치 **10/10·16/16**, 정합성 **9/9 PASS·Oracle 1건 UNRESOLVED**. 후속 held-out 위치 **3/3**, 정합성 **0/3 PASS·3 FAIL**. 첫 held-out **3/3** 및 원본·이전 학습 기준선은 불변이며 합산하지 않는다. 정합성에는 제공 프로젝트/출제 원본의 파일 구성 차이도 포함된다. [종료 보고](docs/m3-final-report.md). M3 전체 PASS와 M4 전환은 보류하고 사용자 검토를 기다린다.

**held-out 첫 실행 완료·결과 검토 대기 — 2026-10-28:** 사용자 지시로 지정 3건을 v4 동결 구현에서 실행했다. 세 첫 진단을 보존한 뒤 정답에 접근했고 첫 점수·원본은 private에 보존했다. 공개 결과는 [사례별 위치 적중 여부](docs/m3-heldout-first-report.md)만 기록한다. 구현·제공 프로젝트를 수정하지 않았으며 후속 지시를 기다린다.

**v4 보정·재채점 완료·held-out 대기 — 2026-10-28:** 사용자 승인으로 06 정답 67→78 정정 이력, enclosing freshness와 삭제형 범위(04:9~13, 10:1~1)를 추가하고 MyBatis 메시지 예외 중복 root를 실패 테스트부터 수정했다. npm test 133/133. 새 동결 9bd0161 / 186개 파일, 새 run-id의 대응 재채점 **10/10·항목 16/16·누락/추가 0**. 첫 **8/10·14/16·누락/추가 각 2**는 그대로 보존한다. 정답/규칙 보정 효과이며 일반화 성능 향상을 뜻하지 않는다. [v4 보고](docs/m3-recheck-v4-report.md). M3 전체는 PARTIAL이고 held-out 제공 후 별도 지시를 기다린다.

**학습 첫 채점 완료·held-out 대기 — 2026-10-28:** 사용자 정답 10건 승인 후 스레드 보존·홈 경로 일반화를 실패 테스트부터 수정했다. npm test 127/127, 새 재현 9/9. 새 동결 aa0c3bb / 173개 파일로 학습 첫 채점 **8/10건, 위치 14/16, 누락·추가 각 2**를 보존했다. 04·06의 행 위치 차이와 06 첫 제안 diff 결함을 설명하고 정정 제안만 별첨했다. 승인 정답·첫 점수는 미수정이며 재채점하지 않았다. [첫 채점 보고](docs/m3-training-first-report.md). M3 전체는 PARTIAL이며 실제 held-out은 사례 제공 후 별도 지시를 기다린다.

**입력 현실성 재GATE — 2026-10-27:** 사용자 1차 위치 검토 후 9건의 로그를 실제 재현 캡처로 교체하고, 07은 MyBatis Oracle 형식 및 세 참조 후보 UNRESOLVED로 보강했다. symptom.md 10건·마스킹 보존·예외 체인 회귀 검증을 반영했다. npm test 123/123, 결함 재현 9/9이며 적중 점수는 아니다. 새 동결 `3884a3e` / 172개 파일, 이전 동결 보존. [재검토 보고](docs/m3-input-recheck-report.md). 재GATE 승인 전 학습 채점·실제 held-out 열람은 하지 않는다.

**상태: 정답 승인 GATE — 2026-10-27.** 프롬프트 보강 `87adf55` 후 si-debug·학습 10건·정답 초안을 작성했다. 최종 npm test 118/118, 실행 가능 9건의 정상·결함 HTTP 비교 및 실제 예외 타입 4건을 검증했다. 원인 위치 적중 채점은 승인 전 미실행이다. [GATE 보고](docs/m3-report.md). 실제 held-out은 동결 후 Ian이 제공하며 첫 점수는 수정 전 기준선으로 보존한다.

**목표:** 스택트레이스·로그·증상으로 원인을 찾고, 근거와 수정안을 낸다.

**완료 기준**
- 자체 학습 10건 eval: 원인 위치 적중 수·증거 단계·자기 작성 편향 보고
- 로그 마스킹 테스트 통과
- 스택트레이스 클래스 해시·트랜잭션 ID 보존과 세션 ID·개인정보 마스킹 회귀 통과
- 재현 불가 케이스에서 근거 없이 단정하지 않음
- 구현 동결 후 실제 held-out 첫 실행·점수·리비전을 비공개로 보존하고 학습과 분리 보고
- 사용자 진단의 실제 식별자와 필수 diff 계약, 학습/held-out 새 실행의 수정안 정합성을 위치 적중과 별도 검증·보고. 비교는 진단 보존·채점 후에만 허용

**[GATE]** 버그 케이스 10건 정답 초안 승인 + 구현 동결 후 Ian이 `evals/private/`에 실제 에러 사례 2~3건 추가. 정답 승인 전 채점하지 않는다.

**Ian 할 일:** 실제 업무 에러 로그를 마스킹해 넣기 (1시간)

---

## M4 — si-unit-test (← pstack tdd, test-behavior-not-implementation)

**상태: 완료 — 2026-10-28 사용자 2차 held-out 3/3 확인 및 종료 지시 반영.** 첫 0/3·v2 보정·2차 신규 첫 3/3과 기존 동결·생성 산출물을 그대로 보존했다. 별도 최종 template에서 모든 assert 메시지와 목록 건수 단언을 정리하고 두 정상 테스트베드만 새 run으로 각각 **48/48 PASS·계획 28/28 충족**을 확인했다. npm test **160/160**, 최종 manifest/test-results 및 XML 참조 검사 통과. 학습 13건 분류·4/4 탐지와 v5 수정 후 통과, 약한 테스트 점검, 동결 후 블라인드 첫 점수 등 완료 기준을 충족했다. [M4 종료 보고](docs/m4-final-report.md)에 M5 입력 JSON 두 개와 스키마를 명시했다. **M5는 시작하지 않았다.** 아래 기록은 당시 이력이다.

**v2 보정·재검증 완료 / 재동결 GATE — 2026-10-28.** 첫 held-out 0/3 원본을 보존하고 정상 인덱스 기반으로 분기·전체 저장 컬럼·허용/거부 경계를 도출했다. 두 테스트베드 각각 기존 회귀 16 + 자동 도출 32 = **48/48 PASS**, 계획 **28/28 생성·실행·통과(100%)**다. 학습 13건 회귀는 가능 4/4 탐지·v5 수정 후 4/4 통과, 범위 밖 8건·Oracle BLOCKED 1건. 관찰한 held-out의 v2는 **3/3 DETECTED**이며 결함 수정 확인이고 일반화 성능이 아니다. npm test 160/160, manifest/test-results 각각 21개 검증. **2b10f62 / 245개 파일** 재동결 후 신규 3건 출제·별도 지시를 기다린다. [v2 보고](docs/m4-v2-report.md). 아래는 당시 이력이다. M5는 시작하지 않았다.

**상태: 학습 평가·구현 동결 GATE — 2026-10-28.** 사용자 조건을 프롬프트에 먼저 반영·커밋한 뒤 두 테스트베드에서 생성 테스트 각 16/16 PASS를 확인했다. M3 기존 13건은 모두 학습으로 분류했으며, 가능 4건 중 **4/4 탐지·v5 수정 후 4/4 통과**(M3 heldout-02 EQUIVALENT 포함), 범위 밖 8건·Oracle 로그 전용 BLOCKED 1건이다. 약한 호출 검사와 반환값 변이를 실제 실행했고 보강 테스트가 결함을 잡았다. npm test 152/152, M5 결과/manifest 18개씩 검사 PASS, pom·운영 원본·M3 결과 보존. **4a584c5 / 219개 파일 동결 후 중지**했다. [GATE 보고](docs/m4-gate-report.md). 신규 Claude held-out 3건은 동결 후 제공·별도 실행 지시 대기이며 M4 전체 완료가 아니다. M5는 시작하지 않았다.

**목표:** 테스트가 없는 레거시 프로젝트에도 쓸모 있는 단위 테스트를 넣고 실행한다.

**완료 기준**
- legacy-board Service 계층 테스트 작성·실행 성공
- **생성된 테스트가 M3 버그 패치 중 일부를 실제로 잡아냄** (구현이 망가져도 통과하는 테스트가 아님을 증명)
- surefire 결과를 `test-results.json`으로 변환 (M5 입력)
- 의존성(pom) 변경 없이 동작하거나, 필요 시 승인 요청

**Ian 할 일:** 생성된 테스트가 실무에서 받아들여질 수준인지 검토

---

## M5 — si-docs (SI 고유)

**상태: 범위 조정 — 2026-10-28. 구현 미시작.** [공통 프롬프트](prompts/M5.md), [M5a](prompts/M5a.md), [M5b](prompts/M5b.md)를 따른다. 참고 스킬의 회사·프로젝트 식별자는 가져오지 않고 현장 규칙만 일반화한다. xlsx·Playwright Node의 후보/버전/라이선스를 비교한 **통합 의존성 승인 GATE** 이전에는 설치·package 변경·구현을 하지 않는다.

### M5a — 프로그램 목록·테이블 정의서

**목표:** 인덱스와 저장소 DDL/제공 CSV에서 기존 계획의 문서 2종을 사용자 xlsx 양식에 채운다. DB 직접 접속 금지.

**완료 기준**
- 문서 2종의 표준 JSON·기본 양식·사용자 양식 매핑 생성
- 미확인 값은 빈 칸·미확인 표시, 원본 양식·서식·수식 보존 검증
- legacy-board 기본 2종 생성·재읽기·서식 회귀, 승인된 실제 양식 검증
- `validate-skills`, `sync-shared --check`, `npm test` 통과

**[GATE]** 기본 2종과 매핑을 만든 뒤 사용자가 제공한 민감정보 제거 양식 1개로 검증한다. 식별자·원본 양식 내용은 저장소 문서/샘플에 복사하지 않는다.

### M5b — 화면 TC 결과서

**목표:** 한국 SI의 화면/프로그램 단위 기능 테스트를 인벤토리 → TC → 실행 증거 → xlsx로 잇는다. M4 JUnit 결과를 화면 TC의 PASS로 바꾸어 쓰지 않는다.

**v0.1 범위와 규칙**
- form, 버튼·핸들러, AJAX, data-url, 링크, fragment, 단일 팝업 호출, 숨김 필드를 인덱스로 수집하고 파일:라인을 남긴다.
- 인벤토리 항목과 TC 초안을 1:1 대조해 누락·중복을 검출한다. 알려진 기대 요청 URL·HTTP 메서드는 자동 기입하고 미확정은 표시한다.
- 실행 유형은 AUTO-API(로그인 세션 HTTP), AUTO-UI(Playwright Node + 설치된 Chrome/Edge), SKIP(삭제·다운로드만)이다. 브라우저 다운로드 금지.
- AUTO-UI는 예상 요청 URL·메서드·응답 코드와 화면 결과를 모두 확인하고 TC별 스크린샷·요청 기록을 남긴다. selector는 실제 템플릿 id·name만 사용한다. 생성·수정 데이터는 삭제·자동 롤백·정리하지 않는다.
- 테스터는 사용자 지정 계정 ID, 자동화 수행 문구 금지. 1차/2차 열 분리·1차 불변, 2차 여부가 불명확하면 실행·작성 전에 질문한다.
- FAIL은 제품 결함/자동화 오탐/미확정을 근거와 함께 구별한다. 근거 없이 PASS로 변경하지 않는다. M4 결과는 서버 로직 검증 근거 보조 열이다.

**완료 기준**
- legacy-board와 legacy-board-thymeleaf 전 화면의 독립 소스 대조로 인벤토리 누락 **0** 확인
- TC 1:1 대조와 기대 요청 자동 기입, 실행 결과 xlsx 생성·재읽기·원본/1차 열 보존 검증
- AUTO-UI 화면+요청 이중 판정 및 TC별 증거, 데이터 보존 확인
- M3 학습 패치를 각각 임시 사본에 적용해 해당 TC FAIL 확인. 실행 가능한 패치의 탐지 수·범위 제외·Oracle 로그 전용 BLOCKED를 분리 보고
- 스킬/공통 복사본/전체 테스트 통과. 실제 양식 내용·참고 스킬 식별자 비공개

**실행 전 확인:** 사용자 계정 ID·1차/2차 차수·허용 로컬 환경·데이터 보존 가능 여부가 필요하다. 실제 id/name이 없거나 기대 요청·화면 결과가 미확정이면 추측해 실행/통과 처리하지 않는다. 범위 밖이나 BLOCKED를 삭제·다운로드 SKIP과 섞지 않는다.

---

## M6 — 통합과 v0.1.0

**목표:** 요구사항 하나를 기준으로 네 스킬을 잇고, 공개 가능한 상태로 정리한다.

**시나리오:** "게시판 목록에서 작성자로 검색하면 오류가 난다"
→ `si-trace`로 흐름 파악 → `si-debug`로 원인 분석 → 수정 → `si-unit-test`로 서버 로직 회귀 테스트 → `si-docs`로 화면 TC 실행·결과서(서버 근거는 보조 열)

**완료 기준**
- 시나리오 전 과정의 manifest가 `parent_run_ids`로 연결되고 스키마 검증 통과
- Codex와 Claude Code에서 4개 스킬 로딩 확인 (못 하면 BLOCKED + 수동 절차 문서)
- README(설치, 사용 예시, pstack과의 차이), `docs/pstack-mapping.md`, `CONTRIBUTING.md`
- 로컬 태그 `v0.1.0` (푸시는 Ian이 직접)

**Ian 할 일:** 실무 일주일 사용 → 공개 여부 결정

---

## v0.2 백로그 (지금 구현하지 않음)

- modern-board 테스트베드(Spring Boot + JPA) — si-migrate의 to-be 및 JPA 인덱서 수집기 검증용
- JPA 수집기: Repository 메서드명, `@Query`, `@Entity`/`@Table`
- Vue3+REST 수집기: `.vue`, axios, router, `application.yml`
- Service↔Mapper map 파라미터 키 정적 대조(Java put 키 vs XML `#{}` / `parameterType=map`)

- `si-impact` (← `blast-radius`): 안전 근거 1개 증명 + SI에서 grep이 멈추는 곳 점검
- `si-migrate`: 기준선 고정 → 이관 → 비교 (si-trace + si-unit-test + si-impact 조합)
- si-docs: docx 양식, 인터페이스 정의서, HWPX 검토
- 화면 동등성 검증 (Playwright)
- 화면 TC 확장: 그리드 셀 편집, 파일 업로드, 드래그, 다단계 팝업 (M5b v0.1 범위 밖)
- PL/PM 연계: 요구사항 추적표, 검수 준비 점검

## 참고 일정 (평일 저녁 + 주말 기준)

| 마일스톤 | 예상 | 병목 |
|---|---|---|
| M0 | 3~4일 | JDK/Maven 환경 |
| M1 | 1주 | 정답 검토 |
| M2 | 3~4일 | |
| M2.5 | 의존성·정답 검토 후 산정 | Thymeleaf 의존성 승인, 학습·held-out 정답 승인 |
| M3 | 1주 | 버그 케이스 정답, 실제 사례 준비 |
| M4 | 1주 | 레거시 테스트 환경 |
| M5a | 기존 4~5일 추정 재검토 | 프로그램/테이블 양식 매핑 |
| M5b | 범위·실행 환경 확인 후 산정 | 전 화면 인벤토리·TC·API/UI 실행·증거·양식 |
| M6 | 3~4일 | |

## Codex로 진행하는 방법

1. 빈 폴더에 `AGENTS.md`, `MILESTONES.md`, `prompts/`를 넣고 `git init` 후 첫 커밋
2. 그 폴더에서 Codex 실행 (`AGENTS.md`는 자동으로 읽힘)
3. `prompts/M0.md를 읽고 수행해` 입력
4. GATE에서 멈추면 검토 후 `승인, 계속` 또는 수정 지시
5. 마일스톤이 끝나면 새 세션에서 다음 프롬프트로 진행 (컨텍스트를 깨끗하게 유지)
