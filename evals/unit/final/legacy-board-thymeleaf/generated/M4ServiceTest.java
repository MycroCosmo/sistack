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
        List<Board> actual = service.list(search);
        assertNotNull("게시글 목록 조회 결과가 있어야 한다", actual);
        assertEquals("게시글 목록에 조회 대상 한 건이 있어야 한다", 1, actual.size());
        assertEquals("게시글 목록은 조회된 게시글을 그대로 전달해야 한다", expected, actual);
        assertEquals("검색 조건의 전체 게시글 수는 11건이어야 한다", 11, search.getTotal());
        assertEquals("게시글 11건의 마지막 페이지는 2페이지여야 한다", 2, search.getLastPage());
    }

    @Test public void 검색결과가_없으면_빈목록과_영건을_전달한다() {
        when(mapper.selectList(any(BoardSearch.class))).thenReturn(Collections.<Board>emptyList());
        BoardSearch search = new BoardSearch(); search.setTotal(99);
        List<Board> actual = service.list(search);
        assertNotNull("검색 결과가 없어도 빈 목록을 전달해야 한다", actual);
        assertEquals("검색 결과가 없으면 게시글 목록은 영 건이어야 한다", 0, actual.size());
        assertEquals("검색 결과가 없으면 전체 건수도 영 건이어야 한다", 0, search.getTotal());
    }

    @Test public void 잘못된_조회기간은_거부한다() {
        BoardSearch search = new BoardSearch(); search.setStartDate("2026-10-29"); search.setEndDate("2026-10-27");
        assertThrows("종료일보다 늦은 시작일은 조회를 거부해야 한다", IllegalArgumentException.class, () -> service.list(search));
        verifyNoInteractions(mapper);
    }

    @Test public void 게시글_조회시_저장된_내용을_전달한다() {
        Board expected = 글(); expected.setId(41);
        when(mapper.selectOne(41)).thenReturn(expected);
        Board actual = service.get(41);
        assertNotNull("존재하는 게시글의 상세 조회 결과가 있어야 한다", actual);
        assertSame("게시글 상세 조회는 저장된 게시글을 전달해야 한다", expected, actual);
        assertEquals("게시글 상세 본문은 저장된 내용과 같아야 한다", "일정 안내", actual.getContent());
        assertThrows("없는 게시글을 조회하면 대상 없음으로 처리해야 한다", NotFoundException.class, () -> service.get(99));
    }

    @Test public void 게시글_등록시_작성자와_생성번호를_반영한다() {
        doAnswer(call -> { Board b = call.getArgument(0); b.setId(42); stored.put(42L, b); return null; }).when(mapper).insert(any(Board.class));
        long id = service.create(글(), "업무담당자");
        assertEquals("게시글 등록은 발급된 게시글 번호를 반환해야 한다", 42L, id);
        assertEquals("게시글 등록 후 저장된 게시글은 한 건이어야 한다", 1, stored.size());
        assertTrue("저장 목록에 발급된 게시글 번호가 있어야 한다", stored.containsKey(id));
        Board actual = stored.get(id);
        assertNotNull("발급된 번호로 등록한 게시글을 찾을 수 있어야 한다", actual);
        assertEquals("등록 게시글의 작성자는 요청한 담당자여야 한다", "업무담당자", actual.getAuthor());
        assertEquals("등록 게시글의 제목은 입력한 제목이어야 한다", "업무 공지", actual.getTitle());
    }

    @Test public void 필수입력이_없거나_길이를_넘으면_등록을_거부한다() {
        Board b = 글(); b.setTitle(null);
        assertThrows("제목이 없으면 게시글 등록을 거부해야 한다", IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setTitle("   "); assertThrows("제목이 공백이면 게시글 등록을 거부해야 한다", IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setTitle(String.join("", Collections.nCopies(201, "가"))); assertThrows("제목이 허용 길이를 넘으면 등록을 거부해야 한다", IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setTitle("제목"); b.setContent(""); assertThrows("본문이 비어 있으면 게시글 등록을 거부해야 한다", IllegalArgumentException.class, () -> service.create(b, "담당자"));
        b.setContent("본문"); b.setCategory("UNKNOWN"); assertThrows("허용되지 않은 분류로 게시글을 등록할 수 없어야 한다", IllegalArgumentException.class, () -> service.create(b, "담당자"));
        verifyNoInteractions(mapper);
    }

    @Test public void 게시글_수정은_요청한_번호의_내용을_저장한다() {
        stored.put(7L, 글());
        when(mapper.update(any(Board.class))).thenAnswer(call -> { Board b = call.getArgument(0); return stored.replace(b.getId(), b) == null ? 0 : 1; });
        Board changed = 글(); changed.setId(999); changed.setTitle("변경 공지");
        service.update(7, changed);
        assertEquals("게시글 수정 후 저장 건수는 한 건이어야 한다", 1, stored.size());
        assertTrue("요청한 번호의 게시글이 저장 목록에 있어야 한다", stored.containsKey(7L));
        Board actual = stored.get(7L);
        assertNotNull("수정한 게시글을 요청한 번호로 찾을 수 있어야 한다", actual);
        assertEquals("수정한 게시글에 변경 제목이 저장되어야 한다", "변경 공지", actual.getTitle());
        assertEquals("수정 대상 번호는 요청한 게시글 번호여야 한다", 7L, actual.getId());
        assertThrows("없는 게시글의 수정은 대상 없음으로 처리해야 한다", NotFoundException.class, () -> service.update(99, 글()));
    }

    @Test public void 게시글_삭제후_대상이_없으면_실패한다() {
        stored.put(7L, 글());
        when(mapper.delete(anyLong())).thenAnswer(call -> stored.remove((Long) call.getArgument(0)) == null ? 0 : 1);
        service.delete(7); assertEquals("게시글 삭제 후 저장 목록은 비어 있어야 한다", 0, stored.size());
        assertThrows("이미 삭제된 게시글을 다시 삭제하면 대상 없음으로 처리해야 한다", NotFoundException.class, () -> service.delete(7));
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
        List<CommonCode> actual = codes.list(page);
        assertNotNull("공통코드 목록 조회 결과가 있어야 한다", actual);
        assertEquals("요청한 페이지에는 공통코드 한 건이 있어야 한다", 1, actual.size());
        assertEquals("공통코드 목록의 명칭은 조회한 값과 같아야 한다", "자유", actual.get(0).getLabel());
        assertEquals("공통코드의 전체 건수는 11건이어야 한다", 11, page.getTotal());
    }
}
