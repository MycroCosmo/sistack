> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
게시판에 처음 들어가면 목록은 보여요. 검색어를 넣고 검색 버튼을 누르면 404 오류가 떠요.


## 원인
- CONFIRMED · 증거 3단계 · board.js listUrl()의 /board/lists.do가 Controller /board/list.do와 불일치한다.
  src/main/webapp/resources/board.js:4
  list.jsp:14의 기본 action은 list.do다. 같은 폼의 submit에서 listUrl()이 lists.do를 생성하고 action을 덮어쓴다. 실제 JS 실행으로 만든 URL도 lists.do/404다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
초기 JSP form action과 Controller GetMapping은 list.do로 일치한다.
정적 board.js 요청은 200이므로 JS 다운로드 실패에 의한 증상은 아니다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/webapp/resources/board.js b/src/main/webapp/resources/board.js
--- a/src/main/webapp/resources/board.js
+++ b/src/main/webapp/resources/board.js
@@ -1,7 +1,7 @@
 $(function () {
   var form = $('#searchForm');
   function listUrl() {
-    return form.attr('data-base') + '/' + 'lists' + '.do';
+    return form.attr('data-base') + '/' + 'list' + '.do';
   }
 
   form.on('submit', function () {

```

동일 패턴 확인: 페이지 버튼도 board.js:12~15에서 같은 listUrl()을 호출하므로 검색과 함께 확인해야 한다.

## 확인 방법
검색 버튼과 페이지 버튼에서 /board/list.do 요청 및 200 응답, 검색어/페이지 값 유지 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
