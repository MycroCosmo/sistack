> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M5a 종료 보고 — 2026-10-28

**상태: M5a 완료. M5b 미시작.** 사용자 승인 매핑으로 두 정상 테스트베드의 프로그램 목록을 채우고 원본/양식 요소를 재읽어 검증했다. 제공 양식은 **Claude가 공공 SI 일반 형식으로 만든 양식**이며, 이번은 **형식 일반성 검증이고 현장 검증이 아니다**. 양식 1개·프로젝트 2개의 결과를 모든 현장 양식의 보존율이나 업무명 정확도로 일반화하지 않는다.

### 한 일

- 승인한 A안: 화면 파일/클래스(인터페이스 포함)/SQL 선언별 한 행. 공유 클래스/SQL과 템플릿 선택자 중복을 제거한다. 공통 JSPF·독립 렌더 연결 없는 조각/레이아웃은 독립 화면에서 제외하고 JSON에 이유를 기록한다. 클래스/SQL의 물리적으로 다른 선언은 이름이 같아도 합치지 않는다.
- 화면명은 정적 `<title>` 우선, 그 값이 없거나 동적이면 첫 `<h1>`의 정적 텍스트를 **LIKELY**로 제안한다. 노란색과 비고의 파일:라인으로 표시한다. 클래스/SQL 업무명은 빈 칸/미확인이다. 원래 식별자는 JSON에 보존하고 엑셀에는 클래스명.메서드명으로 표시한다.
- 메타데이터·ID·작성일은 대상 프로젝트의 `sistack-docs.json`의 `meta`/`id_rule`만 사용한다. 허용 meta 키는 business_name/system_name/document_number/version/author/created_date다. 이번 두 프로젝트에는 설정 파일이 없어 해당 칸을 비웠다. 작성일을 실행일로, 진척률을 0/100으로 만들지 않았다.
- 복합 열·외부 업무 필드·상단 병합 master 입력을 지원한다. 업무구분·개발자·일정·진척률은 빈 칸/노란색/주소별 미확인으로 남긴다. 클래스/SQL URL의 해당 없음은 미확인과 구별한다.
- 새 엑셀에 AI/자동화 안내 문구를 넣지 않는다. 원래 양식·기존 산출물·M4 동결/held-out 기록은 변경하지 않았다.

현재 프로그램 JSON은 **1.1.0**이며 [스키마](../schemas/docs/program-list.schema.json)에 identity/not_applicable/field_evidence를 추가했다. 기존 요청 단위 1.0.0은 명시 endpoint 옵션으로 읽을 수 있다. 테이블 정의서 스키마는 1.0.0이다. 설정 예시는 [빈 설정 파일](../examples/sistack-docs.example.json), 사용법은 [프로그램 목록](../skills/si-docs/references/program-list.md)·[양식 매핑](../skills/si-docs/references/template-mapping.md)을 따른다.

### 검증

구현/소스 기준 리비전: **9885f39af32ae63fb2617f7935983ec0f38886cd**. 두 결과의 run-id는 각 프로젝트 안에서 **m5a-approved-program-list-v1**이다. 상세 manifest/report/evidence와 xlsx는 해당 run에 보존한다. private 양식 원문/상세 매핑/채운 파일은 커밋하지 않고, 공개 [집계 근거](evidence/m5a-completion/summary.json)만 남긴다.

| 프로젝트 | 화면 | 클래스 | SQL | 합계 | LIKELY 화면명 | 미확인 셀 | 기계 검증 / 문서 상태 |
|---|---:|---:|---:|---:|---:|---:|---|
| legacy-board | 6 | 19 | 9 | **34** | 6 | 307 | 재읽기 PASS / PARTIAL |
| legacy-board-thymeleaf | 7 | 19 | 9 | **35** | 7 | 316 | 재읽기 PASS / PARTIAL |

Thymeleaf 결과에는 소스에 남은 공존 JSP도 포함한다. 화면 이름이 같아도 다른 소스 파일을 같은 프로그램으로 합치지 않는다. 문서 PARTIAL은 미확인 설정/업무 정보·LIKELY 이름을 승인된 사실로 바꾸지 않았다는 뜻이며 양식 저장 실패가 아니다.

산출물 위치(로컬, Git 제외):

- legacy-board: [프로그램 목록](../examples/legacy-board/.sistack/runs/m5a-approved-program-list-v1/program-list.xlsx), [manifest](../examples/legacy-board/.sistack/runs/m5a-approved-program-list-v1/manifest.json), [검증 JSON](../examples/legacy-board/.sistack/runs/m5a-approved-program-list-v1/evidence/verification.json).
- legacy-board-thymeleaf: [프로그램 목록](../examples/legacy-board-thymeleaf/.sistack/runs/m5a-approved-program-list-v1/program-list.xlsx), [manifest](../examples/legacy-board-thymeleaf/.sistack/runs/m5a-approved-program-list-v1/manifest.json), [검증 JSON](../examples/legacy-board-thymeleaf/.sistack/runs/m5a-approved-program-list-v1/evidence/verification.json).
- 각 run의 evidence/data.json에 전체 메서드/원래 식별자/화면명 근거가 있다. 상세 승인 매핑과 읽기 전용 별도 검사 기록은 evals/private/templates/m5a-approved-v1/에 보관했다.

