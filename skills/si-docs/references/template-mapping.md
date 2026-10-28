# 양식 매핑·보존

새 기본 엑셀에는 AI/자동화 안내 문구를 넣지 않는다. 승인/증거 단계 안내는 별도 report.md에 남긴다. 제공 양식의 원래 문구는 변경하지 않는다.

실행:
```
node <skill>/scripts/si-docs.mjs default-template program-list <new.xlsx> <draft.json>
node <skill>/scripts/si-docs.mjs propose-mapping table-spec <template.xlsx> <sheet> 4 5 204 <draft.json>
node <skill>/scripts/si-docs.mjs fill-template <project> <data.json> <confirmed-mapping.json> <new-run-id>
```

매핑 필드:
- template: 원본 양식 절대 경로. 결과는 새 run에 쓴다.
- sheet, header_row, start_row, end_row: 입력 시트·헤더·허용 행 범위. 행을 삽입/이동하지 않는다.
- columns: 표준 필드 → 실제 Excel 열 문자(A 등). 기본 한국어 헤더와 정확히 일치하는 열만 자동 제안한다. 중복 헤더는 수동 매핑한다.
- confirmed: 사용자 확인 후 true. false이면 채우기를 거부한다.
- cells: `meta.business_name` 등 → 상단 셀 주소. 헤더보다 위의 빈 셀/병합 master만 허용한다. 병합 자식·기존 값·수식에 쓰지 않는다.
- id_rule/fixed: 매핑에서는 null/빈 객체만 허용한다. 값은 사용자 설정 파일로 분리한다.

필수 열: 분리 프로그램은 program_id/program_name/program_type/url/related_sources/remarks, 기존 endpoint 형식은 url/controller/evidence/status, 테이블은 table/column/data_type/nullable/evidence/status.
프로그램 열에 row_number, meta.<아래 필드>, unknown.<영문 필드명>을 매핑할 수 있다. unknown 필드는 빈 칸/미확인으로만 처리한다. 관련 소스는 파일명:라인과 처음 2개 참조를 표시하고 원래 식별자/전체 메서드는 JSON에 유지한다. 비고에는 LIKELY 근거·미확인·해당 없음 구분을 기록한다.
엑셀의 근거 열은 처음 2개 파일:라인과 추가 건수/JSON 위치를 표시한다. 전체 연결 근거는 evidence/data.json에 유지한다. 알려진 '기본값/참조 없음'은 빈 셀, 값 미확인은 빈 셀+노란색으로 구별한다.
미매핑 열과 원래 메모는 보존한다. 매핑 대상에 병합·수식·기존 값이 있으면 중단한다. 미확인 값은 빈 칸/노란색과 verification.json의 row/field로 표시한다. 기존 메모를 미확인 메모로 덮어쓰지 않는다.

## 사용자 설정

대상 프로젝트의 `sistack-docs.json`을 읽는다. 없으면 모든 메타데이터와 ID를 비운다. 실행 시각/환경/프로젝트명에서 값을 만들지 않는다.

```
{ "meta": {}, "id_rule": null }
```

meta의 허용 문자열 키: business_name(사업명), system_name, document_number, version, author, created_date. 작성일도 이 설정값만 사용한다. id_rule은 사용자 지정 prefix/start(0 이상 정수)/width(1~12)다. 임의 상수·기본 접두사를 넣지 않는다. 설정 파일의 내용은 공개 보고에 복사하지 않고 해시만 남긴다.

fill-template의 마지막 선택 인자로 프로젝트 내부의 다른 설정 상대 경로를 지정할 수 있다. 업무구분·개발자·일정·진척률은 소스에서 추정하지 않으며 unknown 필드로 남긴다.

저장 후 다시 읽어 모든 입력 값, 셀 서식·메모·수식, 다른 시트, 병합, 데이터 유효성, 조건부 서식, 이미지 바이트·배치, 열 너비·시트 설정을 비교한다. 원본 SHA-256도 재확인한다. 불일치면 FAIL이며 결과를 삭제하거나 PASS로 바꾸지 않는다.

## limitations

기본 드롭다운/조건부 서식/PNG/메모/수식 조합의 합성 양식만 실측했다. 모든 Excel 기능 보장을 뜻하지 않는다. OOXML에서 피벗·차트·매크로·전자서명·외부 연결·도형·스레드 댓글·확장 요소를 발견하면 보고서에 경고하고 PARTIAL로 남긴다. 원본을 ExcelJS로 불러오기 전에 검사하므로 읽는 과정의 유실도 숨기지 않는다. 이름을 모르는 확장까지 모두 식별하는 검사는 아니다.

읽기 전 기본 글꼴이 확인되면 암묵적 기본값과 저장 후 같은 명시 글꼴을 동등하게 비교한다. 실제 글꼴/기본 글꼴 변화는 허용하지 않는다. 미확인/제안 강조 외 셀 서식과 원래 행 높이/열 너비를 유지한다. 긴 내용은 편집 창/전체 JSON으로 확인해야 할 수 있다.

수식 계산 엔진은 없다. 식/캐시만 보존하며 실제 Excel 표시/재계산은 사람이 확인한다. 사용자 원본에는 별도 민감정보 제거가 필요하다. 생성 출력은 승인된 로컬 경로에만 보관한다.
