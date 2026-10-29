package com.smartcitizen.complaints.service;

import com.smartcitizen.complaints.dto.ComplaintResponse;
import com.smartcitizen.complaints.dto.ComplaintStatsResponse;
import com.smartcitizen.complaints.dto.CreateComplaintRequest;
import com.smartcitizen.complaints.dto.TrackComplaintRequest;
import com.smartcitizen.complaints.dto.UpdateStatusRequest;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;

import java.util.List;

public interface ComplaintService {

    ComplaintResponse createComplaint(CreateComplaintRequest request);

    List<ComplaintResponse> getComplaints(ComplaintCategory category, ComplaintStatus status, String search);

    List<ComplaintResponse> getMyComplaints();

    ComplaintResponse getComplaintByIdOrIdentifier(String identifier);

    ComplaintResponse trackComplaint(TrackComplaintRequest request);

    ComplaintResponse updateComplaintStatus(String identifier, UpdateStatusRequest request);

    void deleteComplaint(String identifier);

    ComplaintStatsResponse getStats();
}
