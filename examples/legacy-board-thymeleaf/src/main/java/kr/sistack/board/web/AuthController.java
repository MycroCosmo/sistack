package kr.sistack.board.web;

import java.util.UUID;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class AuthController {
    @GetMapping("/auth/login.do")
    public String login(HttpSession session) {
        if (session.getAttribute("csrf") == null) {
            session.setAttribute("csrf", UUID.randomUUID().toString());
        }
        return "login";
    }

    @PostMapping("/auth/login.do")
    public String signIn(@RequestParam("role") String role, @RequestParam("csrf") String csrf,
    HttpServletRequest request, HttpServletResponse response) throws Exception {
        HttpSession previous = request.getSession(false);
        if (previous == null || !csrf.equals(previous.getAttribute("csrf"))) {
            response.sendError(403);
            return null;
        }
        if (!"READER".equals(role) && !"ADMIN".equals(role)) {
            throw new IllegalArgumentException("역할을 확인하세요");
        }
        previous.invalidate();
        HttpSession session = request.getSession(true);
        session.setAttribute("loginUser", new UserSession("ADMIN".equals(role) ? "테스트관리자" : "테스트조회자", role));
        session.setAttribute("csrf", UUID.randomUUID().toString());
        return "redirect:/board/list.do";
    }

    @PostMapping("/auth/logout.do")
    public String logout(HttpSession session) {
        session.invalidate();
        return "redirect:/auth/login.do";
    }
}
