> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M4 v2 일반 규칙 보정·재검증 — 2026-10-28

**상태: v2 보정·재검증 완료, 재동결 후 신규 3건 출제 대기.** 첫 held-out **0/3**과 모든 원본은 보존했다. v2는 관찰한 결함의 수정 확인이며 일반화 성능이 아니다. 다음 신규 held-out은 실행하지 않았다.

### 한 일

- [si-unit-test](../skills/si-unit-test/SKILL.md)의 테스트 도출을 [인덱스 기반 생성기](../lib/unit/coverage.mjs)와 [실행 테스트 생성기](../lib/unit/generate.mjs)로 자동화했다. 기존 인덱서가 가리킨 실제 파일·해시·메서드와 Mapper include를 따라간다. 패치·해설·사례 ID는 생성 입력에 넣지 않았다.
- 두 정상 examples 프로젝트에서 각각 [생성 산출물](../evals/unit/v2/registry.json)을 새로 만들었다. 기존 업무 회귀 16개를 재사용하고, 일반 규칙으로 32개를 추가 생성해 각 프로젝트에서 **48개**를 실행했다. pom·운영 소스·기존 생성 파일은 변경하지 않았다.
- [legacy-board coverage-plan](../evals/unit/v2/legacy-board/coverage-plan.json), [Thymeleaf coverage-plan](../evals/unit/v2/legacy-board-thymeleaf/coverage-plan.json)에 위치·소스 해시·분기 조건과 입력·쓰기 컬럼·경계 쌍·실행 테스트 ID·생성 Java 해시를 남겼다. 해석 못 한 항목은 UNRESOLVED로 분모에 남기는 구조다.
- 대표 생성 테스트: [legacy-board M4CoverageTest.java](../evals/unit/v2/legacy-board/generated/M4CoverageTest.java), [Thymeleaf M4CoverageTest.java](../evals/unit/v2/legacy-board-thymeleaf/generated/M4CoverageTest.java). 공통 실행 지원은 스킬의 Java template으로 함께 배포된다.

### 검증

두 프로젝트 각각의 도출 계획과 실제 테스트 수:

| 일반 규칙 | 계획 의무 수 | 새 테스트 수 | 실제 확인 |
|---|---:|---:|---|
| SQL if 참/거짓·when·otherwise | 16 | 16 | 부모 조건을 만족하는 입력으로 Mapper 호출, 독립 기대 행 ID/건수 단언 |
| UPDATE SET 컬럼별 변경 | 3 | 3 | 서로 다른 값으로 수정 후 JDBC 재조회 |
| INSERT 명시 컬럼 전체 | 5 | 5 | 입력값·생성키를 저장 후 JDBC 재조회 |
| Service 비교식 경계 쌍 | 4 | 8 | public 진입점별 허용/거부 경계 모두 실행 |
| 합계 | **28** | **32** | 기존 업무 회귀 16개와 함께 총 48개 |

정상 소스 기준 충족률:

| 테스트베드 | 전체 테스트 | 생성/계획 | 실행/계획 | 통과/계획 | 미해결 |
|---|---|---|---|---|---:|
| legacy-board | **48/48 PASS** | 28/28 | **28/28 · 100%** | 28/28 | 0 |
| legacy-board-thymeleaf | **48/48 PASS** | 28/28 | **28/28 · 100%** | 28/28 | 0 |

[JSP 기준선 결과](evidence/m4-v2/legacy-board/baseline-test-results.json), [Thymeleaf 기준선 결과](evidence/m4-v2/legacy-board-thymeleaf/baseline-test-results.json). **충족률의 분모는 도출한 계획 28개이며 전체 프로그램의 코드 커버리지가 아니다.** 각 경계 의무는 허용/거부 테스트가 모두 실행돼야 충족한다. 실행 수는 실패도 포함하고, 통과 수는 모든 연결 테스트가 PASS여야 한다. 스킵·누락은 충족으로 세지 않는다.

평가 결과:

| 평가 집합 | 결과 | 범위 |
|---|---|---|
| M3 기존 학습 13건 회귀 | 탐지 가능 **4/4 DETECTED**, v5 수정 후 **4/4 PASS** | 범위 밖 8건은 미탐·각 테스트 실행 PASS, Oracle 로그 전용 1건 BLOCKED |
| M4 첫 held-out | **0/3**, 원본 불변 | [첫 공개 기록](m4-heldout-first-report.md) |
| M4 held-out v2 | 아래 사례별 결과 | 관찰한 3건의 결함 수정 확인 |

