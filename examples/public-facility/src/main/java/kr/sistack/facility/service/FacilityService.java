package kr.sistack.facility.service;

import java.time.LocalDate;
import java.time.LocalTime;
import java.time.Duration;
import java.time.format.DateTimeParseException;
import java.util.List;
import java.util.Set;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import kr.sistack.facility.domain.*;
import kr.sistack.facility.mapper.FacilityMapper;

@Service
@Transactional
public class FacilityService {
    private final FacilityMapper mapper;
    public FacilityService(FacilityMapper mapper) { this.mapper = mapper; }
    private void require(boolean condition, String message) {
        if (!condition) throw new IllegalArgumentException(message);
    }
    private void authorize(boolean condition) {
        if (!condition) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "접근 권한이 없습니다.");
    }
    public List<Facility> facilities() { return mapper.selectFacilities(); }
    private String filterStatus(String status) {
        require(Set.of("", "REQUESTED", "APPROVED", "REJECTED", "CANCELLED").contains(status), "지원하지 않는 상태입니다.");
        return status;
    }
    public List<Booking> bookings(Actor actor, String status, String keyword, int page) {
        require(page >= 1 && page <= 10000, "페이지 범위가 올바르지 않습니다.");
        require(keyword.length() <= 80, "검색어는 80자 이내로 입력하세요.");
        return mapper.selectBookings(actor.isStaff() ? null : actor.getId(), filterStatus(status), keyword, (page - 1) * 10);
    }
    public int count(Actor actor, String status, String keyword) {
        return mapper.countBookings(actor.isStaff() ? null : actor.getId(), filterStatus(status), keyword);
    }
    public Booking detail(Actor actor, long id) {
        Booking booking = mapper.selectBooking(id);
        if (booking == null) throw new ResponseStatusException(HttpStatus.NOT_FOUND, "신청 내역이 없습니다.");
        authorize(actor.isStaff() || actor.getId().equals(booking.getApplicant()));
        return booking;
    }
    public List<History> history(Actor actor, long id) {
        detail(actor, id);
        return mapper.selectHistory(id);
    }
    public long submit(Actor actor, long facilityId, String date, String start, String end, int attendees, String purpose) {
        authorize("APPLICANT".equals(actor.getRole()));
        Facility facility = mapper.lockFacility(facilityId);
        require(facility != null && facility.getActive(), "운영 중인 시설을 선택하세요.");
        LocalDate day;
        LocalTime from;
        LocalTime to;
        try {
            require(date.matches("[0-9]{4}-[0-9]{2}-[0-9]{2}") && start.matches("[0-9]{2}:[0-9]{2}") && end.matches("[0-9]{2}:[0-9]{2}"), "날짜와 시간 형식을 확인하세요.");
            day = LocalDate.parse(date); from = LocalTime.parse(start); to = LocalTime.parse(end);
        } catch (DateTimeParseException ex) { throw new IllegalArgumentException("존재하는 날짜와 시간을 입력하세요."); }
        require(day.isAfter(LocalDate.now()) && !day.isAfter(LocalDate.now().plusDays(90)), "신청일은 내일부터 90일 이내여야 합니다.");
        require(!from.isBefore(LocalTime.of(9,0)) && !to.isAfter(LocalTime.of(18,0)) && to.isAfter(from), "운영시간은 09:00~18:00이며 종료는 시작보다 늦어야 합니다.");
        require(Duration.between(from,to).toMinutes() <= 240, "한 번에 최대 4시간까지 신청할 수 있습니다.");
        require(attendees > 0 && attendees <= facility.getCapacity(), "참여 인원이 시설 정원을 초과하거나 올바르지 않습니다.");
        require(purpose != null && !purpose.trim().isEmpty() && purpose.trim().length() <= 300, "사용 목적은 1~300자로 입력하세요.");
        Booking booking = new Booking();
        booking.setFacilityId(facilityId); booking.setApplicant(actor.getId()); booking.setUseDate(date);
        booking.setStartTime(start); booking.setEndTime(end); booking.setAttendees(attendees); booking.setPurpose(purpose.trim());
        require(mapper.countOverlap(booking) == 0, "같은 시설과 시간에 접수 또는 승인된 신청이 있습니다.");
        mapper.insertBooking(booking);
        mapper.insertHistory(booking.getId(), actor.getId(), "", "REQUESTED", "신청 접수");
        return booking.getId();
    }
    public void changeStatus(Actor actor, long id, String action, String reason) {
        Booking original = detail(actor, id);
        Facility facility = mapper.lockFacility(original.getFacilityId());
        Booking booking = detail(actor, id);
        String next;
        if ("cancel".equals(action)) {
            authorize(actor.getId().equals(booking.getApplicant()));
            require(Set.of("REQUESTED", "APPROVED").contains(booking.getStatus()), "접수 또는 승인 상태에서만 취소할 수 있습니다.");
            next = "CANCELLED";
        } else {
            authorize(actor.isStaff() && !actor.getId().equals(booking.getApplicant()));
            require("REQUESTED".equals(booking.getStatus()), "접수 상태에서만 심사할 수 있습니다.");
            require("approve".equals(action) || "reject".equals(action), "지원하지 않는 처리입니다.");
            next = "approve".equals(action) ? "APPROVED" : "REJECTED";
            if ("APPROVED".equals(next)) {
                require(facility.getActive(), "운영 중지 시설은 승인할 수 없습니다.");
                require(mapper.countOverlap(booking) == 0, "중복된 신청이 있어 승인할 수 없습니다.");
            }
        }
        require(LocalDate.parse(booking.getUseDate()).isAfter(LocalDate.now()), "사용일 당일 이후에는 상태를 변경할 수 없습니다.");
        require(reason != null && reason.trim().length() <= 300, "사유는 300자 이내로 입력하세요.");
        require(!("REJECTED".equals(next) || "CANCELLED".equals(next)) || !reason.trim().isEmpty(), "반려 및 취소 사유는 필수입니다.");
        require(mapper.updateStatus(id, next, reason.trim(), booking.getStatus()) == 1, "다른 사용자가 처리했습니다. 새로고침하세요.");
        mapper.insertHistory(id, actor.getId(), booking.getStatus(), next, reason.trim());
    }
    public void setFacilityActive(Actor actor, long id, boolean active) {
        authorize("ADMIN".equals(actor.getRole()));
        require(mapper.lockFacility(id) != null, "시설이 없습니다.");
        mapper.updateFacility(id, active);
    }
}
