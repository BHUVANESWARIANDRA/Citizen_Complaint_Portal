package com.smartcitizen.complaints.security;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class PasswordUtilTest {

    @Test
    @DisplayName("Should hash password and verify valid credentials successfully")
    void testHashAndVerifySuccess() {
        String rawPassword = "SecurePassword@2026";
        String hash = PasswordUtil.hashPassword(rawPassword);

        assertThat(hash).isNotNull();
        assertThat(hash).contains(":");
        assertThat(PasswordUtil.verifyPassword(rawPassword, hash)).isTrue();
    }

    @Test
    @DisplayName("Should reject incorrect password")
    void testVerifyFailure() {
        String hash = PasswordUtil.hashPassword("CorrectPass@123");
        assertThat(PasswordUtil.verifyPassword("WrongPassword", hash)).isFalse();
    }

    @Test
    @DisplayName("Should generate distinct salts for identical passwords")
    void testUniqueSalts() {
        String hash1 = PasswordUtil.hashPassword("SamePassword123");
        String hash2 = PasswordUtil.hashPassword("SamePassword123");

        assertThat(hash1).isNotEqualTo(hash2);
        assertThat(PasswordUtil.verifyPassword("SamePassword123", hash1)).isTrue();
        assertThat(PasswordUtil.verifyPassword("SamePassword123", hash2)).isTrue();
    }

    @Test
    @DisplayName("Should throw exception for null or empty password")
    void testNullPassword() {
        assertThatThrownBy(() -> PasswordUtil.hashPassword(null))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> PasswordUtil.hashPassword(""))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
