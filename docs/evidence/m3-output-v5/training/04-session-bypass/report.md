> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그아웃한 뒤 즐겨찾기에 저장한 게시판 주소로 들어갔어요. 로그인 화면이 나올 줄 알았는데 오류 화면이 떠요.


## 원인
- CONFIRMED · 증거 3단계 · 인증 매핑 /board/** 누락과 currentUser의 required=false로 익명 요청이 user.getName()의 null 역참조까지 도달한다.
  src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:10, src/main/java/kr/sistack/board/web/BoardController.java:37
  인터셉터 매핑은 /code/**와 logout뿐이다. currentUser는 LoginInterceptor:37에서만 넣는데 Controller는 required=false로 받아 :39에서 user.getName()을 실행한다. 익명 요청의 실제 NPE도 그 줄을 가리킨다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
인터셉터 내부에는 user=null 로그인 redirect/return false가 있어 null 검사의 부재가 아니다.
service.list 이후 user.getName에서 NPE가 발생했으므로 SQL 예외나 뷰 렌더링 실패가 아니다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml b/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
--- a/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
+++ b/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
@@ -7,6 +7,7 @@
     <mvc:resources mapping="/resources/**" location="/resources/"/>
     <mvc:interceptors>
         <mvc:interceptor>
+            <mvc:mapping path="/board/**"/>
             <mvc:mapping path="/code/**"/>
             <mvc:mapping path="/auth/logout.do"/>
             <bean class="kr.sistack.board.web.LoginInterceptor">

diff --git a/src/main/java/kr/sistack/board/web/BoardController.java b/src/main/java/kr/sistack/board/web/BoardController.java
--- a/src/main/java/kr/sistack/board/web/BoardController.java
+++ b/src/main/java/kr/sistack/board/web/BoardController.java
@@ -34,7 +34,7 @@ public class BoardController {
     }
 
     @GetMapping("/list.do")
-    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute(value = "currentUser", required = false) UserSession user, Model model) {
+    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute("currentUser") UserSession user, Model model) {
         model.addAttribute("boards", service.list(search));
         model.addAttribute("viewer", user.getName());
         model.addAttribute("paging", search);

```

동일 패턴 확인: 빠진 /board/**에 속하는 등록·수정·삭제도 인증/권한/CSRF 검사 보호가 필요하다.

## 확인 방법
로그아웃/만료 후 게시판 직접 접근이 로그인 302, 로그인 목록 200, 변경 요청의 권한/CSRF 거부 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
