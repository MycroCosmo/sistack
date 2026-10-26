package kr.sistack.board.web;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.web.servlet.HandlerMapping;
import kr.sistack.board.mapper.MenuMapper;

public class LoginInterceptor implements HandlerInterceptor {
    private final MenuMapper menus;

    public LoginInterceptor(MenuMapper menus) {
        this.menus = menus;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        HttpSession session = request.getSession(false);
        UserSession user = session == null ? null : (UserSession) session.getAttribute("loginUser");
        if (user == null) {
            response.sendRedirect(request.getContextPath() + "/auth/login.do");
            return false;
        }
        String route = String.valueOf(request.getAttribute(HandlerMapping.BEST_MATCHING_PATTERN_ATTRIBUTE));
        boolean admin = route.startsWith("/code/") || route.equals("/board/form.do")
            || route.equals("/board/create.do") || route.equals("/board/update.do") || route.equals("/board/delete.do");
        if (admin && !"ADMIN".equals(user.getRole())) {
            response.sendError(403);
            return false;
        }
        Object csrf = session.getAttribute("csrf");
        if ("POST".equals(request.getMethod()) && (!(csrf instanceof String) || !csrf.equals(request.getParameter("csrf")))) {
            response.sendError(403);
            return false;
        }
        request.setAttribute("currentUser", user);
        request.setAttribute("menus", menus.selectList(user.getRole()));
        return true;
    }
}
