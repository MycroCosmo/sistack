> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그인하고 게시판 목록을 열면 404 오류가 떠요. 새로고침해도 똑같아요.


## 원인
- CONFIRMED · 증거 3단계 · Thymeleaf viewNames=login,error가 board/*를 제외하고 JSP order=0, viewNames=code/*,board/*가 board/list를 먼저 받아 없는 JSP로 해석한다.
  src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:35, src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:40, src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml:41
  Controller는 board/list를 반환한다. Thymeleaf viewNames는 login,error뿐이고 JSP resolver는 order=0, viewNames=code/*,board/*다. 실제 인덱스에는 templates/board/list.html이 있고 views/board JSP는 없으며 요청은 404다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
@GetMapping(/list.do)와 board/list HTML이 있으므로 컨트롤러 경로나 HTML 파일 자체 부재가 아니다.
JSP resolver가 먼저 board/*를 수용하므로 Thymeleaf 표현식 평가에 도달하는 08번 오류와 경로가 다르다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml b/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
--- a/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
+++ b/src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml
@@ -32,12 +32,12 @@
         <property name="templateEngine" ref="templateEngine"/>
         <property name="characterEncoding" value="UTF-8"/>
         <property name="order" value="1"/>
-        <property name="viewNames" value="login,error"/>
+        <property name="viewNames" value="board/*,login,error"/>
     </bean>
     <bean class="org.springframework.web.servlet.view.InternalResourceViewResolver">
         <property name="prefix" value="/WEB-INF/views/"/>
         <property name="suffix" value=".jsp"/>
-        <property name="order" value="0"/>
-        <property name="viewNames" value="code/*,board/*"/>
+        <property name="order" value="2"/>
+        <property name="viewNames" value="code/*"/>
     </bean>
 </beans>

```

동일 패턴 확인: board/detail·form도 같은 board/* 뷰 그룹이므로 목록 외 두 화면의 resolver 선택을 확인해야 한다.

## 확인 방법
board/list/detail/form은 HTML로 200, code/list는 JSP로 200, resolver 선택과 양쪽 인코딩 회귀 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
