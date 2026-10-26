package kr.sistack.board.web;

import org.springframework.http.HttpStatus;
import org.springframework.validation.BindException;
import org.springframework.beans.TypeMismatchException;
import org.springframework.web.bind.ServletRequestBindingException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.ResponseStatus;
import kr.sistack.board.service.NotFoundException;

@ControllerAdvice
public class CommonExceptionHandler {
    @ExceptionHandler(NotFoundException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    public String notFound() {
        return "error";
    }

    @ExceptionHandler({IllegalArgumentException.class, BindException.class, TypeMismatchException.class, ServletRequestBindingException.class})
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    public String invalid() {
        return "error";
    }

    @ExceptionHandler(RuntimeException.class)
    @ResponseStatus(HttpStatus.INTERNAL_SERVER_ERROR)
    public String failure() {
        return "error";
    }
}
