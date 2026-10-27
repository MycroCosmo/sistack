# SIStack 마일스톤

## v0.1 목표

한국 SI 개발자가 매일 하는 네 가지 일, **코드 흐름 파악 · 에러 원인 분석 · 단위 테스트 · 산출물 작성**을 Codex/Claude Code에서 스킬 하나씩으로 처리할 수 있게 한다.

성공 기준은 기능 개수가 아니라 다음 두 가지다.

1. 공개 레거시 코드(eGovFrame)와 실제 업무 사례에서 결과가 사람이 승인한 정답과 맞는다.
2. Ian이 실무에서 일주일 이상 직접 쓰고, 동료 1명 이상이 써본다.

## 전체 흐름

```text
M0 기반 ──▶ M1 공통 인덱서 ──┬──▶ M2 si-trace ─────────────────────────┐
                            └──▶ M3 si-debug ──▶ M4 si-unit-test ──▶ M5 si-docs ──▶ M6 통합·릴리스
```

- M1 인덱서는 네 스킬이 모두 쓰는 공통 부품이다 (흐름 골격, 에러 위치 찾기, 테스트 대상 선정, 프로그램 목록).
- M2와 M3는 M1 이후 순서 무관.
- M4는 M3의 버그 패치로 "테스트가 실제로 버그를 잡는지"를 검증하므로 M3 이후.
- M5는 M4의 `test-results.json`을 입력으로 쓴다.

## 테스트베드

| 이름 | 위치 | 용도 |
|---|---|---|
| legacy-board | `examples/legacy-board/` (M0에서 생성) | 빌드·실행 가능한 소형 레거시 프로젝트. Spring MVC + MyBatis + JSP + jQuery, 테스트용 H2. 모든 스킬의 기본 테스트 대상 |
| 버그 케이스 | `evals/debug/cases/<id>/` | legacy-board에 적용하는 버그 패치 + 증상 로그. 원본 코드는 깨끗하게 유지 |
| eGovFrame 공통컴포넌트 | 외부 클론 (`scripts/fetch-testbed.mjs`) | 실제 규모의 공개 레거시. 인덱서·si-trace 현실성 검증. 저장소에 커밋하지 않음 |
| 실제 업무 사례 | `evals/private/` (gitignore) | Ian이 직접 넣는 마스킹된 실제 에러·코드 사례. 자기채점 방지용 |

---

## M0 — 저장소 기반

**상태: 완료 — 2026-10-27 사용자 legacy-board 구조 승인.** 최종 검증은 [M0 종료 보고](docs/m0-final-report.md)를 따른다. M1은 미착수다.

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

**Ian 할 일:** 정답 초안 검토 (2~3시간, v0.1에서 가장 중요한 검토)

---

## M2 — si-trace (← pstack `how`)

**목표:** "이 버튼 누르면 뭐가 실행돼?"에 근거 달린 흐름으로 답한다.

**완료 기준**
- M1에서 승인된 정답 5건과 비교한 eval 통과 또는 차이 설명
- 단순/복잡 분기 동작 확인
- Codex에서 `$si-trace`로 호출되고, 한국어 질문으로 자동 활성화됨

**Ian 할 일:** 실무 코드 화면 1~2개에 로컬로 써보고 피드백

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
