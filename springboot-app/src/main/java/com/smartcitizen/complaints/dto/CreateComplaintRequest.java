package com.smartcitizen.complaints.dto;

import com.smartcitizen.complaints.model.ComplaintCategory;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public class CreateComplaintRequest {

    @NotBlank(message = "Complaint title is required")
    @Size(min = 5, max = 150, message = "Title must be between 5 and 150 characters")
    private String title;

    @NotNull(message = "Complaint category is required")
    private ComplaintCategory category;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 2000, message = "Description must be between 10 and 2000 characters")
    private String description;

    @NotBlank(message = "Location is required")
    @Size(min = 3, max = 200, message = "Location must be between 3 and 200 characters")
    private String location;

    @Size(max = 100, message = "Citizen name must not exceed 100 characters")
    private String citizenName;

    @Email(message = "Citizen email must be a valid email address")
    @Size(max = 100, message = "Citizen email must not exceed 100 characters")
    private String citizenEmail;

    @Size(max = 25, message = "Citizen phone must not exceed 25 characters")
    private String citizenPhone;

    public CreateComplaintRequest() {
    }

    public CreateComplaintRequest(String title, ComplaintCategory category, String description,
                                  String location, String citizenName, String citizenEmail, String citizenPhone) {
        this.title = title;
        this.category = category;
        this.description = description;
        this.location = location;
        this.citizenName = citizenName;
        this.citizenEmail = citizenEmail;
        this.citizenPhone = citizenPhone;
    }

    public String getTitle() {
        return title;
    }

    public void setTitle(String title) {
        this.title = title;
    }

    public ComplaintCategory getCategory() {
        return category;
    }

    public void setCategory(ComplaintCategory category) {
        this.category = category;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getLocation() {
        return location;
    }

    public void setLocation(String location) {
        this.location = location;
    }

    public String getCitizenName() {
        return citizenName;
    }

    public void setCitizenName(String citizenName) {
        this.citizenName = citizenName;
    }

    public String getCitizenEmail() {
        return citizenEmail;
    }

    public void setCitizenEmail(String citizenEmail) {
        this.citizenEmail = citizenEmail;
    }

    public String getCitizenPhone() {
        return citizenPhone;
    }

    public void setCitizenPhone(String citizenPhone) {
        this.citizenPhone = citizenPhone;
    }
}
