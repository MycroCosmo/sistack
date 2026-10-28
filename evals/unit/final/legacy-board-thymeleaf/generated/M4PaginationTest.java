package kr.sistack.board;

import org.junit.Test;
import static org.junit.Assert.*;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.BoardSearch;

public class M4PaginationTest {
    @Test public void 마지막_페이지의_나머지_한건도_포함한다() {
        Pagination p = new Pagination();
        int[] totals = {0, 1, 9, 10, 11, 20, 21}; int[] pages = {1, 1, 1, 1, 2, 2, 3};
        assertEquals("전체 건수와 기대 페이지의 검증 표본 수는 같아야 한다", totals.length, pages.length);
        for (int i = 0; i < totals.length; i++) { p.setTotal(totals[i]); assertEquals("게시글 전체 " + totals[i] + "건의 마지막 페이지가 맞아야 한다", pages[i], p.getLastPage()); }
        p.setPage(2); assertEquals("두 번째 페이지는 앞의 열 건을 건너뛰어야 한다", 10, p.getOffset()); assertEquals("두 번째 페이지의 마지막 행은 스무 번째여야 한다", 20, p.getEndRow());
    }

    @Test public void 허용되지_않는_페이지와_검색조건은_거부한다() {
        BoardSearch s = new BoardSearch();
        assertThrows("영 페이지는 조회 페이지로 허용하지 않아야 한다", IllegalArgumentException.class, () -> s.setPage(0));
        assertThrows("최대 페이지를 넘는 조회는 거부해야 한다", IllegalArgumentException.class, () -> s.setPage(100001));
        assertThrows("허용되지 않은 게시글 정렬 조건은 거부해야 한다", IllegalArgumentException.class, () -> s.setSort("invalid"));
        assertThrows("허용되지 않은 게시글 검색 조건은 거부해야 한다", IllegalArgumentException.class, () -> s.setSearchType("invalid"));
        assertThrows("검색어의 누락 값은 입력 오류로 처리해야 한다", IllegalArgumentException.class, () -> s.setKeyword(null));
    }

    @Test public void 조회_종료일의_하루전체를_포함한다() {
        BoardSearch s = new BoardSearch(); assertNull("시작일을 입력하지 않으면 조회 하한은 없어야 한다", s.getFromDate()); assertNull("종료일을 입력하지 않으면 조회 상한은 없어야 한다", s.getUntilDate());
        s.setStartDate("2024-02-29"); s.setEndDate("2024-02-29");
        assertEquals("윤년의 조회 시작일은 입력한 날짜여야 한다", "2024-02-29", s.getFromDate().toString()); assertEquals("종료일 하루 전체를 포함하도록 다음 날을 상한으로 써야 한다", "2024-03-01", s.getUntilDate().toString());
    }
}
