package kr.sistack.facility;

import java.time.LocalDate;
import java.util.List;
import java.util.concurrent.*;
import org.junit.Test;
import org.junit.Before;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.*;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.web.WebAppConfiguration;
import org.springframework.web.context.WebApplicationContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.web.server.ResponseStatusException;
import kr.sistack.facility.domain.*;
import kr.sistack.facility.service.FacilityService;
import static org.junit.Assert.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(locations={"classpath:spring/root-context.xml", "file:src/main/webapp/WEB-INF/spring/dispatcher-servlet.xml"})
@ActiveProfiles("local")
@WebAppConfiguration("src/main/webapp")
@Transactional
public class FacilityFlowTest {
    @Autowired private FacilityService service;
    @Autowired private WebApplicationContext context;
    private final Actor applicant = new Actor("applicant","APPLICANT");
    private final Actor neighbor = new Actor("neighbor","APPLICANT");
    private final Actor reviewer = new Actor("reviewer","REVIEWER");
    private final Actor admin = new Actor("admin","ADMIN");
    private MockMvc mvc;
    @Before public void setup() { mvc = MockMvcBuilders.webAppContextSetup(context).build(); }
    private String date(int days) { return LocalDate.now().plusDays(days).toString(); }
    private long submit() { return service.submit(applicant,1,date(10),"10:00","12:00",10,"지역주민 워크숍"); }
    private MockHttpSession session(Actor actor) {
        MockHttpSession session = new MockHttpSession(); session.setAttribute("actor",actor); session.setAttribute("csrf","test-csrf"); return session;
    }
    @Test public void requestApprovalAndAuditAreSavedTogether() {
        long id=submit();
        assertEquals("REQUESTED", service.detail(applicant,id).getStatus());
        service.changeStatus(reviewer,id,"approve","일정 확인");
        assertEquals("APPROVED", service.detail(applicant,id).getStatus());
        List<History> history=service.history(applicant,id);
        assertEquals(2,history.size()); assertEquals("REQUESTED",history.get(0).getToStatus());
        assertEquals("APPROVED",history.get(1).getToStatus()); assertEquals("reviewer",history.get(1).getActor());
    }
    @Test public void otherApplicantCannotReadOrDecide() {
        long id=submit();
        assertThrows(ResponseStatusException.class,()->service.detail(neighbor,id));
        assertThrows(ResponseStatusException.class,()->service.history(neighbor,id));
        assertThrows(ResponseStatusException.class,()->service.changeStatus(applicant,id,"approve",""));
        assertEquals(0, service.count(neighbor,"","지역주민 워크숍"));
        assertEquals("REQUESTED",service.detail(applicant,id).getStatus());
    }
    @Test public void overlapIsRejectedAndAdjacentSlotIsAllowed() {
        submit();
        assertThrows(IllegalArgumentException.class,()->service.submit(neighbor,1,date(10),"11:00","13:00",5,"중복 신청"));
        long adjacent=service.submit(neighbor,1,date(10),"12:00","13:00",5,"연속 시간 신청");
        assertEquals("REQUESTED",service.detail(neighbor,adjacent).getStatus());
    }
    @Test public void rejectionNeedsReasonAndReleasesTime() {
        long id=submit();
        assertThrows(IllegalArgumentException.class,()->service.changeStatus(reviewer,id,"reject","  "));
        assertEquals("REQUESTED",service.detail(applicant,id).getStatus());
        service.changeStatus(reviewer,id,"reject","목적 보완");
        long other=service.submit(neighbor,1,date(10),"10:00","12:00",8,"다른 행사");
        assertEquals("REQUESTED",service.detail(neighbor,other).getStatus());
        assertThrows(IllegalArgumentException.class,()->service.changeStatus(reviewer,id,"approve",""));
    }
    @Test public void approvedOwnerCanCancelAndOthersCannot() {
        long id=submit(); service.changeStatus(reviewer,id,"approve","");
        assertThrows(ResponseStatusException.class,()->service.changeStatus(admin,id,"cancel","대리 취소"));
        service.changeStatus(applicant,id,"cancel","일정 변경");
        assertEquals("CANCELLED",service.detail(applicant,id).getStatus());
        assertEquals(3,service.history(applicant,id).size());
        assertThrows(IllegalArgumentException.class,()->service.changeStatus(applicant,id,"cancel","재시도"));
    }
    @Test public void dateCapacityHoursAndPurposeAreValidated() {
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(0),"10:00","11:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(91),"10:00","11:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,"2026-02-30","10:00","11:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(10),"10:00","11:00",25,"정원 초과"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(10),"10:00","11:00",0,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(10),"08:00","10:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(10),"10:00","15:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(10),"12:00","11:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(10),"10:00","11:00",5," "));
        assertEquals(0,service.count(applicant,"","정원 초과"));
    }
    @Test public void closedFacilityBlocksSubmissionAndApproval() {
        long id=submit();
        assertThrows(ResponseStatusException.class,()->service.setFacilityActive(reviewer,1,false));
        service.setFacilityActive(admin,1,false);
        assertThrows(IllegalArgumentException.class,()->service.submit(applicant,1,date(11),"10:00","11:00",5,"행사"));
        assertThrows(IllegalArgumentException.class,()->service.changeStatus(reviewer,id,"approve",""));
        service.setFacilityActive(admin,1,true); service.changeStatus(reviewer,id,"approve","");
        assertEquals("APPROVED",service.detail(applicant,id).getStatus());
    }
    @Test public void repeatedApprovalDoesNotCreateDuplicateHistory() {
        long id=submit(); service.changeStatus(reviewer,id,"approve","");
        assertThrows(IllegalArgumentException.class,()->service.changeStatus(reviewer,id,"approve",""));
        assertEquals(2,service.history(applicant,id).size());
    }
    @Test public void searchPaginationAndStatusUseActualRows() {
        for(int i=0;i<11;i++) service.submit(applicant,3,date(15+i),"10:00","11:00",5,"페이지검증 "+i);
        assertEquals(11,service.count(applicant,"REQUESTED","페이지검증"));
        assertEquals(10,service.bookings(applicant,"REQUESTED","페이지검증",1).size());
        assertEquals(1,service.bookings(applicant,"REQUESTED","페이지검증",2).size());
        assertEquals(0,service.bookings(applicant,"APPROVED","페이지검증",1).size());
        assertEquals(0,service.count(applicant,"","' OR 1=1 --"));
        assertThrows(IllegalArgumentException.class,()->service.bookings(applicant,"","",0));
    }
    @Test @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public void simultaneousRequestsReserveOnlyOneSlot() throws Exception {
        ExecutorService pool=Executors.newFixedThreadPool(2);
        CountDownLatch start=new CountDownLatch(1);
        Callable<Boolean> request=()-> { start.await(); try {
            service.submit(applicant,2,date(50),"10:00","12:00",5,"동시성 검증"); return true;
        } catch(IllegalArgumentException ex) { return false; } };
        try {
            Future<Boolean> one=pool.submit(request), two=pool.submit(request); start.countDown();
            assertNotEquals(one.get(15,TimeUnit.SECONDS),two.get(15,TimeUnit.SECONDS));
            assertEquals(1,service.count(applicant,"","동시성 검증"));
        } finally { pool.shutdownNow(); }
    }
    @Test @Transactional(propagation=Propagation.NOT_SUPPORTED)
    public void failedAuditRollsBackBusinessChange() {
        long id=service.submit(applicant,1,date(60),"10:00","12:00",10,"이력 롤백 검증");
        Actor oversizedActor=new Actor("r".repeat(41),"REVIEWER");
        assertThrows(org.springframework.dao.DataAccessException.class,()->service.changeStatus(oversizedActor,id,"approve","확인"));
        assertEquals("REQUESTED",service.detail(applicant,id).getStatus());
        assertEquals(1,service.history(applicant,id).size());
    }
    @Test public void httpProtectsSessionCsrfAndOwnership() throws Exception {
        mvc.perform(get("/bookings")).andExpect(status().isUnauthorized());
        mvc.perform(post("/bookings/1/decision").session(session(reviewer)).param("action","approve")).andExpect(status().isForbidden());
        mvc.perform(get("/bookings/1").session(session(neighbor))).andExpect(status().isForbidden());
        mvc.perform(post("/bookings/1/decision").session(session(applicant)).param("csrf","test-csrf").param("action","approve")).andExpect(status().isForbidden());
        mvc.perform(get("/bookings/999999").session(session(applicant))).andExpect(status().isNotFound());
    }
    @Test public void httpFormSubmissionAndTemplatesRender() throws Exception {
        MockHttpSession session=session(applicant);
        for(String url:List.of("/dashboard","/facilities","/bookings","/bookings/new","/bookings/1"))
            mvc.perform(get(url).session(session)).andExpect(status().isOk());
        mvc.perform(post("/bookings").session(session).param("csrf","test-csrf").param("facilityId","1").param("useDate",date(12))
            .param("startTime","09:00").param("endTime","10:00").param("attendees","5").param("purpose","HTTP 신청")
            .param("applicant","neighbor").param("status","APPROVED")).andExpect(status().is3xxRedirection());
        assertEquals(1,service.count(applicant,"REQUESTED","HTTP 신청"));
        assertEquals(0,service.count(neighbor,"","HTTP 신청"));
    }
}
