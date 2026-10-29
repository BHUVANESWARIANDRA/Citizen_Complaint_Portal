package com.smartcitizen.complaints.repository;

import com.smartcitizen.complaints.model.OfficerNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OfficerNotificationRepository extends JpaRepository<OfficerNotification, Long> {

    List<OfficerNotification> findAllByOrderByCreatedAtDesc();

    long countByIsReadFalse();
}
