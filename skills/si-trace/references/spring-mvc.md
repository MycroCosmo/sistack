# Spring MVC 판단

- pom.xml/build.gradle의 Java·Spring 버전, web.xml의 servlet/filter와 context 설정을 먼저 확인한다.
- Controller 클래스 경로와 메서드 경로·HTTP method를 합친다. params/headers 조건은 별도 확인한다.
- 필드 이름보다 주입 타입, @Resource/@Qualifier 이름, XML bean 연결을 우선한다.
- extends와 implements가 함께 있는 구현체를 확인한다. 여러 구현체의 profile/활성 빈을 못 정하면 LIKELY다.
- MVC interceptor 포함·제외 경로는 intercepted_by다. preHandle의 false 반환과 로그인/역할/CSRF 검사를 읽는다.
- 세션→request 속성 전파가 Controller의 @RequestAttribute 사용 전제인지 확인한다. 실제 값은 런타임 확인이 필요하다.
- web.xml filter, AOP 설정/어노테이션, 공통 예외 resolver/advice를 별도 읽는다. 인덱서에 없다고 부재로 단정하지 않는다.
- 페이징의 pageIndex/offset/endRow, 공통코드 별도 AJAX, forward/redirect 이후 요청을 구분한다.
