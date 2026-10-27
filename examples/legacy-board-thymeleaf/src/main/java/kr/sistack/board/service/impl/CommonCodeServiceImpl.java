package kr.sistack.board.service.impl;

import java.util.HashMap;
import java.util.List;
import javax.annotation.Resource;
import org.springframework.stereotype.Service;
import kr.sistack.board.dao.CommonCodeDao;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.CommonCode;
import kr.sistack.board.service.CommonCodeService;

@Service("commonCodeService")
public class CommonCodeServiceImpl implements CommonCodeService {
    @Resource(name = "commonCodeDao")
    private CommonCodeDao dao;

    @Override
    public List<CommonCode> list(Pagination page) {
        page.setTotal(dao.count());
        HashMap<String, Object> params = new HashMap<String, Object>();
        params.put("offset", page.getOffset());
        params.put("endRow", page.getEndRow());
        return dao.selectList(params);
    }
}
