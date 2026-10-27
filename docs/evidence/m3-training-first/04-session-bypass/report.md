> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그아웃한 뒤 즐겨찾기에 저장한 게시판 주소로 들어갔어요. 로그인 화면이 나올 줄 알았는데 오류 화면이 떠요.

## 원인
- CONFIRMED · 증거 5단계 · 게시판 경로가 인증 인터셉터 매핑에서 빠진 상태로 currentUser를 선택 인자로 받아 익명 요청이 null 사용자 역참조까지 진행한다.
  src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10, src/main/java/kr/sistack/board/web/BoardController.java:37
  인터셉터 매핑은 /code/**와 logout뿐이다. currentUser는 LoginInterceptor:37에서만 넣는데 Controller는 required=false로 받아 :39에서 user.getName()을 실행한다. 익명 요청의 실제 NPE도 그 줄을 가리킨다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다.

## 원인까지의 경로
인터셉터 내부에는 user=null 로그인 redirect/return false가 있어 null 검사의 부재가 아니다.
service.list 이후 user.getName에서 NPE가 발생했으므로 SQL 예외나 뷰 렌더링 실패가 아니다.

## 수정안
원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.

```diff
--- a/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
+++ b/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
@@ -10,1 +10,2 @@
-            <mvc:mapping path="/code/**"/>
+            <mvc:mapping path="/board/**"/>
+            <mvc:mapping path="/code/**"/>

--- a/src/main/java/kr/sistack/board/web/BoardController.java
+++ b/src/main/java/kr/sistack/board/web/BoardController.java
@@ -37,1 +37,1 @@
-    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute(value = "currentUser", required = false) UserSession user, Model model) {
+    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute("currentUser") UserSession user, Model model) {
```

동일 패턴 확인: 빠진 /board/**에 속하는 등록·수정·삭제도 인증/권한/CSRF 검사 보호가 필요하다.

## 확인 방법
로그아웃/만료 후 게시판 직접 접근이 로그인 302, 로그인 목록 200, 변경 요청의 권한/CSRF 거부 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
