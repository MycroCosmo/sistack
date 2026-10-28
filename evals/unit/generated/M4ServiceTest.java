package kr.sistack.board;

import java.util.*;
import org.junit.Before;
import org.junit.Test;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import org.springframework.test.util.ReflectionTestUtils;
import kr.sistack.board.domain.*;
import kr.sistack.board.mapper.BoardMapper;
import kr.sistack.board.dao.CommonCodeDao;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.service.NotFoundException;
import kr.sistack.board.service.impl.*;

public class M4ServiceTest {
    private BoardMapper mapper;
    private BoardServiceImpl service;
    private Map<Long, Board> stored;

    @Before public void 준비() {
        mapper = mock(BoardMapper.class);
        service = new BoardServiceImpl();
        stored = new HashMap<Long, Board>();
        ReflectionTestUtils.setField(service, "mapper", mapper);
    }

    private Board 글() {
        Board b = new Board(); b.setTitle("업무 공지"); b.setContent("일정 안내"); b.setCategory("NOTICE"); return b;
    }

    @Test public void 게시글_목록과_전체건수를_전달한다() {
        List<Board> expected = Arrays.asList(글());
        when(mapper.count(any(BoardSearch.class))).thenReturn(11);
        when(mapper.selectList(any(BoardSearch.class))).thenReturn(expected);
        BoardSearch search = new BoardSearch();
        assertEquals(expected, service.list(search));
        assertEquals(11, search.getTotal());
        assertEquals(2, search.getLastPage());
    }

    @Test public void 검색결과가_없으면_빈목록과_영건을_전달한다() {
        when(mapper.selectList(any(BoardSearch.class))).thenReturn(Collections.<Board>emptyList());
        BoardSearch search = new BoardSearch(); search.setTotal(99);
        assertTrue(service.list(search).isEmpty()); assertEquals(0, search.getTotal());
    }

    @Test public void 잘못된_조회기간은_거부한다() {
        BoardSearch search = new BoardSearch(); search.setStartDate("2026-10-29"); search.setEndDate("2026-10-27");
        assertThrows(IllegalArgumentException.class, () -> service.list(search));
        verifyNoInteractions(mapper);
    }

    @Test public void 게시글_조회시_저장된_내용을_전달한다() {
        Board expected = 글(); expected.setId(41);
        when(mapper.selectOne(41)).thenReturn(expected);
        assertSame(expected, service.get(41)); assertEquals("일정 안내", service.get(41).getContent());
        assertThrows(NotFoundException.class, () -> service.get(99));
    }

    @Test public void 게시글_등록시_작성자와_생성번호를_반영한다() {
        doAnswer(call -> { Board b = call.getArgument(0); b.setId(42); stored.put(42L, b); return null; }).when(mapper).insert(any(Board.class));
        long id = service.create(글(), "업무담당자");
        assertEquals(42L, id); assertEquals(1, stored.size());
        assertEquals("업무담당자", stored.get(id).getAuthor()); assertEquals("업무 공지", stored.get(id).getTitle());
    }

    @Test public void 필수입력이_없거나_길이를_넘으면_등록을_거부한다() {
        Board b = 글(); b.setTitle(null);
        assertThrows(IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setTitle("   "); assertThrows(IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setTitle(String.join("", Collections.nCopies(201, "가"))); assertThrows(IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setTitle("제목"); b.setContent(""); assertThrows(IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setContent("본문"); b.setCategory("UNKNOWN"); assertThrows(IllegalArgumentException.class, () -> service.create(b, "담당자"));
        verifyNoInteractions(mapper);
    }

    @Test public void 게시글_수정은_요청한_번호의_내용을_저장한다() {
        stored.put(7L, 글());
        when(mapper.update(any(Board.class))).thenAnswer(call -> { Board b = call.getArgument(0); return stored.replace(b.getId(), b) == null ? 0 : 1; });
        Board changed = 글(); changed.setId(999); changed.setTitle("변경 공지");
        service.update(7, changed);
        assertEquals(1, stored.size()); assertEquals("변경 공지", stored.get(7L).getTitle()); assertEquals(7L, stored.get(7L).getId());
        assertThrows(NotFoundException.class, () -> service.update(99, 글()));
    }

    @Test public void 게시글_삭제후_대상이_없으면_실패한다() {
        stored.put(7L, 글());
        when(mapper.delete(anyLong())).thenAnswer(call -> stored.remove((Long) call.getArgument(0)) == null ? 0 : 1);
        service.delete(7); assertTrue(stored.isEmpty());
        assertThrows(NotFoundException.class, () -> service.delete(7));
    }

    @Test public void 공통코드_목록은_페이지범위와_전체건수를_반영한다() {
        CommonCodeDao dao = mock(CommonCodeDao.class); CommonCodeServiceImpl codes = new CommonCodeServiceImpl();
        ReflectionTestUtils.setField(codes, "dao", dao);
        CommonCode c = new CommonCode(); c.setCode("FREE"); c.setLabel("자유");
        when(dao.count()).thenReturn(11);
        when(dao.selectList(any())).thenAnswer(call -> {
            Map<String, Object> p = call.getArgument(0);
            return Integer.valueOf(10).equals(p.get("offset")) && Integer.valueOf(20).equals(p.get("endRow")) ? Arrays.asList(c) : Collections.emptyList();
        });
        Pagination page = new Pagination(); page.setPage(2);
        assertEquals("자유", codes.list(page).get(0).getLabel()); assertEquals(11, page.getTotal());
    }
}