| 사례 | v2 결과 |
|---|---|
| new-01 | DETECTED |
| new-02 | DETECTED |
| new-03 | DETECTED |

[학습 v2 결과](evidence/m4-v2/training-results.json), [held-out v2 공개 결과](evidence/m4-v2/heldout-v2-results.json). held-out 원문·patch·해설·실패 메시지는 공개하지 않았다. private 재검증은 `evals/private/m4-heldout-v2/`, 첫 결과는 `evals/private/m4-heldout-first/`에 별도로 있다. 학습과 held-out, 첫 결과와 v2를 합산하지 않는다.

- 실패 테스트를 먼저 실행했다. [도출 기능 구현 전 실패](evidence/m4-v2/coverage-red.txt), [생성 ID와 마스킹 충돌 재현](evidence/m4-v2/coverage-id-red.txt)을 보존했다. 실제 소스와 이름이 다른 합성 Mapper/Service, 네 비교 연산자, 상수의 좌우 위치, 비기본 입력, 미해결 분모와 누락/스킵/실패 집계를 검사했다.
- `npm.cmd test`: **160/160 PASS**, 실패·스킵 0. 정답 freshness, 스킬 4개, 공통 복사본 검사 포함. [독립 스킬 복사본의 생성 CLI](evidence/m4-v2/standalone-generator.json)도 계획 28개를 모두 생성했다.
- [직접 산출물 검증](evidence/m4-v2/verification.json): manifest **21개**, test-results **21개** 유효. 모든 실행이 정상 소스에서 생성한 테스트 해시와 일치했고, v5 수정 전후 **4쌍**의 테스트가 동일했다. 각 실행 보고서에도 coverage-plan·coverage-results와 충족률을 기록했다.
- 첫 결과와 정상 소스 관련 **890개 파일** 해시 불변을 확인했고 M3 private 원본·examples·pom도 보존했다. [보존 기록](evidence/m4-v2/preservation.json).

### 결정

- [설계 결정](decisions.md)의 M4 v2 기록을 따른다. 정상 소스의 분기/저장/검증 구조에서 의무를 도출하고, 합성 fixture는 유효한 업무 값만 제공한다. 대상 분기·컬럼·경계의 수동 사례 목록을 사용하지 않는다.
- SQL 검사에는 기본값만 쓰지 않는다. 컬럼마다 다른 양성 행 집합과 건수를 만들어 목록·count가 모두 비기본 분기를 구별하게 한다. ROWNUM 래퍼는 필터와 구별하고 표본이 첫 페이지 크기 안에 있음을 실행 시 확인한다.
- 테스트 이름의 숫자 해시가 마스킹과 충돌한 문제는 안정적인 문자 ID로 해결했다. 개인정보 마스킹을 완화하지 않았다.
- v2 구현 **518bb44**, 재생성·재검증 산출물 **2b10f62**를 구분했다. [새 동결](evidence/m4-freeze-v2.json)은 **2b10f62565cd07f9037fbd4736688f0fff4685a5 / 245개 파일**이다. 기존 동결 파일도 보존했다.

### 남은 문제

- 일반화는 아직 확인하지 않았다. 다음 신규 3건은 재동결 뒤 사용자가 출제한다. v2의 3/3을 새 독립 평가 점수로 해석할 수 없다.
- 현재 자동 실행 template은 두 테스트베드의 기존 MyBatis XML·test resources·로컬 H2 구조를 지원한다. 복잡 OGNL·동적 쓰기 컬럼·계산식·오버로드·상속된 검증·getter 이외 scalar 비교 등은 자동 생성의 한계다. 인식한 미지원 의무는 UNRESOLVED로 남기지만, 모든 Java/SQL 문법을 완전하게 수집한다는 뜻은 아니다.
- 실행은 기존 JDK 17.0.14/Maven 3.9.10, target 8이다. 실제 Oracle/Tibero·WAS·브라우저·성능은 검증하지 않았다. 테스트 가능한 범위의 증거 단계는 4다.

### 사용자 확인 필요

요청대로 **재동결 후 멈춘다.** 다음 신규 패치 3건과 별도 실행 지시를 기다린다. 새 spec은 이번 `m4-freeze-v2.json`을 가리키며, 새 첫 결과 경로는 `evals/private/m4-next-heldout-first/`다. 도구는 동결에 결합된 프로젝트별 v2 테스트와 계획을 선택한다. [절차](../evals/unit/README.md). M5는 시작하지 않았다.
