package com.afyaflow.demo.model;

import java.time.LocalDate;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.ManyToOne;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate appointmentDate;

    private String timeSlot;
    
    private String departmentName;
    
    private String type; // scheduled, walk-in, etc.
    
    private String notes;

    private String status;

    private String queueNumber;

    @ManyToOne
    private Patient patient;

    @ManyToOne
    private Doctor doctor;

}
