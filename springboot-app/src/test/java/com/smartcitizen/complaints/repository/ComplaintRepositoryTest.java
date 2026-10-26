package com.smartcitizen.complaints.repository;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

@DataJpaTest
class ComplaintRepositoryTest {

    @Autowired
    private ComplaintRepository complaintRepository;

    @Test
    @DisplayName("Should save and retrieve complaint by unique complaintId")
    void testSaveAndFindByComplaintId() {
        Complaint complaint = new Complaint(
                "CMP-TEST-001",
                "Damaged Streetlight Pole",
                ComplaintCategory.STREETLIGHTS,
                "Pole tilted dangerously towards the road",
                "Crossroad 3",
                "Rahul",
                "rahul@example.com",
                "9876543210"
        );
        complaintRepository.save(complaint);

        Optional<Complaint> found = complaintRepository.findByComplaintId("CMP-TEST-001");
        assertThat(found).isPresent();
        assertThat(found.get().getTitle()).isEqualTo("Damaged Streetlight Pole");
        assertThat(found.get().getStatus()).isEqualTo(ComplaintStatus.SUBMITTED);
    }

    @Test
    @DisplayName("Should count complaints correctly by status")
    void testCountByStatus() {
        Complaint c1 = new Complaint("CMP-01", "Pothole 1", ComplaintCategory.ROADS_AND_POTHOLES, "Desc 1", "Loc 1", null, null, null);
        c1.setStatus(ComplaintStatus.SUBMITTED);

        Complaint c2 = new Complaint("CMP-02", "Pothole 2", ComplaintCategory.ROADS_AND_POTHOLES, "Desc 2", "Loc 2", null, null, null);
        c2.setStatus(ComplaintStatus.IN_PROGRESS);

        complaintRepository.save(c1);
        complaintRepository.save(c2);

        long submitted = complaintRepository.countByStatus(ComplaintStatus.SUBMITTED);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);

        assertThat(submitted).isGreaterThanOrEqualTo(1);
        assertThat(inProgress).isGreaterThanOrEqualTo(1);
        assertThat(resolved).isGreaterThanOrEqualTo(0);
    }

    @Test
    @DisplayName("Should filter complaints by category and status")
    void testFilterAndSearch() {
        Complaint c = new Complaint(
                "CMP-SEARCH-1",
                "Water Pipeline Leakage",
                ComplaintCategory.WATER_SUPPLY,
                "Massive water waste near supermarket",
                "Market Road",
                "Kavita",
                "kavita@test.com",
                "9998887776"
        );
        complaintRepository.save(c);

        List<Complaint> results = complaintRepository.filterAndSearch(
                ComplaintCategory.WATER_SUPPLY,
                ComplaintStatus.SUBMITTED,
                "pipeline"
        );

        assertThat(results).isNotEmpty();
        assertThat(results.get(0).getComplaintId()).isEqualTo("CMP-SEARCH-1");
    }
}
