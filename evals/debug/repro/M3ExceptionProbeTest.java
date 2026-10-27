package kr.sistack.board;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import kr.sistack.board.web.UserSession;
import static org.junit.Assert.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@RunWith(SpringJUnit4ClassRunner.class)
@WebAppConfiguration
@ActiveProfiles("local")
@ContextConfiguration(locations = {"classpath:spring/root-context.xml", "file:src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml"})
public class M3ExceptionProbeTest {
    @Autowired
    private WebApplicationContext context;

    @Test
    public void actualExceptionMatchesRequestedCase() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).build();
        String caseId = System.getProperty("m3.case");
        MockHttpSession session = new MockHttpSession();
        session.setAttribute("loginUser", new UserSession("합성 관리자", "ADMIN"));
        session.setAttribute("csrf", "synthetic-only");
        Throwable failure = null;
        try {
            MvcResult result = mvc.perform("04-session-bypass".equals(caseId)
                ? get("/board/list.do") : get("/board/list.do").session(session)).andReturn();
            failure = result.getResolvedException();
        } catch (Exception ex) {
            failure = ex;
        }
        assertNotNull("Expected a failure from patched application", failure);
        String expected = "08-thymeleaf-utilities".equals(caseId)
            ? "org.thymeleaf.exceptions.TemplateProcessingException"
            : "01-binding".equals(caseId)
                ? "org.apache.ibatis.binding.BindingException"
                : "04-session-bypass".equals(caseId)
                    ? "java.lang.NullPointerException" : "org.h2.jdbc.JdbcSQLSyntaxErrorException";
        boolean found = false;
        while (failure != null) {
            System.out.println("M3 exception: " + failure.getClass().getName());
            if (expected.equals(failure.getClass().getName())) {
                found = true;
            }
            failure = failure.getCause();
        }
        assertTrue("Expected cause type " + expected, found);
    }
}
