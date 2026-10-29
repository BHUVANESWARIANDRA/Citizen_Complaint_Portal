package com.smartcitizen.complaints.service;

import com.smartcitizen.complaints.dto.ComplaintResponse;
import com.smartcitizen.complaints.dto.ComplaintStatsResponse;
import com.smartcitizen.complaints.dto.CreateComplaintRequest;
import com.smartcitizen.complaints.dto.TrackComplaintRequest;
import com.smartcitizen.complaints.dto.UpdateStatusRequest;
import com.smartcitizen.complaints.exception.ForbiddenException;
import com.smartcitizen.complaints.exception.ResourceNotFoundException;
import com.smartcitizen.complaints.exception.UnauthorizedException;
import com.smartcitizen.complaints.exception.UnauthorizedException;
import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.model.OfficerNotification;
import com.smartcitizen.complaints.model.User;
import com.smartcitizen.complaints.repository.ComplaintRepository;
import com.smartcitizen.complaints.repository.OfficerNotificationRepository;
import com.smartcitizen.complaints.repository.UserRepository;
import com.smartcitizen.complaints.security.SecurityContext;
import com.smartcitizen.complaints.security.UserPrincipal;
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
    private final UserRepository userRepository;
    private final OfficerNotificationRepository notificationRepository;
    private final SecureRandom random = new SecureRandom();

    public ComplaintServiceImpl(ComplaintRepository complaintRepository,
                                UserRepository userRepository,
                                OfficerNotificationRepository notificationRepository) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
    }

    @Override
    public ComplaintResponse createComplaint(CreateComplaintRequest request) {
        String uniqueId = generateUniqueComplaintId();

        User citizenUser = null;
        String citizenName = request.getCitizenName() != null ? request.getCitizenName().trim() : null;
        String citizenEmail = request.getCitizenEmail() != null ? request.getCitizenEmail().trim().toLowerCase() : null;
        String citizenPhone = request.getCitizenPhone() != null ? request.getCitizenPhone().trim() : null;

        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal != null) {
            if (!principal.isCitizen()) {
                throw new ForbiddenException("Only citizens may submit complaints while signed in.");
            }
            citizenUser = userRepository.findById(principal.getUserId())
                    .orElseThrow(() -> new UnauthorizedException("The signed-in citizen account could not be found."));
            citizenName = citizenUser.getName();
            citizenEmail = citizenUser.getEmail();
            citizenPhone = citizenUser.getPhone();
        }

        Complaint complaint = new Complaint(
                uniqueId,
                request.getTitle().trim(),
                request.getCategory(),
                request.getDescription().trim(),
                request.getLocation().trim(),
                citizenName,
                citizenEmail,
                citizenPhone
        );

        if (request.getPhoto() != null && !request.getPhoto().trim().isEmpty()) {
            complaint.setPhoto(request.getPhoto().trim());
        }

        if (citizenUser != null) {
            complaint.setCitizen(citizenUser);
        }

        String loggedBy = (citizenName != null && !citizenName.isEmpty()) ? citizenName : "Citizen";
        complaint.addAuditLog(null, ComplaintStatus.SUBMITTED, "Complaint submitted via Smart Citizen portal.", loggedBy);

        Complaint saved = complaintRepository.save(complaint);

        OfficerNotification notification = new OfficerNotification(
                saved.getComplaintId(),
                saved.getTitle(),
                saved.getCitizenName() != null ? saved.getCitizenName() : "Citizen",
                saved.getCreatedAt()
        );
        notificationRepository.save(notification);

        return ComplaintResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getComplaints(ComplaintCategory category, ComplaintStatus status, String search) {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null) {
            throw new UnauthorizedException("Authentication is required to view all complaints.");
        }
        if (!principal.isOfficer()) {
            throw new ForbiddenException("Municipal officer role is required to view all complaints.");
        }

        String cleanedSearch = (search != null && !search.trim().isEmpty()) ? search.trim() : null;
        List<Complaint> complaints = complaintRepository.filterAndSearch(category, status, cleanedSearch);
        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ComplaintResponse> getMyComplaints() {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null) {
            throw new UnauthorizedException("Authentication is required to view your complaints.");
        }
        if (!principal.isCitizen()) {
            throw new ForbiddenException("Only citizens may view their own complaints.");
        }

        User user = userRepository.findById(principal.getUserId()).orElse(null);
        List<Complaint> complaints;
        if (user != null) {
            complaints = complaintRepository.findByCitizenOrEmail(user, principal.getEmail());
        } else {
            complaints = complaintRepository.findByCitizenOrEmail(null, principal.getEmail());
        }

        return complaints.stream()
                .map(ComplaintResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse getComplaintByIdOrIdentifier(String identifier) {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null) {
            throw new UnauthorizedException("Authentication is required to view complaint details.");
        }

        Complaint complaint = findByIdentifier(identifier);
        boolean isOwner = principal.isCitizen()
                && ((complaint.getCitizen() != null
                        && complaint.getCitizen().getId().equals(principal.getUserId()))
                    || (complaint.getCitizenEmail() != null
                        && complaint.getCitizenEmail().equalsIgnoreCase(principal.getEmail())));
        if (!principal.isOfficer() && !isOwner) {
            throw new ForbiddenException("You are not authorized to view this complaint.");
        }

        return ComplaintResponse.fromEntity(complaint);
    }

    @Override
    @Transactional(readOnly = true)
    public ComplaintResponse trackComplaint(TrackComplaintRequest request) {
        Complaint complaint = findByIdentifier(request.getComplaintId());

        UserPrincipal principal = SecurityContext.getCurrentUser();
        boolean isAuthorized = false;

        if (principal != null) {
            if (principal.isOfficer()) {
                isAuthorized = true;
            } else if (complaint.getCitizen() != null && complaint.getCitizen().getId().equals(principal.getUserId())) {
                isAuthorized = true;
            } else if (principal.getEmail().equalsIgnoreCase(complaint.getCitizenEmail())) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) {
            String verification = request.getVerification() != null ? request.getVerification().trim().toLowerCase() : "";
            boolean matchesEmail = complaint.getCitizenEmail() != null &&
                    complaint.getCitizenEmail().trim().toLowerCase().equals(verification);
            boolean matchesPhone = complaint.getCitizenPhone() != null &&
                    complaint.getCitizenPhone().trim().equals(verification);

            if (!matchesEmail && !matchesPhone) {
                throw new ForbiddenException("Complaint ID and verification details (registered email or phone) do not match.");
            }
        }

        return ComplaintResponse.fromEntity(complaint);
    }

    @Override
    public ComplaintResponse updateComplaintStatus(String identifier, UpdateStatusRequest request) {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null || !principal.isOfficer()) {
            throw new ForbiddenException("Municipal officer role is required to update complaint status.");
        }

        Complaint complaint = findByIdentifier(identifier);
        ComplaintStatus oldStatus = complaint.getStatus();
        complaint.setStatus(request.getStatus());

        String remark = request.getAdminRemark() != null ? request.getAdminRemark().trim() : null;
        if (remark != null) {
            complaint.setAdminRemark(remark);
        }

        complaint.addAuditLog(oldStatus, request.getStatus(), remark, principal.getName());
        Complaint updated = complaintRepository.save(complaint);
        return ComplaintResponse.fromEntity(updated);
    }

    @Override
    public void deleteComplaint(String identifier) {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null || !principal.isOfficer()) {
            throw new ForbiddenException("Municipal officer role is required to delete complaints.");
        }

        Complaint complaint = findByIdentifier(identifier);
        complaintRepository.delete(complaint);
    }

    @Override
    public ComplaintStatsResponse getStats() {
        long total = safeCount();
        long submitted = safeCountStatus(ComplaintStatus.SUBMITTED) + safeCountStatus(ComplaintStatus.PENDING);
        long underReview = safeCountStatus(ComplaintStatus.UNDER_REVIEW);
        long inProgress = safeCountStatus(ComplaintStatus.IN_PROGRESS);
        long resolved = safeCountStatus(ComplaintStatus.RESOLVED);
        long rejected = safeCountStatus(ComplaintStatus.REJECTED);

        return new ComplaintStatsResponse(total, submitted, underReview, inProgress, resolved, rejected);
    }

    private long safeCount() {
        try {
            return complaintRepository.count();
        } catch (Exception e) {
            return 0;
        }
    }

    private long safeCountStatus(ComplaintStatus status) {
        try {
            return complaintRepository.countByStatus(status);
        } catch (Exception e) {
            return 0;
        }
    }

    private Complaint findByIdentifier(String identifier) {
        if (identifier == null || identifier.trim().isEmpty()) {
            throw new ResourceNotFoundException("Complaint identifier must not be empty");
        }

        String trimmed = identifier.trim();

        if (trimmed.toUpperCase().startsWith("CMP-")) {
            return complaintRepository.findByComplaintId(trimmed.toUpperCase())
                    .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + trimmed));
        }

        try {
            Long numericId = Long.parseLong(trimmed);
            return complaintRepository.findById(numericId)
                    .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + numericId));
        } catch (NumberFormatException ex) {
            return complaintRepository.findByComplaintId(trimmed)
                    .orElseThrow(() -> new ResourceNotFoundException("Complaint not found with ID: " + trimmed));
        }
    }

    private String generateUniqueComplaintId() {
        int year = LocalDate.now().getYear();
        String generatedId;
        int attempts = 0;
        do {
            int randomNum = 10000 + random.nextInt(90000);
            generatedId = String.format("CMP-%d-%d", year, randomNum);
            attempts++;
            if (attempts > 50) {
                generatedId = String.format("CMP-%d-%d-%d", year, randomNum, System.currentTimeMillis() % 10000);
                break;
            }
        } while (complaintRepository.existsByComplaintId(generatedId));

        return generatedId;
    }
}
