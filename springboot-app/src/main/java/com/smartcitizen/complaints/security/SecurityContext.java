package com.smartcitizen.complaints.security;

public final class SecurityContext {

    private static final ThreadLocal<UserPrincipal> CURRENT_USER = new ThreadLocal<>();

    private SecurityContext() {
    }

    public static void setCurrentUser(UserPrincipal user) {
        CURRENT_USER.set(user);
    }

    public static UserPrincipal getCurrentUser() {
        return CURRENT_USER.get();
    }

    public static void clear() {
        CURRENT_USER.remove();
    }
}
