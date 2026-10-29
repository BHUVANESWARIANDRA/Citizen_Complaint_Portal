package com.smartcitizen.complaints.controller;

import com.smartcitizen.complaints.dto.NotificationListResponse;
import com.smartcitizen.complaints.dto.NotificationResponse;
import com.smartcitizen.complaints.exception.ForbiddenException;
import com.smartcitizen.complaints.exception.ResourceNotFoundException;
import com.smartcitizen.complaints.exception.UnauthorizedException;
import com.smartcitizen.complaints.model.OfficerNotification;
import com.smartcitizen.complaints.repository.OfficerNotificationRepository;
import com.smartcitizen.complaints.security.SecurityContext;
import com.smartcitizen.complaints.security.UserPrincipal;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final OfficerNotificationRepository notificationRepository;

    public NotificationController(OfficerNotificationRepository notificationRepository) {
        this.notificationRepository = notificationRepository;
    }

    private void verifyOfficerOrAdmin() {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null) {
            throw new UnauthorizedException("Authentication is required to view officer notifications.");
        }
        if (!principal.isOfficer()) {
            throw new ForbiddenException("Officer or Administrator privileges required to access notifications.");
        }
    }

    @GetMapping
    public ResponseEntity<NotificationListResponse> getNotifications() {
        verifyOfficerOrAdmin();
        List<OfficerNotification> entities = notificationRepository.findAllByOrderByCreatedAtDesc();
        long unreadCount = notificationRepository.countByIsReadFalse();

        List<NotificationResponse> dtoList = entities.stream()
                .map(NotificationResponse::fromEntity)
                .collect(Collectors.toList());

        return ResponseEntity.ok(new NotificationListResponse(dtoList, unreadCount));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<NotificationResponse> markAsRead(@PathVariable Long id) {
        verifyOfficerOrAdmin();
        OfficerNotification notif = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found with ID: " + id));

        notif.setRead(true);
        OfficerNotification saved = notificationRepository.save(notif);
        return ResponseEntity.ok(NotificationResponse.fromEntity(saved));
    }

    @PutMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        verifyOfficerOrAdmin();
        List<OfficerNotification> list = notificationRepository.findAll();
        for (OfficerNotification n : list) {
            n.setRead(true);
        }
        notificationRepository.saveAll(list);
        return ResponseEntity.ok().build();
    }
}
