> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그인은 되는데 게시판 목록에 들어가면 오류 화면이 떠요.

## 원인
- CONFIRMED · 증거 5단계 · Thymeleaf 3.1 템플릿에 제거된 #request/#session 유틸리티가 남아 표현식 평가가 실패한다.
  src/main/webapp/WEB-INF/templates/board/list.html:7, src/main/webapp/WEB-INF/templates/fragments/common.html:7
  pom은 thymeleaf-spring5 3.1.5다. 실제 예외는 #session.getAttribute 및 utility objects unavailable을 명시하고, 소스 전체 템플릿 검색에서 #request.getAttribute(viewer)도 찾았다. Controller는 viewer 모델을 이미 제공한다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다. v4는 동일 입력 대응 비교이며 새 앱 실행은 아니다.

## 원인까지의 경로
Controller 반환명 board/list에 맞는 HTML 파일이 존재하며 404가 아닌 TemplateProcessingException이다.
템플릿 파일 인코딩 문제가 아니라 표현식 객체를 사용할 수 없다는 가장 깊은 예외다.

## 수정안
원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.

```diff
--- a/src/main/webapp/WEB-INF/templates/board/list.html
+++ b/src/main/webapp/WEB-INF/templates/board/list.html
@@ -7,1 +7,1 @@
-        <p><span th:text="${#request.getAttribute('viewer')}"></span>님</p>
+        <p><span th:text="${viewer}"></span>님</p>

--- a/src/main/webapp/WEB-INF/templates/fragments/common.html
+++ b/src/main/webapp/WEB-INF/templates/fragments/common.html
@@ -7,1 +7,1 @@
-            <input type="hidden" name="csrf" th:value="${#session.getAttribute('csrf')}">
+            <input type="hidden" name="csrf" th:value="${session.csrf}">
```

동일 패턴 확인: 모든 HTML에서 두 제거 유틸리티를 검색해 목록 viewer와 공통 csrf 두 곳을 확인했다.

## 확인 방법
로그인 목록 렌더링 200, viewer/CSRF 값 제공, 공통 조각을 사용하는 다른 화면과 로그아웃 POST 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