| 검사 | 실제 결과 |
|---|---|
| `npm.cmd test` | **178/178 PASS**, FAIL 0. 스킬 5개·공통 복사본·승인 정답 소스 근거 검사 포함 |
| 신규 분리 행/제안/설정/복합 매핑 테스트 | 구현 전 **FAIL 4/4**, 구현 후 **PASS 4/4** |
| 두 제공 양식의 SHA-256 | 프로그램 양식과 M5b 결과서 모두 읽기 전/후 동일. 결과서는 채우거나 시트를 추가하지 않음 |
| 실제 프로그램 결과 2개 | 입력 값 전체 재읽기 일치, 원본 해시 동일, 양식 요소 비교 일치, 경고 0 |
| 병합·드롭다운/숫자 검증·기존 메모 | 각 출력에서 병합 **7개**, 검증 규칙 있는 셀 **200개**, 기존 메모 **1개** 보존. 전체 모델 비교 일치 |
| 독립 재읽기 | 행별 구분/순번, 클래스·SQL 업무명/URL 빈 칸, 상단 설정 빈 칸, 미확인 강조, LIKELY 제목과 비고 파일:라인, 행 높이/열 너비·병합·검증 모델을 별도 확인 |
| 단독 설치 | 저장소 밖에서 자체 lock의 오프라인 설치 후 추출/기본 양식/채우기 CLI 실행 PASS |
| 기존 기능 회귀 | DDL/CSV 추출, 기본 2종, 드롭다운·조건부 서식·병합·이미지·메모·수식이 함께 있는 합성 양식 보존 테스트 PASS |
| 로컬 미리보기 | 결과 2개를 별도 로컬 렌더러로 읽어 강조/행 구분/상단/소스 표시를 확인. 실제 Excel 앱 표시·재계산 검증은 아님 |
| M4 결과 | 동결 JSON·최종 정상 기준선·학습 결과/종료 보고 Git 변경 0. private held-out 열람/수정/재평가 없음 |

원본 프로그램 양식 SHA-256은 집계 근거에 보존했다. 검증 규칙 셀 200개는 독립 규칙 유형 200종을 뜻하지 않는다. 합성 보존 양식 1개와 제공된 일반 프로그램 양식 1개에 대한 실행 증거이며 미지원 OOXML 전체의 보존을 보증하지 않는다.

### 결정

- 매핑 20항목(본문 14열+상단 6셀)을 명시했다. 기존 정확 일치 헤더 탐지 2항목을 재사용했고, 본문 12+상단 6 = **18항목을 승인 매핑으로 수동 지정**했다. 양식별 열/시트 이름을 공통 코드 상수로 고정하지 않았다.
- 원래 글꼴·테두리·날짜 서식·행 높이·열 너비·병합·검증·메모를 유지한다. 미확인/LIKELY 강조만 승인된 변경이다. 채색 후 기본 글꼴이 명시값으로 바뀌는 경우는 원본 기본 글꼴과 같은 의미만 동등 비교한다.
- 긴 관련 소스는 파일명:라인+처음 2개 참조+추가 건수로 표시하며 전체 목록은 JSON에 유지한다. 비고에는 원래 양식 헤더 표현과 근거를 사용한다.
- 사용자 확정 M5b 규칙은 [프롬프트](../prompts/M5b.md)에 기록했다. 기존 결과서 시트/수식/드롭다운/열을 바꾸지 않고 **서버로직검증** 별도 시트를 붙인다. BLOCKED는 결과 빈 칸+비고 사유+JSON BLOCKED이며 실행 방식 **수동**은 도구가 쓰지 않는다. 이번에는 구현/실행하지 않았다.

### 남은 문제

- 형식 일반성 검증이며 실제 회사의 현장 양식/업무명 검수가 아니다. 화면명 LIKELY와 외부 업무 정보는 사람 확인이 필요하다. 설정을 제공하면 새 run으로 채울 수 있다.
- 원래 행 높이/열 너비를 보존하므로 긴 소스·비고는 Excel의 편집 창/전체 JSON에서 확인해야 할 수 있다. 실제 Excel 표시·수식 재계산은 미검증이다.
- 미지원 기술/중첩 클래스/동적 화면 및 실행의 전수 수집, 복잡한 DDL/ALTER 최종 스키마와 실제 DB 실존은 보증하지 않는다. 피벗·차트·매크로 등 보존 보장 밖 요소는 발견 시 경고한다. [한계](limitations.md) 참조.
- 전이 의존성 buffers@0.1.1의 배포 라이선스 표시는 기존과 같이 UNRESOLVED다. 추가 의존성·브라우저 다운로드·운영 접근은 없다.

### 사용자 확인 필요

승인한 M5a 범위는 완료했다. 설정/업무 정보/LIKELY 화면명은 실제 사용 전에 검토한다. **M5b는 시작하지 않고 여기서 종료한다.** 결과서 양식은 M5b 지시를 받을 때 확정된 규칙으로 사용한다.
