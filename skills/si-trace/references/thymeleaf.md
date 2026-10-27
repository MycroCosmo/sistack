# Thymeleaf 화면 판단

- pom에서 엔진 버전을 확인한다. 3.0의 #request/#session/#response/#servletContext를 포함한 식도 정적으로 읽지만 실행하지 않는다. 3.1에서 제거된 유틸 객체가 렌더링 가능하다는 뜻은 아니다.
- th:action의 리터럴 두 분기, th:href/th:src의 @{...}를 읽는다. 경로 변수는 Controller의 URI 패턴과 대조하고 쿼리는 경로 매칭에서 제외한다. 변수의 실제 값을 만들어내지 않는다.
- th:replace/insert/include는 정적 템플릿·fragment 선언까지 확인한다. fragment 인자는 이름 선택과 구별한다. fragment 내부 요청도 따라가며 동적 이름·순환은 미확정으로 남긴다.
- layout:decorate는 등록된 LayoutDialect와 템플릿 리졸버를 확인한다. content fragment가 화면/레이아웃 양쪽에 있는지도 원문으로 확인한다.
- th:data-* 또는 th:attr의 data URL만으로 요청을 만들지 않는다. 같은 화면이 포함한 외부 JS, 실제 요소 ID, 이벤트의 this 별칭, data/attr/dataset 소비와 AJAX 메서드가 함께 있어야 연결한다. 재할당·중복 ID는 미확정이다.
- th:inline="javascript"의 인라인 URL과 자연 템플릿 fallback을 구별한다. fallback은 엔진 실행 요청으로 중복 채점하지 않는다. 복잡한 JS 별칭·함수 반환·계산식은 소스 확인이 필요하다.
- 리터럴 ID의 submit .on handler가 먼저 preventDefault하고 같은 URL/HTTP method로 AJAX를 보내면 기본 form 요청을 handler 요청에 병합하고 폼·AJAX·취소 근거를 모두 남긴다. 다른 endpoint/메서드·조건부 취소는 기본 form을 차단 이유의 LIKELY로 남긴다. 외부 JS는 해당 화면에 포함된 파일만 확인한다.
- fragment 식은 template/selector와 괄호 인자를 분리한다. html 루트의 th:replace, 인자에 포함된 중첩 ::, 정적 따옴표 템플릿명, 같은 파일 ~{::selector}를 구별한다. 동적 이름·닫히지 않은 식을 확정하지 않는다. CSS 선택자 전체/fragment 인자 값 전파는 지원하지 않는다.
- XML view resolver의 등록·order·viewNames·templateEngine/templateResolver 참조·prefix/suffix·실제 파일을 따라 renders를 확인한다. 정적 이름과 구성 하나만 확인되는 경우에만 확정한다.
- checkExistence=true이고 viewNames 제한이 없을 때 정적 파일 존재는 Thymeleaf, 부재는 다음 적용 가능한 JSP resolver로 분석한다. 동순위·조건부 구성·동적 prefix·외부 리소스는 LIKELY다.
- pom/Gradle의 Thymeleaf starter와 application.properties/yml/yaml의 prefix/suffix를 확인한다. 재정의가 없으면 classpath:/templates/+.html, 파일이 있으면 CONFIRMED다. profile별 설정이 갈리거나 최소 YAML 파서로 모르는 구문은 LIKELY다. 환경 override·임의 Java/Boot 설정 전체를 실행하는 것은 아니다.
- 같은 클래스 static final String 상수·private String 메서드의 반환을 두 번 호출 깊이까지 따라간다. 순환·오버로드·동적 값은 LIKELY다. redirect/forward 응답은 템플릿 연결로 만들지 않는다.
- renders(Controller → 파일), decorates(화면 → 레이아웃), includes(화면/레이아웃 → 파일#fragment), requests(화면/요소 → endpoint)를 구분한다. 파일 포함은 사용자 이벤트가 실행됐다는 증거가 아니다.
- 템플릿 엔진의 완전한 식 평가·렌더링·DB 실행을 증명하지 않는다. 분석 결과와 실제 앱 검증의 증거 단계를 분리한다.
