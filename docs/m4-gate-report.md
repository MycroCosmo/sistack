> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M4 학습 평가·구현 동결 GATE — 2026-10-28

**상태: 학습 평가·구현 동결 완료, 신규 held-out 제공 대기(PARTIAL).** 사용자 지시대로 새 버그 3건 출제 전에 멈춘다. M4 전체 완료나 새 held-out 성능을 선언하지 않는다.

### 한 일

- 사용자 조건을 [M4 프롬프트](../prompts/M4.md)에 먼저 반영하고 **27f01a8**로 커밋한 후 구현했다. 스킬/테스트 구현 **e7c3e88**, 학습·보정·검증 **4a584c5**를 구분했다.
- [si-unit-test](../skills/si-unit-test/SKILL.md)를 작성했다. POM 환경 탐지, 한국어 업무 테스트 계획, Maven 실행, Surefire XML 변환, M5용 [test-results 스키마](../schemas/test-results.schema.json), manifest/report 생성, 단독 설치용 공통 복사본을 포함한다.
- 두 테스트베드에 같은 생성 테스트 **16개(서비스 9·유틸 3·매퍼 4)**를 적용했다. Service/유틸은 단위 검사, Mapper는 실제 MyBatis와 인메모리 H2를 사용하는 좁은 통합 검사다. 기존 JUnit 4.13.2·Mockito 4.11.0·spring-test 5.3.39·H2 2.2.224(test)만 사용했다. pom과 운영 소스는 변경하지 않았다.
- 생성 테스트는 `evals/unit/generated/`에 보관하고 사례별 임시 사본에만 설치했다. 대표 파일: [M4ServiceTest.java](../evals/unit/generated/M4ServiceTest.java), [M4MapperTest.java](../evals/unit/generated/M4MapperTest.java). 페이징은 [M4PaginationTest.java](../evals/unit/generated/M4PaginationTest.java)다.
- M3 기존 13건을 실행 전 [분류](../evals/unit/cases.json)하고 모두 M4 **학습**으로 평가했다. 이전 held-out 3건을 신규 평가로 포장하지 않았다. 원문·private diff는 공개하지 않았다.

### 검증

실행 환경은 **Amazon Corretto 17.0.14 / Maven 3.9.10**, POM 컴파일 target은 8이다. 아래 결과는 [최종 v3 학습 결과](evidence/m4-training-v3/summary.json)를 따른다.

| 평가 | 결과 | 해석 |
|---|---|---|
| legacy-board 정상 기준선 | 16/16 PASS | 생성 테스트만 선택 실행 |
| legacy-board-thymeleaf 정상 기준선 | 16/16 PASS | 동일 테스트 집합 |
| 학습 분류 | 전체 13건 중 가능 4·범위 밖 8·로그 전용 BLOCKED 1 | 분류를 실행 전에 기록 |
| 탐지 가능한 학습 사례 | **4/4 DETECTED** | 정상에서 통과하던 같은 테스트가 결함에서 실패/오류 |
| 탐지한 사례의 v5 수정 후 | **4/4 사례, 각 16/16 PASS** | 테스트/계획 해시 동일, 수정 diff만 적용 |
| 범위 밖 8건 | 각 16/16 PASS, 결함은 미탐 | 전체 결함이 해결됐다는 뜻이 아님. 탐지 가능 분모에서 제외 |
| Oracle 로그 전용 1건 | BLOCKED, 미실행 | 실행 가능한 패치와 Oracle 환경 없음 |

탐지·수정 동작 근거:

| 학습 사례 | 분류 | 결함 사본(16개 테스트) | 보존 v5 수정 후 |
|---|---|---|---|
| 01-binding | Mapper 통합 | 오류 1 | 16/16 PASS |
| 05-paging | 유틸 | 단언 실패 2 | 16/16 PASS |
| 06-sort-sql | 검색 모델/Mapper 통합 | 오류 2 | 16/16 PASS |
| M3 heldout-02 | Mapper 통합 | 단언 실패 1 | **16/16 PASS** |

02의 마지막 행은 Ian이 승인한 EQUIVALENT 수정에 실행 근거를 더한다. 최종 테스트는 목록의 작성일 매핑과 상세 조회의 본문을 검증한다. 정상/결함/수정 후에 같은 테스트를 사용했으며 v5 diff는 고치지 않았다. **H2에서의 해당 동작 확인**이지 실제 DB 호환성이나 성능 개선 실측은 아니다. 상세 결과는 private `evals/private/m4-training-v3/m3-heldout-02/`에 있다.

약한 테스트 점검:

