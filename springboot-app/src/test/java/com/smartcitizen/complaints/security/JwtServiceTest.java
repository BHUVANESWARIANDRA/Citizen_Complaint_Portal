package com.smartcitizen.complaints.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.model.User;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

class JwtServiceTest {

    private JwtService jwtService;
    private ObjectMapper objectMapper;

    @BeforeEach
    void setUp() {
        objectMapper = new ObjectMapper();
        jwtService = new JwtService("my-super-secret-key-for-unit-testing-32-chars-long", 3600, objectMapper);
    }

    @Test
    @DisplayName("Should generate token and parse valid claims successfully")
    void testGenerateAndParseToken() {
        User user = new User("Priya Nair", "priya@example.com", "9876543210", "hash", Role.ROLE_CITIZEN);
        user.setId(42L);

        String token = jwtService.generateToken(user);
        assertThat(token).isNotBlank();

        Optional<UserPrincipal> principal = jwtService.parseAndValidateToken(token);
        assertThat(principal).isPresent();
        assertThat(principal.get().getUserId()).isEqualTo(42L);
        assertThat(principal.get().getEmail()).isEqualTo("priya@example.com");
        assertThat(principal.get().getName()).isEqualTo("Priya Nair");
        assertThat(principal.get().getRole()).isEqualTo(Role.ROLE_CITIZEN);
        assertThat(principal.get().isCitizen()).isTrue();
        assertThat(principal.get().isAdmin()).isFalse();
    }

    @Test
    @DisplayName("Should reject tampered token with altered signature")
    void testRejectTamperedToken() {
        User user = new User("Admin User", "admin@example.com", null, "hash", Role.ROLE_ADMIN);
        user.setId(1L);

        String token = jwtService.generateToken(user);
        String tampered = token.substring(0, token.length() - 4) + "XXXX";

        Optional<UserPrincipal> principal = jwtService.parseAndValidateToken(tampered);
        assertThat(principal).isEmpty();
    }
}
