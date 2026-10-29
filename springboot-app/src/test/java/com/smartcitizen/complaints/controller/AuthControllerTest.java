package com.smartcitizen.complaints.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcitizen.complaints.dto.AdminRegisterRequest;
import com.smartcitizen.complaints.dto.AuthResponse;
import com.smartcitizen.complaints.dto.LoginRequest;
import com.smartcitizen.complaints.dto.OfficerRegisterRequest;
import com.smartcitizen.complaints.dto.RegisterRequest;
import com.smartcitizen.complaints.dto.UserProfileResponse;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.exception.ForbiddenException;
import com.smartcitizen.complaints.exception.UnauthorizedException;
import com.smartcitizen.complaints.security.JwtService;
import com.smartcitizen.complaints.service.AuthService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @Test
    @DisplayName("POST /api/auth/register should create citizen account and return 201 Created")
    void testRegister_Success() throws Exception {
        RegisterRequest request = new RegisterRequest("Anita Roy", "anita@example.com", "9876501234", "SecurePass@1", "SecurePass@1");
        AuthResponse response = new AuthResponse("mock.jwt.token", 1L, "Anita Roy", "anita@example.com", "9876501234", Role.ROLE_CITIZEN, "Success");

        when(authService.registerCitizen(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.email").value("anita@example.com"))
                .andExpect(jsonPath("$.role").value("ROLE_CITIZEN"));
    }

    @Test
    @DisplayName("POST /api/auth/login should authenticate user and return 200 OK")
    void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest("anita@example.com", "SecurePass@1");
        AuthResponse response = new AuthResponse("mock.jwt.token", 1L, "Anita Roy", "anita@example.com", "9876501234", Role.ROLE_CITIZEN, "Login successful");

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mock.jwt.token"))
                .andExpect(jsonPath("$.role").value("ROLE_CITIZEN"));
    }

    @Test
    @DisplayName("POST /api/auth/login should return a generic error for invalid credentials")
    void testLogin_InvalidCredentials() throws Exception {
        when(authService.login(any(LoginRequest.class)))
                .thenThrow(new UnauthorizedException("Invalid email address or password"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginRequest("officer@example.gov", "wrong-password"))))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid email address or password"));
    }

    @Test
    @DisplayName("POST /api/auth/admin/register should provision admin account and return 201 Created")
    void testProvisionAdmin_Success() throws Exception {
        AdminRegisterRequest request = new AdminRegisterRequest("Admin Officer", "officer@smartcitizen.gov", "9888877777", "AdminPass@1", "AdminPass@1");
        AuthResponse response = new AuthResponse("mock.admin.token", 2L, "Admin Officer", "officer@smartcitizen.gov", "9888877777", Role.ROLE_ADMIN, "Provisioned");

        when(authService.provisionAdmin(any(AdminRegisterRequest.class), eq("SetupKey123"))).thenReturn(response);

        mockMvc.perform(post("/api/auth/admin/register")
                        .header("X-Admin-Setup-Key", "SetupKey123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock.admin.token"))
                .andExpect(jsonPath("$.role").value("ROLE_ADMIN"));
    }

    @Test
    @DisplayName("POST /api/auth/officer/register should provision an officer account")
    void testProvisionOfficer_Success() throws Exception {
        OfficerRegisterRequest request = new OfficerRegisterRequest(
                "Officer Nina",
                "nina@smartcitizen.gov",
                "9888877778",
                "OfficerPass@1",
                "OfficerPass@1"
        );
        AuthResponse response = new AuthResponse(
                "mock.officer.token",
                3L,
                "Officer Nina",
                "nina@smartcitizen.gov",
                "9888877778",
                Role.ROLE_OFFICER,
                "Provisioned"
        );

        when(authService.provisionOfficer(any(OfficerRegisterRequest.class), eq("SetupKey123"))).thenReturn(response);

        mockMvc.perform(post("/api/auth/officer/register")
                        .header("X-Admin-Setup-Key", "SetupKey123")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").value("mock.officer.token"))
                .andExpect(jsonPath("$.role").value("ROLE_OFFICER"));
    }

    @Test
    @DisplayName("POST /api/auth/officer/register should reject an invalid setup key")
    void testProvisionOfficer_InvalidSetupKey() throws Exception {
        OfficerRegisterRequest request = new OfficerRegisterRequest(
                "Officer Nina", "nina@smartcitizen.gov", null, "OfficerPass@1", "OfficerPass@1");
        when(authService.provisionOfficer(any(OfficerRegisterRequest.class), eq("WrongKey")))
                .thenThrow(new ForbiddenException(
                        "The authorization key is invalid. Check with your system administrator or sign in with an administrator account."));

        mockMvc.perform(post("/api/auth/officer/register")
                        .header("X-Admin-Setup-Key", "WrongKey")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.message").value(
                        "The authorization key is invalid. Check with your system administrator or sign in with an administrator account."));
    }

    @Test
    @DisplayName("GET /api/auth/me should return current profile")
    void testGetMe_Success() throws Exception {
        UserProfileResponse profile = new UserProfileResponse(1L, "Anita Roy", "anita@example.com", "9876501234", Role.ROLE_CITIZEN);
        when(authService.getCurrentUser()).thenReturn(profile);

        mockMvc.perform(get("/api/auth/me"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value("anita@example.com"))
                .andExpect(jsonPath("$.name").value("Anita Roy"));
    }
}
