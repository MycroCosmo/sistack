> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# M5a 사용자 양식 GATE — 2026-10-28

**상태: GATE / M5a 전체 완료 전.** 기본 프로그램 목록·테이블 정의서와 양식 매핑을 구현·검증했다. 실제 사용자 양식 검증은 아직 하지 않았다. M5b는 시작하지 않는다.

### 한 일

- 사용자 승인 버전 exceljs@4.4.0(MIT), playwright-core@1.64.1(Apache-2.0)을 정확히 고정하고 루트 package-lock.json, 전이 [라이선스 기록](dependency-licenses.json)을 추가했다. 설치 스크립트·브라우저 다운로드는 실행하지 않았다. 루트/M5a Node >=18 유지, M5b만 >=20이다. M5a는 playwright-core를 import하지 않는다.
- [si-docs](../skills/si-docs/SKILL.md)에 표준 JSON 추출, 기본 양식 2종, 헤더 매핑 초안, 확인된 매핑만 채우기, 재읽기 검사와 manifest/report/evidence 출력을 제공한다. 설치본은 자체 package.json/lock과 공통 복사본으로 저장소 밖에서 실행한다.
- JSON 스키마: [프로그램 목록](../schemas/docs/program-list.schema.json), [테이블 정의서](../schemas/docs/table-spec.schema.json), schema_version **1.0.0**. 각 행은 values/evidence(file,line)/status/reason/unverified, 문서는 source_revision/source_files 해시를 가진다. 파일 해시가 달라지면 채우기를 거부한다.
- 기본 양식/헤더 매핑 초안은 [templates](evidence/m5a-final/templates/)에 있다. confirmed=false로 생성하며 사용자 확인 없이는 실행하지 않는다. ID·업무명 규칙은 사용자 입력으로만 채운다. 실제 회사/프로젝트 식별자와 참고 양식 원문은 가져오지 않았다.

최종 산출물의 도구·소스 기준 리비전: **8b9d05f2416ca883025fea87d1e49f34b0f05479**. 새 run은 대상 프로젝트 `.sistack/runs/m5a-final-program-list`, `m5a-final-table-spec`, `m5a-final-roundtrip`이며, 공개 합성 테스트베드 결과만 아래에 복사 보존했다.

| 문서 | 추출 범위 | 재읽기/원본 보존 | 문서 상태 | 산출물 |
|---|---|---|---|---|
| 프로그램 목록 | endpoint 11행 | 입력 값 일치, 양식 보존, 원본 해시 동일 | PARTIAL | [xlsx](evidence/m5a-final/program-list/program-list.xlsx), [표준 JSON](evidence/m5a-final/program-list/evidence/data.json), [manifest](evidence/m5a-final/program-list/manifest.json) |
| 테이블 정의서 | 선택 Oracle DDL, 3개 테이블·12개 컬럼 | 입력 값 일치, 양식 보존, 원본 해시 동일 | PARTIAL | [xlsx](evidence/m5a-final/table-spec/table-spec.xlsx), [표준 JSON](evidence/m5a-final/table-spec/evidence/data.json), [manifest](evidence/m5a-final/table-spec/manifest.json) |

프로그램 목록의 미확인 빈 칸 34개: ID 11, 업무명 11, Service 3, Mapper 3, 화면 6. 연결 근거 수준은 CONFIRMED 9행 / LIKELY 2행이며 행의 reason에 이유가 있다. 계층명 표시는 클래스명 관례다. 미확인 칸만 노란색이며, 알려진 '기본값/참조 없음'은 일반 빈 셀로 구별한다. 테이블 빈 칸 미확인은 0개지만 실제 DB·최종 ALTER 이력은 미확인이어서 PARTIAL이다. 스코프 내 기계 검증 PASS와 문서 내용의 완성/승인을 구분한다.

### 검증

| 실행 | 실제 결과 |
|---|---|
| `npm.cmd test` | **173/173 PASS**, FAIL 0. 신규 M5a 13건 포함. 정답 소스·라인 검사, 스킬 5개 형식 검사, 공통 복사본 검사 포함 |
| `node scripts/demo-docs.mjs examples/legacy-board docs/evidence/m5a-final m5a-final` | 기본 2종+합성 양식, 새 run으로 생성. [요약](evidence/m5a-final/summary.json) |
| 합성 양식 1개·2시트 채우기/재읽기 | 아래 6종 요소 모두 보존. 입력 값·원본 해시 동일, 감지된 보존 밖 경고 0 |
| 저장소 밖 임시 설치본 | 자체 lock `npm ci --offline --ignore-scripts`, ExcelJS의 로컬 설치 위치 확인 후 프로그램/테이블 추출·기본 양식·CLI 채우기 PASS |
| 공유 서식 회귀 | 수정 전 확인된 URL에 노란색이 번지는 테스트 **FAIL 1/1**, 셀 서식 복제 수정 후 관련 2/2 PASS |
| 보존 밖 요소 경고 | 합성 chart OOXML 부품을 로드 전에 감지하여 실제 run/report에 경고, PARTIAL 유지 |
| 값/보존 경계 | 미확인 표시, 원본/기존 결과/run 덮어쓰기·기존 값/수식/병합 충돌·중복 매핑·부족한 영역·변경 소스 거부, CSV 인용/필수 값, 스키마/마스킹 검사 PASS |
| 미리보기 | ExcelJS 결과를 별도 로컬 렌더러로 읽어 기본 2종의 제목/헤더/입력/강조 영역 확인. 실제 Excel 앱 표시·계산 검증을 뜻하지 않음 |
| 기존 결과 보존 | M4 동결 JSON·공개 결과·학습 결과/종료 보고의 Git 변경 0. private held-out 내용 접근/재평가 없음 |

