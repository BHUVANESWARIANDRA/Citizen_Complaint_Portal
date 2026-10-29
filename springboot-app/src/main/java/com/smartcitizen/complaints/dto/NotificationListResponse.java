package com.smartcitizen.complaints.dto;

import java.util.List;

public class NotificationListResponse {

    private List<NotificationResponse> notifications;
    private long unreadCount;

    public NotificationListResponse() {
    }

    public NotificationListResponse(List<NotificationResponse> notifications, long unreadCount) {
        this.notifications = notifications;
        this.unreadCount = unreadCount;
    }

    public List<NotificationResponse> getNotifications() {
        return notifications;
    }

    public void setNotifications(List<NotificationResponse> notifications) {
        this.notifications = notifications;
    }

    public long getUnreadCount() {
        return unreadCount;
    }

    public void setUnreadCount(long unreadCount) {
        this.unreadCount = unreadCount;
    }
}
