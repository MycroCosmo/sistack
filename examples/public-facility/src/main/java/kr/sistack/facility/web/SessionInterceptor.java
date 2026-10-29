package kr.sistack.facility.web;

import java.util.UUID;
import javax.servlet.http.*;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

public class SessionInterceptor implements HandlerInterceptor {
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("Cache-Control", "no-store");
        response.setHeader("Content-Security-Policy", "default-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'self'");
        HttpSession session = request.getSession();
        if (session.getAttribute("csrf") == null) session.setAttribute("csrf", UUID.randomUUID().toString());
        if (!"GET".equals(request.getMethod()) && !"HEAD".equals(request.getMethod())) {
            if (!session.getAttribute("csrf").equals(request.getParameter("csrf")))
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "화면을 새로고침한 뒤 다시 시도하세요.");
        }
        String uri = request.getRequestURI().substring(request.getContextPath().length());
        if (!uri.equals("/auth/login") && !uri.startsWith("/resources/") && session.getAttribute("actor") == null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "실습 계정으로 먼저 로그인하세요.");
        return true;
    }
}
