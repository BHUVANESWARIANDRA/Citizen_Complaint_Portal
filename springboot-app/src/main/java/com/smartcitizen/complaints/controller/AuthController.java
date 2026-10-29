package com.smartcitizen.complaints.controller;

import com.smartcitizen.complaints.dto.AdminRegisterRequest;
import com.smartcitizen.complaints.dto.AuthResponse;
import com.smartcitizen.complaints.dto.LoginRequest;
import com.smartcitizen.complaints.dto.OfficerRegisterRequest;
import com.smartcitizen.complaints.dto.RegisterRequest;
import com.smartcitizen.complaints.dto.UserProfileResponse;
import com.smartcitizen.complaints.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * Dedicated citizen registration endpoint.
     * Publicly accessible, strictly assigns ROLE_CITIZEN.
     */
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> registerCitizen(@Valid @RequestBody RegisterRequest request) {
        AuthResponse response = authService.registerCitizen(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Dedicated authentication endpoint for both citizens and administrators.
     * Validates credentials and returns a secure JWT bearer token.
     */
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    /**
     * Protected administrator provisioning endpoint.
     * Requires the server administrator setup key (X-Admin-Setup-Key header)
     * or an authenticated session from an existing administrator.
     */
    @PostMapping("/admin/register")
    public ResponseEntity<AuthResponse> provisionAdmin(
            @Valid @RequestBody AdminRegisterRequest request,
            @RequestHeader(value = "X-Admin-Setup-Key", required = false) String setupKeyHeader) {
        AuthResponse response = authService.provisionAdmin(request, setupKeyHeader);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Provisioning is authorized by the configured server key header or an administrator JWT.
     * The key is deliberately not accepted in the JSON request body.
     */
    @PostMapping("/officer/register")
    public ResponseEntity<AuthResponse> provisionOfficer(
            @Valid @RequestBody OfficerRegisterRequest request,
            @RequestHeader(value = "X-Admin-Setup-Key", required = false) String setupKeyHeader) {
        AuthResponse response = authService.provisionOfficer(request, setupKeyHeader);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    /**
     * Get the profile and role details of the currently authenticated user.
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileResponse> getCurrentUser() {
        UserProfileResponse profile = authService.getCurrentUser();
        return ResponseEntity.ok(profile);
    }
}
