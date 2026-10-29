package com.smartcitizen.complaints.service;

import com.smartcitizen.complaints.dto.AdminRegisterRequest;
import com.smartcitizen.complaints.dto.AuthResponse;
import com.smartcitizen.complaints.dto.LoginRequest;
import com.smartcitizen.complaints.dto.OfficerRegisterRequest;
import com.smartcitizen.complaints.dto.RegisterRequest;
import com.smartcitizen.complaints.dto.UserProfileResponse;

public interface AuthService {

    AuthResponse registerCitizen(RegisterRequest request);

    AuthResponse login(LoginRequest request);

    AuthResponse provisionAdmin(AdminRegisterRequest request, String setupKeyHeader);

    AuthResponse provisionOfficer(OfficerRegisterRequest request, String setupKeyHeader);

    UserProfileResponse getCurrentUser();
}
