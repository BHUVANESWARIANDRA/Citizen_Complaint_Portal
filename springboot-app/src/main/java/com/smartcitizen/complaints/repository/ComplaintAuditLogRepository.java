package com.smartcitizen.complaints.repository;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintAuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComplaintAuditLogRepository extends JpaRepository<ComplaintAuditLog, Long> {

    List<ComplaintAuditLog> findByComplaintOrderByCreatedAtAsc(Complaint complaint);
}
