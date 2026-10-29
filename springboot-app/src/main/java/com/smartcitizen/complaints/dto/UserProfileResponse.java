package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.Role;

public class UserProfileResponse {

    private Long userId;
    private String name;
    private String email;
    private String phone;
    private Role role;

    public UserProfileResponse() {
    }

    public UserProfileResponse(Long userId, String name, String email, String phone, Role role) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }
}
