package kr.sistack.board.service;

import java.util.List;
import kr.sistack.board.domain.Board;
import kr.sistack.board.domain.BoardSearch;

public interface BoardService {
    List<Board> list(BoardSearch search);

    Board get(long id);

    long create(Board board, String author);

    void update(long id, Board board);

    void delete(long id);
}
