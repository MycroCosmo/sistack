package kr.sistack.facility.domain;
public class Account {
    private final String id;
    private final String role;
    public Account(String id, String role) { this.id=id; this.role=role; }
    public String getId() { return id; }
    public String getRole() { return role; }
    public boolean isStaff() { return "REVIEWER".equals(role) || "ADMIN".equals(role); }
}
