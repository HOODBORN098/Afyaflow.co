package com.afyaflow.demo.model;

import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Patient {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String patientCode;

    // Full legacy name field (used by old receptionist flow)
    private String name;

    // New split name fields (used by patient self-registration)
    private String firstName;
    private String lastName;

    private String email;

    private String phone;

    private Integer age;

    private String dob; // YYYY-MM-DD

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

    @PrePersist
    protected void onCreate() {
        if (this.registeredAt == null) {
            this.registeredAt = LocalDateTime.now();
        }
    }
}

