package kr.sistack.capture;

import java.io.IOException;
import java.time.Instant;
import javax.servlet.Filter;
import javax.servlet.FilterChain;
import javax.servlet.FilterConfig;
import javax.servlet.ServletException;
import javax.servlet.ServletRequest;
import javax.servlet.ServletResponse;
import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;

public class CaptureFilter implements Filter {
    @Override
    public void init(FilterConfig config) {
    }

    @Override
    public void destroy() {
    }

    @Override
    public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
            throws IOException, ServletException {
        HttpServletRequest http = (HttpServletRequest) request;
        HttpServletResponse reply = (HttpServletResponse) response;
        int status = 500;
        try {
            chain.doFilter(request, response);
            status = reply.getStatus();
        } catch (IOException | ServletException | RuntimeException ex) {
            ex.printStackTrace(System.err);
            throw ex;
        } finally {
            System.err.println(Instant.now() + " ACCESS " + http.getMethod() + " "
                + http.getRequestURI() + " " + status);
        }
    }
}
