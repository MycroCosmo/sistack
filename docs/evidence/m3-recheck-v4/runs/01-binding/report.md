> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그인하면 오류 화면이 나와요. 게시판 목록이 안 보여요.

## 원인
- CONFIRMED · 증거 5단계 · MenuMapper의 @Param 이름 roleKey가 SQL의 role 키와 달라 메뉴 조회 바인딩이 실패한다.
  src/main/java/kr/sistack/board/mapper/MenuMapper.java:10
  로그의 Available parameters=[roleKey,param1]와 @Select의 #{role}, 메서드의 @Param("roleKey")를 대조했다. LoginInterceptor:38은 실패가 전파된 호출부다.

재현: 실행 — 입력 수집 때 실제 앱에서 결함을 재현했다(동결 전). 같은 패치의 새 임시 복사본을 동결 후 소스로 분석했다. 수정 적용/수정 후 검증은 미실행이다. v4는 동일 입력 대응 비교이며 새 앱 실행은 아니다.

## 원인까지의 경로
LoginInterceptor:19~24의 로그인 검사는 통과해야 메뉴 조회에 도달한다.
DB 문법 오류가 아니라 파라미터 맵에서 role을 찾지 못하는 BindingException이 가장 깊은 예외다.

## 수정안
원인을 바로잡는 최소 diff 제안이며 적용하지 않았다.

```diff
--- a/src/main/java/kr/sistack/board/mapper/MenuMapper.java
+++ b/src/main/java/kr/sistack/board/mapper/MenuMapper.java
@@ -10,1 +10,1 @@
-    List<Menu> selectList(@Param("roleKey") String role);
+    List<Menu> selectList(@Param("role") String role);
```

동일 패턴 확인: 동일 MenuMapper는 인증된 게시판/공통코드 요청의 LoginInterceptor에서 공유된다.

## 확인 방법
ADMIN 로그인 후 목록 200, 익명은 로그인으로 이동, USER/ADMIN 메뉴 역할별 결과 확인

## 확정 못 한 것
수정안 미적용·수정 후 앱 회귀 미실행
Java 8/11 및 JEUS/WebLogic 실환경 미검증

## 다음 작업
사용자가 수정 범위를 승인한 뒤 제안 diff 적용 및 verification 절차 실행
