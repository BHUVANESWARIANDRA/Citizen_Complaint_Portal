package com.smartcitizen.complaints.repository;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByComplaintId(String complaintId);

    boolean existsByComplaintId(String complaintId);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    List<Complaint> findByCategoryOrderByCreatedAtDesc(ComplaintCategory category);

    List<Complaint> findByStatusOrderByCreatedAtDesc(ComplaintStatus status);

    List<Complaint> findByCategoryAndStatusOrderByCreatedAtDesc(ComplaintCategory category, ComplaintStatus status);

    long countByStatus(ComplaintStatus status);

    @Query("SELECT c FROM Complaint c WHERE " +
           "(:category IS NULL OR c.category = :category) AND " +
           "(:status IS NULL OR c.status = :status) AND " +
           "(:search IS NULL OR LOWER(c.complaintId) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.title) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.location) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(c.description) LIKE LOWER(CONCAT('%', :search, '%'))) " +
           "ORDER BY c.createdAt DESC")
    List<Complaint> filterAndSearch(
            @Param("category") ComplaintCategory category,
            @Param("status") ComplaintStatus status,
            @Param("search") String search
    );
}
