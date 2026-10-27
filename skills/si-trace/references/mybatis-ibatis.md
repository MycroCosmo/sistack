# MyBatis·iBatis·SQL 판단

- pom.xml과 XML 루트로 MyBatis mapper/iBatis 2 sqlMap을 구분한다. 실제 버전을 가정하지 않는다.
- 인터페이스 namespace.id 또는 SqlSession/상속 DAO의 문자열 sqlId를 실제 선언에 연결한다.
- mapperLocations의 classpath 패턴과 등록된 properties의 DB 선택 값을 확인한다. 미해결이면 LIKELY다.
- 다른 DB XML은 후보이며 선택된 실행 SQL과 섞지 않는다. 서버 override는 정적 기본 설정과 별개다.
- include는 같은 namespace/외부 namespace, resultMap은 실제 id를 확인한다. SQL 조각에서 읽는 테이블도 포함한다.
- 메서드 이름 delete와 실제 UPDATE를 구분한다. selectKey의 읽기와 INSERT 쓰기를 나눠 기록한다.
- ${}는 문자열 치환 위치를 지적하되 허용 목록 검증 없이 안전하다고 말하지 않는다.
- 직접 JDBC의 동적 테이블명/메타데이터는 확정할 값이 없으면 UNRESOLVED다. DB에 접속해서 메우지 않는다.
- 동적 SQL 조건, Map 키, 파라미터 타입과 실제 입력 검증을 구분한다. iBatis 합성 테스트를 현장 실행 증거로 쓰지 않는다.
