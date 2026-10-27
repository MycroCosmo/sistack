> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그인은 되는데 게시판 목록에 들어가면 오류 화면이 떠요.


## 원인
- CONFIRMED · 증거 3단계 · Thymeleaf 3.1에서 제거된 #request.getAttribute와 #session.getAttribute가 남아 viewer/session.csrf 모델 접근 대신 평가된다.
  src/main/webapp/WEB-INF/templates/board/list.html:7, src/main/webapp/WEB-INF/templates/fragments/common.html:7
  pom은 thymeleaf-spring5 3.1.5다. 실제 예외는 #session.getAttribute 및 utility objects unavailable을 명시하고, 소스 전체 템플릿 검색에서 #request.getAttribute(viewer)도 찾았다. Controller는 viewer 모델을 이미 제공한다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
Controller 반환명 board/list에 맞는 HTML 파일이 존재하며 404가 아닌 TemplateProcessingException이다.
템플릿 파일 인코딩 문제가 아니라 표현식 객체를 사용할 수 없다는 가장 깊은 예외다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/webapp/WEB-INF/templates/board/list.html b/src/main/webapp/WEB-INF/templates/board/list.html
--- a/src/main/webapp/WEB-INF/templates/board/list.html
+++ b/src/main/webapp/WEB-INF/templates/board/list.html
@@ -4,7 +4,7 @@
 <body>
     <section layout:fragment="content">
         <h1>게시판 목록</h1>
-        <p><span th:text="${#request.getAttribute('viewer')}"></span>님</p>
+        <p><span th:text="${viewer}"></span>님</p>
         <form id="searchForm" method="get" th:action="@{/board/list.do}">
             <input type="hidden" name="page" th:value="${search.page}">
             <label>검색 조건

diff --git a/src/main/webapp/WEB-INF/templates/fragments/common.html b/src/main/webapp/WEB-INF/templates/fragments/common.html
--- a/src/main/webapp/WEB-INF/templates/fragments/common.html
+++ b/src/main/webapp/WEB-INF/templates/fragments/common.html
@@ -4,7 +4,7 @@
     <nav th:fragment="menu" th:if="${session.loginUser != null}" aria-label="주 메뉴">
         <a th:each="menu : ${menus}" th:href="@{${menu.url}}" th:text="${menu.label}"></a>
         <form method="post" th:action="@{/auth/logout.do}">
-            <input type="hidden" name="csrf" th:value="${#session.getAttribute('csrf')}">
+            <input type="hidden" name="csrf" th:value="${session.csrf}">
             <button>로그아웃</button>
         </form>
     </nav>

```

동일 패턴 확인: 모든 HTML에서 두 제거 유틸리티를 검색해 목록 viewer와 공통 csrf 두 곳을 확인했다.

## 확인 방법
로그인 목록 렌더링 200, viewer/CSRF 값 제공, 공통 조각을 사용하는 다른 화면과 로그아웃 POST 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
