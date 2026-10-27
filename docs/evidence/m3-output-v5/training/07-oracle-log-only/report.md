> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PARTIAL (원인 분석 범위). 수정 적용 없음.

## 증상 요약
회사에서 게시판을 조회하면 오류가 나요. 날짜를 넣고 검색했어요. 제 PC에서는 같은 화면이 열려요.


## 원인
- UNRESOLVED · 증거 2단계 · B.CREATED_AT 오류는 기간 조건 두 곳과 ORDER BY 중 어느 참조인지 확정할 수 없다.
  src/main/resources/mapper/BoardMapper.xml:23, src/main/resources/mapper/BoardMapper.xml:26, src/main/resources/mapper/BoardMapper.xml:34
  MyBatis selectList의 ? 바인딩 SQL은 같은 식별자를 세 번 참조한다. XML filters의 23/26행과 sortColumn이 b.CREATED_AT을 반환해 삽입되는 34행이 대응한다. Oracle 로그는 합성이고 실제 배포 SQL/스키마가 없다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
PersistenceException의 하위 예외는 ORA-00904 식별자 오류이므로 로컬 요청 인코딩이나 뷰 오류만으로 설명하지 않는다.
로컬 소스와 공통 Oracle 페이징 SQL만으로 배포 스키마/동의어/컬럼 대소문자 차이를 소거할 수 없다.

## 수정안
실제 배포 SQL/스키마 확인 전 수정안 보류.

```diff

```

동일 패턴 확인: 같은 filters를 사용하는 count에도 날짜 참조가 있으나 제공된 오류 SQL은 selectList다. 채점 후보를 실제 오류 SQL의 세 참조로 한정한다.

## 확인 방법
사용자에게 마스킹된 실제 배포 SQL/바인딩 타입, current_schema와 ALL_TAB_COLUMNS 결과 요청

## 확정 못 한 것
실제 Oracle DB 미접속·미재현
합성 로그와 실제 배포 SQL/바인딩 값 일치 여부, 세 참조 중 실패 지점 미확정

## 다음 작업
승인된 환경에서 사용자가 schema/컬럼/동의어 정보를 확인하고 배포 Mapper 리비전을 제공하도록 요청
