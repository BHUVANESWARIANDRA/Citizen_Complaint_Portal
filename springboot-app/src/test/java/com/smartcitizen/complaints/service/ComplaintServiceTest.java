package com.smartcitizen.complaints.service;

import com.smartcitizen.complaints.dto.ComplaintResponse;
import com.smartcitizen.complaints.dto.ComplaintStatsResponse;
import com.smartcitizen.complaints.dto.CreateComplaintRequest;
import com.smartcitizen.complaints.dto.TrackComplaintRequest;
import com.smartcitizen.complaints.dto.UpdateStatusRequest;
import com.smartcitizen.complaints.exception.ForbiddenException;
import com.smartcitizen.complaints.exception.ResourceNotFoundException;
import com.smartcitizen.complaints.exception.UnauthorizedException;
import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.model.OfficerNotification;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.repository.ComplaintRepository;
import com.smartcitizen.complaints.repository.OfficerNotificationRepository;
import com.smartcitizen.complaints.repository.UserRepository;
import com.smartcitizen.complaints.security.SecurityContext;
import com.smartcitizen.complaints.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private OfficerNotificationRepository notificationRepository;

    @InjectMocks
    private ComplaintServiceImpl complaintService;

    private Complaint sampleComplaint;

    @BeforeEach
    void setUp() {
        sampleComplaint = new Complaint(
                "CMP-2026-99999",
                "Flickering Streetlight",
                ComplaintCategory.STREETLIGHTS,
                "Light keeps blinking every few seconds",
                "Lane 4",
                "Sunil",
                "sunil@example.com",
                "9876500000"
        );
        sampleComplaint.setId(10L);
    }

    @AfterEach
    void tearDown() {
        SecurityContext.clear();
    }

    @Test
    @DisplayName("Should successfully create complaint with auto-generated ID and SUBMITTED status")
    void testCreateComplaint() {
        CreateComplaintRequest request = new CreateComplaintRequest(
                "Broken Water Main",
                ComplaintCategory.WATER_SUPPLY,
                "Flooding the street with high velocity water",
                "Ring Road Junction",
                "Sunil",
                "sunil@example.com",
                "9876500000"
        );

        when(complaintRepository.existsByComplaintId(anyString())).thenReturn(false);
        when(complaintRepository.save(any(Complaint.class))).thenAnswer(invocation -> {
            Complaint c = invocation.getArgument(0);
            c.setId(1L);
            return c;
        });

        ComplaintResponse response = complaintService.createComplaint(request);

        assertThat(response).isNotNull();
        assertThat(response.getComplaintId()).startsWith("CMP-");
        assertThat(response.getTitle()).isEqualTo("Broken Water Main");
        assertThat(response.getStatus()).isEqualTo(ComplaintStatus.SUBMITTED);
        verify(complaintRepository, times(1)).save(any(Complaint.class));
        verify(notificationRepository).save(any(OfficerNotification.class));
    }

    @Test
    @DisplayName("Should retrieve complaint by complaintId string")
    void testGetComplaintByIdOrIdentifier() {
        SecurityContext.setCurrentUser(new UserPrincipal(1L, "admin@smartcitizen.gov", "Administrator", Role.ROLE_ADMIN));
        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));

        ComplaintResponse response = complaintService.getComplaintByIdOrIdentifier("CMP-2026-99999");

        assertThat(response).isNotNull();
        assertThat(response.getComplaintId()).isEqualTo("CMP-2026-99999");
        assertThat(response.getTitle()).isEqualTo("Flickering Streetlight");
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when complaint does not exist")
    void testGetComplaint_NotFound() {
        SecurityContext.setCurrentUser(new UserPrincipal(1L, "admin@smartcitizen.gov", "Administrator", Role.ROLE_ADMIN));
        when(complaintRepository.findByComplaintId("CMP-UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getComplaintByIdOrIdentifier("CMP-UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Complaint not found with ID: CMP-UNKNOWN");
    }

    @Test
    @DisplayName("Should reject complaint detail reads without authentication")
    void testGetComplaintById_Unauthenticated() {
        assertThatThrownBy(() -> complaintService.getComplaintByIdOrIdentifier("CMP-2026-99999"))
                .isInstanceOf(UnauthorizedException.class);
        verifyNoInteractions(complaintRepository);
    }

    @Test
    @DisplayName("Should reject full complaint list reads by citizens")
    void testGetComplaints_ForbiddenForCitizen() {
        SecurityContext.setCurrentUser(new UserPrincipal(2L, "citizen@example.com", "Citizen User", Role.ROLE_CITIZEN));

        assertThatThrownBy(() -> complaintService.getComplaints(null, null, null))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Municipal officer role");
        verifyNoInteractions(complaintRepository);
    }

    @Test
    @DisplayName("Should allow an officer to view the complaint list")
    void testGetComplaints_OfficerCanRead() {
        SecurityContext.setCurrentUser(new UserPrincipal(3L, "officer@example.com", "Officer", Role.ROLE_OFFICER));
        when(complaintRepository.filterAndSearch(null, null, null)).thenReturn(java.util.List.of(sampleComplaint));

        assertThat(complaintService.getComplaints(null, null, null))
                .extracting(ComplaintResponse::getComplaintId)
                .containsExactly("CMP-2026-99999");
    }

    @Test
    @DisplayName("Should deny officers access to the citizen-only complaint list")
    void testGetMyComplaints_ForbiddenForOfficer() {
        SecurityContext.setCurrentUser(new UserPrincipal(
                3L, "officer@example.com", "Officer", Role.ROLE_OFFICER));

        assertThatThrownBy(() -> complaintService.getMyComplaints())
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Only citizens");
        verifyNoInteractions(userRepository, complaintRepository);
    }

    @Test
    @DisplayName("Should allow citizens to read only their own complaint details")
    void testGetComplaintById_OwnerCanRead() {
        SecurityContext.setCurrentUser(new UserPrincipal(2L, "sunil@example.com", "Sunil", Role.ROLE_CITIZEN));
        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));

        ComplaintResponse response = complaintService.getComplaintByIdOrIdentifier("CMP-2026-99999");

        assertThat(response.getComplaintId()).isEqualTo("CMP-2026-99999");
    }

    @Test
    @DisplayName("Should deny citizens access to another citizen's complaint details")
    void testGetComplaintById_ForbiddenForOtherCitizen() {
        SecurityContext.setCurrentUser(new UserPrincipal(2L, "other@example.com", "Other Citizen", Role.ROLE_CITIZEN));
        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));

        assertThatThrownBy(() -> complaintService.getComplaintByIdOrIdentifier("CMP-2026-99999"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("not authorized");
    }

    @Test
    @DisplayName("Should allow tracking complaint with matching email verification")
    void testTrackComplaint_Success() {
        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));

        TrackComplaintRequest request = new TrackComplaintRequest("CMP-2026-99999", "sunil@example.com");
        ComplaintResponse response = complaintService.trackComplaint(request);

        assertThat(response).isNotNull();
        assertThat(response.getComplaintId()).isEqualTo("CMP-2026-99999");
    }

    @Test
    @DisplayName("Should reject tracking complaint with mismatched verification")
    void testTrackComplaint_MismatchedVerification() {
        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));

        TrackComplaintRequest request = new TrackComplaintRequest("CMP-2026-99999", "wrong@example.com");

        assertThatThrownBy(() -> complaintService.trackComplaint(request))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("verification details");
    }

    @Test
    @DisplayName("Should update complaint status and add admin remark when caller is ADMIN")
    void testUpdateComplaintStatus() {
        SecurityContext.setCurrentUser(new UserPrincipal(1L, "admin@smartcitizen.gov", "Administrator", Role.ROLE_ADMIN));

        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));
        when(complaintRepository.save(any(Complaint.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        UpdateStatusRequest updateRequest = new UpdateStatusRequest(
                ComplaintStatus.IN_PROGRESS,
                "Maintenance crew assigned."
        );

        ComplaintResponse updated = complaintService.updateComplaintStatus("CMP-2026-99999", updateRequest);

        assertThat(updated.getStatus()).isEqualTo(ComplaintStatus.IN_PROGRESS);
        assertThat(updated.getAdminRemark()).isEqualTo("Maintenance crew assigned.");
    }

    @Test
    @DisplayName("Should reject complaint status update when caller is not ADMIN")
    void testUpdateComplaintStatus_Unauthorized() {
        SecurityContext.setCurrentUser(new UserPrincipal(2L, "citizen@example.com", "Citizen User", Role.ROLE_CITIZEN));

        UpdateStatusRequest updateRequest = new UpdateStatusRequest(
                ComplaintStatus.IN_PROGRESS,
                "Maintenance crew assigned."
        );

        assertThatThrownBy(() -> complaintService.updateComplaintStatus("CMP-2026-99999", updateRequest))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("Municipal officer role");
    }

    @Test
    @DisplayName("Should delete complaint successfully when caller is ADMIN")
    void testDeleteComplaint() {
        SecurityContext.setCurrentUser(new UserPrincipal(1L, "admin@smartcitizen.gov", "Administrator", Role.ROLE_ADMIN));

        when(complaintRepository.findByComplaintId("CMP-2026-99999"))
                .thenReturn(Optional.of(sampleComplaint));
        doNothing().when(complaintRepository).delete(sampleComplaint);

        complaintService.deleteComplaint("CMP-2026-99999");

        verify(complaintRepository, times(1)).delete(sampleComplaint);
    }

    @Test
    @DisplayName("Should compute correct aggregate stats")
    void testGetStats() {
        when(complaintRepository.count()).thenReturn(10L);
        when(complaintRepository.countByStatus(ComplaintStatus.SUBMITTED)).thenReturn(4L);
        when(complaintRepository.countByStatus(ComplaintStatus.UNDER_REVIEW)).thenReturn(1L);
        when(complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS)).thenReturn(3L);
        when(complaintRepository.countByStatus(ComplaintStatus.RESOLVED)).thenReturn(2L);
        when(complaintRepository.countByStatus(ComplaintStatus.REJECTED)).thenReturn(0L);

        ComplaintStatsResponse stats = complaintService.getStats();

        assertThat(stats.getTotalComplaints()).isEqualTo(10L);
        assertThat(stats.getSubmittedCount()).isEqualTo(4L);
        assertThat(stats.getUnderReviewCount()).isEqualTo(1L);
        assertThat(stats.getInProgressCount()).isEqualTo(3L);
        assertThat(stats.getResolvedCount()).isEqualTo(2L);
        assertThat(stats.getRejectedCount()).isEqualTo(0L);
    }
}
