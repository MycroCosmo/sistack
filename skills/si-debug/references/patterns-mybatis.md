# MyBatis / iBatis

| 증상 | 확인 위치 | 확정하는 방법 |
|---|---|---|
| BindingException: Parameter not found | Mapper @Param, 인자 수, 실제 파라미터 map, XML #{키} | 사용 가능한 키와 SQL 참조 키 비교. 단일 scalar는 @Param 없이도 동작할 수 있으므로 무조건 누락으로 단정하지 않음 |
| Invalid bound statement | namespace.id, mapperLocations, MapperScan, profile | 선택된 XML과 문자열 sqlId/FQCN을 비교. 파일 존재만으로 로딩됐다고 단정 금지 |
| TooManyResultsException | selectOne 호출, where, join/unique 조건 | 반환 행 수·키 조건 확인. LIMIT 추가 전 중복 데이터/조인 원인을 구분 |
| 특정 정렬 입력 SQL 오류 | ${}에 들어가는 값의 생성 경로, 허용 목록 | 리터럴 치환 값과 실제 컬럼을 비교. 값은 #{}, 식별자는 검증된 상수 매핑으로 제한 |
| 타입 변환/NULL 오류 | resultMap, JDBC 타입, typeHandler, nullable 값 | 실패 컬럼과 Java 타입·처리기를 대조. 임의 기본값 삽입 금지 |

iBatis 2는 sqlMap namespace/id, parameterClass·parameterMap, #키#와 $키$를 해당 버전 기준으로 읽는다. MyBatis 규칙을 그대로 확정 적용하지 않는다.
`###` 블록, `Cause: ...`, `nested exception is ...`에 반복된 예외명은 메시지다. 실제 줄 시작 예외 헤더와 `Caused by:`/`Suppressed:`를 구별해 체인과 프로젝트 프레임의 소속을 확인한다. 메시지 안의 예외명을 별도 root로 늘리지 않는다.
공식 참고: https://mybatis.org/mybatis-3/java-api.html , https://mybatis.org/mybatis-3/sqlmap-xml.html
