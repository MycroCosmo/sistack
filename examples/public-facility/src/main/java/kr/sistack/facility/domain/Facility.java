package kr.sistack.facility.domain;

public class Facility {
    private long id;
    public long getId() { return id; }
    public void setId(long value) { id = value; }
    private String name;
    public String getName() { return name; }
    public void setName(String value) { name = value; }
    private String location;
    public String getLocation() { return location; }
    public void setLocation(String value) { location = value; }
    private int capacity;
    public int getCapacity() { return capacity; }
    public void setCapacity(int value) { capacity = value; }
    private boolean enabled;
    public boolean getEnabled() { return enabled; }
    public void setEnabled(boolean value) { enabled = value; }
}
