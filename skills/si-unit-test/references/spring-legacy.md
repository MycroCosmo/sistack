# 레거시 Spring과 Mapper

Service 단위 테스트에서는 전체 Spring context를 띄우지 않는다. Mapper 검사는 별도로 분류한다. 사용자가 허용한 test scope H2와 test/resources의 스키마·합성 데이터만 이용한다. 외부 JDBC URL·운영 properties·루트 DB context를 불러오지 않는다.

로컬 인메모리 DataSource와 SqlSessionFactoryBean에 실제 Mapper XML/인터페이스를 등록해 호출한다. Mapper 반환 객체의 필드·순서·건수, CRUD 후 저장 상태를 검증한다. SQL 문자열 비교나 결과를 목으로 돌려주는 검사는 매핑 결함 탐지가 아니다. 세션과 테스트 DB는 종료하고 테스트마다 독립 DB를 사용한다. H2 Oracle mode는 실제 Oracle 검증을 대신하지 않는다.
