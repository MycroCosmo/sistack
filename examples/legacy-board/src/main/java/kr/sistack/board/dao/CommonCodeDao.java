package kr.sistack.board.dao;

import java.util.List;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.CommonCode;

@Repository
public class CommonCodeDao {
    private final SqlSessionTemplate session;
    public CommonCodeDao(SqlSessionTemplate session) { this.session = session; }
    public List<CommonCode> selectList(Pagination page) { return session.selectList("commonCode.selectList", page); }
    public int count() { return session.selectOne("commonCode.count"); }
}
