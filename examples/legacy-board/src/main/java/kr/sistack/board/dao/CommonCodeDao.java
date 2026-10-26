package kr.sistack.board.dao;

import java.util.List;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.stereotype.Repository;
import kr.sistack.board.domain.CommonCode;

@Repository("commonCodeDao")
public class CommonCodeDao {
    @Autowired
    private SqlSessionTemplate session;

    public List<CommonCode> selectList(HashMap<String, Object> params) {
        return session.selectList("commonCode.selectList", params);
    }

    public int count() {
        return session.selectOne("commonCode.count");
    }
}
