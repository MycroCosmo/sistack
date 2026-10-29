package kr.sistack.facility.web;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;
import javax.servlet.http.*;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import kr.sistack.facility.domain.*;
import kr.sistack.facility.service.ReservationService;

@Controller
public class ReservationController {
    private final ReservationService service;
    public ReservationController(ReservationService service) { this.service=service; }
    private Account account(HttpSession session) { return (Account)session.getAttribute("account"); }
    @ModelAttribute public void common(Model model,HttpSession session) {
        model.addAttribute("account",account(session));
        model.addAttribute("labels",Map.of("REQUESTED","접수","APPROVED","승인","REJECTED","반려","CANCELLED","취소"));
        if(account(session)!=null) model.addAttribute("rooms",service.facilities().stream().collect(Collectors.toMap(Facility::getId,Facility::getName)));
    }
    @GetMapping("/login") public String login() { return "login"; }
    @PostMapping("/login") public String enter(@RequestParam String user,HttpServletRequest request) {
        String role=Map.of("applicant","APPLICANT","neighbor","APPLICANT","reviewer","REVIEWER","admin","ADMIN").get(user);
        if(role==null) throw new IllegalArgumentException("실습 계정을 선택하세요.");
        request.changeSessionId(); request.getSession().setAttribute("account",new Account(user,role)); return "redirect:/dashboard";
    }
    @PostMapping("/logout") public String logout(HttpSession session) { session.invalidate(); return "redirect:/login"; }
    @GetMapping({"/","/dashboard"}) public String dashboard(HttpSession session,Model model) {
        model.addAttribute("total",service.count(account(session),"",""));
        model.addAttribute("pending",service.count(account(session),"REQUESTED",""));
        model.addAttribute("approved",service.count(account(session),"APPROVED",""));
        model.addAttribute("rows",service.search(account(session),"","",1)); return "dashboard";
    }
    @GetMapping("/facilities") public String facilities(Model model) { model.addAttribute("facilities",service.facilities()); return "facilities"; }
    @PostMapping("/facilities/{id}") public String availability(@PathVariable long id,@RequestParam boolean enabled,HttpSession session) {
        service.availability(account(session),id,enabled); return "redirect:/facilities";
    }
    @GetMapping("/requests") public String list(@RequestParam(defaultValue="") String status,@RequestParam(defaultValue="") String keyword,@RequestParam(defaultValue="1") int page,HttpSession session,Model model) {
        model.addAttribute("rows",service.search(account(session),status,keyword,page)); model.addAttribute("total",service.count(account(session),status,keyword));
        model.addAttribute("status",status); model.addAttribute("keyword",keyword); model.addAttribute("page",page); return "requests";
    }
    @GetMapping("/requests/new") public String form(Model model) {
        model.addAttribute("facilities",service.facilities()); model.addAttribute("tomorrow",LocalDate.now().plusDays(1)); model.addAttribute("lastDate",LocalDate.now().plusDays(90)); return "apply";
    }
    @PostMapping("/requests") public String apply(@RequestParam long facilityId,@RequestParam String useDate,@RequestParam String startTime,@RequestParam String endTime,@RequestParam int people,@RequestParam String purpose,HttpSession session) {
        Reservation form=new Reservation(); form.setFacilityId(facilityId); form.setUseDate(useDate); form.setStartTime(startTime); form.setEndTime(endTime); form.setPeople(people); form.setPurpose(purpose);
        long id=service.apply(form,account(session)); return "redirect:/requests/"+id;
    }
    @GetMapping("/requests/{id}") public String detail(@PathVariable long id,HttpSession session,Model model) {
        model.addAttribute("item",service.find(account(session),id)); model.addAttribute("events",service.history(account(session),id)); return "detail";
    }
    @PostMapping("/requests/{id}") public String decide(@PathVariable long id,@RequestParam String action,@RequestParam(defaultValue="") String reason,HttpSession session) {
        service.decide(account(session),id,action,reason); return "redirect:/requests/"+id;
    }
}
