> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
글 쓸 때는 제목이 한글로 잘 보여요. 저장하고 다시 열어 보면 제목 글자가 깨져 있어요.


## 원인
- CONFIRMED · 증거 3단계 · CharacterEncodingFilter의 encoding=ISO-8859-1이 UTF-8 폼 요청을 잘못 해석한다.
  src/main/webapp/WEB-INF/web.xml:15
  필터 매핑 /*와 forceEncoding=true는 살아 있으나 encoding 값이 ISO-8859-1이다. 폼 JSP는 UTF-8이고 저장 후 제목이 달라졌으며 요청 자체는 성공했다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
필터 매핑 자체 누락은 아니다. web.xml:22~25에서 모든 경로에 적용된다.
Controller create는 바인딩된 Board를 전달하며 JSP 파일은 UTF-8을 선언한다. 오류 응답/바인딩 거부에 따른 저장 실패도 아니다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/webapp/WEB-INF/web.xml b/src/main/webapp/WEB-INF/web.xml
--- a/src/main/webapp/WEB-INF/web.xml
+++ b/src/main/webapp/WEB-INF/web.xml
@@ -12,7 +12,7 @@
         <filter-class>org.springframework.web.filter.CharacterEncodingFilter</filter-class>
         <init-param>
             <param-name>encoding</param-name>
-            <param-value>ISO-8859-1</param-value>
+            <param-value>UTF-8</param-value>
         </init-param>
         <init-param>
             <param-name>forceEncoding</param-name>

```

동일 패턴 확인: 같은 필터를 쓰는 게시글 수정과 한글 검색 파라미터도 영향 범위다.

## 확인 방법
한글 제목/본문 등록·수정·검색 왕복 일치, ASCII 입력과 로그인 동작 회귀 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
