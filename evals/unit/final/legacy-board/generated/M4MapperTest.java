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
        assertNotNull("조회 권한의 메뉴 목록이 있어야 한다", reader);
        assertEquals("조회 권한의 메뉴는 한 건이어야 한다", 1, reader.size());
        assertEquals("조회 권한의 메뉴 이름은 게시판이어야 한다", "게시판", reader.get(0).getLabel());
        assertEquals("조회 권한의 게시판 메뉴 주소가 맞아야 한다", "/board/list.do", reader.get(0).getUrl());
        assertNotNull("관리자 권한의 메뉴 목록이 있어야 한다", admin);
        assertEquals("관리자 메뉴는 두 건이어야 한다", 2, admin.size());
        assertEquals("관리자의 두 번째 메뉴는 공통코드여야 한다", "공통코드", admin.get(1).getLabel());
        assertEquals("관리자의 공통코드 메뉴 주소가 맞아야 한다", "/code/list.do", admin.get(1).getUrl());
        List<Menu> unknown = mapper.selectList("UNKNOWN");
        assertNotNull("등록되지 않은 권한도 빈 메뉴 목록을 반환해야 한다", unknown);
        assertEquals("등록되지 않은 권한에는 메뉴가 없어야 한다", 0, unknown.size());
    }

    @Test public void 게시글_목록의_작성일과_상세본문을_정확히_매핑한다() {
        List<Board> rows = board.selectList(new BoardSearch());
        assertNotNull("게시글 목록 조회 결과가 있어야 한다", rows);
        assertEquals("게시글 목록에는 안내 게시글 한 건이 있어야 한다", 1, rows.size());
        Board result = rows.get(0);
        assertEquals("목록의 게시글 제목은 저장한 제목이어야 한다", "게시판 안내", result.getTitle());
        assertEquals("목록의 게시글 작성자는 저장한 작성자여야 한다", "테스트관리자", result.getAuthor());
        assertEquals("목록의 게시글 분류는 공지여야 한다", "NOTICE", result.getCategory());
        assertTrue("목록의 게시글 번호는 발급된 양수여야 한다", result.getId() > 0);
        assertNotNull("게시글 목록에는 작성일이 있어야 한다", result.getCreatedAt());
        Board detail = board.selectOne(result.getId());
        assertNotNull("목록의 게시글 번호로 상세 내용을 조회할 수 있어야 한다", detail);
        assertEquals("게시글 상세 본문은 저장한 본문이어야 한다", "로컬 테스트용 합성 데이터입니다.", detail.getContent());
        assertEquals("목록과 상세의 게시글 작성일은 같아야 한다", detail.getCreatedAt(), result.getCreatedAt());
    }

    @Test public void 작성일과_제목순으로_게시글을_정렬한다() {
        JdbcTemplate jdbc = new JdbcTemplate(data);
        jdbc.update("DELETE FROM BOARD");
        jdbc.update("INSERT INTO BOARD VALUES (101, '가나다', '본문', '담당자', 'FREE', TIMESTAMP '2026-01-02 00:00:00')");
        jdbc.update("INSERT INTO BOARD VALUES (102, '하하하', '본문', '담당자', 'FREE', TIMESTAMP '2026-01-01 00:00:00')");
        BoardSearch s = new BoardSearch();
        List<Board> dateOrder = board.selectList(s);
        assertNotNull("작성일순 게시글 조회 결과가 있어야 한다", dateOrder);
        assertEquals("작성일순 조회에는 게시글 두 건이 있어야 한다", 2, dateOrder.size());
        assertEquals("작성일순 조회는 나중에 작성한 게시글이 먼저여야 한다", 101L, dateOrder.get(0).getId());
        s.setSort("title"); List<Board> titleOrder = board.selectList(s);
        assertNotNull("제목순 게시글 조회 결과가 있어야 한다", titleOrder);
        assertEquals("제목순 조회에는 게시글 두 건이 있어야 한다", 2, titleOrder.size());
        assertEquals("제목순 조회는 제목 내림차순의 첫 게시글을 반환해야 한다", 102L, titleOrder.get(0).getId());
        s.setKeyword("가나다");
        assertEquals("제목 검색의 전체 건수는 한 건이어야 한다", 1, board.count(s));
        List<Board> searched = board.selectList(s);
        assertNotNull("제목 검색 결과 목록이 있어야 한다", searched);
        assertEquals("검색 결과에는 조건에 맞는 게시글 한 건이 있어야 한다", 1, searched.size());
        assertEquals("검색 결과의 게시글 번호는 조건에 맞는 번호여야 한다", 101L, searched.get(0).getId());
    }

    @Test public void 게시글_등록수정삭제가_저장상태에_반영된다() {
        Board b = new Board(); b.setTitle("등록"); b.setContent("본문"); b.setCategory("FREE"); b.setAuthor("담당자");
        board.insert(b); assertTrue("게시글 등록 시 양수의 번호를 발급해야 한다", b.getId() > 0);
        Board created = board.selectOne(b.getId());
        assertNotNull("등록한 게시글을 번호로 재조회할 수 있어야 한다", created);
        assertEquals("등록 후 재조회한 제목은 입력한 제목이어야 한다", "등록", created.getTitle());
        b.setTitle("수정"); assertEquals("게시글 수정은 한 건에 반영되어야 한다", 1, board.update(b));
        Board updated = board.selectOne(b.getId());
        assertNotNull("수정한 게시글을 번호로 재조회할 수 있어야 한다", updated);
        assertEquals("수정 후 재조회한 제목은 변경한 제목이어야 한다", "수정", updated.getTitle());
        assertEquals("게시글 삭제는 한 건에 반영되어야 한다", 1, board.delete(b.getId()));
        assertNull("삭제한 게시글은 상세 조회에 나오지 않아야 한다", board.selectOne(b.getId()));
        assertEquals("이미 삭제한 게시글을 다시 삭제해도 반영 건수는 영 건이어야 한다", 0, board.delete(b.getId()));
    }
}
