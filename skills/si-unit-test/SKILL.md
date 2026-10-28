---
name: si-unit-test
description: 레거시 Java/Spring의 Service·Mapper·유틸에 실제 결함을 잡는 테스트를 작성하고 실행한다. '이 서비스 테스트 코드 짜 줘', '단위 테스트 만들어 줘', '이 버그 회귀 테스트 추가해 줘', '단위테스트 결과서용 실행 결과 만들어 줘' 요청에 사용한다.
license: MIT
---

# si-unit-test

읽기·분석이 기본이다. 테스트 작성·실행 요청은 해당 테스트 파일 생성과 로컬 실행의 승인이다. 기존 테스트 덮어쓰기, 운영 코드·빌드 설정 변경은 별도 승인한다. 운영·개발 DB와 배포 서버에는 접속하지 않는다. 분석 소스를 외부에 전송하지 않는다.

## 절차

1. `node <skill>/scripts/detect-env.mjs <project>`로 실제 POM을 읽는다. [환경 규칙](references/detect-env.md)을 따른다. 지원 범위 밖이면 BLOCKED와 필요한 확인을 기록한다. 라이브러리를 임의 추가하지 않는다.
2. 프로젝트 소스와 기존 테스트를 읽고 대상 메서드→Mapper/DAO 호출을 확인한다. 필요하면 내장 인덱서 `scripts/lib/indexer/index.mjs`의 `buildIndex`로 골격을 얻고 실제 소스로 확정한다. 인덱스만으로 원인을 확정하지 않는다.
3. [자동 도출 규칙](references/coverage-rules.md)에 따라 인덱스의 Mapper XML/include와 Service 검증 비교식을 읽고 `generate-tests.mjs`로 `coverage-plan.json`과 테스트를 생성한다. `<if>/<when>/<otherwise>`별 입력, UPDATE SET 컬럼별 변경·재조회, INSERT 전체 컬럼 재조회, 비교 상수의 허용/거부 쌍을 포함한다. 생성은 정상 소스와 합성 fixture만 입력으로 받는다. 패치·정답으로 테스트를 도출하지 않는다. 해석 못 한 항목은 분모에서 지우지 않고 UNRESOLVED로 남긴다.
4. [케이스 설계](references/test-case-design.md)에 따라 업무 동작·경계·예외를 보충하고 한국어 업무 이름을 붙인다. Service는 DAO를 목으로 격리하고 Mapper는 이미 승인된 테스트 DB 설정이 있을 때만 로컬 H2로 실행한다. Mapper 검사는 좁은 통합 테스트라고 구분한다. 템플릿·JS·웹 설정의 결함을 소스 문자열 검사로 잡지 않는다.
4. [JUnit 4/Mockito](references/junit4-mockito.md), [레거시 Spring](references/spring-legacy.md)을 따라 테스트와 `test-plan.json`을 작성한다. 운영 코드를 테스트 편의 목적으로 고치지 않는다. 기존 테스트와 이름을 충돌시키지 않는다.
5. [실행 계약](references/result-contract.md)의 설정 JSON으로 `node <skill>/scripts/run-tests.mjs <project> <config.json>`을 실행한다. 사용자가 승인한 실행만 수행한다. 실행 전에 계획된 테스트 목록을 확정하고 결과에 없는 테스트를 성공으로 세지 않는다. 원인 코드가 틀렸으면 결함으로 보고하며 임의 수정하지 않는다.
6. 반환값을 바꾸거나 핵심 호출을 누락한 임시 사본에서도 통과하는 약한 테스트를 검토한다. 결과와 부작용을 검증하도록 고치고, 동일 변이에서 실패함을 실행해 증명한다. 목 호출 검증만으로 반환값을 검증했다고 주장하지 않는다.
7. `.sistack/runs/<run-id>/`에 `manifest.json`, `report.md`, `test-results.json`, `evidence/`를 보존한다. 같은 run-id를 재사용하지 않는다. 실패 메시지·XML·로그는 마스킹한다. M5는 스키마와 실행 범위까지 확인해 읽는다.

## si-debug 연결

입력 run-id를 `parent_run_ids`에 남긴다. 테스트 가능한 결함이면 결함 사본에서 실패를 확인하고, 사용자가 승인한 수정 diff를 별도 임시 사본에 적용해 **동일 테스트**가 통과하는지 확인한다. 비교 중 테스트를 바꿔 통과시키지 않는다. 빌드 실패·환경 부재는 탐지가 아니다. 사람의 EQUIVALENT 판단과 실행 근거를 별도로 기록한다.

## 보고

실행한 테스트 수, 실패·오류·스킵, 실행 환경과 한계, 검증한 대상·증거 단계, 테스트 가능한 사례 중 탐지 수를 적는다. 실제 실행은 증거 4단계, 소스 위치 확인은 2단계다. H2 통과를 Oracle/Tibero 호환성이나 브라우저 동작 검증으로 확대하지 않는다. AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아니다.

계획 대비 충족률은 `coverage-results.json`의 생성/실행/통과 개수를 전체 계획 수와 함께 보고한다. 실행은 실패한 테스트도 포함하고, 통과는 해당 계획의 모든 테스트가 PASS여야 한다. 스킵·누락·미해결을 성공으로 세지 않는다. 이 수치는 계획 테스트 충족률이며 JVM 계측 코드 커버리지가 아니다. 관찰한 held-out으로 규칙을 고친 후의 v2는 결함 수정 확인이며 일반화 성능이 아니다.
