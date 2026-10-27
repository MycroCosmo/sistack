> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
게시글이 11건이라고 나오는데 목록에는 10개만 보여요. 다음 페이지로 가는 버튼이 없어서 나머지 글을 못 보겠어요.

## 원인
- CONFIRMED · 증거 5단계 · 마지막 페이지 계산이 나머지를 버려 11건을 한 페이지로 계산하고 다음 버튼을 숨긴다.
  src/main/java/kr/sistack/board/common/Pagination.java:39
  pageSize=10일 때 total/getPageSize()는 11/10=1이다. paging.jspf:8은 현재 페이지<lastPage일 때만 다음 버튼을 만들며 service는 실제 count를 total에 넣는다. 2페이지 직접 요청은 200이다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다. v4는 동일 입력 대응 비교이며 새 앱 실행은 아니다.

## 원인까지의 경로
총건수는 count로 입력되고 2페이지 직접 조회가 가능하므로 마지막 데이터 자체 삭제나 조회 경로 404가 아니다.
JSP의 조건은 계산된 lastPage를 사용하므로 가장 이른 잘못된 값은 Pagination 계산이다.

## 수정안
원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.

```diff
--- a/src/main/java/kr/sistack/board/common/Pagination.java
+++ b/src/main/java/kr/sistack/board/common/Pagination.java
@@ -39,1 +39,1 @@
-        return Math.max(1, total / getPageSize());
+        return Math.max(1, (total + getPageSize() - 1) / getPageSize());
```

동일 패턴 확인: Pagination을 상속한 BoardSearch 및 JSP/Thymeleaf 페이징 조각에서 같은 lastPage를 소비한다.

## 확인 방법
총건수 0/1/10/11/20/21에서 lastPage와 이전/다음 링크, 마지막 행 접근 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
