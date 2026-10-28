# 정상 소스 기반 자동 도출

`node <skill>/scripts/generate-tests.mjs <정상 프로젝트> <존재하지 않는 출력 폴더> <생성설정.json>`

생성 설정은 `fixtureFile`(합성 bean/table 값), 선택적인 `baseTests`(기존 회귀 테스트 directory/plan)를 지정한다. Java support template은 스킬에 포함된다. 기존 출력은 덮어쓰지 않는다. 기존 회귀 테스트를 재사용했다면 자동 생성 건수와 구분해 보고한다.

1. 인덱서의 실제 SQL·클래스 위치와 source hash를 기준으로 읽는다. Mapper `<include>`를 따라간다. 각 `<if>`의 참/거짓, `<when>`·`<otherwise>` 진입을 계획하고 부모 조건도 만족하는 입력을 탐색한다. OGNL의 단순 비교·and/or만 지원한다. 분기 결과는 여러 컬럼이 서로 다른 행 집합에서 실제 Mapper를 호출해 독립 기대 행 ID/건수와 비교한다. SQL 문자열 일치로 성공 처리하지 않는다.
2. UPDATE SET의 명시 바인딩 컬럼마다 정상 값과 다른 값을 주고 실제 Mapper UPDATE 후 JDBC 재조회로 단언한다. INSERT의 명시 컬럼마다 입력값(생성키는 호출 후 값)을 재조회해 비교한다. 지원하지 않는 계산식·동적 컬럼은 UNRESOLVED다.
3. Service의 IllegalArgumentException 검증 guard에서 getter/길이와 정수·상수의 `>`, `>=`, `<`, `<=`를 읽는다. 순서가 뒤집힌 비교도 정규화한다. 상한 초과 거부는 허용 최댓값/거부 최솟값, 하한 미달 거부는 허용 최솟값/거부 최댓값을 생성한다. private validate를 호출하는 public 진입점마다 실행한다. 인식 못 한 scalar/복합 비교는 미해결 항목으로 남긴다.
4. 정상 fixture는 업무상 유효한 분류 코드·필수 입력·테스트 DB 스키마를 제공한다. 분기 종류나 대상 컬럼·경계값을 fixture에 수동 지정하지 않는다. 실제 비밀값·개인정보를 넣지 않는다. 날짜/검색 분기는 합성 행에서 양성과 음성을 구별한다. 페이징 래퍼는 ROWNUM 선언에서 분리하고 첫 페이지의 페이지 크기 안에 표본이 있음을 실행 시 확인한다.
5. coverage-plan은 source hash, 파일:라인, 분기 조건·입력, 컬럼, 경계 쌍, 연결된 테스트 ID와 생성 Java 해시를 담는다. `run-tests` 설정에 `coverage_plan` 경로를 지정하면 실제 테스트 파일을 대조하고 coverage-results와 계획 충족률을 보고서에 기록한다.

현재 support template은 기존 classpath `mapper/*.xml`, 테스트 `db/schema.sql`·`db/data.sql`, 로컬 H2 Oracle mode에 맞는다. 다른 자원 경로·다중 인자/오버로드·복잡 OGNL/SQL·외부 DB 설정은 자동 성공으로 처리하지 않는다. source에서 도출한 의무 자체를 찾지 못하는 문법도 있으므로 전체 프로그램의 완전성이나 범용 Java/MyBatis 분석기를 주장하지 않는다.
