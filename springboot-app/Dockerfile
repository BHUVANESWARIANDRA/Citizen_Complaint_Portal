# ==========================================
# Stage 1: Build & Package the Application
# ==========================================
FROM eclipse-temurin:21-jdk-alpine AS builder

WORKDIR /build

# Copy Maven Wrapper and POM first to leverage Docker layer caching
COPY .mvn/ .mvn/
COPY mvnw pom.xml ./
RUN sed -i 's/\r$//' mvnw \
    && chmod +x mvnw \
    && test "$(head -n 1 mvnw)" = '#!/bin/sh' \
    && test -x mvnw

# Copy application source code
COPY src ./src

# Compile and package executable JAR (skipping unit tests since tests run in CI stage)
RUN ./mvnw clean package -DskipTests=true

# ==========================================
# Stage 2: Minimal Production Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine

# Install curl for container health check
RUN apk add --no-cache curl

# Create non-root system user and group for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Create the application data directory for local/container mounts
RUN mkdir -p /app/data && chown -R appuser:appgroup /app

# Copy packaged JAR from builder stage
COPY --from=builder /build/target/*.jar /app/app.jar
RUN chown appuser:appgroup /app/app.jar

# Switch to non-root user
USER appuser

# Spring Boot defaults to 8081 locally; Render supplies PORT at runtime.
EXPOSE 8081

# Configure JVM memory limits and runtime properties
ENV JAVA_OPTS="-XX:MaxRAMPercentage=65 -XX:+UseSerialGC"

# Container healthcheck using Spring Boot Actuator
HEALTHCHECK --interval=30s --timeout=5s --start-period=40s --retries=3 \
  CMD curl -f "http://localhost:${PORT:-8081}/actuator/health" || exit 1

ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar /app/app.jar"]
