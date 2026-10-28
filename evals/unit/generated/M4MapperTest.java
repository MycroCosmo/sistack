package kr.sistack.board;

import java.util.*;
import java.sql.Connection;
import org.junit.Before;
import org.junit.After;
import org.junit.Test;
import static org.junit.Assert.*;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.core.JdbcTemplate;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.apache.ibatis.session.SqlSession;
import org.apache.ibatis.session.SqlSessionFactory;
import kr.sistack.board.domain.*;
import kr.sistack.board.mapper.*;

public class M4MapperTest {
    private JdbcDataSource data;
    private SqlSession session;
    private BoardMapper board;

    @Before public void 준비() throws Exception {
        data = new JdbcDataSource(); data.setURL("jdbc:h2:mem:" + UUID.randomUUID() + ";MODE=Oracle;DB_CLOSE_DELAY=-1"); data.setUser("sa");
        ResourceDatabasePopulator seed = new ResourceDatabasePopulator(new ClassPathResource("db/schema.sql"), new ClassPathResource("db/data.sql"));
        seed.setSqlScriptEncoding("UTF-8"); seed.execute(data);
        SqlSessionFactoryBean bean = new SqlSessionFactoryBean(); bean.setDataSource(data);
        bean.setMapperLocations(new PathMatchingResourcePatternResolver().getResources("classpath*:mapper/*.xml"));
        SqlSessionFactory factory = bean.getObject(); factory.getConfiguration().addMapper(MenuMapper.class);
        session = factory.openSession(true); board = session.getMapper(BoardMapper.class);
    }

    @After public void 종료() throws Exception {
        if (session != null) session.close();
        if (data != null) try (Connection c = data.getConnection()) { c.createStatement().execute("SHUTDOWN"); }
    }

    @Test public void 권한별_메뉴의_이름과_주소를_조회한다() {
        MenuMapper mapper = session.getMapper(MenuMapper.class);
        List<Menu> reader = mapper.selectList("READER"), admin = mapper.selectList("ADMIN");
        assertEquals(1, reader.size()); assertEquals("게시판", reader.get(0).getLabel()); assertEquals("/board/list.do", reader.get(0).getUrl());
        assertEquals(2, admin.size()); assertEquals("공통코드", admin.get(1).getLabel()); assertEquals("/code/list.do", admin.get(1).getUrl());
        assertTrue(mapper.selectList("UNKNOWN").isEmpty());
    }

    @Test public void 게시글_목록의_작성일과_본문을_정확히_매핑한다() {
        List<Board> rows = board.selectList(new BoardSearch()); assertEquals(1, rows.size());
        Board result = rows.get(0); assertEquals("게시판 안내", result.getTitle());
        assertEquals("로컬 테스트용 합성 데이터입니다.", result.getContent()); assertEquals("테스트관리자", result.getAuthor());
        assertEquals("NOTICE", result.getCategory()); assertTrue(result.getId() > 0);
        assertNotNull("목록에 작성일이 있어야 한다", result.getCreatedAt());
        assertEquals(board.selectOne(result.getId()).getCreatedAt(), result.getCreatedAt());
    }

    @Test public void 작성일과_제목순으로_게시글을_정렬한다() {
        JdbcTemplate jdbc = new JdbcTemplate(data);
        jdbc.update("DELETE FROM BOARD");
        jdbc.update("INSERT INTO BOARD VALUES (101, '가나다', '본문', '담당자', 'FREE', TIMESTAMP '2026-01-02 00:00:00')");
        jdbc.update("INSERT INTO BOARD VALUES (102, '하하하', '본문', '담당자', 'FREE', TIMESTAMP '2026-01-01 00:00:00')");
        BoardSearch s = new BoardSearch();
        assertEquals(101L, board.selectList(s).get(0).getId());
        s.setSort("title"); assertEquals(102L, board.selectList(s).get(0).getId());
        s.setKeyword("가나다"); assertEquals(1, board.count(s)); assertEquals(101L, board.selectList(s).get(0).getId());
    }

    @Test public void 게시글_등록수정삭제가_저장상태에_반영된다() {
        Board b = new Board(); b.setTitle("등록"); b.setContent("본문"); b.setCategory("FREE"); b.setAuthor("담당자");
        board.insert(b); assertTrue(b.getId() > 0); assertEquals("등록", board.selectOne(b.getId()).getTitle());
        b.setTitle("수정"); assertEquals(1, board.update(b)); assertEquals("수정", board.selectOne(b.getId()).getTitle());
        assertEquals(1, board.delete(b.getId())); assertNull(board.selectOne(b.getId())); assertEquals(0, board.delete(b.getId()));
    }
}
