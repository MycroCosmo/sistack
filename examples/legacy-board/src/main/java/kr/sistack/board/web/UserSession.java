package kr.sistack.board.web;

import java.io.Serializable;

public class UserSession implements Serializable {
    private static final long serialVersionUID = 1L;
    private final String name;
    private final String role;
    public UserSession(String name, String role) { this.name = name; this.role = role; }
    public String getName() { return name; }
    public String getRole() { return role; }
}
