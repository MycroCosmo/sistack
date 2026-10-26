package kr.sistack.board.web;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.service.CommonCodeService;

@Controller
public class CommonCodeController {
    private final CommonCodeService service;
    public CommonCodeController(CommonCodeService service) { this.service = service; }
    @InitBinder("paging")
    public void pageFields(WebDataBinder binder) { binder.setAllowedFields("page"); }
    @GetMapping("/code/list.do")
    public String list(@ModelAttribute("paging") Pagination page, Model model) {
        model.addAttribute("codes", service.list(page)); return "code/list";
    }
}
