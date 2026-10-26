<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="ko"><head><title>로컬 게시판 로그인</title><%@ include file="common/header.jspf" %></head><body><main>
<h1>레거시 게시판</h1><p>합성 데이터와 역할 선택을 사용하는 로컬 테스트베드입니다. 운영 용도가 아닙니다.</p>
<form method="post" action="<c:url value='/auth/login.do'/>">
  <input type="hidden" name="csrf" value="<c:out value='${sessionScope.csrf}'/>">
  <label>테스트 역할 <select name="role"><option value="READER">조회자</option><option value="ADMIN">관리자</option></select></label>
  <button>입장</button>
</form></main></body></html>
