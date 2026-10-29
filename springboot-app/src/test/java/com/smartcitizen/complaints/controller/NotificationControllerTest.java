package com.smartcitizen.complaints.controller;

import com.smartcitizen.complaints.model.OfficerNotification;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.repository.OfficerNotificationRepository;
import com.smartcitizen.complaints.security.JwtService;
import com.smartcitizen.complaints.security.SecurityContext;
import com.smartcitizen.complaints.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(NotificationController.class)
class NotificationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OfficerNotificationRepository notificationRepository;

    @MockBean
    private JwtService jwtService;

    @BeforeEach
    void setUp() {
        SecurityContext.setCurrentUser(new UserPrincipal(1L, "officer@smartcitizen.gov", "Officer Sharma", Role.ROLE_OFFICER));
    }

    @AfterEach
    void tearDown() {
        SecurityContext.clear();
    }

    @Test
    @DisplayName("GET /api/notifications should return list of notifications for officer")
    void testGetNotifications_Success() throws Exception {
        OfficerNotification n1 = new OfficerNotification("CMP-2026-10021", "Pothole on Main Road", "Rajesh Kumar", LocalDateTime.now());
        n1.setId(1L);

        when(notificationRepository.findAllByOrderByCreatedAtDesc()).thenReturn(List.of(n1));
        when(notificationRepository.countByIsReadFalse()).thenReturn(1L);

        mockMvc.perform(get("/api/notifications"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.unreadCount", is(1)))
                .andExpect(jsonPath("$.notifications", hasSize(1)))
                .andExpect(jsonPath("$.notifications[0].complaintId", is("CMP-2026-10021")));
    }

    @Test
    @DisplayName("PUT /api/notifications/{id}/read should mark notification as read")
    void testMarkAsRead_Success() throws Exception {
        OfficerNotification n1 = new OfficerNotification("CMP-2026-10021", "Pothole on Main Road", "Rajesh Kumar", LocalDateTime.now());
        n1.setId(1L);

        when(notificationRepository.findById(1L)).thenReturn(Optional.of(n1));
        when(notificationRepository.save(any(OfficerNotification.class))).thenAnswer(i -> i.getArgument(0));

        mockMvc.perform(put("/api/notifications/1/read"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.read", is(true)));
    }
}
