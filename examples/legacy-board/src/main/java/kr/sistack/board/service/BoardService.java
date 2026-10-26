package kr.sistack.board.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import kr.sistack.board.domain.Board;
import kr.sistack.board.domain.BoardSearch;
import kr.sistack.board.mapper.BoardMapper;

@Service
public class BoardService {
    private final BoardMapper mapper;
    public BoardService(BoardMapper mapper) { this.mapper = mapper; }
    public List<Board> list(BoardSearch search) {
        if (search.getFromDate() != null && search.getUntilDate() != null && !search.getFromDate().before(search.getUntilDate()))
            throw new IllegalArgumentException("시작일과 종료일을 확인하세요");
        search.setTotal(mapper.count(search));
        return mapper.selectList(search);
    }
    public Board get(long id) {
        Board board = mapper.selectOne(id);
        if (board == null) throw new NotFoundException();
        return board;
    }
    @Transactional
    public long create(Board board, String author) {
        validate(board);
        board.setAuthor(author);
        mapper.insert(board);
        return board.getId();
    }
    @Transactional
    public void update(long id, Board board) {
        validate(board);
        board.setId(id);
        if (mapper.update(board) != 1) throw new NotFoundException();
    }
    @Transactional
    public void delete(long id) { if (mapper.delete(id) != 1) throw new NotFoundException(); }
    private void validate(Board board) {
        if (board.getTitle() == null || board.getTitle().trim().isEmpty() || board.getTitle().length() > 200
            || board.getContent() == null || board.getContent().trim().isEmpty() || board.getContent().length() > 4000
            || (!"NOTICE".equals(board.getCategory()) && !"FREE".equals(board.getCategory())))
            throw new IllegalArgumentException("제목, 내용, 분류를 확인하세요");
    }
}
