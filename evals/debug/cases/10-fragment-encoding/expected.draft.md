# 10-fragment-encoding — 승인 전 정답 초안

위치(패치 적용 후): src/main/webapp/WEB-INF/views/common/paging.jspf:1

원인: UTF-8 jspf의 pageEncoding 선언이 빠져 JSP 번역 단계에서 조각 바이트를 잘못 해석한다.

수정안: 공통 조각의 pageEncoding=UTF-8을 복구한다. 부모 응답 charset만 바꾸지 않는다.

기대 상태: CONFIRMED. 기대 증거: 소스 검토 2~3단계, 재현 성공 시에만 4~5단계.

소거할 후보: 요청 경로·바인딩·인코딩·뷰 설정·DB 값 중 해당 증상을 설명하지 못하는 조건을 실제 소스로 확인한다.

이 문서는 자기 작성 학습 세트의 초안이며 승인/적중 점수가 아니다. JSON의 위치·소스 해시와 함께 Ian이 검토한다.
