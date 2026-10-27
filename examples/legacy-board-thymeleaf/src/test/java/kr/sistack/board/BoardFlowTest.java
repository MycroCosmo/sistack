package kr.sistack.board;

import java.time.LocalDate;
import java.util.List;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.web.filter.CharacterEncodingFilter;
import kr.sistack.board.domain.Board;
import kr.sistack.board.domain.BoardSearch;
import kr.sistack.board.service.BoardService;
import static org.junit.Assert.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

@RunWith(SpringJUnit4ClassRunner.class)
@WebAppConfiguration
@ActiveProfiles("local")
@ContextConfiguration(locations = {"classpath:spring/root-context.xml", "file:src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml"})
public class BoardFlowTest {
    @Autowired
    private WebApplicationContext context;

    @Autowired
    private BoardService service;

    private MockHttpSession login(MockMvc mvc, String role) throws Exception {
        MvcResult start = mvc.perform(get("/auth/login.do")).andReturn();
        MockHttpSession previous = (MockHttpSession) start.getRequest().getSession();
        MvcResult signedIn = mvc.perform(post("/auth/login.do").session(previous)
            .param("csrf", (String) previous.getAttribute("csrf")).param("role", role)).andReturn();
        assertEquals(302, signedIn.getResponse().getStatus());
        return (MockHttpSession) signedIn.getRequest().getSession();
    }

    @Test
    @SuppressWarnings("unchecked")
    public void boardAndCodeFlowUsesRealXmlMappersAndH2() throws Exception {
        MockMvc mvc = MockMvcBuilders.webAppContextSetup(context).addFilters(new CharacterEncodingFilter("UTF-8", true)).build();
        assertEquals("/auth/login.do", mvc.perform(get("/board/list.do")).andReturn().getResponse().getRedirectedUrl());
        MockHttpSession reader = login(mvc, "READER");
        assertEquals(403, mvc.perform(get("/code/list.do").servletPath("/code/list.do").session(reader)).andReturn().getResponse().getStatus());
        assertEquals(403, mvc.perform(get("/code/listJson.do").session(reader)).andReturn().getResponse().getStatus());
        assertEquals(403, mvc.perform(post("/board/create.do;legacy").session(reader)
            .param("csrf", (String) reader.getAttribute("csrf"))).andReturn().getResponse().getStatus());
        MockHttpSession admin = login(mvc, "ADMIN");
        String csrf = (String) admin.getAttribute("csrf");
        assertEquals(403, mvc.perform(post("/board/create.do").servletPath("/board/create.do").session(admin)).andReturn().getResponse().getStatus());
        MvcResult created = mvc.perform(post("/board/create.do").servletPath("/board/create.do").session(admin)
            .param("csrf", csrf).param("title", "검색 대상").param("content", "한글 본문").param("category", "FREE")).andReturn();
        assertEquals(302, created.getResponse().getStatus());
        long id = Long.parseLong(created.getResponse().getRedirectedUrl().split("=")[1]);
        assertEquals("테스트관리자", service.get(id).getAuthor());
        assertEquals("한글 본문", service.get(id).getContent());

        MvcResult title = mvc.perform(get("/board/list.do").session(admin).param("keyword", "검색 대상")).andReturn();
        assertEquals(200, title.getResponse().getStatus());
        assertEquals(1, ((List<Board>) title.getModelAndView().getModel().get("boards")).size());
        assertEquals("테스트관리자", title.getModelAndView().getModel().get("viewer"));
        BoardSearch search = new BoardSearch();
        search.setSearchType("author");
        search.setKeyword("테스트관리자");
        assertEquals(2, service.list(search).size());
        search.setStartDate(LocalDate.now().toString());
        search.setEndDate(LocalDate.now().toString());
        assertEquals(2, service.list(search).size());
        search.setEndDate("2000-01-01");
        assertThrows(IllegalArgumentException.class, () -> service.list(search));
        assertEquals(400, mvc.perform(get("/board/list.do").session(admin).param("sort", "ID; DROP TABLE BOARD")).andReturn().getResponse().getStatus());
        assertEquals(400, mvc.perform(get("/board/detail.do").session(admin).param("id", "invalid")).andReturn().getResponse().getStatus());

        for (int i = 0; i < 11; i++) {
            Board item = new Board();
            item.setTitle("페이지 " + i);
            item.setContent("본문");
            item.setCategory("FREE");
            service.create(item, "페이징작성자");
        }
        BoardSearch pages = new BoardSearch();
        pages.setKeyword("페이지");
        assertEquals(10, service.list(pages).size());
        assertEquals(11, pages.getTotal());
        pages.setPage(2);
        assertEquals(1, service.list(pages).size());
        MvcResult codes = mvc.perform(get("/code/list.do").servletPath("/code/list.do").session(admin)).andReturn();
        assertEquals(200, codes.getResponse().getStatus());
        assertEquals(2, ((List<?>) codes.getModelAndView().getModel().get("codes")).size());
        ObjectMapper json = new ObjectMapper();
        MvcResult codeJson = mvc.perform(get("/code/listJson.do").session(admin)).andReturn();
        assertEquals(200, codeJson.getResponse().getStatus());
        assertTrue(codeJson.getResponse().getContentType().startsWith("application/json"));
        JsonNode codeResult = json.readTree(codeJson.getResponse().getContentAsByteArray());
        assertEquals(2, codeResult.get("total").asInt());
        assertEquals("FREE", codeResult.get("codes").get(0).get("code").asText());
        assertEquals("자유", codeResult.get("codes").get(0).get("label").asText());
        MvcResult nextCodes = mvc.perform(get("/code/listJson.do").session(admin).param("page", "2")).andReturn();
        assertEquals(0, json.readTree(nextCodes.getResponse().getContentAsByteArray()).get("codes").size());
        assertEquals(400, mvc.perform(get("/code/listJson.do").session(admin).param("page", "0")).andReturn().getResponse().getStatus());
        assertEquals(200, mvc.perform(get("/board/form.do").servletPath("/board/form.do").session(admin)).andReturn().getResponse().getStatus());
        assertEquals(302, mvc.perform(post("/board/update.do").servletPath("/board/update.do").session(admin)
            .param("csrf", csrf).param("id", Long.toString(id)).param("title", "수정 제목").param("content", "수정 내용").param("category", "NOTICE")).andReturn().getResponse().getStatus());
        assertEquals("수정 제목", service.get(id).getTitle());
        assertEquals(403, mvc.perform(post("/board/delete.do").session(reader)
            .param("csrf", (String) reader.getAttribute("csrf")).param("id", Long.toString(id))).andReturn().getResponse().getStatus());
        assertEquals(403, mvc.perform(post("/board/delete.do").session(admin).param("id", Long.toString(id))).andReturn().getResponse().getStatus());
        assertEquals("수정 제목", service.get(id).getTitle());
        MvcResult deleted = mvc.perform(post("/board/delete.do").session(admin)
            .param("csrf", csrf).param("id", Long.toString(id))).andReturn();
        assertEquals(200, deleted.getResponse().getStatus());
        assertTrue(deleted.getResponse().getContentType().startsWith("application/json"));
        assertTrue(json.readTree(deleted.getResponse().getContentAsByteArray()).get("success").asBoolean());
        assertEquals(404, mvc.perform(get("/board/detail.do").session(admin).param("id", Long.toString(id))).andReturn().getResponse().getStatus());
        assertEquals(302, mvc.perform(post("/auth/logout.do").servletPath("/auth/logout.do").session(admin).param("csrf", csrf)).andReturn().getResponse().getStatus());
    }
}
