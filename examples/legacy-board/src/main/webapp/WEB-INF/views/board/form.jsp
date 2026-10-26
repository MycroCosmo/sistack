<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="ko"><head><title>게시글 작성</title><%@ include file="../common/header.jspf" %></head><body><main>
<%@ include file="../common/menu.jspf" %><h1>게시글 ${board.id == 0 ? '등록' : '수정'}</h1>
<c:url value="${board.id == 0 ? '/board/create.do' : '/board/update.do'}" var="saveUrl"/>
<form method="post" action="${fn:escapeXml(saveUrl)}">
  <input type="hidden" name="id" value="${board.id}"><input type="hidden" name="csrf" value="<c:out value='${sessionScope.csrf}'/>">
  <label>제목 <input name="title" maxlength="200" required value="<c:out value='${board.title}'/>"></label>
  <label>분류 <select name="category"><c:forEach items="${categories}" var="category"><option value="${fn:escapeXml(category.code)}" ${board.category == category.code ? 'selected' : ''}><c:out value="${category.label}"/></option></c:forEach></select></label>
  <label>내용 <textarea name="content" maxlength="4000" required rows="8"><c:out value="${board.content}"/></textarea></label>
  <button>저장</button><a href="<c:url value='/board/list.do'/>">취소</a>
</form></main></body></html>
