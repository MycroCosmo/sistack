# 04-session-bypass — 승인 전 정답 초안

위치(패치 적용 후): src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:9, src/main/java/kr/sistack/board/web/BoardController.java:37

원인: 필수 사용자 속성을 보장하던 인터셉터의 board 매핑이 빠지고 optional 바인딩 경로가 null을 역참조한다.

수정안: board 경로의 인증 인터셉터 매핑과 required 계약을 복구한다. 익명 기본 사용자를 만들지 않는다.

기대 상태: CONFIRMED. 기대 증거: 소스 검토 2~3단계, 재현 성공 시에만 4~5단계.

소거할 후보: 요청 경로·바인딩·인코딩·뷰 설정·DB 값 중 해당 증상을 설명하지 못하는 조건을 실제 소스로 확인한다.

이 문서는 자기 작성 학습 세트의 초안이며 승인/적중 점수가 아니다. JSON의 위치·소스 해시와 함께 Ian이 검토한다.
