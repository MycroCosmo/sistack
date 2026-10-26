package kr.sistack.board.service;

import java.util.List;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.CommonCode;

public interface CommonCodeService {
    List<CommonCode> list(Pagination page);
}
