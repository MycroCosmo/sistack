# 테이블 정의서

`node <skill>/scripts/si-docs.mjs extract-table-spec <project> <sources.json> <output.json>`

sources.json은 프로젝트 상대 경로 배열이다. 예: `["src/main/resources/db/oracle/ddl.sql"]`.
DB별 DDL을 혼합하지 않는다. 같은 테이블/컬럼 중복은 중단한다.

Oracle/Tibero/PostgreSQL의 단순 CREATE TABLE, 컬럼 자료형·NULL·기본값, 인라인/테이블 PK/FK, COMMENT ON TABLE/COLUMN을 읽는다. 괄호·인용부 쉼표를 분리하지 않는다. 실행하지 않으며 DB 연결도 없다.
ALTER 이력·CTAS·인용 식별자·동적 DDL·CHECK·복잡한 생성식/상속/도메인 타입의 최종 의미는 보장하지 않는다. 지원 밖 구문은 미확인으로 남긴다. 지원하지 않는 선언을 추측해 채우지 않는다.

CSV(UTF-8, 쉼표, 큰따옴표 이스케이프/줄바꿈 지원)도 사용할 수 있다.
필수 헤더: table,column,data_type,nullable. nullable은 Y/N이다.
선택 헤더: table_name,column_name,primary_key(Y/N),foreign_key,default_value.
생략 필드는 null+미확인, 명시한 빈 문자열은 '기본값/참조 없음' 등 사용자 제공 값이다. DB 실존/최신성을 확인한 것으로 쓰지 않는다.

스키마: scripts/schemas/docs/table-spec.schema.json. DDL에서 기본값/참조가 없으면 빈 문자열, 설명이 없으면 null+미확인이다.