왕복 검사 양식에는 데이터 유효성 드롭다운 1개, 조건부 서식 1개, 병합 3개, PNG 이미지 1개, 메모 1개, 수식/캐시 2개와 다른 시트가 함께 있다. [원본 합성 양식](evidence/m5a-final/roundtrip/rich.xlsx), [채운 파일](evidence/m5a-final/roundtrip/run/table-spec.xlsx), [재읽기 증거](evidence/m5a-final/roundtrip/run/evidence/verification.json)를 보존했다. 셀 서식·행 높이·열 너비, 이미지 바이트/위치, 다른 시트·수식/캐시도 비교했다. 합성 양식 1개의 통과를 임의 사용자 양식 전체의 보존율로 해석하지 않는다.

### 결정

- 상세 근거는 [decisions](decisions.md), [limitations](limitations.md), [의존성 제안서](m5-dependency-proposal.md)에 기록했다.
- ExcelJS 공식 latest API 조회 결과 최신 안정 릴리스는 v4.4.0, **2023-10-19T19:57:46Z**다. 약 3년 새 안정 릴리스가 없다는 한계를 명시하고 승인 버전을 사용한다. [공식 릴리스](https://github.com/exceljs/exceljs/releases/tag/v4.4.0), [공식 latest API](https://api.github.com/repos/exceljs/exceljs/releases/latest).
- 원본 양식은 항상 보존한다. 매핑이 가리키는 빈 영역만 쓰며 행을 이동/삽입하지 않는다. 엑셀 근거 열은 첫 2개+추가 건수/JSON 위치, 표준 JSON에는 전체 근거를 남긴다.
- ExcelJS가 기본 인쇄 시작 번호를 명시값으로 다시 쓰는 문제는 비활성 기본값만 저장 시 제외해 보정했다. 미확인 강조는 셀 서식 복제로 다른 영역에 전파되지 않게 했다. JSP 프로그램 목록의 화면 누락은 인덱서 뷰 연결의 JSP 진입 조건으로 보완했다.

커밋: `6c1b45e` 의존성/lock/라이선스, `643a9a9` M5a 구현·회귀, `8b9d05f` 공유 서식 보정. 이 보고와 산출물은 후속 문서 커밋으로 보존한다. 원격 push는 하지 않는다.

### 남은 문제

- **실제 사용자 양식 미검증**. 아래 GATE가 남아 M5a 전체 완료를 선언하지 않는다.
- 피벗·차트·매크로·전자서명·외부 연결·도형·스레드 댓글·고급 확장은 보존 보장 밖이다. 원본 OOXML 검사에서 해당 부품/확장이 발견되면 사용자 보고서에 경고하고 PARTIAL로 남긴다. 알 수 없는 기능을 모두 감지하지는 못한다. 기본 드롭다운/조건부 서식/PNG/메모/수식 조합만 실측했다.
- 수식은 계산하지 않는다. 실제 Excel 표시·재계산, 복잡한 DDL/ALTER 최종 스키마, endpoint에 연결되지 않은 배치/화면 전수 목록은 미확인이다.
- 전이 배포 패키지 **194개 중 buffers@0.1.1의 라이선스 표시는 1개 미확인**이다. 배포 package.json/라이선스 파일에 정보가 없어 UNRESOLVED를 유지했다. 직접 승인한 두 패키지는 MIT/Apache-2.0 확인. 추정 라이선스를 쓰지 않았다.
- M5b의 TC 인벤토리/API/UI/엑셀 실행 결과는 구현·실행하지 않았다. 브라우저 호환성 실측도 M5b 선행 확인으로 남긴다.

### 사용자 확인 필요

[M5a 프롬프트의 실제 양식 GATE](../prompts/M5a.md): “기본 2종과 매핑이 검토 가능한 상태가 되면 보고하고 멈춘다.”

**민감정보를 제거한 실제 사용자 xlsx 양식 1개와 로컬 경로를 지정해 주세요.** 그 양식의 시트/헤더/입력 영역 매핑 초안을 먼저 제시하고 확인을 받은 뒤 채우기·원본 해시·서식 보존을 검증한다. 사용자 식별자·원문 양식은 공개 샘플/커밋에 넣지 않는다. 여기서 멈추며 M5b는 시작하지 않는다.
