package com.smartcitizen.complaints.service;

import com.smartcitizen.complaints.dto.ComplaintResponse;
import com.smartcitizen.complaints.dto.ComplaintStatsResponse;
import com.smartcitizen.complaints.dto.CreateComplaintRequest;
import com.smartcitizen.complaints.dto.UpdateStatusRequest;
import com.smartcitizen.complaints.exception.ResourceNotFoundException;
import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.repository.ComplaintRepository;
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
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ComplaintServiceTest {

    @Mock
    private ComplaintRepository complaintRepository;

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
    }

    @Test
    @DisplayName("Should retrieve complaint by complaintId string")
    void testGetComplaintByIdOrIdentifier() {
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
        when(complaintRepository.findByComplaintId("CMP-UNKNOWN"))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> complaintService.getComplaintByIdOrIdentifier("CMP-UNKNOWN"))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Complaint not found with identifier: CMP-UNKNOWN");
    }

    @Test
    @DisplayName("Should update complaint status and add admin remark")
    void testUpdateComplaintStatus() {
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
    @DisplayName("Should delete complaint successfully")
    void testDeleteComplaint() {
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
        when(complaintRepository.countByStatus(ComplaintStatus.SUBMITTED)).thenReturn(5L);
        when(complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS)).thenReturn(3L);
        when(complaintRepository.countByStatus(ComplaintStatus.RESOLVED)).thenReturn(2L);

        ComplaintStatsResponse stats = complaintService.getStats();

        assertThat(stats.getTotalComplaints()).isEqualTo(10L);
        assertThat(stats.getSubmittedCount()).isEqualTo(5L);
        assertThat(stats.getInProgressCount()).isEqualTo(3L);
        assertThat(stats.getResolvedCount()).isEqualTo(2L);
    }
}
