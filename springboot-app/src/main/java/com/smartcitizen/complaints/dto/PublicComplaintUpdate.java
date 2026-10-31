package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.ComplaintAuditLog;
import com.smartcitizen.complaints.model.ComplaintStatus;

import java.time.LocalDateTime;

public record PublicComplaintUpdate(ComplaintStatus status, LocalDateTime updatedAt) {

    public static PublicComplaintUpdate fromAuditLog(ComplaintAuditLog auditLog) {
        return new PublicComplaintUpdate(auditLog.getToStatus(), auditLog.getCreatedAt());
    }
}
