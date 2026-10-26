package kr.sistack.board.service;

import java.util.List;
import org.springframework.stereotype.Service;
import kr.sistack.board.dao.CommonCodeDao;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.CommonCode;

@Service
public class CommonCodeService {
    private final CommonCodeDao dao;
    public CommonCodeService(CommonCodeDao dao) { this.dao = dao; }
    public List<CommonCode> list(Pagination page) { page.setTotal(dao.count()); return dao.selectList(page); }
}
