package kr.sistack.board;

import org.junit.Test;
import static org.junit.Assert.*;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.BoardSearch;

public class M4PaginationTest {
    @Test public void 마지막_페이지의_나머지_한건도_포함한다() {
        Pagination p = new Pagination();
        int[] totals = {0, 1, 9, 10, 11, 20, 21}; int[] pages = {1, 1, 1, 1, 2, 2, 3};
        for (int i = 0; i < totals.length; i++) { p.setTotal(totals[i]); assertEquals("전체 " + totals[i] + "건", pages[i], p.getLastPage()); }
        p.setPage(2); assertEquals(10, p.getOffset()); assertEquals(20, p.getEndRow());
    }

    @Test public void 허용되지_않는_페이지와_검색조건은_거부한다() {
        BoardSearch s = new BoardSearch();
        assertThrows(IllegalArgumentException.class, () -> s.setPage(0));
        assertThrows(IllegalArgumentException.class, () -> s.setPage(100001));
        assertThrows(IllegalArgumentException.class, () -> s.setSort("invalid"));
        assertThrows(IllegalArgumentException.class, () -> s.setSearchType("invalid"));
        assertThrows(IllegalArgumentException.class, () -> s.setKeyword(null));
    }

    @Test public void 조회_종료일의_하루전체를_포함한다() {
        BoardSearch s = new BoardSearch(); assertNull(s.getFromDate()); assertNull(s.getUntilDate());
        s.setStartDate("2024-02-29"); s.setEndDate("2024-02-29");
        assertEquals("2024-02-29", s.getFromDate().toString()); assertEquals("2024-03-01", s.getUntilDate().toString());
    }
}
