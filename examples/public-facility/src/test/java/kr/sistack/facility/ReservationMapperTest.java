package kr.sistack.facility;

import java.time.LocalDate;
import java.util.*;
import java.util.concurrent.*;
import org.junit.*;
import org.h2.jdbcx.JdbcDataSource;
import org.springframework.context.support.GenericXmlApplicationContext;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.datasource.init.ResourceDatabasePopulator;
import org.springframework.jdbc.core.JdbcTemplate;
import kr.sistack.facility.domain.*;
import kr.sistack.facility.service.ReservationService;
import static org.junit.Assert.*;

public class ReservationMapperTest {
    private JdbcDataSource data;
    private GenericXmlApplicationContext context;
    private ReservationService service;
    private final Account applicant=new Account("applicant","APPLICANT");
    private final Account neighbor=new Account("neighbor","APPLICANT");
    private final Account reviewer=new Account("reviewer","REVIEWER");
    @Before public void prepare() {
        data=new JdbcDataSource();data.setURL("jdbc:h2:mem:"+UUID.randomUUID()+";DB_CLOSE_DELAY=-1;LOCK_TIMEOUT=10000");data.setUser("sa");
        ResourceDatabasePopulator seed=new ResourceDatabasePopulator(new ClassPathResource("db/schema.sql"),new ClassPathResource("db/data.sql"));seed.setSqlScriptEncoding("UTF-8");seed.execute(data);
        context=new GenericXmlApplicationContext();context.getEnvironment().setActiveProfiles("test");
        context.getBeanFactory().registerSingleton("dataSource",data);context.load("classpath:spring/root-context.xml");context.refresh();
        service=context.getBean(ReservationService.class);
    }
    @After public void close() throws Exception { if(context!=null)context.close();if(data!=null)try(java.sql.Connection c=data.getConnection()){c.createStatement().execute("SHUTDOWN");} }
    private Reservation request(int day,String purpose) {
        Reservation r=new Reservation();r.setFacilityId(1);r.setUseDate(LocalDate.now().plusDays(day).toString());r.setStartTime("10:00");r.setEndTime("12:00");r.setPeople(8);r.setPurpose(purpose);return r;
    }
    @Test public void 신청전체필드와접수이력을재조회한다() {
        long id=service.apply(request(10,"주민 강좌"),applicant);Reservation stored=service.find(applicant,id);
        assertNotNull("신청이 저장되어야 한다",stored);assertEquals("시설 번호를 보존해야 한다",1,stored.getFacilityId());
        assertEquals("신청자를 보존해야 한다","applicant",stored.getApplicant());assertEquals("사용일을 보존해야 한다",LocalDate.now().plusDays(10).toString(),stored.getUseDate());
        assertEquals("시작 시간을 보존해야 한다","10:00",stored.getStartTime());assertEquals("종료 시간을 보존해야 한다","12:00",stored.getEndTime());
        assertEquals("인원을 보존해야 한다",8,stored.getPeople());assertEquals("목적을 보존해야 한다","주민 강좌",stored.getPurpose());assertEquals("접수 상태를 보존해야 한다","REQUESTED",stored.getStatus());
        List<AuditEvent> events=service.history(applicant,id);assertNotNull("처리 이력이 있어야 한다",events);assertEquals("접수 이력은 한 건이어야 한다",1,events.size());
        assertEquals("처리 이력의 신청번호가 같아야 한다",id,events.get(0).getReservationId());assertEquals("처리 이력은 접수 상태여야 한다","REQUESTED",events.get(0).getStatus());
    }
    @Test public void 조건별조회와마지막페이지를검증한다() {
        for(int i=0;i<11;i++)service.apply(request(i+10,"시민강좌 "+i),applicant);
        service.apply(request(35,"다른 행사"),neighbor);
        assertEquals("신청자는 본인 신청 열한 건만 조회한다",11,service.count(applicant,"",""));
        assertEquals("담당자는 전체 열두 건을 조회한다",12,service.count(reviewer,"",""));
        List<Reservation> first=service.search(applicant,"REQUESTED","시민강좌",1),last=service.search(applicant,"REQUESTED","시민강좌",2);
        assertNotNull("첫 페이지가 있어야 한다",first);assertEquals("첫 페이지는 열 건이다",10,first.size());
        assertNotNull("마지막 페이지가 있어야 한다",last);assertEquals("마지막 페이지는 한 건이다",1,last.size());
        assertTrue("최신 신청이 먼저 나와야 한다",first.get(0).getId()>first.get(1).getId());
        assertEquals("시설명으로도 검색되어야 한다",11,service.count(applicant,"","시민교육실"));
        assertEquals("일치하지 않는 목적은 빈 결과다",0,service.count(applicant,"","없는 행사"));
        assertEquals("SQL 형태의 검색어를 실행하지 않는다",0,service.count(applicant,"","' OR 1=1 --"));
        assertEquals("승인 상태 검색에는 접수 건이 포함되지 않는다",0,service.count(applicant,"APPROVED",""));
    }
    @Test public void 중복은차단하고맞닿은시간은허용한다() {
        service.apply(request(10,"원래 행사"),applicant);
        assertThrows("겹치는 신청은 거부한다",IllegalArgumentException.class,()->service.apply(request(10,"겹치는 행사"),neighbor));
        Reservation adjacent=request(10,"연속 행사");adjacent.setStartTime("12:00");adjacent.setEndTime("13:00");
        long id=service.apply(adjacent,neighbor);assertEquals("맞닿은 다음 시간은 접수한다","REQUESTED",service.find(neighbor,id).getStatus());
    }
    @Test public void 반려후같은시간을재신청할수있다() {
        long id=service.apply(request(10,"검토 행사"),applicant);service.decide(reviewer,id,"reject","목적 보완");
        assertEquals("반려 상태를 저장해야 한다","REJECTED",service.find(applicant,id).getStatus());
        long other=service.apply(request(10,"대체 행사"),neighbor);assertEquals("반려된 시간은 다시 접수한다","REQUESTED",service.find(neighbor,other).getStatus());
        List<AuditEvent> events=service.history(applicant,id);assertEquals("접수와 반려 이력이 두 건이다",2,events.size());assertEquals("반려 사유가 보존되어야 한다","목적 보완",events.get(1).getReason());
    }
    @Test public void 승인취소와세단계이력을보존한다() {
        long id=service.apply(request(10,"정상 행사"),applicant);service.decide(reviewer,id,"approve","검토 완료");service.decide(applicant,id,"cancel","일정 변경");
        assertEquals("취소 상태를 재조회할 수 있어야 한다","CANCELLED",service.find(applicant,id).getStatus());
        List<AuditEvent> events=service.history(applicant,id);assertEquals("접수 승인 취소 세 이력을 보존한다",3,events.size());
        assertEquals("승인 처리자가 보존된다","reviewer",events.get(1).getActor());assertEquals("취소의 이전 상태는 승인이다","APPROVED",events.get(2).getPrevious());
        assertEquals("취소 사유를 보존한다","일정 변경",events.get(2).getReason());
    }
    @Test public void 운영중지시설은승인을막고기존신청은보존한다() {
        long id=service.apply(request(10,"운영 검토"),applicant);Account admin=new Account("admin","ADMIN");service.availability(admin,1,false);
        assertThrows("운영 중지 시설을 승인하지 않는다",IllegalArgumentException.class,()->service.decide(reviewer,id,"approve","확인"));
        assertEquals("대기 신청은 삭제하지 않는다","REQUESTED",service.find(applicant,id).getStatus());
        service.availability(admin,1,true);service.decide(reviewer,id,"approve","재개 확인");assertEquals("운영 재개 후 승인한다","APPROVED",service.find(applicant,id).getStatus());
    }
    @Test public void 이력저장실패는신청상태변경도롤백한다() {
        long id=service.apply(request(10,"트랜잭션 행사"),applicant);
        assertThrows("저장 제약 위반이 발생해야 한다",org.springframework.dao.DataAccessException.class,()->service.decide(new Account("r".repeat(41),"REVIEWER"),id,"approve","확인"));
        assertEquals("이력 저장 실패 시 접수 상태를 유지한다","REQUESTED",service.find(applicant,id).getStatus());
        assertEquals("실패한 승인 이력을 남기지 않는다",1,service.history(applicant,id).size());
    }
    @Test public void 동시요청은같은시간을한번만접수한다() throws Exception {
        ExecutorService pool=Executors.newFixedThreadPool(2);CountDownLatch start=new CountDownLatch(1);
        Callable<Boolean> apply=()->{start.await();try{service.apply(request(20,"동시 신청"),applicant);return true;}catch(IllegalArgumentException ex){return false;}};
        try {Future<Boolean> one=pool.submit(apply),two=pool.submit(apply);start.countDown();
            assertNotEquals("동시 요청 중 하나만 성공해야 한다",one.get(15,TimeUnit.SECONDS),two.get(15,TimeUnit.SECONDS));
            assertEquals("실제 저장된 신청은 한 건이어야 한다",1,service.count(applicant,"","동시 신청"));
            List<Reservation> rows=service.search(applicant,"","동시 신청",1);assertEquals("조회된 신청은 한 건이어야 한다",1,rows.size());
            assertEquals("중복 접수 이력을 남기지 않는다",1,service.history(applicant,rows.get(0).getId()).size());
        }finally{pool.shutdownNow();}
    }
}
