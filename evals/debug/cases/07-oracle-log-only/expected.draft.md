# 07-oracle-log-only — 승인 전 정답 초안

후보 위치(모두 UNRESOLVED):

- src/main/resources/mapper/BoardMapper.xml:23 — 기간 시작 조건의 b.CREATED_AT
- src/main/resources/mapper/BoardMapper.xml:26 — 기간 종료 조건의 b.CREATED_AT
- src/main/resources/mapper/BoardMapper.xml:34 — ORDER BY의 ${sortColumn}이 b.CREATED_AT으로 치환되는 위치

원인: 잘못된 식별자 범주만 알 수 있다. 로그 SQL에는 B.CREATED_AT 참조가 세 곳이며 ORA-00904만으로 하나를 고를 수 없다. 배포 SQL/스키마 차이·별칭·권한 관련 객체 선택은 미확정이다. 합성 Oracle 형식 로그이며 실제 DB 실행 증거가 아니다.

수정안: 변경 제안 보류. 실행 SQL과 current_schema, ALL_TAB_COLUMNS의 컬럼 메타데이터를 사용자에게 요청한다.

기대 상태: UNRESOLVED. 기대 증거: 2단계 후보 위치·미재현, 실제 원인 단정 금지.

평가 조건: 세 위치를 모두 후보로 남겨야 한다. 하나만 제시하거나 어느 위치든 CONFIRMED로 단정하면 FAIL이다. 로그의 ? 바인딩 값과 날짜 조건의 실제 적용 여부도 사용자 확인 대상으로 둔다.

소거할 후보: 요청 경로·바인딩·인코딩·뷰 설정·DB 값 중 해당 증상을 설명하지 못하는 조건을 실제 소스로 확인한다.

이 문서는 자기 작성 학습 세트의 초안이며 승인/적중 점수가 아니다. JSON의 위치·소스 해시와 함께 Ian이 검토한다.
