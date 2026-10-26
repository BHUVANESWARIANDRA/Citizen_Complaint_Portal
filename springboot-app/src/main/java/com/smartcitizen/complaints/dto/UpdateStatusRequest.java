package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.ComplaintStatus;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class UpdateStatusRequest {

    @NotNull(message = "Complaint status is required")
    private ComplaintStatus status;

    @Size(max = 2000, message = "Administrator remark must not exceed 2000 characters")
    private String adminRemark;

    public UpdateStatusRequest() {
    }

    public UpdateStatusRequest(ComplaintStatus status, String adminRemark) {
        this.status = status;
        this.adminRemark = adminRemark;
    }

    public ComplaintStatus getStatus() {
        return status;
    }

    public void setStatus(ComplaintStatus status) {
        this.status = status;
    }

    public String getAdminRemark() {
        return adminRemark;
    }

    public void setAdminRemark(String adminRemark) {
        this.adminRemark = adminRemark;
    }
}
