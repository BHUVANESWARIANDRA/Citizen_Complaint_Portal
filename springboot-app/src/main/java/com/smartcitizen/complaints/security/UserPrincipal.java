package com.smartcitizen.complaints.security;

import com.smartcitizen.complaints.model.Role;

public class UserPrincipal {

    private final Long userId;
    private final String email;
    private final String name;
    private final Role role;

    public UserPrincipal(Long userId, String email, String name, Role role) {
        this.userId = userId;
        this.email = email;
        this.name = name;
        this.role = role;
    }

    public Long getUserId() {
        return userId;
    }

    public String getEmail() {
        return email;
    }

    public String getName() {
        return name;
    }

    public Role getRole() {
        return role;
    }

    public boolean isAdmin() {
        return Role.ROLE_ADMIN.equals(this.role);
    }

    public boolean isOfficer() {
        return Role.ROLE_OFFICER.equals(this.role) || isAdmin();
    }

    public boolean isCitizen() {
        return Role.ROLE_CITIZEN.equals(this.role);
    }
}
