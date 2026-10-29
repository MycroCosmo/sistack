package kr.sistack.facility.domain;

public class AuditEvent {
    private long id;
    public long getId() { return id; }
    public void setId(long value) { id = value; }
    private long reservationId;
    public long getReservationId() { return reservationId; }
    public void setReservationId(long value) { reservationId = value; }
    private String actor;
    public String getActor() { return actor; }
    public void setActor(String value) { actor = value; }
    private String previous;
    public String getPrevious() { return previous; }
    public void setPrevious(String value) { previous = value; }
    private String status;
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    private String reason;
    public String getReason() { return reason; }
    public void setReason(String value) { reason = value; }
    private String occurredAt;
    public String getOccurredAt() { return occurredAt; }
    public void setOccurredAt(String value) { occurredAt = value; }
}
