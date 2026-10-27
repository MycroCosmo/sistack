package kr.sistack.board.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Param;
import kr.sistack.board.domain.Menu;

public interface MenuMapper {
    @Select("SELECT LABEL, URL FROM APP_MENU WHERE ROLE_KEY = #{role} ORDER BY MENU_ORDER")
    List<Menu> selectList(@Param("role") String role);
}
