# JSP · Thymeleaf · jQuery

| 증상 | 확인 위치 | 확정하는 방법 |
|---|---|---|
| POST 한글만 깨짐 | CharacterEncodingFilter 매핑/순서, 최초 getParameter, 실제 요청 charset | 바이트 디코딩 이전 필터 실행 여부 확인. 응답 charset만 바꿔 해결했다고 하지 않음 |
| 공통 조각만 한글 깨짐 | jspf pageEncoding, JSP include 방식, template resolver characterEncoding | 부모/조각 원본 바이트와 렌더링 결과 비교. 전체 페이지 charset과 조각 소스 읽기 인코딩 구분 |
| JSP 컴파일 오류 | 최초 JasperException, include 경로·taglib·EL·생성 servlet 줄 매핑 | 생성 Java 프레임과 원본 JSP 위치를 연결. 후속 예외 대신 최초 문법/설정 오류 확인 |
| Thymeleaf 3.1 TemplateProcessingException | pom 실제 버전, #request/#session 사용식, model | 3.0의 웹 utility 객체 사용 여부 확인. 3.1에서는 필요한 값을 model에 넣거나 session 속성 namespace를 사용. 실제 template 처리로 확인 |
| Controller 진입 후 JSP 404 | 반환 view, 각 resolver의 viewNames/order/prefix/suffix | 작은 order부터 대상 view 수락 여부 확인. InternalResourceViewResolver는 JSP 존재를 일반적으로 미리 확인하지 않아 뒤에 두어야 함. 실제 forward와 파일 유무 확인 |
| AJAX parsererror / 302 / 403 | 요청 method·URL·data·CSRF·세션·응답 Content-Type | 로그인 HTML을 JSON으로 읽었는지, 권한/CSRF 차단인지 서버 오류인지 네트워크 응답으로 구분 |

Thymeleaf 캐시·활성 profile·resolver 중복도 확인한다. template 파일이 존재한다는 사실만으로 선택됐다고 판단하지 않는다.
공식 참고: https://www.thymeleaf.org/doc/tutorials/3.1/usingthymeleaf.html , https://github.com/thymeleaf/thymeleaf/blob/3.1-master/ChangeLog.txt , https://docs.spring.io/spring/reference/web/webmvc/mvc-servlet/viewresolver.html
