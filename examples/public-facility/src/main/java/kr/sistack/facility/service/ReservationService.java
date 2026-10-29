package kr.sistack.facility.service;
import java.time.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import kr.sistack.facility.domain.*;
import kr.sistack.facility.mapper.ReservationMapper;

@Service
@Transactional
public class ReservationService {
    @Autowired private ReservationMapper mapper;
    private void access(boolean allowed) {
        if (!allowed) throw new ResponseStatusException(HttpStatus.FORBIDDEN,"처리 권한이 없습니다.");
    }
    private void require(boolean allowed, String message) {
        if (!allowed) throw new IllegalArgumentException(message);
    }
    public List<Facility> facilities() { return mapper.facilities(); }
    public Search query(Account account,String status,String keyword,int page) {
        require(page>=1 && page<=10000,"페이지 범위를 확인하세요.");
        require(Set.of("","REQUESTED","APPROVED","REJECTED","CANCELLED").contains(status),"상태를 확인하세요.");
        require(keyword.length()<=80,"검색어는 80자 이내로 입력하세요.");
        Search query=new Search(); query.setApplicant(account.isStaff()?null:account.getId());
        query.setStatus(status); query.setKeyword(keyword); query.setOffset((page-1)*10);
        return query;
    }
    public List<Reservation> search(Account account,String status,String keyword,int page) {
        return mapper.search(query(account,status,keyword,page));
    }
    public int count(Account account,String status,String keyword) {
        return mapper.count(query(account,status,keyword,1));
    }
    public Reservation find(Account account,long id) {
        Reservation found=mapper.find(id);
        if(found==null) throw new ResponseStatusException(HttpStatus.NOT_FOUND,"신청을 찾을 수 없습니다.");
        access(account.isStaff() || account.getId().equals(found.getApplicant()));
        return found;
    }
    public List<AuditEvent> history(Account account,long id) {
        find(account,id); return mapper.history(id);
    }
    public long apply(Reservation input,Account account) {
        access("APPLICANT".equals(account.getRole()));
        Facility facility=mapper.lockFacility(input.getFacilityId());
        require(facility!=null && facility.getEnabled(),"운영 중인 시설을 선택하세요.");
        require(input.getUseDate()!=null && input.getUseDate().matches("[0-9]{4}-[0-9]{2}-[0-9]{2}"),"사용일 형식을 확인하세요.");
        require(input.getStartTime()!=null && input.getEndTime()!=null && input.getStartTime().matches("[0-9]{2}:[0-9]{2}") && input.getEndTime().matches("[0-9]{2}:[0-9]{2}"),"시간 형식을 확인하세요.");
        LocalDate day=LocalDate.parse(input.getUseDate());
        LocalTime start=LocalTime.parse(input.getStartTime()),end=LocalTime.parse(input.getEndTime());
        require(day.isAfter(LocalDate.now()) && !day.isAfter(LocalDate.now().plusDays(90)),"사용일은 내일부터 90일 이내입니다.");
        require(!start.isBefore(LocalTime.of(9,0)) && !end.isAfter(LocalTime.of(18,0)) && end.isAfter(start),"운영시간 09:00~18:00과 시작·종료 순서를 확인하세요.");
        require(Duration.between(start,end).toMinutes()<=240,"한 번에 최대 4시간까지 신청할 수 있습니다.");
        require(input.getPeople()>0 && input.getPeople()<=facility.getCapacity(),"참여 인원과 시설 정원을 확인하세요.");
        require(input.getPurpose()!=null && !input.getPurpose().trim().isEmpty() && input.getPurpose().trim().length()<=300,"사용 목적은 1~300자로 입력하세요.");
        input.setId(0); input.setApplicant(account.getId()); input.setStatus("REQUESTED"); input.setReason(""); input.setPurpose(input.getPurpose().trim());
        require(mapper.overlaps(input)==0,"같은 시설의 접수·승인 시간과 겹칩니다.");
        mapper.insert(input);
        record(input,account,"","신청 접수");
        return input.getId();
    }
    public void decide(Account account,long id,String action,String reason) {
        Reservation first=find(account,id);
        Facility facility=mapper.lockFacility(first.getFacilityId());
        Reservation current=find(account,id);
        require(LocalDate.parse(current.getUseDate()).isAfter(LocalDate.now()),"사용일 당일부터 처리할 수 없습니다.");
        String next;
        if("cancel".equals(action)) {
            access(account.getId().equals(current.getApplicant()));
            require(Set.of("REQUESTED","APPROVED").contains(current.getStatus()),"접수·승인 상태에서만 취소할 수 있습니다."); next="CANCELLED";
        } else {
            access(account.isStaff() && !account.getId().equals(current.getApplicant()));
            require("REQUESTED".equals(current.getStatus()),"이미 처리된 신청입니다.");
            require("approve".equals(action)||"reject".equals(action),"처리 종류를 확인하세요.");
            next="approve".equals(action)?"APPROVED":"REJECTED";
            if("APPROVED".equals(next)) {
                require(facility.getEnabled(),"운영 중지 시설은 승인할 수 없습니다.");
                require(mapper.overlaps(current)==0,"다른 접수·승인 일정과 겹칩니다.");
            }
        }
        require(reason!=null && reason.trim().length()<=300,"사유는 300자 이내로 입력하세요.");
        require("APPROVED".equals(next)||!reason.trim().isEmpty(),"반려·취소 사유를 입력하세요.");
        String previous=current.getStatus(); current.setPreviousStatus(previous); current.setStatus(next); current.setReason(reason.trim());
        require(mapper.updateStatus(current)==1,"다른 요청에서 먼저 변경했습니다. 새로고침하세요.");
        record(current,account,previous,reason.trim());
    }
    private void record(Reservation reservation,Account account,String previous,String reason) {
        AuditEvent event=new AuditEvent(); event.setReservationId(reservation.getId()); event.setActor(account.getId());
        event.setPrevious(previous); event.setStatus(reservation.getStatus()); event.setReason(reason); mapper.insertEvent(event);
    }
    public void availability(Account account,long id,boolean enabled) {
        access("ADMIN".equals(account.getRole()));
        Facility facility=mapper.lockFacility(id); require(facility!=null,"시설을 찾을 수 없습니다.");
        facility.setEnabled(enabled); mapper.updateFacility(facility);
    }
}
