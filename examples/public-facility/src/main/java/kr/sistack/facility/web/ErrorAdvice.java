package kr.sistack.facility.web;
import javax.servlet.http.HttpServletResponse;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import java.time.format.DateTimeParseException;
@ControllerAdvice
public class ErrorAdvice {
    @ExceptionHandler({IllegalArgumentException.class,DateTimeParseException.class,MissingServletRequestParameterException.class,MethodArgumentTypeMismatchException.class})
    public String invalid(Exception error,HttpServletResponse response,Model model) {
        response.setStatus(400); model.addAttribute("message",error instanceof IllegalArgumentException?error.getMessage():"날짜·시간·입력값을 확인하세요."); return "error";
    }
    @ExceptionHandler(ResponseStatusException.class)
    public String access(ResponseStatusException error,HttpServletResponse response,Model model) {
        response.setStatus(error.getStatus().value()); model.addAttribute("message",error.getReason()); return "error";
    }
    @ExceptionHandler(Exception.class)
    public String failure(Exception error,HttpServletResponse response,Model model) {
        response.setStatus(500); model.addAttribute("message","처리 중 오류가 발생했습니다. 입력과 처리 상태를 확인하세요."); return "error";
    }
}
