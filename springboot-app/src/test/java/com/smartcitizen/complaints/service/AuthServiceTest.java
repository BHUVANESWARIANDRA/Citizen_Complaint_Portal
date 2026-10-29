package com.smartcitizen.complaints.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcitizen.complaints.dto.AdminRegisterRequest;
import com.smartcitizen.complaints.dto.AuthResponse;
import com.smartcitizen.complaints.dto.LoginRequest;
import com.smartcitizen.complaints.dto.OfficerRegisterRequest;
import com.smartcitizen.complaints.dto.RegisterRequest;
import com.smartcitizen.complaints.exception.ConflictException;
import com.smartcitizen.complaints.exception.ForbiddenException;
import com.smartcitizen.complaints.exception.UnauthorizedException;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.model.User;
import com.smartcitizen.complaints.repository.UserRepository;
import com.smartcitizen.complaints.security.JwtService;
import com.smartcitizen.complaints.security.PasswordUtil;
import com.smartcitizen.complaints.security.SecurityContext;
import com.smartcitizen.complaints.security.UserPrincipal;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    private JwtService jwtService;
    private AuthServiceImpl authService;
    private final String setupKey = "TestSetupKey123!";

    @BeforeEach
    void setUp() {
        SecurityContext.clear();
        jwtService = new JwtService("secret-jwt-key-for-auth-service-testing-purposes-123", 3600, new ObjectMapper());
        authService = new AuthServiceImpl(userRepository, jwtService, setupKey);
    }

    @AfterEach
    void tearDown() {
        SecurityContext.clear();
    }

    @Test
    @DisplayName("Should successfully register citizen and assign ROLE_CITIZEN")
    void testRegisterCitizen_Success() {
        RegisterRequest request = new RegisterRequest("Sunita Rao", "sunita@example.com", "9876543210", "Password@123", "Password@123");
        when(userRepository.existsByEmailIgnoreCase("sunita@example.com")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(101L);
            return u;
        });

        AuthResponse response = authService.registerCitizen(request);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getEmail()).isEqualTo("sunita@example.com");
        assertThat(response.getRole()).isEqualTo(Role.ROLE_CITIZEN);
        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid officer credentials")
    void testOfficerLogin_Success() {
        String password = "Officer@2026";
        User user = new User("Municipal Officer", "officer.demo@smartcitizen.gov", null,
                PasswordUtil.hashPassword(password), Role.ROLE_OFFICER);
        user.setId(8L);
        when(userRepository.findByEmailIgnoreCase("officer.demo@smartcitizen.gov"))
                .thenReturn(Optional.of(user));

        AuthResponse response = authService.login(
                new LoginRequest("OFFICER.DEMO@SMARTCITIZEN.GOV", password));

        assertThat(response.getRole()).isEqualTo(Role.ROLE_OFFICER);
        assertThat(response.getToken()).isNotBlank();
    }

    @Test
    @DisplayName("Should reject citizen registration if passwords do not match")
    void testRegisterCitizen_MismatchedPasswords() {
        RegisterRequest request = new RegisterRequest("Sunita Rao", "sunita@example.com", "9876543210", "Password@123", "WrongConfirm");
        assertThatThrownBy(() -> authService.registerCitizen(request))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("do not match");
    }

    @Test
    @DisplayName("Should reject citizen registration if email already exists")
    void testRegisterCitizen_DuplicateEmail() {
        RegisterRequest request = new RegisterRequest("Sunita Rao", "sunita@example.com", "9876543210", "Password@123", "Password@123");
        when(userRepository.existsByEmailIgnoreCase("sunita@example.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.registerCitizen(request))
                .isInstanceOf(ConflictException.class)
                .hasMessageContaining("already registered");
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void testLogin_Success() {
        String password = "SecretPassword@1";
        String hash = PasswordUtil.hashPassword(password);
        User user = new User("John Citizen", "john@example.com", "9123456789", hash, Role.ROLE_CITIZEN);
        user.setId(5L);

        when(userRepository.findByEmailIgnoreCase("john@example.com")).thenReturn(Optional.of(user));

        AuthResponse response = authService.login(new LoginRequest("john@example.com", password));

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isNotBlank();
        assertThat(response.getUserId()).isEqualTo(5L);
        assertThat(response.getRole()).isEqualTo(Role.ROLE_CITIZEN);
    }

    @Test
    @DisplayName("Should reject login with invalid password")
    void testLogin_InvalidPassword() {
        User user = new User("John Citizen", "john@example.com", null, PasswordUtil.hashPassword("CorrectPass"), Role.ROLE_CITIZEN);
        when(userRepository.findByEmailIgnoreCase("john@example.com")).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> authService.login(new LoginRequest("john@example.com", "WrongPass")))
                .isInstanceOf(UnauthorizedException.class);
    }

    @Test
    @DisplayName("Should reject administrator provisioning without valid setup key")
    void testProvisionAdmin_Unauthorized() {
        AdminRegisterRequest request = new AdminRegisterRequest("Admin Dave", "dave@smartcitizen.gov", "9800000000", "Admin@123", "Admin@123");
        assertThatThrownBy(() -> authService.provisionAdmin(request, "InvalidKey"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("authorization key is invalid");
    }

    @Test
    @DisplayName("Should provision administrator successfully with valid setup key")
    void testProvisionAdmin_Success() {
        AdminRegisterRequest request = new AdminRegisterRequest("Admin Dave", "dave@smartcitizen.gov", "9800000000", "Admin@123", "Admin@123");
        when(userRepository.existsByEmailIgnoreCase("dave@smartcitizen.gov")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User u = invocation.getArgument(0);
            u.setId(99L);
            return u;
        });

        AuthResponse response = authService.provisionAdmin(request, setupKey);

        assertThat(response).isNotNull();
        assertThat(response.getRole()).isEqualTo(Role.ROLE_ADMIN);
        assertThat(response.getEmail()).isEqualTo("dave@smartcitizen.gov");
    }

    @Test
    @DisplayName("Should provision a distinct officer role with the valid setup key")
    void testProvisionOfficer_Success() {
        OfficerRegisterRequest request = new OfficerRegisterRequest(
                "Officer Nina",
                "nina@smartcitizen.gov",
                "9800000001",
                "Officer@123",
                "Officer@123"
        );
        when(userRepository.existsByEmailIgnoreCase("nina@smartcitizen.gov")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(100L);
            return user;
        });

        AuthResponse response = authService.provisionOfficer(request, setupKey);

        assertThat(response.getRole()).isEqualTo(Role.ROLE_OFFICER);
        assertThat(response.getEmail()).isEqualTo("nina@smartcitizen.gov");
        assertThat(response.getToken()).isNull();
    }

    @Test
    @DisplayName("Should reject officer provisioning with an invalid setup key")
    void testProvisionOfficer_InvalidSetupKey() {
        OfficerRegisterRequest request = new OfficerRegisterRequest(
                "Officer Nina", "nina@smartcitizen.gov", null, "Officer@123", "Officer@123");

        assertThatThrownBy(() -> authService.provisionOfficer(request, "wrong-key"))
                .isInstanceOf(ForbiddenException.class)
                .hasMessageContaining("authorization key is invalid");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should provision an officer through an authenticated administrator")
    void testProvisionOfficer_AdminAuthorization() {
        SecurityContext.setCurrentUser(new UserPrincipal(
                7L, "admin@smartcitizen.gov", "Administrator", Role.ROLE_ADMIN));
        OfficerRegisterRequest request = new OfficerRegisterRequest(
                "Officer Nina", "nina@smartcitizen.gov", null, "Officer@123", "Officer@123");
        when(userRepository.existsByEmailIgnoreCase("nina@smartcitizen.gov")).thenReturn(false);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User user = invocation.getArgument(0);
            user.setId(100L);
            return user;
        });

        AuthResponse response = authService.provisionOfficer(request, null);

        assertThat(response.getRole()).isEqualTo(Role.ROLE_OFFICER);
        assertThat(response.getToken()).isNull();
    }
}
