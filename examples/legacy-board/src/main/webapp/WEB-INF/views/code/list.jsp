<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="ko"><head><title>공통코드</title><%@ include file="../common/header.jspf" %></head><body><main>
<%@ include file="../common/menu.jspf" %><h1>게시판 분류 코드</h1>
<form id="searchForm" method="get" action="<c:url value='/code/list.do'/>" data-base="<c:url value='/code'/>"><input type="hidden" name="page" value="${paging.page}"></form>
<table><thead><tr><th>코드</th><th>이름</th></tr></thead><tbody><c:forEach items="${codes}" var="code"><tr><td><c:out value="${code.code}"/></td><td><c:out value="${code.label}"/></td></tr></c:forEach></tbody></table>
<%@ include file="../common/paging.jspf" %></main></body></html>
