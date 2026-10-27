package kr.sistack.board.web;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import javax.annotation.Resource;
import kr.sistack.board.domain.CommonCode;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.service.CommonCodeService;

@Controller
public class CommonCodeController {
    @Resource(name = "commonCodeService")
    private CommonCodeService service;

    @InitBinder("paging")
    public void pageFields(WebDataBinder binder) {
        binder.setAllowedFields("page");
    }

    @GetMapping("/code/list.do")
    public String list(@ModelAttribute("paging") Pagination page, Model model) {
        model.addAttribute("codes", service.list(page));
        return "code/list";
    }

    @GetMapping(value = "/code/listJson.do", produces = "application/json")
    @ResponseBody
    public Map<String, Object> listJson(@ModelAttribute("paging") Pagination page) {
        List<CommonCode> codes = service.list(page);
        Map<String, Object> result = new HashMap<String, Object>();
        result.put("codes", codes);
        result.put("page", page.getPage());
        result.put("total", page.getTotal());
        return result;
    }
}
