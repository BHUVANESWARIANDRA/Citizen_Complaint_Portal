package com.smartcitizen.complaints.model;

public enum ComplaintCategory {
    ROADS_AND_POTHOLES("Roads and potholes"),
    WATER_SUPPLY("Water supply"),
    ELECTRICITY("Electricity"),
    GARBAGE_COLLECTION("Garbage collection"),
    DRAINAGE("Drainage"),
    STREETLIGHTS("Streetlights"),
    OTHER("Other civic issues");

    private final String displayName;

    ComplaintCategory(String displayName) {
        this.displayName = displayName;
    }

    public String getDisplayName() {
        return displayName;
    }
}
