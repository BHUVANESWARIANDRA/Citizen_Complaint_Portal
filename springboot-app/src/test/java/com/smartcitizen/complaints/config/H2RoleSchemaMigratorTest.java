package com.smartcitizen.complaints.config;

import org.h2.jdbcx.JdbcDataSource;
import org.junit.jupiter.api.Test;

import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.sql.SQLException;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class H2RoleSchemaMigratorTest {

    @Test
    void convertsLegacyEnumColumnAndPreservesExistingUsers() throws Exception {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1");

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE users (" +
                    "id BIGINT PRIMARY KEY, " +
                    "role ENUM('ROLE_ADMIN', 'ROLE_CITIZEN') NOT NULL)");
            statement.execute("INSERT INTO users (id, role) VALUES (1, 'ROLE_ADMIN')");
        }

        H2RoleSchemaMigrator migrator = new H2RoleSchemaMigrator(dataSource);
        migrator.migrateUserRoleCheckConstraint();
        migrator.migrateUserRoleCheckConstraint();

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("INSERT INTO users (id, role) VALUES (2, 'ROLE_OFFICER')");

            assertThatThrownBy(() ->
                    statement.execute("INSERT INTO users (id, role) VALUES (3, 'ROLE_UNKNOWN')"))
                    .isInstanceOf(SQLException.class);

            try (ResultSet users = statement.executeQuery(
                    "SELECT id, role FROM users ORDER BY id")) {
                assertThat(users.next()).isTrue();
                assertThat(users.getLong("id")).isEqualTo(1);
                assertThat(users.getString("role")).isEqualTo("ROLE_ADMIN");
                assertThat(users.next()).isTrue();
                assertThat(users.getLong("id")).isEqualTo(2);
                assertThat(users.getString("role")).isEqualTo("ROLE_OFFICER");
                assertThat(users.next()).isFalse();
            }
        }
    }

    @Test
    void removesOnlyLegacyRoleConstraintAndPreservesExistingUsers() throws Exception {
        JdbcDataSource dataSource = new JdbcDataSource();
        dataSource.setURL("jdbc:h2:mem:" + UUID.randomUUID() + ";DB_CLOSE_DELAY=-1");

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("CREATE TABLE users (" +
                    "id BIGINT PRIMARY KEY, " +
                    "role VARCHAR(30) NOT NULL, " +
                    "CONSTRAINT CK_USERS_ROLE CHECK (role IN ('ROLE_ADMIN', 'ROLE_CITIZEN')), " +
                    "CONSTRAINT CK_USERS_ID CHECK (id > 0))");
            statement.execute("INSERT INTO users (id, role) VALUES (1, 'ROLE_ADMIN')");
        }

        H2RoleSchemaMigrator migrator = new H2RoleSchemaMigrator(dataSource);
        migrator.migrateUserRoleCheckConstraint();
        migrator.migrateUserRoleCheckConstraint();

        try (Connection connection = dataSource.getConnection();
             Statement statement = connection.createStatement()) {
            statement.execute("INSERT INTO users (id, role) VALUES (2, 'ROLE_OFFICER')");

            try (ResultSet users = statement.executeQuery("SELECT COUNT(*) FROM users")) {
                users.next();
                assertThat(users.getLong(1)).isEqualTo(2);
            }

            try (ResultSet constraints = statement.executeQuery(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                            "WHERE UPPER(TABLE_NAME) = 'USERS' AND CONSTRAINT_TYPE = 'CHECK'")) {
                java.util.Set<String> names = new java.util.HashSet<>();
                while (constraints.next()) {
                    names.add(constraints.getString(1));
                }
                assertThat(names).containsExactlyInAnyOrder("CK_USERS_ID", "CK_USERS_ROLE_SUPPORTED");
            }
        }
    }
}
