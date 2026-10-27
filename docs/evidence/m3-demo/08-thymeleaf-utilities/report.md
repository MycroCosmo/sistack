> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
Thymeleaf 이관 후 목록에서 500. 정상본은 200.

## 원인
- CONFIRMED · 증거 5단계 · Thymeleaf 3.1.5에서 제거된 #request/#session utility 객체를 목록·공통 조각에서 사용한다.
  src/main/webapp/WEB-INF/templates/board/list.html:7, src/main/webapp/WEB-INF/templates/fragments/common.html:7
  pom의 3.1.5와 두 식을 확인했다. 동일 HTTP 요청은 정상본 200/패치본 500이며 MVC 재현의 원인 체인에 TemplateProcessingException이 있다.

재현: 실행 — JDK 17 임시 Jetty 앱 HTTP 및 MVC/JUnit으로 확인

## 원인까지의 경로
Controller 매핑 불일치는 정상·패치가 같은 /board/list.do이고 변경은 템플릿뿐이므로 소거했다.
뷰 리졸버 설정과 SQL은 기준본과 같으며 실제 템플릿 처리 예외 타입으로 실패 단계를 좁혔다.

## 수정안
기존 model viewer와 session.csrf 속성 namespace로 복구하는 제안이며 적용하지 않았다.

```diff
diff --git a/src/main/webapp/WEB-INF/templates/board/list.html b/src/main/webapp/WEB-INF/templates/board/list.html
--- a/src/main/webapp/WEB-INF/templates/board/list.html
+++ b/src/main/webapp/WEB-INF/templates/board/list.html
@@ -4,7 +4,7 @@
 <body>
     <section layout:fragment="content">
         <h1>게시판 목록</h1>
+        <p><span th:text="${viewer}"></span>님</p>
-        <p><span th:text="${#request.getAttribute('viewer')}"></span>님</p>
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
+            <input type="hidden" name="csrf" th:value="${session.csrf}">
-            <input type="hidden" name="csrf" th:value="${#session.getAttribute('csrf')}">
             <button>로그아웃</button>
         </form>
     </nav>

```

동일 패턴 확인: 목록 viewer와 공통 fragment CSRF 두 위치를 확인했다. #request/#session을 사용하는 다른 템플릿은 없음.

## 확인 방법
같은 로그인→목록 요청이 200이고 로그아웃 CSRF hidden 값이 채워지는지 확인

## 확정 못 한 것
별도 실무 프로젝트 및 다른 WAS/Thymeleaf 버전 미확인

## 다음 작업
학습 정답 초안 사용자 검토 후 채점
