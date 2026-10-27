# 01-binding — 승인 전 정답 초안

위치(패치 적용 후): src/main/java/kr/sistack/board/mapper/MenuMapper.java:10

원인: @Param 이름이 SQL의 role 키와 달라 ParamMap에서 값을 찾지 못한다.

수정안: @Param("role")로 SQL과 이름을 맞춘다. 단일 scalar의 @Param 단순 삭제 사례와 구분한다.

기대 상태: CONFIRMED. 기대 증거: 소스 검토 2~3단계, 재현 성공 시에만 4~5단계.

소거할 후보: 요청 경로·바인딩·인코딩·뷰 설정·DB 값 중 해당 증상을 설명하지 못하는 조건을 실제 소스로 확인한다.

이 문서는 자기 작성 학습 세트의 초안이며 승인/적중 점수가 아니다. JSON의 위치·소스 해시와 함께 Ian이 검토한다.
