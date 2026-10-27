> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
게시글이 11건이라고 나오는데 목록에는 10개만 보여요. 다음 페이지로 가는 버튼이 없어서 나머지 글을 못 보겠어요.


## 원인
- CONFIRMED · 증거 3단계 · getLastPage의 total / getPageSize()는 total=11, pageSize=10에서 1을 반환해 필요한 마지막 페이지 2와 어긋난다.
  src/main/java/kr/sistack/board/common/Pagination.java:39
  pageSize=10일 때 total/getPageSize()는 11/10=1이다. paging.jspf:8은 현재 페이지<lastPage일 때만 다음 버튼을 만들며 service는 실제 count를 total에 넣는다. 2페이지 직접 요청은 200이다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
총건수는 count로 입력되고 2페이지 직접 조회가 가능하므로 마지막 데이터 자체 삭제나 조회 경로 404가 아니다.
JSP의 조건은 계산된 lastPage를 사용하므로 가장 이른 잘못된 값은 Pagination 계산이다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/java/kr/sistack/board/common/Pagination.java b/src/main/java/kr/sistack/board/common/Pagination.java
--- a/src/main/java/kr/sistack/board/common/Pagination.java
+++ b/src/main/java/kr/sistack/board/common/Pagination.java
@@ -36,6 +36,6 @@ public class Pagination {
     }
 
     public int getLastPage() {
-        return Math.max(1, total / getPageSize());
+        return Math.max(1, (total + getPageSize() - 1) / getPageSize());
     }
 }

```

동일 패턴 확인: Pagination을 상속한 BoardSearch 및 JSP/Thymeleaf 페이징 조각에서 같은 lastPage를 소비한다.

## 확인 방법
총건수 0/1/10/11/20/21에서 lastPage와 이전/다음 링크, 마지막 행 접근 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
