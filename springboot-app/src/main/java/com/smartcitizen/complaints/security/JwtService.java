package com.smartcitizen.complaints.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.model.User;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Service
public class JwtService {

    private static final Logger log = LoggerFactory.getLogger(JwtService.class);
    private static final String HMAC_SHA256 = "HmacSHA256";

    private final byte[] secretKeyBytes;
    private final long expirationSeconds;
    private final ObjectMapper objectMapper;

    public JwtService(
            @Value("${security.jwt.secret:}") String secret,
            @Value("${security.jwt.expiration-seconds:86400}") long expirationSeconds,
            ObjectMapper objectMapper) {
        this.secretKeyBytes = secret.getBytes(StandardCharsets.UTF_8);
        if (secretKeyBytes.length < 32) {
            throw new IllegalArgumentException("JWT_SECRET must contain at least 32 bytes.");
        }
        this.expirationSeconds = expirationSeconds;
        this.objectMapper = objectMapper;
    }

    public String generateToken(User user) {
        try {
            long now = Instant.now().getEpochSecond();
            long exp = now + expirationSeconds;

            Map<String, Object> header = new HashMap<>();
            header.put("alg", "HS256");
            header.put("typ", "JWT");

            Map<String, Object> payload = new HashMap<>();
            payload.put("sub", user.getEmail());
            payload.put("userId", user.getId());
            payload.put("name", user.getName());
            payload.put("role", user.getRole().name());
            payload.put("iat", now);
            payload.put("exp", exp);

            String encodedHeader = base64UrlEncode(objectMapper.writeValueAsString(header).getBytes(StandardCharsets.UTF_8));
            String encodedPayload = base64UrlEncode(objectMapper.writeValueAsString(payload).getBytes(StandardCharsets.UTF_8));

            String content = encodedHeader + "." + encodedPayload;
            String signature = sign(content);

            return content + "." + signature;
        } catch (Exception e) {
            log.error("Failed to generate JWT token", e);
            throw new IllegalStateException("Could not generate authentication token", e);
        }
    }

    public Optional<UserPrincipal> parseAndValidateToken(String token) {
        if (token == null || token.trim().isEmpty()) {
            return Optional.empty();
        }

        String[] parts = token.trim().split("\\.");
        if (parts.length != 3) {
            return Optional.empty();
        }

        try {
            String content = parts[0] + "." + parts[1];
            String expectedSignature = sign(content);

            byte[] actualSigBytes = parts[2].getBytes(StandardCharsets.UTF_8);
            byte[] expectedSigBytes = expectedSignature.getBytes(StandardCharsets.UTF_8);

            if (!MessageDigest.isEqual(actualSigBytes, expectedSigBytes)) {
                log.warn("Invalid JWT signature");
                return Optional.empty();
            }

            byte[] payloadBytes = base64UrlDecode(parts[1]);
            JsonNode payloadNode = objectMapper.readTree(payloadBytes);

            long exp = payloadNode.path("exp").asLong(0);
            long now = Instant.now().getEpochSecond();
            if (exp <= now) {
                log.warn("JWT token expired at {} (now {})", exp, now);
                return Optional.empty();
            }

            Long userId = payloadNode.path("userId").asLong();
            String email = payloadNode.path("sub").asText();
            String name = payloadNode.path("name").asText();
            String roleStr = payloadNode.path("role").asText("ROLE_CITIZEN");
            Role role = Role.valueOf(roleStr);

            return Optional.of(new UserPrincipal(userId, email, name, role));
        } catch (Exception e) {
            log.warn("JWT parsing error: {}", e.getMessage());
            return Optional.empty();
        }
    }

    private String sign(String content) throws Exception {
        Mac mac = Mac.getInstance(HMAC_SHA256);
        SecretKeySpec secretKeySpec = new SecretKeySpec(secretKeyBytes, HMAC_SHA256);
        mac.init(secretKeySpec);
        byte[] rawHmac = mac.doFinal(content.getBytes(StandardCharsets.UTF_8));
        return base64UrlEncode(rawHmac);
    }

    private String base64UrlEncode(byte[] data) {
        return Base64.getUrlEncoder().withoutPadding().encodeToString(data);
    }

    private byte[] base64UrlDecode(String str) {
        return Base64.getUrlDecoder().decode(str);
    }
}
