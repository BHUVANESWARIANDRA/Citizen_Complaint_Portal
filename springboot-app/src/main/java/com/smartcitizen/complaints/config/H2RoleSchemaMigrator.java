package com.smartcitizen.complaints.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Component
public class H2RoleSchemaMigrator {

    private static final Logger log = LoggerFactory.getLogger(H2RoleSchemaMigrator.class);
    private static final String ROLE_CONSTRAINT = "CK_USERS_ROLE_SUPPORTED";

    private final DataSource dataSource;

    public H2RoleSchemaMigrator(DataSource dataSource) {
        this.dataSource = dataSource;
    }

    public void migrateUserRoleCheckConstraint() {
        String sql = "SELECT tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE " +
                "FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS tc " +
                "JOIN INFORMATION_SCHEMA.CHECK_CONSTRAINTS cc " +
                "ON tc.CONSTRAINT_CATALOG = cc.CONSTRAINT_CATALOG " +
                "AND tc.CONSTRAINT_SCHEMA = cc.CONSTRAINT_SCHEMA " +
                "AND tc.CONSTRAINT_NAME = cc.CONSTRAINT_NAME " +
                "WHERE UPPER(tc.TABLE_SCHEMA) = UPPER(CURRENT_SCHEMA()) " +
                "AND UPPER(tc.TABLE_NAME) = 'USERS' " +
                "AND tc.CONSTRAINT_TYPE = 'CHECK'";

        try (Connection connection = dataSource.getConnection();
             PreparedStatement statement = connection.prepareStatement(sql)) {
            widenLegacyEnumColumn(connection);

            List<String> obsoleteConstraints = new ArrayList<>();
            boolean hasSupportedRoleConstraint = false;
            try (ResultSet resultSet = statement.executeQuery()) {
                while (resultSet.next()) {
                    String clause = resultSet.getString("CHECK_CLAUSE");
                    if (supportsAllRoles(clause)) {
                        hasSupportedRoleConstraint = true;
                    } else if (restrictsOfficerRole(clause)) {
                        obsoleteConstraints.add(resultSet.getString("CONSTRAINT_NAME"));
                    }
                }
            }

            for (String constraintName : obsoleteConstraints) {
                String quotedName = "\"" + constraintName.replace("\"", "\"\"") + "\"";
                try (Statement dropStatement = connection.createStatement()) {
                    dropStatement.execute("ALTER TABLE \"USERS\" DROP CONSTRAINT " + quotedName);
                }
                log.info("Removed legacy users role constraint {} so ROLE_OFFICER can be stored", constraintName);
            }
            if (!hasSupportedRoleConstraint) {
                try (Statement addConstraint = connection.createStatement()) {
                    addConstraint.execute("ALTER TABLE \"USERS\" ADD CONSTRAINT \"" + ROLE_CONSTRAINT
                            + "\" CHECK (\"ROLE\" IN ('ROLE_CITIZEN', 'ROLE_OFFICER', 'ROLE_ADMIN'))");
                }
                log.info("Ensured users.role only accepts ROLE_CITIZEN, ROLE_OFFICER, and ROLE_ADMIN");
            }
        } catch (SQLException ex) {
            throw new IllegalStateException("Could not migrate the H2 users role constraint for ROLE_OFFICER", ex);
        }
    }

    private void widenLegacyEnumColumn(Connection connection) throws SQLException {
        String schema = connection.getSchema();
        try (ResultSet columns = connection.getMetaData().getColumns(
                connection.getCatalog(), schema, "USERS", "ROLE")) {
            if (!columns.next()) {
                return;
            }

            String typeName = columns.getString("TYPE_NAME");
            if (typeName != null && typeName.toUpperCase(Locale.ROOT).startsWith("ENUM")) {
                try (Statement statement = connection.createStatement()) {
                    statement.execute("ALTER TABLE \"USERS\" ALTER COLUMN \"ROLE\" VARCHAR(30)");
                }
                log.info("Changed legacy users.role ENUM column to VARCHAR(30) so ROLE_OFFICER can be stored");
            }
        }
    }

    private boolean restrictsOfficerRole(String checkClause) {
        if (checkClause == null) {
            return false;
        }
        String normalizedClause = checkClause.toUpperCase(Locale.ROOT);
        return normalizedClause.contains("ROLE_ADMIN")
                && normalizedClause.contains("ROLE_CITIZEN")
                && !normalizedClause.contains("ROLE_OFFICER");
    }

    private boolean supportsAllRoles(String checkClause) {
        if (checkClause == null) {
            return false;
        }
        String normalizedClause = checkClause.toUpperCase(Locale.ROOT);
        return normalizedClause.contains("ROLE_CITIZEN")
                && normalizedClause.contains("ROLE_OFFICER")
                && normalizedClause.contains("ROLE_ADMIN");
    }
}