- `get`이 Mapper를 호출한 뒤 반환값을 null로 돌려주도록 임시 변이했다. 호출만 `verify`하는 [약한 fixture](../evals/unit/weak/WeakReturnTest.java.fixture)는 정상 1/1 PASS, 변이에서도 1/1 PASS였다.
- 반환 객체와 본문을 단언하는 최종 M4ServiceTest는 같은 변이에서 **1건 FAIL(전체 16개 중 15 PASS·1 FAIL)**이었다. 약한 fixture는 최종 생성 테스트에 포함하지 않는다. [점검 요약](evidence/m4-weak-test/summary.json), [최종 변이 결과](evidence/m4-weak-test/strong-mutant-final.json).

도구와 산출물 검사:

- `npm.cmd test`: **152/152 PASS**, 실패·스킵 0. 정답 freshness, 스킬 4개 검증, 공통 복사본, si-unit-test 단독 복사 실행을 포함한다.
- 최종 정상/결함/수정 실행의 **manifest 18개·test-results 18개** 계약 검사 PASS. 수정 전후 **4쌍**의 테스트 소스·계획이 동일하다. 표시 이름은 한국어 업무 표현이며 실패 메시지는 마스킹했다.
- 기존 private M3 자료와 두 examples 파일 **404개** 해시 불변. 공개 M3 보고/증거·학습 자료도 M3 완료 커밋 대비 변경 없음. [전체 검증 기록](evidence/m4-verification.json).
- `node scripts/eval-unit-test.mjs freeze docs/evidence/m4-freeze.json`: **4a584c5caf0e9907a690da1c40ed0642970c28a3 / 219개 파일** 동결. 구현·생성 테스트·계획·평가 도구·테스트베드를 포함한다. [동결 원본](evidence/m4-freeze.json).

### 결정

- [decisions.md](decisions.md)의 M4 기록을 따른다. 생성 테스트로 POM/운영 소스를 바꾸지 않고, DB 검사는 기존 테스트 H2에 한정했다. TDD의 실패 전/수정 후 확인과 동작 중심 테스트 원칙을 사용했다.
- 매 실행마다 별도 작업 사본에서 컴파일해 이전 Surefire XML·class 파일이 점수에 섞이지 않도록 했다. 실제 패치 적용을 파일 해시로 확인한다. 빌드 실패·누락 테스트는 탐지로 세지 않는다.
- 초기 시도는 삭제하지 않았다. 첫 실행의 SQL 문자셋/보고서 경로 문제를 보정했고, 패치가 적용되지 않은 초기 평가는 [무효 표시](evidence/m4-training/attempt-status.json)를 남겼다. 저장소 밖 임시 패치 적용과 실제 변경 확인 후 다시 실행했다.
- 첫 실제 학습에서는 목록에 본문까지 요구한 잘못된 테스트 때문에 02 수정 후 FAIL이 발생했다. 목록/상세 화면의 실제 사용 계약과 사용자의 명시 투영 승인을 근거로 테스트를 정정했다. [당시 결과](evidence/m4-training-final/summary.json)를 보존하고, 최종 v3에서 두 정상 기준선과 13건 학습을 모두 새로 평가했다. 성공에 맞춰 v5 수정안을 바꾸지 않았다.

### 남은 문제

- **신규 held-out 3건은 미제공·미실행**이다. 동결 이후 새 패치·정답·해설을 읽거나 만들지 않았다. 학습의 4/4를 일반화 성능으로 해석할 수 없다.
- Java 8/11/21 런타임, Oracle/Tibero, 브라우저·템플릿·JS·WAS 설정 동작은 이번 실행 범위 밖이다. Oracle 로그 전용 사례에는 임의 재현 테스트를 만들지 않았다.
- 현재 자동 실행은 단일 Maven POM/JUnit 4 조합이다. Gradle·상속 POM·profile·사용자 지정 JVM/빌드 경로는 수동 검토가 필요하며 BLOCKED로 처리한다. Codex 명시 CLI/단독 실행은 확인했지만 실제 대화의 한국어 자동 활성화는 별도 미검증이다.

### 사용자 확인 필요

요청한 **“학습 평가 후 구현을 동결하고 멈춰”** GATE에 도달했다. 이 보고와 대표 테스트 2개, 동결 파일을 검토하면 된다. Claude가 동결 이후 신규 패치 3건을 제공하고 별도 실행 지시를 주기 전에는 계속하지 않는다.

출제/실행 형식은 [평가 절차](../evals/unit/README.md)에 있다. 에이전트는 새 패치를 보지 않고 동결 테스트를 실행하며, 최초 탐지 여부만 `evals/private/m4-heldout-first/first-score.json`에 보존한다. M5는 시작하지 않았다.
