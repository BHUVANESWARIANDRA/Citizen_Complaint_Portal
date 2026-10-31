package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;

import java.time.LocalDateTime;
import java.util.List;

public record ComplaintTrackingResponse(
        String complaintId,
        ComplaintCategory category,
        String categoryDisplayName,
        String description,
        ComplaintStatus status,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        List<PublicComplaintUpdate> publicUpdates
) {

    public static ComplaintTrackingResponse fromEntity(Complaint complaint) {
        List<PublicComplaintUpdate> publicUpdates = complaint.getAuditLogs() == null
                ? List.of()
                : complaint.getAuditLogs().stream()
                        .map(PublicComplaintUpdate::fromAuditLog)
                        .toList();

        ComplaintCategory category = complaint.getCategory();
        return new ComplaintTrackingResponse(
                complaint.getComplaintId(),
                category,
                category != null ? category.getDisplayName() : "",
                complaint.getDescription(),
                complaint.getStatus(),
                complaint.getCreatedAt(),
                complaint.getUpdatedAt(),
                publicUpdates
        );
    }
}
