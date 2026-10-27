package kr.sistack.board.mapper;

import java.util.List;
import kr.sistack.board.domain.Board;
import kr.sistack.board.domain.BoardSearch;

public interface BoardMapper {
    List<Board> selectList(BoardSearch search);

    int count(BoardSearch search);

    Board selectOne(long id);

    void insert(Board board);

    int update(Board board);

    int delete(long id);
}
