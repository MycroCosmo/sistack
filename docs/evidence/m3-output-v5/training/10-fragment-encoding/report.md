> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
게시글 제목은 한글로 잘 보여요. 그런데 목록 아래쪽 페이지 안내 글자만 깨져 보여요.


## 원인
- CONFIRMED · 증거 3단계 · paging.jspf에 pageEncoding="UTF-8"이 없어 한글 공통 조각만 다른 소스 인코딩으로 번역된다.
  src/main/webapp/WEB-INF/views/common/paging.jspf:1
  paging.jspf는 한글을 포함하지만 첫 줄이 div이고 pageEncoding이 없다. header.jspf는 UTF-8을 선언하며 list.jsp:70이 paging.jspf를 정적으로 포함한다. 실제 HTTP 본문은 정상 한글이고 조각만 불일치한다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
전체 응답은 200이고 게시판 본문 한글이 정상이므로 저장 데이터 전체 손상이나 전체 응답 인코딩 실패로 좁히지 않는다.
공통 header는 UTF-8을 선언하고 해당 조각만 선언이 없는 차이를 확인했다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/webapp/WEB-INF/views/common/paging.jspf b/src/main/webapp/WEB-INF/views/common/paging.jspf
--- a/src/main/webapp/WEB-INF/views/common/paging.jspf
+++ b/src/main/webapp/WEB-INF/views/common/paging.jspf
@@ -1,3 +1,4 @@
+<%@ page pageEncoding="UTF-8" %>
 <div class="paging" aria-label="페이지 이동">
     <c:if test="${paging.page > 1}">
         <button type="button" data-page="${paging.page - 1}">이전</button>

```

동일 패턴 확인: 다른 JSP 조각의 pageEncoding 선언을 확인했다. 한글 조각 파일마다 소스 인코딩을 명시해야 한다.

## 확인 방법
페이지 이동/건수 안내·이전/다음 한글 정상, 본문/메뉴 및 다른 조각 회귀 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
