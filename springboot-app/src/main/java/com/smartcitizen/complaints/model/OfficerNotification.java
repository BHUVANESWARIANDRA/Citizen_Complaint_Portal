package com.smartcitizen.complaints.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "officer_notifications", indexes = {
    @Index(name = "idx_notif_created", columnList = "createdAt"),
    @Index(name = "idx_notif_read", columnList = "isRead")
})
public class OfficerNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 32)
    private String complaintId;

    @Column(nullable = false, length = 150)
    private String title;

    @Column(length = 100)
    private String citizenName;

    @Column(nullable = false)
    private boolean isRead = false;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    public OfficerNotification() {
    }

    public OfficerNotification(String complaintId, String title, String citizenName, LocalDateTime createdAt) {
        this.complaintId = complaintId;
        this.title = title;
        this.citizenName = citizenName;
        this.createdAt = createdAt != null ? createdAt : LocalDateTime.now();
        this.isRead = false;
    }

    @PrePersist
    protected void onCreate() {
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

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

    public String getCitizenName() {
        return citizenName;
    }

    public void setCitizenName(String citizenName) {
        this.citizenName = citizenName;
    }

    public boolean isRead() {
        return isRead;
    }

    public void setRead(boolean read) {
        isRead = read;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
