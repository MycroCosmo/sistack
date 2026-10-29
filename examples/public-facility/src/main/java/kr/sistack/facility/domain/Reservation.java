package kr.sistack.facility.domain;

public class Reservation {
    private long id;
    public long getId() { return id; }
    public void setId(long value) { id = value; }
    private long facilityId;
    public long getFacilityId() { return facilityId; }
    public void setFacilityId(long value) { facilityId = value; }
    private String applicant;
    public String getApplicant() { return applicant; }
    public void setApplicant(String value) { applicant = value; }
    private String useDate;
    public String getUseDate() { return useDate; }
    public void setUseDate(String value) { useDate = value; }
    private String startTime;
    public String getStartTime() { return startTime; }
    public void setStartTime(String value) { startTime = value; }
    private String endTime;
    public String getEndTime() { return endTime; }
    public void setEndTime(String value) { endTime = value; }
    private int people;
    public int getPeople() { return people; }
    public void setPeople(int value) { people = value; }
    private String purpose;
    public String getPurpose() { return purpose; }
    public void setPurpose(String value) { purpose = value; }
    private String status;
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    private String reason;
    public String getReason() { return reason; }
    public void setReason(String value) { reason = value; }
    private String previousStatus;
    public String getPreviousStatus() { return previousStatus; }
    public void setPreviousStatus(String value) { previousStatus = value; }
}
