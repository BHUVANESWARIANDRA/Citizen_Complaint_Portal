package com.smartcitizen.complaints.service;

import com.smartcitizen.complaints.dto.AdminRegisterRequest;
import com.smartcitizen.complaints.dto.AuthResponse;
import com.smartcitizen.complaints.dto.LoginRequest;
import com.smartcitizen.complaints.dto.OfficerRegisterRequest;
import com.smartcitizen.complaints.dto.RegisterRequest;
import com.smartcitizen.complaints.dto.UserProfileResponse;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);

    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final String configuredAdminKey;

    public AuthServiceImpl(
            UserRepository userRepository,
            JwtService jwtService,
            @Value("${admin.provision.key:}") String configuredAdminKey) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
        this.configuredAdminKey = configuredAdminKey == null ? "" : configuredAdminKey.trim();
    }

    @Override
    public AuthResponse registerCitizen(RegisterRequest request) {
        if (!request.getPassword().equals(request.getConfirmPassword())) {
            throw new IllegalArgumentException("Password and confirmation password do not match");
        }

        String normalizedEmail = request.getEmail().trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Email is already registered. Please login to continue.");
        }

        String passwordHash = PasswordUtil.hashPassword(request.getPassword().trim());
        User citizen = new User(
                request.getName().trim(),
                normalizedEmail,
                request.getPhone() != null ? request.getPhone().trim() : null,
                passwordHash,
                Role.ROLE_CITIZEN
        );

        User saved = userRepository.save(citizen);
        String token = jwtService.generateToken(saved);

        log.info("Registered new citizen account: {}", normalizedEmail);
        return new AuthResponse(
                token,
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getRole(),
                "Citizen registration successful. Welcome to Smart Citizen!"
        );
    }

    @Override
    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new UnauthorizedException("Invalid email address or password"));

        boolean isValid = PasswordUtil.verifyPassword(request.getPassword().trim(), user.getPasswordHash());
        if (!isValid) {
            throw new UnauthorizedException("Invalid email address or password");
        }

        String token = jwtService.generateToken(user);
        log.info("User logged in successfully: {} (role: {})", normalizedEmail, user.getRole());

        return new AuthResponse(
                token,
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole(),
                "Login successful. Welcome back, " + user.getName() + "!"
        );
    }

    @Override
    public AuthResponse provisionAdmin(AdminRegisterRequest request, String setupKeyHeader) {
        return provisionMunicipalAccount(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getPassword(),
                request.getConfirmPassword(),
                setupKeyHeader,
                Role.ROLE_ADMIN,
                "administrator"
        );
    }

    @Override
    public AuthResponse provisionOfficer(OfficerRegisterRequest request, String setupKeyHeader) {
        return provisionMunicipalAccount(
                request.getName(),
                request.getEmail(),
                request.getPhone(),
                request.getPassword(),
                request.getConfirmPassword(),
                setupKeyHeader,
                Role.ROLE_OFFICER,
                "officer"
        );
    }

    private AuthResponse provisionMunicipalAccount(
            String name,
            String email,
            String phone,
            String password,
            String confirmPassword,
            String setupKeyHeader,
            Role role,
            String roleLabel) {
        UserPrincipal currentUser = SecurityContext.getCurrentUser();
        boolean isCallerAdmin = currentUser != null && currentUser.isAdmin();

        String providedKey = setupKeyHeader == null ? "" : setupKeyHeader.trim();
        boolean hasValidKey = !configuredAdminKey.isEmpty()
                && MessageDigest.isEqual(
                        configuredAdminKey.getBytes(StandardCharsets.UTF_8),
                        providedKey.getBytes(StandardCharsets.UTF_8));

        if (!isCallerAdmin && !hasValidKey) {
            log.warn("Unauthorized attempt to provision {} account for email: {}", roleLabel, email);
            if (configuredAdminKey.isEmpty()) {
                throw new ForbiddenException(
                        roleLabel.substring(0, 1).toUpperCase() + roleLabel.substring(1)
                                + " provisioning is not configured. Set ADMIN_PROVISION_KEY on the server or sign in as an administrator.");
            }
            throw new ForbiddenException(
                    "The authorization key is invalid. Check with your system administrator or sign in with an administrator account.");
        }

        if (!password.equals(confirmPassword)) {
            throw new IllegalArgumentException("Password and confirmation password do not match");
        }

        String normalizedEmail = email.trim().toLowerCase();
        if (userRepository.existsByEmailIgnoreCase(normalizedEmail)) {
            throw new ConflictException("Email is already registered. Please login or use a different email address.");
        }

        String passwordHash = PasswordUtil.hashPassword(password.trim());
        User municipalUser = new User(
                name.trim(),
                normalizedEmail,
                phone != null ? phone.trim() : null,
                passwordHash,
                role
        );

        User saved = userRepository.save(municipalUser);
        String token = role == Role.ROLE_ADMIN ? jwtService.generateToken(saved) : null;

        log.info("Successfully provisioned new {} account: {}", roleLabel, normalizedEmail);
        return new AuthResponse(
                token,
                saved.getId(),
                saved.getName(),
                saved.getEmail(),
                saved.getPhone(),
                saved.getRole(),
                "Municipal " + roleLabel + " account provisioned successfully."
        );
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getCurrentUser() {
        UserPrincipal principal = SecurityContext.getCurrentUser();
        if (principal == null) {
            throw new UnauthorizedException("Session expired or user is not authenticated.");
        }

        User user = userRepository.findById(principal.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User profile not found."));

        return new UserProfileResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getPhone(),
                user.getRole()
        );
    }
}
