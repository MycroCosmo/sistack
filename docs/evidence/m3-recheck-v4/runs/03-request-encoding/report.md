> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
글 쓸 때는 제목이 한글로 잘 보여요. 저장하고 다시 열어 보면 제목 글자가 깨져 있어요.

## 원인
- CONFIRMED · 증거 5단계 · CharacterEncodingFilter가 UTF-8 폼 요청을 ISO-8859-1로 강제 해석한다.
  src/main/webapp/WEB-INF/web.xml:15
  필터 매핑 /*와 forceEncoding=true는 살아 있으나 encoding 값이 ISO-8859-1이다. 폼 JSP는 UTF-8이고 저장 후 제목이 달라졌으며 요청 자체는 성공했다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다. v4는 동일 입력 대응 비교이며 새 앱 실행은 아니다.

## 원인까지의 경로
필터 매핑 자체 누락은 아니다. web.xml:22~25에서 모든 경로에 적용된다.
Controller create는 바인딩된 Board를 전달하며 JSP 파일은 UTF-8을 선언한다. 오류 응답/바인딩 거부에 따른 저장 실패도 아니다.

## 수정안
원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.

```diff
--- a/src/main/webapp/WEB-INF/web.xml
+++ b/src/main/webapp/WEB-INF/web.xml
@@ -15,1 +15,1 @@
-            <param-value>ISO-8859-1</param-value>
+            <param-value>UTF-8</param-value>
```

동일 패턴 확인: 같은 필터를 쓰는 게시글 수정과 한글 검색 파라미터도 영향 범위다.

## 확인 방법
한글 제목/본문 등록·수정·검색 왕복 일치, ASCII 입력과 로그인 동작 회귀 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
