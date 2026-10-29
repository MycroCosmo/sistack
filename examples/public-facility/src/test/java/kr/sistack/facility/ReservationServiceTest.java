package kr.sistack.facility;

import java.time.LocalDate;
import java.util.*;
import org.junit.Before;
import org.junit.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;
import kr.sistack.facility.domain.*;
import kr.sistack.facility.mapper.ReservationMapper;
import kr.sistack.facility.service.ReservationService;
import static org.junit.Assert.*;
import static org.mockito.Mockito.*;

public class ReservationServiceTest {
    private ReservationMapper mapper;
    private ReservationService service;
    private Facility room;
    private final Account applicant=new Account("applicant","APPLICANT");
    private final Account reviewer=new Account("reviewer","REVIEWER");
    @Before public void prepare() {
        mapper=mock(ReservationMapper.class); service=new ReservationService();
        ReflectionTestUtils.setField(service,"mapper",mapper);
        room=new Facility(); room.setId(1); room.setCapacity(24); room.setEnabled(true);
        when(mapper.lockFacility(1)).thenReturn(room);
        when(mapper.insert(any())).thenAnswer(call->{((Reservation)call.getArgument(0)).setId(101);return 1;});
        when(mapper.updateStatus(any())).thenReturn(1);
    }
    private Reservation request() {
        Reservation r=new Reservation(); r.setFacilityId(1); r.setUseDate(LocalDate.now().plusDays(10).toString());
        r.setStartTime("10:00");r.setEndTime("12:00");r.setPeople(10);r.setPurpose(" 시민 강좌 ");return r;
    }
    private Reservation pending() {
        Reservation r=request();r.setId(1);r.setApplicant("applicant");r.setStatus("REQUESTED");when(mapper.find(1)).thenReturn(r);return r;
    }
    @Test public void 신청번호와세션신청자및접수상태를저장한다() {
        Reservation input=request();input.setApplicant("neighbor");input.setStatus("APPROVED");input.setId(999);
        long id=service.apply(input,applicant);
        assertEquals("저장된 신청번호를 반환해야 한다",101,id);
        ArgumentCaptor<Reservation> saved=ArgumentCaptor.forClass(Reservation.class);verify(mapper).insert(saved.capture());
        assertEquals("신청자는 세션 계정이어야 한다","applicant",saved.getValue().getApplicant());
        assertEquals("신규 신청은 접수 상태여야 한다","REQUESTED",saved.getValue().getStatus());
        assertEquals("사용 목적의 앞뒤 공백을 제거해야 한다","시민 강좌",saved.getValue().getPurpose());
        ArgumentCaptor<AuditEvent> event=ArgumentCaptor.forClass(AuditEvent.class);verify(mapper).insertEvent(event.capture());
        assertEquals("이력은 저장된 신청번호에 연결되어야 한다",101,event.getValue().getReservationId());
        assertEquals("접수 이력의 처리자가 일치해야 한다","applicant",event.getValue().getActor());
    }
    @Test public void 조회결과와페이지범위를전달한다() {
        Reservation row=pending();when(mapper.search(any())).thenReturn(List.of(row));
        List<Reservation> found=service.search(applicant,"REQUESTED","강좌",2);
        assertNotNull("신청 목록이 있어야 한다",found);assertEquals("신청 목록은 한 건이어야 한다",1,found.size());
        assertEquals("조회된 신청번호가 같아야 한다",1,found.get(0).getId());
        ArgumentCaptor<Search> query=ArgumentCaptor.forClass(Search.class);verify(mapper).search(query.capture());
        assertEquals("신청자 범위를 유지해야 한다","applicant",query.getValue().getApplicant());
        assertEquals("두 번째 페이지는 열 건 이후부터 조회한다",10,query.getValue().getOffset());
        assertEquals("검색어를 전달해야 한다","강좌",query.getValue().getKeyword());
    }
    @Test public void 담당자는전체신청을조회한다() {
        Search query=service.query(reviewer,"","",1);
        assertNull("담당자는 신청자 제한 없이 조회한다",query.getApplicant());
        assertThrows("0페이지는 거부한다",IllegalArgumentException.class,()->service.query(reviewer,"","",0));
        assertThrows("정의되지 않은 상태는 거부한다",IllegalArgumentException.class,()->service.query(reviewer,"UNKNOWN","",1));
    }
    @Test public void 타인상세와신청자승인을차단한다() {
        pending();
        assertThrows("다른 신청자의 상세는 거부한다",ResponseStatusException.class,()->service.find(new Account("neighbor","APPLICANT"),1));
        assertThrows("신청자 직접 승인은 거부한다",ResponseStatusException.class,()->service.decide(applicant,1,"approve","확인"));
        verify(mapper,never()).updateStatus(any());
    }
    @Test public void 정원경계와목적길이를검증한다() {
        Reservation exact=request();exact.setPeople(24);exact.setPurpose("가".repeat(300));
        assertEquals("정원과 목적 최대 길이는 허용한다",101,service.apply(exact,applicant));
        Reservation over=request();over.setPeople(25);
        assertThrows("정원 초과는 거부한다",IllegalArgumentException.class,()->service.apply(over,applicant));
        Reservation empty=request();empty.setPeople(0);
        assertThrows("0명은 거부한다",IllegalArgumentException.class,()->service.apply(empty,applicant));
        Reservation longPurpose=request();longPurpose.setPurpose("가".repeat(301));
        assertThrows("사용 목적 길이 초과는 거부한다",IllegalArgumentException.class,()->service.apply(longPurpose,applicant));
        Reservation blank=request();blank.setPurpose(" ");
        assertThrows("빈 사용 목적은 거부한다",IllegalArgumentException.class,()->service.apply(blank,applicant));
    }
    @Test public void 신청기간의양끝과초과를검증한다() {
        for(int days:new int[]{1,90}) {Reservation r=request();r.setUseDate(LocalDate.now().plusDays(days).toString());assertEquals("신청 가능 기간의 양끝은 허용한다",101,service.apply(r,applicant));}
        for(int days:new int[]{0,91}) {Reservation r=request();r.setUseDate(LocalDate.now().plusDays(days).toString());assertThrows("신청 가능 기간 밖은 거부한다",IllegalArgumentException.class,()->service.apply(r,applicant));}
    }
    @Test public void 운영시간과최대네시간을검증한다() {
        Reservation exact=request();exact.setStartTime("14:00");exact.setEndTime("18:00");
        assertEquals("마감시간과 최대 네 시간은 허용한다",101,service.apply(exact,applicant));
        for(String[] times:new String[][]{{"08:59","10:00"},{"14:00","18:01"},{"10:00","14:01"},{"12:00","12:00"},{"12:00","11:00"}}) {
            Reservation r=request();r.setStartTime(times[0]);r.setEndTime(times[1]);
            assertThrows("운영시간 또는 사용시간 제한 위반은 거부한다",IllegalArgumentException.class,()->service.apply(r,applicant));
        }
    }
    @Test public void 중복또는운영중지시설의신청을차단한다() {
        when(mapper.overlaps(any())).thenReturn(1);
        assertThrows("중복 신청은 거부한다",IllegalArgumentException.class,()->service.apply(request(),applicant));
        when(mapper.overlaps(any())).thenReturn(0);room.setEnabled(false);
        assertThrows("운영 중지 시설은 거부한다",IllegalArgumentException.class,()->service.apply(request(),applicant));
        verify(mapper,never()).insert(any());
    }
    @Test public void 승인결과와처리이력을저장한다() {
        pending();service.decide(reviewer,1,"approve"," 일정 확인 ");
        ArgumentCaptor<Reservation> row=ArgumentCaptor.forClass(Reservation.class);verify(mapper).updateStatus(row.capture());
        assertEquals("승인 상태를 저장해야 한다","APPROVED",row.getValue().getStatus());
        assertEquals("기존 상태를 조건으로 전달해야 한다","REQUESTED",row.getValue().getPreviousStatus());
        ArgumentCaptor<AuditEvent> event=ArgumentCaptor.forClass(AuditEvent.class);verify(mapper).insertEvent(event.capture());
        assertEquals("사유를 정리해 이력에 남겨야 한다","일정 확인",event.getValue().getReason());
        assertEquals("승인 이력에 이전 상태를 남겨야 한다","REQUESTED",event.getValue().getPrevious());
    }
    @Test public void 반려취소사유와재처리를검증한다() {
        Reservation r=pending();
        assertThrows("반려 사유는 필수다",IllegalArgumentException.class,()->service.decide(reviewer,1,"reject"," "));
        assertThrows("취소 사유는 필수다",IllegalArgumentException.class,()->service.decide(applicant,1,"cancel",""));
        r.setStatus("APPROVED");
        assertThrows("이미 승인된 신청을 다시 심사하지 않는다",IllegalArgumentException.class,()->service.decide(reviewer,1,"reject","변경"));
        service.decide(applicant,1,"cancel","일정 변경");
        assertEquals("승인 신청은 본인이 취소할 수 있다","CANCELLED",r.getStatus());
    }
    @Test public void 관리자만시설운영을변경한다() {
        assertThrows("담당자는 시설 운영을 변경하지 못한다",ResponseStatusException.class,()->service.availability(reviewer,1,false));
        service.availability(new Account("admin","ADMIN"),1,false);
        ArgumentCaptor<Facility> saved=ArgumentCaptor.forClass(Facility.class);verify(mapper).updateFacility(saved.capture());
        assertFalse("시설 운영 중지가 저장되어야 한다",saved.getValue().getEnabled());
    }
}
