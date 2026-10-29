package com.smartcitizen.complaints.dto;

import jakarta.validation.constraints.NotBlank;

public class TrackComplaintRequest {

    @NotBlank(message = "Complaint reference ID is required")
    private String complaintId;

    @NotBlank(message = "Contact verification (registered email or mobile number) is required")
    private String verification;

    public TrackComplaintRequest() {
    }

    public TrackComplaintRequest(String complaintId, String verification) {
        this.complaintId = complaintId;
        this.verification = verification;
    }

    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
    }

    public String getVerification() {
        return verification;
    }

    public void setVerification(String verification) {
        this.verification = verification;
    }
}
