<%@ page contentType="text/html; charset=UTF-8" %>
<!DOCTYPE html>
<html lang="ko">
    <head>
        <title>게시글 상세</title>
        <%@ include file="../common/header.jspf" %>
    </head>
    <body>
        <main>
            <%@ include file="../common/menu.jspf" %>
            <h1>
                <c:out value="${board.title}"/>
            </h1>
            <p>작성자: <c:out value="${board.author}"/> · 분류: <c:out value="${board.category}"/>
            </p>
            <pre><c:out value="${board.content}"/></pre>
            <a href="<c:url value='/board/list.do'/>">목록</a>
            <c:if test="${currentUser.role == 'ADMIN'}">
                <c:url value="/board/form.do" var="editUrl">
                    <c:param name="id" value="${board.id}"/>
                </c:url>
                <a href="${fn:escapeXml(editUrl)}">수정</a>
                <form id="deleteForm" method="post" action="<c:url value='/board/delete.do'/>" data-base="<c:url value='/board'/>">
                    <input type="hidden" name="id" value="${board.id}">
                    <input type="hidden" name="csrf" value="<c:out value='${sessionScope.csrf}'/>">
                    <button>삭제</button>
                </form>
                <p id="deleteStatus" role="status">
                </p>
            </c:if>
        </main>
    </body>
</html>
