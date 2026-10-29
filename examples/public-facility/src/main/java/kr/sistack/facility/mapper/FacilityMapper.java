package kr.sistack.facility.mapper;

import java.util.List;
import org.apache.ibatis.annotations.Param;
import kr.sistack.facility.domain.*;

public interface FacilityMapper {
    List<Facility> selectFacilities();
    Facility lockFacility(@Param("id") long id);
    int updateFacility(@Param("id") long id, @Param("active") boolean active);
    List<Booking> selectBookings(@Param("applicant") String applicant, @Param("status") String status, @Param("keyword") String keyword, @Param("offset") int offset);
    int countBookings(@Param("applicant") String applicant, @Param("status") String status, @Param("keyword") String keyword);
    Booking selectBooking(@Param("id") long id);
    List<History> selectHistory(@Param("id") long id);
    int countOverlap(Booking booking);
    int insertBooking(Booking booking);
    int updateStatus(@Param("id") long id, @Param("status") String status, @Param("reason") String reason, @Param("previous") String previous);
    int insertHistory(@Param("id") long id, @Param("actor") String actor, @Param("previous") String previous, @Param("status") String status, @Param("reason") String reason);
}
