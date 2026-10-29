package kr.sistack.facility.web;

import java.time.LocalDate;
import java.util.Map;
import javax.servlet.http.HttpSession;
import javax.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import kr.sistack.facility.domain.Actor;
import kr.sistack.facility.service.FacilityService;

@Controller
public class FacilityController {
    private final FacilityService service;
    public FacilityController(FacilityService service) { this.service = service; }
    private Actor actor(HttpSession session) { return (Actor) session.getAttribute("actor"); }
    @ModelAttribute
    public void common(Model model, HttpSession session) {
        model.addAttribute("actor", actor(session));
        model.addAttribute("states", Map.of("REQUESTED","접수", "APPROVED","승인", "REJECTED","반려", "CANCELLED","취소"));
    }
    @GetMapping("/auth/login")
    public String login() { return "login"; }
    @PostMapping("/auth/login")
    public String loginSubmit(@RequestParam String account, HttpServletRequest request) {
        String role = Map.of("applicant","APPLICANT", "neighbor","APPLICANT", "reviewer","REVIEWER", "admin","ADMIN").get(account);
        if (role == null) throw new IllegalArgumentException("등록된 실습 계정을 선택하세요.");
        request.changeSessionId();
        request.getSession().setAttribute("actor", new Actor(account, role));
        return "redirect:/dashboard";
    }
    @PostMapping("/auth/logout")
    public String logout(HttpSession session) { session.invalidate(); return "redirect:/auth/login"; }
    @GetMapping({"/", "/dashboard"})
    public String dashboard(HttpSession session, Model model) {
        model.addAttribute("pending", service.count(actor(session),"REQUESTED",""));
        model.addAttribute("approved", service.count(actor(session),"APPROVED",""));
        model.addAttribute("total", service.count(actor(session),"",""));
        model.addAttribute("bookings", service.bookings(actor(session),"","",1));
        return "dashboard";
    }
    @GetMapping("/facilities")
    public String facilities(Model model) { model.addAttribute("facilities", service.facilities()); return "facilities"; }
    @PostMapping("/facilities/{id}/availability")
    public String facility(@PathVariable long id, @RequestParam boolean active, HttpSession session) {
        service.setFacilityActive(actor(session), id, active); return "redirect:/facilities";
    }
    @GetMapping("/bookings")
    public String bookings(@RequestParam(defaultValue="") String status, @RequestParam(defaultValue="") String keyword,
                           @RequestParam(defaultValue="1") int page, HttpSession session, Model model) {
        model.addAttribute("bookings", service.bookings(actor(session),status,keyword,page));
        model.addAttribute("total", service.count(actor(session),status,keyword));
        model.addAttribute("status",status); model.addAttribute("keyword",keyword); model.addAttribute("page",page);
        return "bookings";
    }
    @GetMapping("/bookings/new")
    public String form(Model model) {
        model.addAttribute("facilities", service.facilities());
        model.addAttribute("minDate", LocalDate.now().plusDays(1).toString());
        model.addAttribute("maxDate", LocalDate.now().plusDays(90).toString());
        return "form";
    }
    @PostMapping("/bookings")
    public String submit(@RequestParam long facilityId, @RequestParam String useDate, @RequestParam String startTime,
                         @RequestParam String endTime, @RequestParam int attendees, @RequestParam String purpose, HttpSession session) {
        long id = service.submit(actor(session),facilityId,useDate,startTime,endTime,attendees,purpose);
        return "redirect:/bookings/" + id;
    }
    @GetMapping("/bookings/{id}")
    public String detail(@PathVariable long id, HttpSession session, Model model) {
        model.addAttribute("booking",service.detail(actor(session),id));
        model.addAttribute("history",service.history(actor(session),id));
        return "detail";
    }
    @PostMapping("/bookings/{id}/decision")
    public String decision(@PathVariable long id, @RequestParam String action, @RequestParam(defaultValue="") String reason, HttpSession session) {
        service.changeStatus(actor(session),id,action,reason); return "redirect:/bookings/" + id;
    }
}
