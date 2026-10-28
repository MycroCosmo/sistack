# 양식 매핑·보존

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
- id_rule: null 또는 `{ "prefix": "PGM-", "start": 1, "width": 3 }`. 실제 ID 체계는 사용자 제공. fixed.program_id와 병용 금지.
- fixed: 사용자 program_id/program_name 문자열만 지원. 자료형·NULL/PK 등 소스 사실을 덮어쓰지 않는다.

필수 열: 프로그램 url/controller/evidence/status, 테이블 table/column/data_type/nullable/evidence/status.
미매핑 열과 원래 메모는 보존한다. 매핑 대상에 병합·수식·기존 값이 있으면 중단한다. 미확인 값은 빈 칸/노란색과 verification.json의 row/field로 표시한다. 기존 메모를 미확인 메모로 덮어쓰지 않는다.

저장 후 다시 읽어 모든 입력 값, 셀 서식·메모·수식, 다른 시트, 병합, 데이터 유효성, 조건부 서식, 이미지 바이트·배치, 열 너비·시트 설정을 비교한다. 원본 SHA-256도 재확인한다. 불일치면 FAIL이며 결과를 삭제하거나 PASS로 바꾸지 않는다.

## limitations

기본 드롭다운/조건부 서식/PNG/메모/수식 조합의 합성 양식만 실측했다. 모든 Excel 기능 보장을 뜻하지 않는다. OOXML에서 피벗·차트·매크로·전자서명·외부 연결·도형·스레드 댓글·확장 요소를 발견하면 보고서에 경고하고 PARTIAL로 남긴다. 원본을 ExcelJS로 불러오기 전에 검사하므로 읽는 과정의 유실도 숨기지 않는다. 이름을 모르는 확장까지 모두 식별하는 검사는 아니다.

수식 계산 엔진은 없다. 식/캐시만 보존하며 실제 Excel 표시/재계산은 사람이 확인한다. 사용자 원본에는 별도 민감정보 제거가 필요하다. 생성 출력은 승인된 로컬 경로에만 보관한다.
