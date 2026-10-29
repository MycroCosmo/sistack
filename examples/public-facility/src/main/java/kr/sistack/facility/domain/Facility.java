package kr.sistack.facility.domain;

public class Facility {
    private long id;
    public long getId() { return id; }
    public void setId(long value) { this.id = value; }
    private String name;
    public String getName() { return name; }
    public void setName(String value) { this.name = value; }
    private String location;
    public String getLocation() { return location; }
    public void setLocation(String value) { this.location = value; }
    private int capacity;
    public int getCapacity() { return capacity; }
    public void setCapacity(int value) { this.capacity = value; }
    private boolean active;
    public boolean getActive() { return active; }
    public void setActive(boolean value) { this.active = value; }
}
