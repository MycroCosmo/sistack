> AI의 PASS는 PL/PM 승인이나 고객 검수 완료가 아닙니다.

# si-debug

상태: PASS (원인 분석 범위). 수정 적용 없음.

## 증상 요약
로그인하면 오류 화면이 나와요. 게시판 목록이 안 보여요.


## 원인
- CONFIRMED · 증거 3단계 · MenuMapper @Param("roleKey")와 SQL #{role} 불일치로 role을 찾지 못한다.
  src/main/java/kr/sistack/board/mapper/MenuMapper.java:10
  로그의 Available parameters=[roleKey,param1]와 @Select의 #{role}, 메서드의 @Param("roleKey")를 대조했다. LoginInterceptor:38은 실패가 전파된 호출부다.

재현: 미재현 — 새 실행은 동일 소스 재검토와 Node 분석이다. 이전 앱 재현 증거는 별도 보존하며 이번에는 WAS/DB를 재실행하지 않았다.

## 원인까지의 경로
LoginInterceptor:19~24의 로그인 검사는 통과해야 메뉴 조회에 도달한다.
DB 문법 오류가 아니라 파라미터 맵에서 role을 찾지 못하는 BindingException이 가장 깊은 예외다.

## 수정안
현재 결함 소스에서 원인을 바로잡는 제안이다. 원본과 비교해 생성하지 않았고 원본에는 적용하지 않는다.

```diff
diff --git a/src/main/java/kr/sistack/board/mapper/MenuMapper.java b/src/main/java/kr/sistack/board/mapper/MenuMapper.java
--- a/src/main/java/kr/sistack/board/mapper/MenuMapper.java
+++ b/src/main/java/kr/sistack/board/mapper/MenuMapper.java
@@ -7,5 +7,5 @@ import kr.sistack.board.domain.Menu;
 
 public interface MenuMapper {
     @Select("SELECT LABEL, URL FROM APP_MENU WHERE ROLE_KEY = #{role} ORDER BY MENU_ORDER")
-    List<Menu> selectList(@Param("roleKey") String role);
+    List<Menu> selectList(@Param("role") String role);
 }

```

동일 패턴 확인: 동일 MenuMapper는 인증된 게시판/공통코드 요청의 LoginInterceptor에서 공유된다.

## 확인 방법
ADMIN 로그인 후 목록 200, 익명은 로그인으로 이동, USER/ADMIN 메뉴 역할별 결과 확인

## 확정 못 한 것
수정 후 런타임 회귀 미실행
Java/WAS 실환경 미검증

## 다음 작업
승인된 범위에서 수정 후 앱 회귀 실행
