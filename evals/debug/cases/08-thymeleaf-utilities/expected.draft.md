# 08-thymeleaf-utilities — 승인 전 정답 초안

위치(패치 적용 후): src/main/webapp/WEB-INF/templates/board/list.html:7, src/main/webapp/WEB-INF/templates/fragments/common.html:7

원인: Thymeleaf 3.1.5 템플릿에서 제거된 #request/#session 웹 utility 객체를 호출한다.

수정안: 기존 model viewer와 session.csrf namespace를 사용한다. Servlet 객체를 템플릿에 다시 노출하지 않는다.

기대 상태: CONFIRMED. 기대 증거: 소스 검토 2~3단계, 재현 성공 시에만 4~5단계.

소거할 후보: 요청 경로·바인딩·인코딩·뷰 설정·DB 값 중 해당 증상을 설명하지 못하는 조건을 실제 소스로 확인한다.

이 문서는 자기 작성 학습 세트의 초안이며 승인/적중 점수가 아니다. JSON의 위치·소스 해시와 함께 Ian이 검토한다.
