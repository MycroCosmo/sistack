package kr.sistack.facility.web;

import javax.servlet.http.HttpServletResponse;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@ControllerAdvice
public class ExceptionAdvice {
    @ExceptionHandler({IllegalArgumentException.class, MissingServletRequestParameterException.class, MethodArgumentTypeMismatchException.class})
    public String invalid(Exception ex, HttpServletResponse response, Model model) {
        response.setStatus(400);
        model.addAttribute("message", ex instanceof IllegalArgumentException ? ex.getMessage() : "입력값과 형식을 확인하세요.");
        return "error";
    }
    @ExceptionHandler(ResponseStatusException.class)
    public String denied(ResponseStatusException ex, HttpServletResponse response, Model model) {
        response.setStatus(ex.getStatus().value()); model.addAttribute("message", ex.getReason()); return "error";
    }
    @ExceptionHandler(Exception.class)
    public String failed(Exception ex, HttpServletResponse response, Model model) {
        response.setStatus(500); model.addAttribute("message", "요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요."); return "error";
    }
}
