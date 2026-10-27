# SIStack 마일스톤

## v0.1 목표

한국 SI 개발자가 매일 하는 네 가지 일, **코드 흐름 파악 · 에러 원인 분석 · 단위 테스트 · 산출물 작성**을 Codex/Claude Code에서 스킬 하나씩으로 처리할 수 있게 한다.

성공 기준은 기능 개수가 아니라 다음 두 가지다.

1. 공개 레거시 코드(eGovFrame)와 실제 업무 사례에서 결과가 사람이 승인한 정답과 맞는다.
2. Ian이 실무에서 일주일 이상 직접 쓰고, 동료 1명 이상이 써본다.

## 전체 흐름

```text
M0 기반 ──▶ M1 공통 인덱서 ──┬──▶ M2 si-trace ──▶ M2.5 Thymeleaf ─────┐
                            └──▶ M3 si-debug ──▶ M4 si-unit-test ──▶ M5 si-docs ──▶ M6 통합·릴리스
```

- M1 인덱서는 네 스킬이 모두 쓰는 공통 부품이다 (흐름 골격, 에러 위치 찾기, 테스트 대상 선정, 프로그램 목록).
- M2와 M3는 M1 이후 순서 무관.
- M2.5는 M2 완료 후 수행한다. 이번 작업 순서는 M2 → M2.5 → M3이며 M3의 기술적 선행 조건은 M1로 유지한다.
- M4는 M3의 버그 패치로 "테스트가 실제로 버그를 잡는지"를 검증하므로 M3 이후.
- M5는 M4의 `test-results.json`을 입력으로 쓴다.

## 테스트베드

| 이름 | 위치 | 용도 |
|---|---|---|
| legacy-board | `examples/legacy-board/` (M0에서 생성) | 빌드·실행 가능한 소형 레거시 프로젝트. Spring MVC + MyBatis + JSP + jQuery, 테스트용 H2. 모든 스킬의 기본 테스트 대상 |
| legacy-board-thymeleaf | `examples/legacy-board-thymeleaf/` (M2.5 구축 완료) | 같은 서버 코드, Layout Dialect·data URL 외부 JS를 사용하는 Thymeleaf 화면과 공통코드 JSP 공존. 학습 정답 승인 대기, 삭제 AJAX held-out 평가 예정 |
| Spring PetClinic | `.testbeds/spring-petclinic/` (M2.5 예정, 소스 커밋 금지) | 공식 공개 프로젝트 고정 커밋의 화면 → Controller held-out 1건. 이후 JPA 구간 제외 |
| 버그 케이스 | `evals/debug/cases/<id>/` | legacy-board에 적용하는 버그 패치 + 증상 로그. 원본 코드는 깨끗하게 유지 |
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

**상태: 그룹별 학습 정답 3건 GATE — 구조 재검토 대기.** 기존 검색 17개·등록 14개 주 연결은 사용자 승인. parity/screen 분리와 화면 연결 승격, 독립 공존 사례를 반영했다. [그룹별 GATE 보고](docs/m2.5-grouped-gate-report.md)를 검토한다. 기존 승인 8건의 비교기 결과 동일, npm test 81건 통과. 수집기·새 학습 채점·held-out은 미착수이며 Java 8 런타임은 BLOCKED다.

**목표:** Ian의 JSP → Thymeleaf 이관 업무에서 to-be 화면의 이벤트부터 기존 서버 흐름까지 추적한다.

**산출물**
- `examples/legacy-board-thymeleaf/`: legacy-board의 Controller·Service·Mapper를 동일하게 유지하고 화면을 Thymeleaf로 변환하되 공통코드 목록 1개는 JSP로 유지. 두 뷰 리졸버의 order·viewNames·prefix/suffix를 근거로 반환 뷰를 판정하고 불확실하면 LIKELY
- 수집 대상: `th:action`, `th:href`/`th:src`의 `@{...}`(경로 변수·쿼리 파라미터 포함), `th:replace`/`th:insert`/`th:include` 프래그먼트, `th:inline="javascript"`의 AJAX URL
- 추가 수집: `layout:decorate`/`layout:fragment`의 레이아웃·본문 연결, `th:data-*`/`th:attr`의 data URL을 외부 JS가 읽어 AJAX 하는 흐름. 테스트베드 공통 레이아웃과 화면 1개 이상에 적용
- 수집기 단계의 추가 검증: viewNames 무제한 + `checkExistence=true`의 템플릿 존재/fallback 합성 사례, Thymeleaf 3.0 유틸 객체 구문 읽기. 테스트베드는 viewNames 방식과 3.1.5 렌더링을 유지
- 그룹별 학습 초안 3건: 검색(parity 16/screen 7), 등록(parity 12/screen 5), 독립 공존(parity 해당 없음/screen 1). 기존 화면 요청도 screen에 포함하고 보충 항목을 채점에서 제외하지 않음
- held-out 2건(자체 삭제 AJAX·외부 PetClinic 화면 → Controller)은 개별 등록·채점. 외부 JPA 구간은 범위 밖

