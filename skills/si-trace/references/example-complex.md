# 복잡 예시 — 게시판 메뉴

입력: “게시판 메뉴 전체 코드 흐름과 공통 처리를 정리해 줘.”

해석: 목록/등록/수정 화면, 인터셉터와 공통 메뉴 조회를 함께 확인한다.
prepare에 JSP 시작점들을 반복해 지정하고 --scope menu를 사용한다.
화면·JS / Controller·Service / SQL·DB 탐색자 3개가 읽기 전용으로 탐색하고 주 에이전트가 종합한다.

출력 예: 검색의 기본 form action과 JS submit의 동적 action 차이, 등록/수정의 두 리터럴 분기,
공유 paging.jspf, 인터셉터 currentUser·menus 주입, BoardMapper의 count/selectList·include,
공통코드 DAO의 문자열 sqlId와 동적 AJAX 미확정 경로를 함께 보여준다.
관련 테이블은 BOARD 읽기/쓰기와 APP_MENU 읽기 등 실제로 확인한 것만 기록한다.
실제 병렬 도구가 없으면 순차 탐색으로 표시하며 병렬 실행을 했다고 주장하지 않는다.
