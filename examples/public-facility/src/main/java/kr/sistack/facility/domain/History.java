package kr.sistack.facility.domain;

public class History {
    private long id;
    public long getId() { return id; }
    public void setId(long value) { this.id = value; }
    private long bookingId;
    public long getBookingId() { return bookingId; }
    public void setBookingId(long value) { this.bookingId = value; }
    private String actor;
    public String getActor() { return actor; }
    public void setActor(String value) { this.actor = value; }
    private String fromStatus;
    public String getFromStatus() { return fromStatus; }
    public void setFromStatus(String value) { this.fromStatus = value; }
    private String toStatus;
    public String getToStatus() { return toStatus; }
    public void setToStatus(String value) { this.toStatus = value; }
    private String reason;
    public String getReason() { return reason; }
    public void setReason(String value) { this.reason = value; }
    private String createdAt;
    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String value) { this.createdAt = value; }
}
