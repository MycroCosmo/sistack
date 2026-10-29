> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# 스킬 기반 재구현 실행 기록

실행일: 2026-10-29. 이전 구현을 삭제한 커밋은 `b4d97a7`이다. 삭제 후 분석 → 새 구현 → 테스트 → 진단 → 문서 작성 순으로 진행했다. **SIStack은 프로젝트 전체를 자동 생성하는 스킬이 아니다.** 실제 스킬 실행을 개발 과정에 연결했고, 앱 구현과 보충 테스트는 에이전트가 작성했다.

## 실제 적용과 결과

| 스킬 | 적용 시점·실행 | 결과와 근거 |
|---|---|---|
| si-trace | 구현 전 theHands `OrgController#selectOrgList` prepare → 소스 대조 → finish | PARTIAL. 5개 연결을 검토했다. 자동 수집이 놓친 중첩 Service 호출을 원문으로 보완했다. 실제 프로필·권한 실행은 미확인. |
| si-unit-test | 환경 탐지 → 자동 계획·생성 → 업무 테스트 보충 → 공식 실행기 | 환경 PASS. 자동 계획 29건, 자동 생성 0건. 보충한 서비스 11건 + H2 연동 8건은 총 19/19 PASS. |
| si-debug | 실제 자동 생성 실패를 prepare → diagnosis → finish로 분석 | PARTIAL. wildcard import의 DTO 패키지와 계획 input_type 불일치를 소스 위치로 확인했다. 생성기 내부 원인은 UNRESOLVED이며 수정 적용 없음. 앱 결함을 일부러 만들지 않았다. |
| si-docs | 소스·DDL 추출 → 사용자 양식·매핑 승인 → fill-template·재읽기 | 두 문서 PARTIAL. 프로그램 23행, 테이블 컬럼 22행 작성. 원본 불변·양식 보존·값 재읽기 검증은 모두 true. 미확인 값은 공란. |

스킬 원문: 저장소 `.agents/skills/si-trace/SKILL.md`, `si-unit-test/SKILL.md`, `si-debug/SKILL.md`, `si-docs/SKILL.md`. `ponytail` lite와 필요한 검증 원칙을 함께 적용했다. 별도 에이전트·모델 전환은 사용하지 않았다.

## 실행 근거 위치

참고 분석은 참고 프로젝트 내부에 기록된다.

`C:/Users/Ian/OneDrive/Desktop/theHands/cms_was_egov_4.2/.sistack/runs/facility-reference-20261029/report.md`

새 앱 내부 근거:

- [최초 공식 테스트 실행](../.sistack/runs/facility-unit-first/report.md): 생성 불가 29건과 수동 보충 결과를 함께 보존
- [npm test를 통한 공식 실행](../.sistack/runs/facility-unit-1793236268468/report.md): 실제 JUnit 19건 통과
- [자동 생성 원본 계획](../.sistack/generated-01/coverage-plan.json): 자동 계획/생성 결과 원본
- [자동 생성 실패 진단](../.sistack/runs/facility-generator-diagnosis/report.md): 확인 범위와 수정 보류 이유
- [프로그램 목록 작성 기록](../.sistack/runs/facility-programs-01/report.md): 23행, 13개 매핑 열, 미확인 셀 41개
- [테이블 정의서 작성 기록](../.sistack/runs/facility-tables-01/report.md): 22행, 11개 매핑 열, 미확인 셀 22개
- [HTTP 검증](../.sistack/http/results.json): 12개 시나리오
- [재시작 검증](../.sistack/http/persistence-result.json): 저장된 신청·취소 상태·처리 사유 보존
- [실제 승인 화면](../.sistack/browser-approved.png): 브라우저 신청 → 담당자 승인 후 재시작해 확인

`.sistack` 결과는 이 PC에 보존하고 Git에서는 제외한다. 명령을 재실행하면 실행 ID와 결과가 새로 생성된다. 자동화 한계를 숨기기 위해 과거 보고서나 계획의 상태를 바꾸지 않았다.

## 검증한 범위

서비스 테스트 11건은 권한, 실제 조회 반환값, 페이지 조건, 날짜·시간·정원·문자 길이 경계, 중복·중지 시설, 승인·반려·취소, 관리자 권한을 검증한다. H2 연동 테스트 8건은 실제 Mapper SQL과 Spring 트랜잭션을 사용해 저장·조회·검색·페이징·인접 시간·이력·롤백·동시 신청을 검증한다.

별도 사본에서 `ReservationService.search`가 항상 빈 목록을 반환하도록 바꾼 변이 실험은 11건 중 1건이 실패했다. 원본 앱은 수정하지 않았다. 기대한 결함 탐지이며 앱 테스트 실패와 구분한다. 근거는 저장소 `.tmp/facility-return-mutation/.sistack/runs/facility-unit-return-mutation/`에 있다.

HTTP 검증 12개는 비로그인, CSRF 누락, 타인 상세, 시설 변경 권한, 잘못된 날짜, 신청 저장, 중복 시간, 신청자 승인 권한, 반려 사유 누락, 담당자 승인·재처리 차단, 취소 이력, 검색 권한 범위를 확인했다. 합성 신청을 생성·취소하며 운영 데이터에 접근하지 않는다.

브라우저에서는 합성 신청자 `applicant`가 시민교육실 신청을 접수하고 `reviewer`가 승인했다. 재시작 후 같은 승인 내역과 접수·승인 이력을 다시 확인했다. 별도 HTTP 신청의 취소 이력도 재시작 후 유지됐다. 화면 전체에 대한 si-docs TC 결과서를 실행한 것은 아니다.

저장소 루트 `npm test`도 실행해 Node 테스트 195/195, 기능 목록 감사, 스킬 형식 및 공통 코드 동기화 검사를 통과했다. 실행 로그는 `.tmp/facility-root-regression.log`에 있다.

## 한계와 다음 단계

- 자동 계획 29건을 수동 테스트 19건으로 대체해 충족률 100%라고 하지 않는다. 자동 생성 성공률은 이번 입력에서 0/29이다.
- si-debug는 생성기 입력 타입의 불일치까지 확인했으며 내부 원인 확정·수정·회귀 검증은 별도 스킬 개선 범위다.
- 프로그램 ID·업무명과 컬럼 한글명이 소스에서 확정되지 않아 엑셀은 PARTIAL이다. Excel 앱의 표시·수식 재계산은 검증하지 않았다.
- H2 외 DB, 운영 인증, 외부 배포, 모바일·보조기술 전체 검증은 하지 않았다.
- 이 사례는 에이전트가 만든 합성 앱의 검증이다. 독립 평가 정답 또는 고객 검수로 사용하지 않는다.

추가 사용자 승인은 필요하지 않다. 두 기본 양식과 매핑은 사용자의 명시적 승인 답변에 따라 작성했다.
