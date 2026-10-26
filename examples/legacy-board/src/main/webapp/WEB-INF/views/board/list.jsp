<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html><html lang="ko"><head><title>게시판 목록</title><%@ include file="../common/header.jspf" %></head><body><main>
<%@ include file="../common/menu.jspf" %><h1>게시판 목록</h1><p><c:out value="${viewer}"/>님</p>
<form id="searchForm" method="get" action="<c:url value='/board/list.do'/>" data-base="<c:url value='/board'/>">
  <input type="hidden" name="page" value="${search.page}">
  <label>검색 조건 <select name="searchType"><option value="title" ${search.searchType == 'title' ? 'selected' : ''}>제목</option><option value="author" ${search.searchType == 'author' ? 'selected' : ''}>작성자</option></select></label>
  <label>검색어 <input name="keyword" maxlength="100" value="<c:out value='${search.keyword}'/>"></label>
  <label>시작일 <input type="date" name="startDate" value="<c:out value='${search.startDate}'/>"></label>
  <label>종료일 <input type="date" name="endDate" value="<c:out value='${search.endDate}'/>"></label>
  <label>정렬 <select name="sort"><option value="createdAt" ${search.sort == 'createdAt' ? 'selected' : ''}>등록일</option><option value="title" ${search.sort == 'title' ? 'selected' : ''}>제목</option></select></label>
  <button type="submit">검색</button>
</form>
<table><thead><tr><th>번호</th><th>제목</th><th>작성자</th><th>등록일</th></tr></thead><tbody>
<c:forEach items="${boards}" var="item"><c:url value="/board/detail.do" var="detailUrl"><c:param name="id" value="${item.id}"/></c:url>
<tr><td>${item.id}</td><td><a href="${fn:escapeXml(detailUrl)}"><c:out value="${item.title}"/></a></td><td><c:out value="${item.author}"/></td><td><c:out value="${item.createdAt}"/></td></tr></c:forEach>
<c:if test="${empty boards}"><tr><td colspan="4">조회 결과가 없습니다.</td></tr></c:if>
</tbody></table><%@ include file="../common/paging.jspf" %>
<c:if test="${currentUser.role == 'ADMIN'}"><a href="<c:url value='/board/form.do'/>">새 글 등록</a></c:if>
</main></body></html>
