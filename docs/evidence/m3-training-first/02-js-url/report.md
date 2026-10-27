> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
게시판에 처음 들어가면 목록은 보여요. 검색어를 넣고 검색 버튼을 누르면 404 오류가 떠요.

## 원인
- CONFIRMED · 증거 5단계 · 검색 submit 핸들러가 정상 폼 action을 /board/lists.do로 바꿔 Controller /board/list.do 매핑과 어긋난다.
  src/main/webapp/resources/board.js:4
  list.jsp:14의 기본 action은 list.do다. 같은 폼의 submit에서 listUrl()이 lists.do를 생성하고 action을 덮어쓴다. 실제 JS 실행으로 만든 URL도 lists.do/404다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다.

## 원인까지의 경로
초기 JSP form action과 Controller GetMapping은 list.do로 일치한다.
정적 board.js 요청은 200이므로 JS 다운로드 실패에 의한 증상은 아니다.

## 수정안
원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.

```diff
--- a/src/main/webapp/resources/board.js
+++ b/src/main/webapp/resources/board.js
@@ -4,1 +4,1 @@
-    return form.attr('data-base') + '/' + 'lists' + '.do';
+    return form.attr('data-base') + '/' + 'list' + '.do';
```

동일 패턴 확인: 페이지 버튼도 board.js:12~15에서 같은 listUrl()을 호출하므로 검색과 함께 확인해야 한다.

## 확인 방법
검색 버튼과 페이지 버튼에서 /board/list.do 요청 및 200 응답, 검색어/페이지 값 유지 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
