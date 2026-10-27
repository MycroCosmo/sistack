# Spring MVC

| 증상 | 확인 위치 | 확정하는 방법 |
|---|---|---|
| 404 | 브라우저 실제 URL/컨텍스트 경로, class+method mapping, DispatcherServlet 매핑 | 요청 URL을 합성한 JS와 활성 HandlerMapping을 비교. Controller 진입 후 404면 뷰 단계도 조사 |
| 405 | form/$.ajax method와 @GetMapping/@PostMapping | 동일 URL의 허용 method와 실제 요청을 대조 |
| 바인딩 400 | @RequestParam/@ModelAttribute, InitBinder, setter 변환 | 요청 키·타입·허용 필드·변환 예외를 따라 최초 불일치 확인 |
| 세션 NPE | 인터셉터 include/exclude, request 속성 설정, optional 바인딩 | 해당 경로가 preHandle을 거치는지, 속성 설정 전에 return되는지 비교. 인증을 우회하는 null 기본값은 수정 아님 |
| 저장 후 일부만 반영 | @Transactional 경계, proxy 자기 호출, rollback 규칙, datasource | 실제 호출이 proxy를 통과하는지·예외가 경계 밖으로 나가는지 확인. DB 없이 롤백 성공 단정 금지 |

XML과 어노테이션이 공존하면 component-scan·중복 bean·활성 profile을 먼저 확인한다.
공식 참고: https://docs.spring.io/spring-framework/docs/5.3.39/reference/html/web.html