**완료 기준**
- 승인된 legacy-board 검색·등록 2건과 비교해 화면 노드만 달라지고 서버 연결·상태는 동일함을 검증
- 사례별 parity·screen 일치/정답을 따로 보고하고 합산하지 않음. 서버 parity의 from/to/kind/status는 JSP 승인본과 동일해야 함
- 수집 범위의 확정·미확정 패턴 검증, 기존 JSP 승인 8건 회귀 확인(학습·held-out 구분), `npm test` 및 단독 설치 복사본 검사 통과
- held-out 2건의 흐름 탐색·정답 작성 전 구현 동결, 정답 승인 전 구현 수정 금지. 두 사례 모두 같은 동결 구현으로 첫 점수·원본·해시를 개별 보존·보고한 뒤 지시가 있을 때만 수정 가능
- 테스트베드 빌드·렌더링·AJAX 동작 확인. 실행 환경이 없으면 BLOCKED와 재실행 명령 기록

**[GATE]** 의존성·공존 설정 승인(완료) → 검색·등록·공존의 그룹별 채점 구조 승인(현재) → held-out 2건 정답 승인 → 수정 전 첫 점수 개별 보고. 각 지점에서 멈춘다.

**Ian 할 일:** 학습 3건의 expected.draft JSON/MD에서 parity/screen 구조와 승격한 screen 연결을 검토한다. 그 후 수집기 구현을 진행하며 held-out 2건은 별도 정답 GATE를 거친다.

---

## M3 — si-debug (← pstack bug-fix, fix-root-causes)

**목표:** 스택트레이스·로그·증상으로 원인을 찾고, 근거와 수정안을 낸다.

**완료 기준**
- 버그 케이스 7건 eval: 원인 위치 적중률, 증거 단계 보고
- 로그 마스킹 테스트 통과
- 재현 불가 케이스에서 근거 없이 단정하지 않음

**[GATE]** 버그 케이스 정답 초안 승인 + Ian이 `evals/private/`에 실제 에러 사례 2~3건 추가

**Ian 할 일:** 실제 업무 에러 로그를 마스킹해 넣기 (1시간)

---

## M4 — si-unit-test (← pstack tdd, test-behavior-not-implementation)

**목표:** 테스트가 없는 레거시 프로젝트에도 쓸모 있는 단위 테스트를 넣고 실행한다.

**완료 기준**
- legacy-board Service 계층 테스트 작성·실행 성공
- **생성된 테스트가 M3 버그 패치 중 일부를 실제로 잡아냄** (구현이 망가져도 통과하는 테스트가 아님을 증명)
- surefire 결과를 `test-results.json`으로 변환 (M5 입력)
- 의존성(pom) 변경 없이 동작하거나, 필요 시 승인 요청

**Ian 할 일:** 생성된 테스트가 실무에서 받아들여질 수준인지 검토

---

## M5 — si-docs (SI 고유)

**목표:** 코드·테스트 결과에서 SI 산출물을 **사용자 양식(xlsx)에 채워서** 만든다.

**v0.1 지원 문서:** 프로그램 목록, 테이블 정의서, 단위테스트 결과서

**완료 기준**
- 기본 양식 3종 생성 + 사용자 양식 매핑 동작
- 코드에서 확인 못 한 칸은 비워두고 표시 (지어내지 않음)
- 원본 양식 파일을 덮어쓰지 않음

**[GATE]** Ian이 회사 스타일 양식(민감정보 제거) 1개를 제공해 매핑 유연성 검증

**Ian 할 일:** 실제로 써본 산출물 양식 1개 준비

---

## M6 — 통합과 v0.1.0

**목표:** 요구사항 하나를 기준으로 네 스킬을 잇고, 공개 가능한 상태로 정리한다.

**시나리오:** "게시판 목록에서 작성자로 검색하면 오류가 난다"
→ `si-trace`로 흐름 파악 → `si-debug`로 원인 분석 → 수정 → `si-unit-test`로 회귀 테스트 → `si-docs`로 단위테스트 결과서

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

- `si-impact` (← `blast-radius`): 안전 근거 1개 증명 + SI에서 grep이 멈추는 곳 점검
- `si-migrate`: 기준선 고정 → 이관 → 비교 (si-trace + si-unit-test + si-impact 조합)
- si-docs: docx 양식, 인터페이스 정의서, HWPX 검토
- 화면 동등성 검증 (Playwright)
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
| M5 | 4~5일 | 양식 매핑 |
| M6 | 3~4일 | |

## Codex로 진행하는 방법

1. 빈 폴더에 `AGENTS.md`, `MILESTONES.md`, `prompts/`를 넣고 `git init` 후 첫 커밋
2. 그 폴더에서 Codex 실행 (`AGENTS.md`는 자동으로 읽힘)
3. `prompts/M0.md를 읽고 수행해` 입력
4. GATE에서 멈추면 검토 후 `승인, 계속` 또는 수정 지시
5. 마일스톤이 끝나면 새 세션에서 다음 프롬프트로 진행 (컨텍스트를 깨끗하게 유지)
