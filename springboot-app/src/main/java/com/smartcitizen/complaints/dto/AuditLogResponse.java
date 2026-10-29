package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.ComplaintAuditLog;
import com.smartcitizen.complaints.model.ComplaintStatus;

import java.time.LocalDateTime;

public class AuditLogResponse {

    private Long id;
    private ComplaintStatus fromStatus;
    private ComplaintStatus toStatus;
    private String remark;
    private String updatedBy;
    private LocalDateTime createdAt;

    public AuditLogResponse() {
    }

    public AuditLogResponse(Long id, ComplaintStatus fromStatus, ComplaintStatus toStatus, String remark, String updatedBy, LocalDateTime createdAt) {
        this.id = id;
        this.fromStatus = fromStatus;
        this.toStatus = toStatus;
        this.remark = remark;
        this.updatedBy = updatedBy;
        this.createdAt = createdAt;
    }

    public static AuditLogResponse fromEntity(ComplaintAuditLog log) {
        if (log == null) {
            return null;
        }
        return new AuditLogResponse(
                log.getId(),
                log.getFromStatus(),
                log.getToStatus(),
                log.getRemark(),
                log.getUpdatedBy(),
                log.getCreatedAt()
        );
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ComplaintStatus getFromStatus() {
        return fromStatus;
    }

    public void setFromStatus(ComplaintStatus fromStatus) {
        this.fromStatus = fromStatus;
    }

    public ComplaintStatus getToStatus() {
        return toStatus;
    }

    public void setToStatus(ComplaintStatus toStatus) {
        this.toStatus = toStatus;
    }

    public String getRemark() {
        return remark;
    }

    public void setRemark(String remark) {
        this.remark = remark;
    }

    public String getUpdatedBy() {
        return updatedBy;
    }

    public void setUpdatedBy(String updatedBy) {
        this.updatedBy = updatedBy;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
