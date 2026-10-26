package com.smartcitizen.complaints.dto;

public class ComplaintStatsResponse {

    private long totalComplaints;
    private long submittedCount;
    private long inProgressCount;
    private long resolvedCount;

    public ComplaintStatsResponse() {
    }

    public ComplaintStatsResponse(long totalComplaints, long submittedCount, long inProgressCount, long resolvedCount) {
        this.totalComplaints = totalComplaints;
        this.submittedCount = submittedCount;
        this.inProgressCount = inProgressCount;
        this.resolvedCount = resolvedCount;
    }

    public long getTotalComplaints() {
        return totalComplaints;
    }

    public void setTotalComplaints(long totalComplaints) {
        this.totalComplaints = totalComplaints;
    }

    public long getSubmittedCount() {
        return submittedCount;
    }

    public void setSubmittedCount(long submittedCount) {
        this.submittedCount = submittedCount;
    }

    public long getInProgressCount() {
        return inProgressCount;
    }

    public void setInProgressCount(long inProgressCount) {
        this.inProgressCount = inProgressCount;
    }

    public long getResolvedCount() {
        return resolvedCount;
    }

    public void setResolvedCount(long resolvedCount) {
        this.resolvedCount = resolvedCount;
    }
}
