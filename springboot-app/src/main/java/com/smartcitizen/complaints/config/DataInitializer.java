package com.smartcitizen.complaints.config;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.model.OfficerNotification;
import com.smartcitizen.complaints.model.Role;
import com.smartcitizen.complaints.model.User;
import com.smartcitizen.complaints.repository.ComplaintRepository;
import com.smartcitizen.complaints.repository.OfficerNotificationRepository;
import com.smartcitizen.complaints.repository.UserRepository;
import com.smartcitizen.complaints.security.PasswordUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Configuration
@Profile("!production")
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    private final ComplaintRepository complaintRepository;
    private final UserRepository userRepository;
    private final OfficerNotificationRepository notificationRepository;
    private final DataSource dataSource;
    private final H2RoleSchemaMigrator roleSchemaMigrator;

    @Value("${initial.admin.email:}")
    private String initialAdminEmail;

    @Value("${initial.admin.password:}")
    private String initialAdminPassword;

    @Value("${demo.accounts.enabled:false}")
    private boolean demoAccountsEnabled;

    public DataInitializer(ComplaintRepository complaintRepository,
                           UserRepository userRepository,
                           OfficerNotificationRepository notificationRepository,
                           DataSource dataSource,
                           H2RoleSchemaMigrator roleSchemaMigrator) {
        this.complaintRepository = complaintRepository;
        this.userRepository = userRepository;
        this.notificationRepository = notificationRepository;
        this.dataSource = dataSource;
        this.roleSchemaMigrator = roleSchemaMigrator;
    }

    @Override
    public void run(String... args) {
        roleSchemaMigrator.migrateUserRoleCheckConstraint();

        // Drop legacy H2 check constraints and ensure schema compatibility
        try (Connection conn = dataSource.getConnection();
             Statement stmt = conn.createStatement()) {

            try {
                stmt.execute("ALTER TABLE complaints ADD COLUMN IF NOT EXISTS photo CLOB");
            } catch (Exception ex) {
                log.debug("Photo column check: {}", ex.getMessage());
            }

            try {
                stmt.execute("ALTER TABLE complaints ALTER COLUMN status VARCHAR(30)");
                log.info("Altered complaints.status to VARCHAR(30)");
            } catch (Exception ex) {
                log.debug("Alter complaints status column: {}", ex.getMessage());
            }

            try {
                stmt.execute("ALTER TABLE complaint_audit_logs ALTER COLUMN old_status VARCHAR(30)");
                stmt.execute("ALTER TABLE complaint_audit_logs ALTER COLUMN new_status VARCHAR(30)");
                log.info("Altered complaint_audit_logs status columns to VARCHAR(30)");
            } catch (Exception ex) {
                log.debug("Alter audit status columns: {}", ex.getMessage());
            }

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                    "WHERE UPPER(TABLE_NAME) = 'COMPLAINTS' AND UPPER(CONSTRAINT_TYPE) = 'CHECK'")) {
                List<String> constraints = new ArrayList<>();
                while (rs.next()) {
                    constraints.add(rs.getString("CONSTRAINT_NAME"));
                }
                for (String cName : constraints) {
                    try {
                        stmt.execute("ALTER TABLE complaints DROP CONSTRAINT " + cName);
                        log.info("Dropped legacy CHECK constraint: {}", cName);
                    } catch (Exception e) {
                        log.warn("Could not drop constraint {}: {}", cName, e.getMessage());
                    }
                }
            } catch (Exception ex) {
                log.debug("Constraint cleanup: {}", ex.getMessage());
            }

            try (ResultSet rs = stmt.executeQuery(
                    "SELECT CONSTRAINT_NAME FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS " +
                    "WHERE UPPER(TABLE_NAME) = 'COMPLAINT_AUDIT_LOGS' AND UPPER(CONSTRAINT_TYPE) = 'CHECK'")) {
                List<String> constraints = new ArrayList<>();
                while (rs.next()) {
                    constraints.add(rs.getString("CONSTRAINT_NAME"));
                }
                for (String cName : constraints) {
                    try {
                        stmt.execute("ALTER TABLE complaint_audit_logs DROP CONSTRAINT " + cName);
                        log.info("Dropped legacy audit CHECK constraint: {}", cName);
                    } catch (Exception e) {
                        log.warn("Could not drop audit constraint {}: {}", cName, e.getMessage());
                    }
                }
            } catch (Exception ex) {
                log.debug("Audit constraint cleanup: {}", ex.getMessage());
            }
        } catch (Exception e) {
            log.warn("Schema initialization notice: {}", e.getMessage());
        }

        // Seed demo citizen if not present
        User demoCitizen = null;
        if (!userRepository.existsByEmailIgnoreCase("citizen.demo@smartcitizen.gov")) {
            demoCitizen = new User(
                    "Rajesh Kumar",
                    "citizen.demo@smartcitizen.gov",
                    "9876543210",
                    PasswordUtil.hashPassword("Citizen@2026"),
                    Role.ROLE_CITIZEN
            );
            demoCitizen = userRepository.save(demoCitizen);
            log.info("Initialized demo citizen account: citizen.demo@smartcitizen.gov / Citizen@2026");
        } else {
            demoCitizen = userRepository.findByEmailIgnoreCase("citizen.demo@smartcitizen.gov").orElse(null);
        }

        // Environment-based initial administrator provisioning
        if (userRepository.countByRole(Role.ROLE_ADMIN) == 0) {
            if (initialAdminEmail != null && !initialAdminEmail.trim().isEmpty() &&
                initialAdminPassword != null && !initialAdminPassword.trim().isEmpty()) {
                User admin = new User(
                        "System Administrator",
                        initialAdminEmail.trim().toLowerCase(),
                        "9998887776",
                        PasswordUtil.hashPassword(initialAdminPassword.trim()),
                        Role.ROLE_ADMIN
                );
                userRepository.save(admin);
                log.info("Provisioned initial administrator from environment: {}", initialAdminEmail);
            } else {
                // Provision a standard civic administrator for the lab demonstration
                User defaultAdmin = new User(
                        "Ward Commissioner",
                        "admin.civic@smartcitizen.gov",
                        "9123456789",
                        PasswordUtil.hashPassword("Admin@2026"),
                        Role.ROLE_ADMIN
                );
                userRepository.save(defaultAdmin);
                log.info("Provisioned initial municipal administrator: admin.civic@smartcitizen.gov / Admin@2026");
            }
        }

        if (demoAccountsEnabled && !userRepository.existsByEmailIgnoreCase("officer.demo@smartcitizen.gov")) {
            User demoOfficer = new User(
                    "Municipal Officer",
                    "officer.demo@smartcitizen.gov",
                    "9123456780",
                    PasswordUtil.hashPassword("Officer@2026"),
                    Role.ROLE_OFFICER
            );
            userRepository.save(demoOfficer);
            log.info("Initialized demo municipal officer account: officer.demo@smartcitizen.gov");
        }

        // Seed initial complaints if table is empty
        if (complaintRepository.count() == 0) {
            log.info("Seeding initial civic complaints with audit history...");

            Complaint c1 = new Complaint(
                    "CMP-2026-10021",
                    "Deep Potholes on Main Ring Road Near Central Bus Stand",
                    ComplaintCategory.ROADS_AND_POTHOLES,
                    "Multiple deep potholes causing traffic congestion and severe hazard to two-wheelers during night hours.",
                    "Sector 4, Main Ring Road, near Bus Stand",
                    "Rajesh Kumar",
                    "citizen.demo@smartcitizen.gov",
                    "9876543210"
            );
            if (demoCitizen != null) {
                c1.setCitizen(demoCitizen);
            }
            c1.setStatus(ComplaintStatus.IN_PROGRESS);
            c1.setAdminRemark("Inspected by Ward Engineer. Road patch-work tender issued, repair scheduled for Wednesday.");
            c1.addAuditLog(null, ComplaintStatus.SUBMITTED, "Complaint registered via Smart Citizen portal.", "Rajesh Kumar");
            c1.addAuditLog(ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, "Assigned to Municipal Roads & Pavements Division.", "Ward Commissioner");
            c1.addAuditLog(ComplaintStatus.UNDER_REVIEW, ComplaintStatus.IN_PROGRESS, "Inspected by Ward Engineer. Road patch-work tender issued.", "Ward Commissioner");

            Complaint c2 = new Complaint(
                    "CMP-2026-10045",
                    "Contaminated Low-Pressure Water Supply",
                    ComplaintCategory.WATER_SUPPLY,
                    "Water received in the morning pipeline is muddy and carries strong odor. Pressure is insufficient for overhead tanks.",
                    "Block C, Ashoka Nagar",
                    "Sneha Patel",
                    "sneha.patel@example.com",
                    "9123456780"
            );
            c2.setStatus(ComplaintStatus.UNDER_REVIEW);
            c2.setAdminRemark("Water sample collected by municipal quality testing laboratory. Awaiting chemical report.");
            c2.addAuditLog(null, ComplaintStatus.SUBMITTED, "Complaint registered by citizen.", "Sneha Patel");
            c2.addAuditLog(ComplaintStatus.SUBMITTED, ComplaintStatus.UNDER_REVIEW, "Forwarded to Urban Water Supply & Sanitation Board.", "Ward Commissioner");

            Complaint c3 = new Complaint(
                    "CMP-2026-10068",
                    "Dark Streetlights on 5th Cross Road",
                    ComplaintCategory.STREETLIGHTS,
                    "Four consecutive streetlights have been completely dark for over one week, raising pedestrian safety concerns.",
                    "5th Cross, Gandhi Colony",
                    "Amit Sharma",
                    "amit.s@example.com",
                    "9811223344"
            );
            c3.setStatus(ComplaintStatus.RESOLVED);
            c3.setAdminRemark("Electrician team visited site, replaced faulty LED ballast and restored all 4 lamp fixtures.");
            c3.addAuditLog(null, ComplaintStatus.SUBMITTED, "Complaint registered by citizen.", "Amit Sharma");
            c3.addAuditLog(ComplaintStatus.SUBMITTED, ComplaintStatus.IN_PROGRESS, "Work order dispatched to streetlight contractor.", "Ward Commissioner");
            c3.addAuditLog(ComplaintStatus.IN_PROGRESS, ComplaintStatus.RESOLVED, "All 4 fixtures replaced and verified working.", "Ward Commissioner");

            Complaint c4 = new Complaint(
                    "CMP-2026-10082",
                    "Overflowing Garbage Dump Near Public Park",
                    ComplaintCategory.GARBAGE_COLLECTION,
                    "Commercial waste is piling up around the public park dumpster. Stray cattle and foul odor are creating a health hazard.",
                    "Municipal Park Gate 2, Ward 12",
                    "Pooja Verma",
                    "pooja.v@example.com",
                    "9765432109"
            );
            c4.setStatus(ComplaintStatus.IN_PROGRESS);
            c4.setAdminRemark("Emergency garbage compacting vehicle dispatched. Extra waste bins requested for the park perimeter.");
            c4.addAuditLog(null, ComplaintStatus.SUBMITTED, "Complaint registered by citizen.", "Pooja Verma");
            c4.addAuditLog(ComplaintStatus.SUBMITTED, ComplaintStatus.IN_PROGRESS, "Sanitation truck dispatched to clear excess accumulation.", "Ward Commissioner");

            Complaint c5 = new Complaint(
                    "CMP-2026-10099",
                    "Severe Drain Blockage Causing Stagnant Sewage",
                    ComplaintCategory.DRAINAGE,
                    "Monsoon drain is fully choked with plastic and silt, causing dirty water to spill onto the pedestrian walkway.",
                    "Kaveri Street Corner",
                    "Vikram Singh",
                    "vikram.s@example.com",
                    "9845012345"
            );
            c5.setStatus(ComplaintStatus.SUBMITTED);
            c5.addAuditLog(null, ComplaintStatus.SUBMITTED, "Complaint registered by citizen.", "Vikram Singh");

            complaintRepository.save(c1);
            complaintRepository.save(c2);
            complaintRepository.save(c3);
            complaintRepository.save(c4);
            complaintRepository.save(c5);

            log.info("Successfully seeded 5 initial complaints with audit trails into database.");
        }

        // Initialize officer notifications if empty
        try {
            if (notificationRepository.count() == 0) {
                List<Complaint> allComplaints = complaintRepository.findAll();
                for (Complaint c : allComplaints) {
                    OfficerNotification n = new OfficerNotification(
                            c.getComplaintId(),
                            c.getTitle(),
                            c.getCitizenName() != null ? c.getCitizenName() : "Citizen",
                            c.getCreatedAt()
                    );
                    if (c.getStatus() == ComplaintStatus.RESOLVED) {
                        n.setRead(true);
                    }
                    notificationRepository.save(n);
                }
                log.info("Initialized {} officer notifications for existing complaints.", allComplaints.size());
            }
        } catch (Exception ex) {
            log.debug("Notification initialization note: {}", ex.getMessage());
        }
    }
}
