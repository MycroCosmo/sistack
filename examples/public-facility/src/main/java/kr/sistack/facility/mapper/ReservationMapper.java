package kr.sistack.facility.mapper;
import java.util.List;
import kr.sistack.facility.domain.*;
public interface ReservationMapper {
    List<Facility> facilities();
    Facility lockFacility(long id);
    int updateFacility(Facility facility);
    List<Reservation> search(Search query);
    int count(Search query);
    Reservation find(long id);
    int overlaps(Reservation reservation);
    int insert(Reservation reservation);
    int updateStatus(Reservation reservation);
    int insertEvent(AuditEvent event);
    List<AuditEvent> history(long id);
}
