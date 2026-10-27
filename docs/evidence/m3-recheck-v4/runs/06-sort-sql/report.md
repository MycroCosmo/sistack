> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
제목순으로 보면 잘 나와요. 등록일순으로 바꾸면 오류 화면이 떠요.

## 원인
- CONFIRMED · 증거 5단계 · 정렬 식별자 변환이 제거되어 UI 값 createdAt이 SQL ORDER BY에 그대로 삽입된다.
  src/main/java/kr/sistack/board/domain/BoardSearch.java:78
  setter는 createdAt/title만 허용하지만 getSortColumn은 sort를 그대로 반환한다. Mapper:34는 ${sortColumn}으로 직접 치환하며 실제 SQL과 H2 예외는 CREATEDAT 미존재를 가리킨다. title 정렬은 200이다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다. v4는 동일 입력 대응 비교이며 새 앱 실행은 아니다.

## 원인까지의 경로
정렬 setter의 허용 목록은 남아 있어 임의 값이 무제한 허용된다는 주장은 하지 않는다.
같은 SELECT의 title 정렬은 성공하므로 테이블 전체 부재나 공통 날짜 필터 오류를 원인으로 잡지 않는다.

## 수정안
첫 제안의 중복 return 문장 선택 오류를 메서드 문맥 포함 후속 diff로 보정. 실제 소스 미적용.

```diff
diff --git a/src/main/java/kr/sistack/board/domain/BoardSearch.java b/src/main/java/kr/sistack/board/domain/BoardSearch.java
--- a/src/main/java/kr/sistack/board/domain/BoardSearch.java
+++ b/src/main/java/kr/sistack/board/domain/BoardSearch.java
@@ -77,3 +77,3 @@
     public String getSortColumn() {
-        return sort;
+        return "title".equals(sort) ? "b.TITLE" : "b.CREATED_AT";
     }

```

동일 패턴 확인: ORDER BY가 같은 DTO getter를 쓰는 조회를 확인했다. createdAt에는 물리 컬럼 b.CREATED_AT 변환이 필요하다.

## 확인 방법
sort=title/createdAt 모두 200, 알 수 없는 정렬 값은 거부, 바인딩 SQL과 정렬 결과 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
