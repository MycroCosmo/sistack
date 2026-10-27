> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PARTIAL (원인 분석 범위). 수정 적용 없음.

## 증상 요약
외부 Oracle 로그에 ORA-00904가 있으나 배포 SQL/스키마가 없다.

## 원인
- UNRESOLVED · 증거 2단계 · 식별자 오류 범주만 확인 가능하다. 실제 스키마 차이·별칭 또는 배포 SQL 차이는 미확정이다.
  src/main/resources/mapper/BoardMapper.xml:34
  로컬 Mapper의 정렬 식별자 경로는 확인했지만 현장 Oracle이 같은 SQL/DDL을 사용하는지 알 수 없다. 이 위치는 조사 후보이지 확정 원인이 아니다.

재현: 미재현 — Oracle 접속과 배포 스키마가 제공되지 않아 미재현. DB에 접속하지 않았다.

## 원인까지의 경로
로컬 H2가 정상이라는 사실로 Oracle 스키마 차이를 소거할 수 없다.
전체 실행 SQL과 배포 revision이 없어 별칭·컬럼 오타·객체 선택 후보를 소거하지 않았다.

## 수정안
원인 미확정으로 변경 제안을 보류한다.

```diff

```

동일 패턴 확인: BoardMapper의 ORDER BY와 BoardSearch의 상수 매핑은 로컬에서 확인. 현장 배포본의 같은 패턴 여부는 미확정.

## 확인 방법
사용자가 승인된 환경에서 실행 SQL과 ALL_TAB_COLUMNS의 해당 schema/table 컬럼 목록을 확인

## 확정 못 한 것
현장 Oracle의 실제 스키마·실행 SQL·배포 revision

## 다음 작업
마스킹된 실행 SQL 및 컬럼 메타데이터를 요청
