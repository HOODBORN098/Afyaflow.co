package com.afyaflow.demo.controller;

import java.security.Principal;
import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.afyaflow.demo.dto.PatientDTO;
import com.afyaflow.demo.service.PatientService;

import jakarta.validation.Valid;

/**
 * =========================================================
 * PATIENT CONTROLLER - Patient & Medical Registry API
 * =========================================================
 * 
 * PURPOSE:
 *   Manages patient registration, profile retrieval, and status updates.
 *   This is the primary interface for patient-facing dashboard data
 *   and receptionist registration workflows.
 * 
 * KEY FEATURES:
 *   - Profile management for logged-in patients (/me)
 *   - Status tracking (queued, in-progress, served)
 *   - Centralized registry for all hospital patients
 * 
 * @author AfyaFlow Development Team
 * @date April 2026
 */
@RestController
@RequestMapping("/api/patients")
public class PatientController {

    private final PatientService service;

    public PatientController(PatientService service) {
        this.service = service;
    }

    /**
     * REGISTER PATIENT
     * Creates a new patient record. Used by the login/registration flow
     * and by receptionists for walk-in admissions.
     * @param patientDTO Validated patient data
     * @return The created patient record
     */
    @PostMapping
    public ResponseEntity<PatientDTO> createPatient(@Valid @RequestBody PatientDTO patientDTO) {
        PatientDTO saved = service.registerPatient(patientDTO);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @GetMapping
    public List<PatientDTO> getAll() {
        return service.getAllPatients();
    }

    /**
     * GET LOGGED-IN PROFILE
     * Retrieves the profile of the currently authenticated user.
     * @param principal The security principal (JWT holder)
     * @return The patient's own profile data
     */
    @GetMapping("/me")
    public ResponseEntity<PatientDTO> getMyProfile(Principal principal) {
        if (principal == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(service.getPatientByEmail(principal.getName()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<PatientDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(service.getPatient(id));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<PatientDTO> updateStatus(@PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(service.updatePatientStatus(id, status));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PatientDTO> updatePatient(@PathVariable Long id, @RequestBody PatientDTO patientDTO) {
        return ResponseEntity.ok(service.updatePatient(id, patientDTO));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        service.deletePatient(id);
        return ResponseEntity.noContent().build();
    }
}
