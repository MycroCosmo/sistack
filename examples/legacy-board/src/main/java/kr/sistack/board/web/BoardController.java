package kr.sistack.board.web;

import java.util.Collections;
import java.util.Map;
import javax.annotation.Resource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.WebDataBinder;
import org.springframework.web.bind.annotation.*;
import kr.sistack.board.common.Pagination;
import kr.sistack.board.domain.Board;
import kr.sistack.board.domain.BoardSearch;
import kr.sistack.board.service.BoardService;
import kr.sistack.board.service.CommonCodeService;

@Controller
@RequestMapping("/board")
public class BoardController {
    @Resource(name = "boardService")
    private BoardService service;

    @Autowired
    private CommonCodeService codes;

    @InitBinder("board")
    public void boardFields(WebDataBinder binder) {
        binder.setAllowedFields("title", "content", "category");
    }

    @InitBinder("search")
    public void searchFields(WebDataBinder binder) {
        binder.setAllowedFields("page", "searchType", "keyword", "startDate", "endDate", "sort");
    }

    @GetMapping("/list.do")
    public String list(@ModelAttribute("search") BoardSearch search, @RequestAttribute("currentUser") UserSession user, Model model) {
        model.addAttribute("boards", service.list(search));
        model.addAttribute("viewer", user.getName());
        model.addAttribute("paging", search);
        return "board/list";
    }

    @GetMapping("/detail.do")
    public String detail(@RequestParam("id") long id, Model model) {
        model.addAttribute("board", service.get(id));
        return "board/detail";
    }

    @GetMapping("/form.do")
    public String form(@RequestParam(value = "id", required = false) Long id, Model model) {
        model.addAttribute("board", id == null ? new Board() : service.get(id));
        model.addAttribute("categories", codes.list(new Pagination()));
        return "board/form";
    }

    @PostMapping("/create.do")
    public String create(@ModelAttribute("board") Board board, @RequestAttribute("currentUser") UserSession user) {
        return "redirect:/board/detail.do?id=" + service.create(board, user.getName());
    }

    @PostMapping("/update.do")
    public String update(@RequestParam("id") long id, @ModelAttribute("board") Board board) {
        service.update(id, board);
        return "redirect:/board/detail.do?id=" + id;
    }

    @PostMapping(value = "/delete.do", produces = "application/json")
    @ResponseBody
    public Map<String, Object> delete(@RequestParam("id") long id) {
        service.delete(id);
        return Collections.<String, Object>singletonMap("success", true);
    }
}
