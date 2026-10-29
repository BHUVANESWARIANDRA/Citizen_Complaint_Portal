package com.smartcitizen.complaints.dto;

public class ComplaintStatsResponse {

    private long totalComplaints;
    private long submittedCount;
    private long underReviewCount;
    private long inProgressCount;
    private long resolvedCount;
    private long rejectedCount;

    public ComplaintStatsResponse() {
    }

    public ComplaintStatsResponse(long totalComplaints, long submittedCount, long inProgressCount, long resolvedCount) {
        this.totalComplaints = totalComplaints;
        this.submittedCount = submittedCount;
        this.inProgressCount = inProgressCount;
        this.resolvedCount = resolvedCount;
    }

    public ComplaintStatsResponse(long totalComplaints, long submittedCount, long underReviewCount,
                                  long inProgressCount, long resolvedCount, long rejectedCount) {
        this.totalComplaints = totalComplaints;
        this.submittedCount = submittedCount;
        this.underReviewCount = underReviewCount;
        this.inProgressCount = inProgressCount;
        this.resolvedCount = resolvedCount;
        this.rejectedCount = rejectedCount;
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

    public long getUnderReviewCount() {
        return underReviewCount;
    }

    public void setUnderReviewCount(long underReviewCount) {
        this.underReviewCount = underReviewCount;
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

    public long getRejectedCount() {
        return rejectedCount;
    }

    public void setRejectedCount(long rejectedCount) {
        this.rejectedCount = rejectedCount;
    }
}
