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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional
public class ComplaintServiceImpl implements ComplaintService {

    private final ComplaintRepository complaintRepository;
    private final SecureRandom random = new SecureRandom();

    public ComplaintServiceImpl(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Override
    public ComplaintResponse createComplaint(CreateComplaintRequest request) {
        String uniqueId = generateUniqueComplaintId();

        Complaint complaint = new Complaint(
                uniqueId,
                request.getTitle().trim(),
                request.getCategory(),
                request.getDescription().trim(),
                request.getLocation().trim(),
                request.getCitizenName() != null ? request.getCitizenName().trim() : null,
                request.getCitizenEmail() != null ? request.getCitizenEmail().trim() : null,
                request.getCitizenPhone() != null ? request.getCitizenPhone().trim() : null
        );

        Complaint saved = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints(ComplaintCategory category, ComplaintStatus status, String search) {
        String cleanedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<Complaint> complaints = complaintRepository.filterAndSearch(category, status, cleanedSearch);
        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintByIdOrIdentifier(String identifier) {
        Complaint complaint = findByIdentifier(identifier);
        return ComplaintResponse.fromEntity(complaint);
    }

    @Override
    public ComplaintResponse updateComplaintStatus(String identifier, UpdateStatusRequest request) {
        Complaint complaint = findByIdentifier(identifier);
        complaint.setStatus(request.getStatus());
        if (request.getAdminRemark() != null) {
            complaint.setAdminRemark(request.getAdminRemark().trim());
        }
        Complaint updated = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updated);
    }

    @Override
    public void deleteComplaint(String identifier) {
        Complaint complaint = findByIdentifier(identifier);
        complaintRepository.delete(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintStatsResponse getStats() {
        long total = complaintRepository.count();
        long submitted = complaintRepository.countByStatus(ComplaintStatus.SUBMITTED);
        long inProgress = complaintRepository.countByStatus(ComplaintStatus.IN_PROGRESS);
        long resolved = complaintRepository.countByStatus(ComplaintStatus.RESOLVED);

        return new ComplaintStatsResponse(total, submitted, inProgress, resolved);
    }

    private Complaint findByIdentifier(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new ResourceNotFoundException("Complaint identifier must not be empty");
        }

        String trimmed = identifier.trim();

        // 1. Check if numeric primary key
        if (trimmed.matches("^\\d+$")) {
            Long numericId = Long.parseLong(trimmed);
            var byId = complaintRepository.findById(numericId);
            if (byId.isPresent()) {
                return byId.get();
            }
        }

        // 2. Query by complaintId string (e.g. CMP-2026-XXXX)
        return complaintRepository.findByComplaintId(trimmed)
                .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with identifier: " + trimmed));
    }

    private String generateUniqueComplaintId() {
        int year = LocalDate.now().getYear();
        String candidate;
        do {
            int randomNum = 10000 + random.nextInt(90000);
            candidate = String.format("CMP-%d-%d", year, randomNum);
        } while (complaintRepository.existsByComplaintId(candidate));
        return candidate;
    }
}
