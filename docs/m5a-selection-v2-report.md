> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M5a 프로그램 행 선정 보정 v2 — 2026-10-28

### 한 일

기존 m5a-approved-program-list-v1은 보존하고 두 프로젝트에 **m5a-approved-program-list-v2**를 생성했다. 제공 양식에 대한 **형식 일반성 검증이며 현장 검증이 아니다**. 선정 사유를 JSON에 남기고 Service 인터페이스를 실제 상속/구현 관계로 구현체 행에 병합했다. 인터셉터/Advice는 공통으로 유지했다.

| 프로젝트 | v1 | v2 | 변화 | 화면 | 클래스 | 공통 | SQL |
|---|---:|---:|---:|---:|---:|---:|---:|
| legacy-board | 34 | **25** | -9 | 6 | 8 | 2 | 9 |
| legacy-board-thymeleaf | 35 | **26** | -9 | 7 | 8 | 2 | 9 |

두 프로젝트의 기본 제외 목록은 같다.

| 항목 | 처리·사유 |
|---|---|
| Pagination | 자료 필드+getter/setter 중심의 데이터 보조 타입 |
| Board | 자료 필드+getter/setter 중심 |
| BoardSearch | 자료 필드+getter/setter 중심 |
| CommonCode | 자료 필드+getter/setter 중심 |
| Menu | 자료 필드+getter/setter 중심 |
| UserSession | 생성자를 제외하면 getter 중심인 자료 전달 타입 |
| NotFoundException | RuntimeException 상속 |
| BoardService | 제외가 아닌 BoardServiceImpl 행으로 병합 |
| CommonCodeService | 제외가 아닌 CommonCodeServiceImpl 행으로 병합 |

따라서 각 프로젝트에서 **기본 제외 7개 + 병합으로 줄어든 단독 행 2개 = 9행 감소**다. 순수 유틸 분류 규칙도 구현·검증했지만 두 테스트베드에서 그 종류로 별도 제외한 항목은 0개다. LoginInterceptor와 CommonExceptionHandler는 공통 2행이며, Mapper 인터페이스와 XML/어노테이션 SQL은 별도 행으로 유지했다.

### 검증

- `npm.cmd test`: **181/181 PASS**, FAIL 0. 신규 선정 테스트는 수정 전 FAIL 3/3 → 수정 후 PASS 3/3. 기존 왕복 보존/단독 설치/승인 정답/스킬 5개/복사본 검사 포함.
- v1의 모든 파일 이름·SHA-256을 새 run 전후 비교하여 동일함을 확인했다. 두 v2의 입력 값 재읽기·원본 해시·서식/병합/검증 모델 보존 모두 통과했다. 관련 소스 셀에 병합 인터페이스 이름이 실제로 표시됨을 확인했다.
- 구현 기준 리비전: **265f5adc4c0d1cd1aa997d527c65d146c4bdde33**. [집계와 제외/병합 근거](evidence/m5a-selection-v2/summary.json)에 상태·이유·파일:라인·병합 대상 식별자를 남겼다.
- [legacy-board xlsx](../examples/legacy-board/.sistack/runs/m5a-approved-program-list-v2/program-list.xlsx), [Thymeleaf xlsx](../examples/legacy-board-thymeleaf/.sistack/runs/m5a-approved-program-list-v2/program-list.xlsx). 각 run의 evidence/data.json에 전체 제외 사유, interface_sources, field_evidence가 있다. 원본 양식·상세 매핑·채운 파일은 커밋하지 않는다.

### 결정

- `sistack-docs.json`의 `program_kinds`에 dto/exception/utility boolean을 받는다. 생략/false는 기본 제외, true는 포함한다. [설정 예시](../examples/sistack-docs.example.json), [선정 규칙](../skills/si-docs/references/program-list.md) 참조.
- DTO는 생성자를 제외한 getter/setter 비율(80% 이상)·필드·자료형 어노테이션으로 보수적으로 분류한다. 프레임워크 빈/진입점과 의존성이 있는 타입을 무작정 자료형으로 제외하지 않는다. 유틸은 상태/의존성 없는 정적 계산 후보만 제외한다. 추론 분류는 LIKELY로 남긴다.
- JSON **1.2.0**에 excluded/interface_sources와 선정 설정 해시를 추가했다. 설정이 추출 후 바뀌면 재추출을 요구한다. 기존 1.0.0/1.1.0 결과는 보존한다.

### 남은 문제

분류는 정적 휴리스틱이며 임의 프로젝트의 실행 역할을 완전히 증명하지 않는다. 필요하면 program_kinds로 포함한다. 설정/업무명 미확인 및 LIKELY 화면명 때문에 v2 문서 상태는 PARTIAL이다. 기존 글꼴·행 높이·열 너비를 유지하므로 긴 내용은 셀 편집/전체 JSON으로 확인해야 할 수 있다.

### 사용자 확인 필요

행 선정 보정과 재생성은 완료했다. 이어서 [M5b 선행조건 GATE](m5b-preflight-report.md)에서 테스트 계정 ID와 수행 차수를 확인한다.
