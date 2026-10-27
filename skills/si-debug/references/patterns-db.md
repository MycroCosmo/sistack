# DB 로그만 있는 경우

| 증상 | 확인 위치 | 확정하는 방법 |
|---|---|---|
| ORA-00904 | 실행 SQL의 식별자·별칭·따옴표, 접속 스키마·DDL | 잘못된 식별자 범주까지만 확정 가능. 실제 컬럼 목록·배포 SQL이 없으면 오타/스키마 차이 후보 유지 |
| ORA-00942 | schema prefix·synonym·권한·현재 사용자 | 존재/권한/동의어를 분리. 사용자에게 관련 메타데이터 SELECT 결과 요청 |
| ORA-00001 | constraint 이름·입력 키·시퀀스 | 제약 컬럼과 중복 키를 확인. 운영 삭제나 sequence 변경 금지 |
| ORA-01722 | 문자열→숫자 변환·바인딩 타입 | 실패 표현식과 실제 입력의 타입을 비교 |
| PostgreSQL 42P01/42703 | schema/search_path·table/column 대소문자 | 실행 SQL과 해당 schema의 메타데이터 비교 |
| PostgreSQL 23505 | 제약 이름·키·동시 실행 | unique 충돌 범위만 먼저 기록. 동시성 결론은 로그 근거 필요 |
| Tibero 에러 | 서버 버전·원문 코드·해당 버전 메시지 매뉴얼 | Oracle 유사성만으로 숫자 코드를 대응시키지 않는다. 매뉴얼/DDL 미확보면 UNRESOLVED |

DB에는 직접 접속하지 않는다. 예: `SELECT COLUMN_NAME FROM ALL_TAB_COLUMNS WHERE OWNER = :owner AND TABLE_NAME = :table`을 사용자가 승인된 환경에서 확인하도록 제시한다. 개인정보 행 조회는 요구하지 않는다.
같은 식별자가 SELECT·WHERE·ORDER BY 등에 반복되면 실행 SQL에 나타난 참조 위치를 모두 소스에 연결한다. 에러 코드가 발생 위치를 구별해 주지 않으면 후보를 하나로 줄이지 않고 UNRESOLVED로 남긴다. MyBatis의 `###` 메시지 블록과 `?` 바인딩 SQL도 함께 확인하되 값을 추측하지 않는다.
공식 참고: https://docs.oracle.com/en/error-help/db/ora-00904/ , https://www.postgresql.org/docs/current/errcodes-appendix.html
