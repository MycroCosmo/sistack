# 단순 예시 — 삭제 버튼

입력: “게시글 상세에서 삭제 버튼 누르면 뭐가 실행돼?”

해석: legacy-board detail.jsp의 삭제 handler부터 POST /board/delete.do와 DB 쓰기까지 확인한다.
prepare의 시작점은 해당 handler 또는 POST URL이다. 단일 버튼이며 경로 20개 미만이면 simple이다.

출력 예: detail.jsp의 ctx 선언을 포함한 board.js 요청 → BoardController#delete →
BoardServiceImpl#delete → BoardMapper#delete → 삭제 SQL → BOARD 쓰기.
별도로 LoginInterceptor의 로그인·역할·CSRF 검사와 MenuMapper의 APP_MENU 읽기를 설명한다.
각 연결의 실제 라인은 실행 시 다시 읽는다. 이 예시는 고정 라인 번호나 자동 정답을 제공하지 않는다.
CONFIRMED는 정적 선언·사용 관계다. 브라우저 클릭과 삭제 성공을 실행해 확인했다는 뜻은 아니다.
