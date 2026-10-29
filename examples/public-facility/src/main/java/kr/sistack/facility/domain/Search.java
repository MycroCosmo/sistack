package kr.sistack.facility.domain;

public class Search {
    private String applicant;
    public String getApplicant() { return applicant; }
    public void setApplicant(String value) { applicant = value; }
    private String status;
    public String getStatus() { return status; }
    public void setStatus(String value) { status = value; }
    private String keyword;
    public String getKeyword() { return keyword; }
    public void setKeyword(String value) { keyword = value; }
    private int offset;
    public int getOffset() { return offset; }
    public void setOffset(int value) { offset = value; }
}
