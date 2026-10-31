package com.smartcitizen.complaints.controller;

import com.smartcitizen.complaints.dto.ComplaintResponse;
import com.smartcitizen.complaints.dto.ComplaintStatsResponse;
import com.smartcitizen.complaints.dto.ComplaintTrackingResponse;
import com.smartcitizen.complaints.dto.CreateComplaintRequest;
import com.smartcitizen.complaints.dto.TrackComplaintRequest;
import com.smartcitizen.complaints.dto.UpdateStatusRequest;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.service.ComplaintService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/complaints")
public class ComplaintController {

    private final ComplaintService complaintService;

    public ComplaintController(ComplaintService complaintService) {
        this.complaintService = complaintService;
    }

    /**
     * Submit a new citizen complaint.
     * If user is authenticated, automatically attaches complaint to citizen profile.
     */
    @PostMapping
    public ResponseEntity<ComplaintResponse> createComplaint(@Valid @RequestBody CreateComplaintRequest request) {
        ComplaintResponse response = complaintService.createComplaint(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * View all complaints with optional filtering by category, status, or search keyword.
     */
    @GetMapping
    public ResponseEntity<List<ComplaintResponse>> getAllComplaints(
            @RequestParam(required = false) ComplaintCategory category,
            @RequestParam(required = false) ComplaintStatus status,
            @RequestParam(required = false) String search) {
        List<ComplaintResponse> complaints = complaintService.getComplaints(category, status, search);
        return ResponseEntity.ok(complaints);
    }

    /**
     * Retrieve complaints submitted by the currently authenticated citizen.
     */
    @GetMapping("/my")
    public ResponseEntity<List<ComplaintResponse>> getMyComplaints() {
        List<ComplaintResponse> complaints = complaintService.getMyComplaints();
        return ResponseEntity.ok(complaints);
    }

    /**
     * Securely track a complaint by reference ID and verification (email or phone).
     */
    @PostMapping("/track")
    public ResponseEntity<ComplaintTrackingResponse> trackComplaint(@Valid @RequestBody TrackComplaintRequest request) {
        ComplaintTrackingResponse response = complaintService.trackComplaint(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Get aggregate statistics for the landing page and administrator portal.
     */
    @GetMapping("/stats")
    public ResponseEntity<ComplaintStatsResponse> getStats() {
        ComplaintStatsResponse stats = complaintService.getStats();
        return ResponseEntity.ok(stats);
    }

    /**
     * Search and view a single complaint by database ID or alphanumeric Complaint ID.
     */
    @GetMapping("/{id}")
    public ResponseEntity<ComplaintResponse> getComplaintById(@PathVariable String id) {
        ComplaintResponse response = complaintService.getComplaintByIdOrIdentifier(id);
        return ResponseEntity.ok(response);
    }

    /**
     * Update the status and/or add an administrator remark to a complaint.
     * Enforces municipal officer or administrator access in the backend service layer.
     */
    @PutMapping("/{id}/status")
    public ResponseEntity<ComplaintResponse> updateComplaintStatus(
            @PathVariable String id,
            @Valid @RequestBody UpdateStatusRequest request) {
        ComplaintResponse updated = complaintService.updateComplaintStatus(id, request);
        return ResponseEntity.ok(updated);
    }

    /**
     * Delete a complaint (requires confirmation on the client side).
     * Enforces municipal officer or administrator access in the backend service layer.
     */
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteComplaint(@PathVariable String id) {
        complaintService.deleteComplaint(id);
        return ResponseEntity.noContent().build();
    }
}
