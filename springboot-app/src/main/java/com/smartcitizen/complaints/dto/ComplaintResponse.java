package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class ComplaintResponse {

    private Long id;
    private String complaintId;
    private String title;
    private ComplaintCategory category;
    private String categoryDisplayName;
    private String description;
    private String location;
    private String citizenName;
    private String citizenEmail;
    private String citizenPhone;
    private Long citizenUserId;
    private ComplaintStatus status;
    private String adminRemark;
    private String photo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<AuditLogResponse> auditLogs = new ArrayList<>();

    public ComplaintResponse() {
    }

    public static ComplaintResponse fromEntity(Complaint complaint) {
        ComplaintResponse dto = new ComplaintResponse();
        dto.setId(complaint.getId());
        dto.setComplaintId(complaint.getComplaintId());
        dto.setTitle(complaint.getTitle());
        dto.setCategory(complaint.getCategory());
        dto.setCategoryDisplayName(complaint.getCategory() != null ? complaint.getCategory().getDisplayName() : "");
        dto.setDescription(complaint.getDescription());
        dto.setLocation(complaint.getLocation());
        dto.setCitizenName(complaint.getCitizenName());
        dto.setCitizenEmail(complaint.getCitizenEmail());
        dto.setCitizenPhone(complaint.getCitizenPhone());
        if (complaint.getCitizen() != null) {
            dto.setCitizenUserId(complaint.getCitizen().getId());
        }
        dto.setStatus(complaint.getStatus());
        dto.setAdminRemark(complaint.getAdminRemark());
        dto.setPhoto(complaint.getPhoto());
        dto.setCreatedAt(complaint.getCreatedAt());
        dto.setUpdatedAt(complaint.getUpdatedAt());

        if (complaint.getAuditLogs() != null && !complaint.getAuditLogs().isEmpty()) {
            dto.setAuditLogs(complaint.getAuditLogs().stream()
                    .map(AuditLogResponse::fromEntity)
                    .collect(Collectors.toList()));
        }
        return dto;
    }

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getComplaintId() {
        return complaintId;
    }

    public void setComplaintId(String complaintId) {
        this.complaintId = complaintId;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public ComplaintCategory getCategory() {
        return category;
    }

    public void setCategory(ComplaintCategory category) {
        this.category = category;
    }

    public String getCategoryDisplayName() {
        return categoryDisplayName;
    }

    public void setCategoryDisplayName(String categoryDisplayName) {
        this.categoryDisplayName = categoryDisplayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCitizenName() {
        return citizenName;
    }

    public void setCitizenName(String citizenName) {
        this.citizenName = citizenName;
    }

    public String getCitizenEmail() {
        return citizenEmail;
    }

    public void setCitizenEmail(String citizenEmail) {
        this.citizenEmail = citizenEmail;
    }

    public String getCitizenPhone() {
        return citizenPhone;
    }

    public void setCitizenPhone(String citizenPhone) {
        this.citizenPhone = citizenPhone;
    }

    public Long getCitizenUserId() {
        return citizenUserId;
    }

    public void setCitizenUserId(Long citizenUserId) {
        this.citizenUserId = citizenUserId;
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

    public String getPhoto() {
        return photo;
    }

    public void setPhoto(String photo) {
        this.photo = photo;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public List<AuditLogResponse> getAuditLogs() {
        return auditLogs;
    }

    public void setAuditLogs(List<AuditLogResponse> auditLogs) {
        this.auditLogs = auditLogs;
    }
}
