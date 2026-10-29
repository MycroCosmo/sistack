package kr.sistack.facility.web;
import java.util.UUID;
import javax.servlet.http.*;
import org.springframework.web.servlet.HandlerInterceptor;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
public class AccessGuard implements HandlerInterceptor {
    public boolean preHandle(HttpServletRequest request,HttpServletResponse response,Object handler) {
        response.setHeader("Cache-Control","no-store"); response.setHeader("X-Content-Type-Options","nosniff");
        response.setHeader("Content-Security-Policy","default-src 'self'; style-src 'self'; frame-ancestors 'none'; form-action 'self'");
        HttpSession session=request.getSession();
        if(session.getAttribute("csrf")==null) session.setAttribute("csrf",UUID.randomUUID().toString());
        if(!"GET".equals(request.getMethod())&&!"HEAD".equals(request.getMethod())&&!session.getAttribute("csrf").equals(request.getParameter("csrf")))
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,"화면을 새로고침한 뒤 다시 시도하세요.");
        String uri=request.getRequestURI().substring(request.getContextPath().length());
        if(!uri.equals("/login")&&!uri.startsWith("/resources/")&&session.getAttribute("account")==null)
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,"먼저 실습 계정을 선택하세요.");
        return true;
    }
}
