# 03-request-encoding — 승인 전 정답 초안

위치(패치 적용 후): src/main/webapp/WEB-INF/web.xml:15

원인: CharacterEncodingFilter의 encoding이 UTF-8 요청과 다른 ISO-8859-1로 설정되어 POST 파라미터를 잘못 디코딩한다.

수정안: encoding 필터 값을 UTF-8로 복구한다. 이미 손상된 저장값은 별도 처리한다. Jetty에서 매핑 누락만으로는 UTF-8 기본값 때문에 재현되지 않았다.

기대 상태: CONFIRMED. 기대 증거: 소스 검토 2~3단계, 재현 성공 시에만 4~5단계.

소거할 후보: 요청 경로·바인딩·인코딩·뷰 설정·DB 값 중 해당 증상을 설명하지 못하는 조건을 실제 소스로 확인한다.

이 문서는 자기 작성 학습 세트의 초안이며 승인/적중 점수가 아니다. JSON의 위치·소스 해시와 함께 Ian이 검토한다.
