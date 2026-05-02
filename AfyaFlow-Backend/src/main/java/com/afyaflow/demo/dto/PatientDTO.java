package com.afyaflow.demo.dto;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PatientDTO {
    private Long id;
    private String tokenId; // Maps to patientCode
    private String name;
    private String firstName;
    private String lastName;
    private String email;
    private String phone;
    private Integer age;
    private String dob;
    private String gender;
    private String address;
    private String nationalId;
    private String reason;
    private String assignedDoctor;
    private String status;
    private String department;
    private String priority;
    private LocalDateTime registeredAt;
    private LocalDateTime servedAt;
    private String diagnosis;
    private String consultationNotes;
    private String vitalsJson;
    private String prescriptionsJson;
    private String referralsJson;
}
