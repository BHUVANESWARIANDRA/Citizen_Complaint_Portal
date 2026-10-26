package com.smartcitizen.complaints.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcitizen.complaints.dto.ComplaintResponse;
import com.smartcitizen.complaints.dto.ComplaintStatsResponse;
import com.smartcitizen.complaints.dto.CreateComplaintRequest;
import com.smartcitizen.complaints.dto.UpdateStatusRequest;
import com.smartcitizen.complaints.exception.ResourceNotFoundException;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.service.ComplaintService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(ComplaintController.class)
class ComplaintControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ComplaintService complaintService;

    @Test
    @DisplayName("POST /api/complaints should return 201 Created on valid payload")
    void testCreateComplaint_Success() throws Exception {
        CreateComplaintRequest request = new CreateComplaintRequest(
                "Damaged Road Divider",
                ComplaintCategory.ROADS_AND_POTHOLES,
                "Concrete divider has cracked and fallen onto road",
                "Highway Exit 7",
                "Priya",
                "priya@example.com",
                "9876512345"
        );

        ComplaintResponse response = new ComplaintResponse();
        response.setId(1L);
        response.setComplaintId("CMP-2026-12345");
        response.setTitle("Damaged Road Divider");
        response.setCategory(ComplaintCategory.ROADS_AND_POTHOLES);
        response.setCategoryDisplayName("Roads and potholes");
        response.setDescription("Concrete divider has cracked and fallen onto road");
        response.setLocation("Highway Exit 7");
        response.setStatus(ComplaintStatus.SUBMITTED);
        response.setCreatedAt(LocalDateTime.now());
        response.setUpdatedAt(LocalDateTime.now());

        when(complaintService.createComplaint(any(CreateComplaintRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.complaintId", is("CMP-2026-12345")))
                .andExpect(jsonPath("$.title", is("Damaged Road Divider")))
                .andExpect(jsonPath("$.status", is("SUBMITTED")));
    }

    @Test
    @DisplayName("POST /api/complaints should return 400 Bad Request when validation fails")
    void testCreateComplaint_ValidationFailure() throws Exception {
        CreateComplaintRequest invalidRequest = new CreateComplaintRequest(
                "", // Blank title violates @NotBlank
                null, // Null category
                "short", // Description under 10 chars
                "", // Blank location
                null,
                "not-an-email", // Invalid email format
                null
        );

        mockMvc.perform(post("/api/complaints")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Validation Failed")))
                .andExpect(jsonPath("$.validationErrors", notNullValue()));
    }

    @Test
    @DisplayName("GET /api/complaints should return list of complaints")
    void testGetAllComplaints() throws Exception {
        ComplaintResponse r = new ComplaintResponse();
        r.setId(1L);
        r.setComplaintId("CMP-2026-11111");
        r.setTitle("Water Leakage");
        r.setCategory(ComplaintCategory.WATER_SUPPLY);
        r.setStatus(ComplaintStatus.SUBMITTED);

        when(complaintService.getComplaints(null, null, null)).thenReturn(List.of(r));

        mockMvc.perform(get("/api/complaints"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].complaintId", is("CMP-2026-11111")));
    }

    @Test
    @DisplayName("GET /api/complaints/{id} should return 404 when not found")
    void testGetComplaintById_NotFound() throws Exception {
        when(complaintService.getComplaintByIdOrIdentifier("CMP-MISSING"))
                .thenThrow(new ResourceNotFoundException("Complaint not found with identifier: CMP-MISSING"));

        mockMvc.perform(get("/api/complaints/CMP-MISSING"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error", is("Not Found")))
                .andExpect(jsonPath("$.message", containsString("CMP-MISSING")));
    }

    @Test
    @DisplayName("PUT /api/complaints/{id}/status should update status")
    void testUpdateStatus() throws Exception {
        UpdateStatusRequest update = new UpdateStatusRequest(ComplaintStatus.RESOLVED, "Fixed yesterday");

        ComplaintResponse updatedResponse = new ComplaintResponse();
        updatedResponse.setComplaintId("CMP-2026-11111");
        updatedResponse.setStatus(ComplaintStatus.RESOLVED);
        updatedResponse.setAdminRemark("Fixed yesterday");

        when(complaintService.updateComplaintStatus(eq("CMP-2026-11111"), any(UpdateStatusRequest.class)))
                .thenReturn(updatedResponse);

        mockMvc.perform(put("/api/complaints/CMP-2026-11111/status")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(update)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("RESOLVED")))
                .andExpect(jsonPath("$.adminRemark", is("Fixed yesterday")));
    }

    @Test
    @DisplayName("DELETE /api/complaints/{id} should return 204 No Content")
    void testDeleteComplaint() throws Exception {
        doNothing().when(complaintService).deleteComplaint("CMP-2026-11111");

        mockMvc.perform(delete("/api/complaints/CMP-2026-11111"))
                .andExpect(status().isNoContent());
    }

    @Test
    @DisplayName("GET /api/complaints/stats should return dashboard counts")
    void testGetStats() throws Exception {
        ComplaintStatsResponse stats = new ComplaintStatsResponse(20, 10, 6, 4);
        when(complaintService.getStats()).thenReturn(stats);

        mockMvc.perform(get("/api/complaints/stats"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalComplaints", is(20)))
                .andExpect(jsonPath("$.submittedCount", is(10)))
                .andExpect(jsonPath("$.inProgressCount", is(6)))
                .andExpect(jsonPath("$.resolvedCount", is(4)));
    }
}
