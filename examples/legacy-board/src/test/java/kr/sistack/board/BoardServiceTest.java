package kr.sistack.board;

import org.junit.Test;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;
import kr.sistack.board.domain.Board;
import kr.sistack.board.mapper.BoardMapper;
import kr.sistack.board.service.BoardService;
import kr.sistack.board.service.NotFoundException;

public class BoardServiceTest {
    @Test
    public void readsExistingBoardAndRejectsMissingBoard() {
        BoardMapper mapper = mock(BoardMapper.class);
        Board existing = new Board(); existing.setId(42); existing.setTitle("합성 게시글");
        when(mapper.selectOne(42)).thenReturn(existing);
        BoardService service = new BoardService(mapper);
        assertEquals("합성 게시글", service.get(42).getTitle());
        assertThrows(NotFoundException.class, () -> service.get(99));
    }
}
