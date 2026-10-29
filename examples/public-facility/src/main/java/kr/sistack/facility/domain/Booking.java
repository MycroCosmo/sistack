package kr.sistack.facility.domain;

public class Booking {
    private long id;
    public long getId() { return id; }
    public void setId(long value) { this.id = value; }
    private long facilityId;
    public long getFacilityId() { return facilityId; }
    public void setFacilityId(long value) { this.facilityId = value; }
    private String facilityName;
    public String getFacilityName() { return facilityName; }
    public void setFacilityName(String value) { this.facilityName = value; }
    private String applicant;
    public String getApplicant() { return applicant; }
    public void setApplicant(String value) { this.applicant = value; }
    private String useDate;
    public String getUseDate() { return useDate; }
    public void setUseDate(String value) { this.useDate = value; }
    private String startTime;
    public String getStartTime() { return startTime; }
    public void setStartTime(String value) { this.startTime = value; }
    private String endTime;
    public String getEndTime() { return endTime; }
    public void setEndTime(String value) { this.endTime = value; }
    private int attendees;
    public int getAttendees() { return attendees; }
    public void setAttendees(int value) { this.attendees = value; }
    private String purpose;
    public String getPurpose() { return purpose; }
    public void setPurpose(String value) { this.purpose = value; }
    private String status;
    public String getStatus() { return status; }
    public void setStatus(String value) { this.status = value; }
    private String reason;
    public String getReason() { return reason; }
    public void setReason(String value) { this.reason = value; }
}
