# JSP·jQuery 판단

- form의 기본 action과 JS가 submit 직전에 덮어쓰는 action을 따로 확인한다. script/include 위치까지 따라간다.
- submit의 action 대입은 같은 함수·같은 폼 수신자 범위에서만 추적한다. 대입이 없으면 form 기본 action과 onsubmit 함수 또는 폼 참조를 확인한다. 여러 폼/동적 수신자를 하나로 못 정하면 미확정이다.
- href의 #fragment와 javascript:void(0)는 서버 요청이 아니다. 실제 onclick/AJAX 호출과 구별한다.
- c:url, contextPath 선언 + 리터럴 경로, fn:escapeXml을 확인한다. ctx가 실제로 contextPath로 선언됐는지 본다.
- 두 분기가 리터럴인 단순 삼항식은 양쪽 도달 경로를 CONFIRMED로 표시한다. 실제 선택 분기는 입력에 달려 있다.
- 함수 반환·임의 문자열 조합 URL은 상수 조각만 남기고 UNRESOLVED로 표시한다. 같은 URL 선언이 있다고 연결하지 않는다.
- 정적 include/동적 include와 공유 paging/menu 조각을 구분한다. 공통 조각을 포함한 모든 화면의 영향은 이 스킬 범위 밖이다.
- 주석 속 코드와 scriptlet 미지원 부분, 정규식/템플릿 등 완전한 AST가 아닌 한계를 표시한다.
- JSP/JS 파일에 함수가 포함된다는 includes는 호출·사용자 이벤트 실행의 증거가 아니다.
- 요청 method, 버튼/handler, 리다이렉트 후 URL을 분리한다. 찾지 못한 버튼이나 요청을 만들어내지 않는다.
