# 온마을 시설관리 구현·검증 보고

> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

2026-10-29. 신규 실습 앱의 선언 범위는 **PASS**, SIStack CLI 구조 추출은 **PARTIAL**이다. 고객 현장 검증이나 스킬 정확도 평가와 구별한다.

### 한 일

- `examples/public-facility`에 7개 화면과 공통 조각, 시설·신청·이력 3개 테이블, 역할 3종/합성 계정 4개를 가진 독립 앱을 작성했다.
- 신청·검색·심사·취소·시설 운영 변경과 중복/동시 요청 방지, 권한/CSRF, 변경 이력 트랜잭션을 구현했다.
- 실행기, HTTP 스모크, JUnit 테스트, 업무 요구사항과 스킬별 요청 예시를 제공했다.
- 기존 SIStack 소스/평가 정답과 theHands 프로젝트는 수정하지 않았다.

### 검증

| 실행한 검증 | 관측 결과 | 근거 |
|---|---|---|
| 새 프로젝트 `mvn -o -q test` | JDK 17에서 JUnit **13/13 PASS** | 실제 Spring·MyBatis·H2 호출, `target/surefire-reports/` |
| 새 프로젝트 `npm test` | JDK 21에서 JUnit **13/13 PASS**, Node 래퍼 **1/1 PASS** | 실제 Maven 호출과 JUnit 보고서 대조. 두 실행의 테스트를 26개로 합산하지 않음 |
| 실제 HTTP `npm run smoke` | **PASS**, 합성 계정 4개 로그인, 신청 1건의 승인·취소·검색·이력 및 권한/중복 차단 | 실행 중 앱의 신청 #4, 취소 상태와 이력 보존 |
| 실제 브라우저 신청→담당자 승인 | **PASS**, 신청 #5의 목적·인원·일자와 접수→승인 이력 확인 | `.sistack/browser-approved.png`, 실행 중 앱 |
| SIStack 저장소 루트 `npm test` | **195/195 PASS**, 정답·인벤토리·스킬·공통 복사본 검사 통과 | `.tmp/public-facility-root-tests-local.log` |
| CLI `trace --from /bookings --mode structure-only` | **PARTIAL**, 노드 65·연결 87 추출 | `.sistack/runs/facility-trace-readable/` |
| CLI `unit-plan --mode structure-only` | **PARTIAL**, 테스트 후보 29개 추출 | `.sistack/unit-plan-readable.json` |
| CLI `docs program-list --mode structure-only` | **PARTIAL**, 프로그램 23행 추출 | `.sistack/program-list-readable.json` |

각 CLI 수치는 이 합성 프로젝트 한 개의 추출량이다. 소스 연결의 정답 일치율, 후보 테스트 실행 수, 문서 내용 검수 완료를 뜻하지 않는다. CLI 결과는 전체 스킬의 prepare/review/finish 수행 결과가 아니다.

최종 점검에서 화면 소스와 CSS의 줄을 나누어 파일:라인 근거와 수정 위치를 읽기 쉽게 정리했다. 이후 JDK 17의 JUnit 13/13을 재확인하고 브라우저를 새로고침해 승인 화면을 확인했다. 최초 구조 추출 파일은 보존하고 `readable` 이름의 새 결과를 만들었다. 추출량은 동일했다.

최초 루트 테스트는 격리 환경에서 임시 Git 쓰기/오프라인 npm 캐시 접근 문제로 **193 PASS·2 FAIL**이었다. 원시 로그 `.tmp/public-facility-root-tests.log`를 보존하고 로컬 환경에서 전체 검사를 다시 실행해 통과했다. 최초 서버/HTTP 실행도 루프백 연결 제한으로 실패했으며, 로컬 실행 권한으로 재실행 후 HTTP·브라우저 검증을 완료했다.

### 결정

사용자가 선택한 Thymeleaf와 시설 대관 업무를 기준으로 구현했다. 기존 라이브러리 버전·구성을 재사용하고 새 의존성은 추가하지 않았다. 자세한 이유는 [결정 기록](decisions.md)을 따른다.

### 남은 문제

- 로컬 역할 선택 로그인과 메모리 H2이므로 실제 인증·영속 데이터 보관·운영 배포용이 아니다. 서버 종료 시 실행 데이터는 사라진다.
- PostgreSQL/Oracle/Tibero, 외부 WAS, 별도 기기의 모바일 화면, 부하·장시간 운용은 미검증이다.
- si-debug 실제 결함 패치, si-unit-test 스킬을 통한 신규 테스트 생성, si-docs xlsx·화면 TC 실행은 이번 완료 범위가 아니다. 메모리 DB를 si-docs TC 데이터 보존 조건 충족으로 간주하지 않는다.
- 생성한 앱과 테스트는 같은 에이전트가 작성했다. 독립된 현장 평가나 승인 정답으로 사용하지 않는다.

### 사용자 확인 필요

구현을 마치기 위한 추가 승인은 없다. 다음 실습은 [스킬 실습 안내](skill-practice.md)의 요청을 하나씩 실행하면 된다. 후속 변경 요청 CR-001~003은 아직 구현하지 않았다.
