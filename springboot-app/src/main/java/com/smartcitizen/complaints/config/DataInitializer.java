package com.smartcitizen.complaints.config;

import com.smartcitizen.complaints.model.Complaint;
import com.smartcitizen.complaints.model.ComplaintCategory;
import com.smartcitizen.complaints.model.ComplaintStatus;
import com.smartcitizen.complaints.repository.ComplaintRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;

@Configuration
public class DataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);
    private final ComplaintRepository complaintRepository;

    public DataInitializer(ComplaintRepository complaintRepository) {
        this.complaintRepository = complaintRepository;
    }

    @Override
    public void run(String... args) {
        if (complaintRepository.count() == 0) {
            log.info("Seeding initial civic complaints for lab demonstration...");

            Complaint c1 = new Complaint(
                    "CMP-2026-10021",
                    "Deep Potholes on Main Ring Road Near Central Bus Stand",
                    ComplaintCategory.ROADS_AND_POTHOLES,
                    "Multiple deep potholes causing traffic congestion and severe hazard to two-wheelers during night hours.",
                    "Sector 4, Main Ring Road, near Bus Stand",
                    "Rajesh Kumar",
                    "rajesh.k@example.com",
                    "9876543210"
            );
            c1.setStatus(ComplaintStatus.IN_PROGRESS);
            c1.setAdminRemark("Inspected by Ward Engineer. Road patch-work tender issued, repair scheduled for Wednesday.");

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
            c2.setStatus(ComplaintStatus.SUBMITTED);

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

            complaintRepository.save(c1);
            complaintRepository.save(c2);
            complaintRepository.save(c3);
            complaintRepository.save(c4);
            complaintRepository.save(c5);

            log.info("Successfully seeded 5 initial complaints into H2 database.");
        }
    }
}
