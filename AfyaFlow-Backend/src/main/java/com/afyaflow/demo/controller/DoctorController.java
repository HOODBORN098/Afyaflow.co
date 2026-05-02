package com.afyaflow.demo.controller;

import java.util.List;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.afyaflow.demo.model.Doctor;
import com.afyaflow.demo.service.DoctorService;

/**
 * =========================================================
 * DOCTOR CONTROLLER - Staff Management API
 * =========================================================
 * 
 * PURPOSE:
 *   Handles all administrative and informational requests related to doctors.
 *   Provides endpoints for CRUD operations on doctor profiles, department filtering,
 *   and secure credential management (password resets).
 * 
 * ACCESS CONTROL:
 *   - Reading doctor lists is generally available for booking and directory features.
 *   - Creating, updating, and deleting doctors is restricted to ADMIN users.
 *   - Password updates are used by admins to reset forgotten credentials.
 * 
 * @author AfyaFlow Development Team
 * @date April 2026
 */
@RestController
@RequestMapping("/api/doctors")
public class DoctorController {

    private final DoctorService service;

    public DoctorController(DoctorService service){
        this.service = service;
    }

    /**
     * CREATE DOCTOR
     * Registers a new doctor in the system. Usually called from the Admin Dashboard.
     * @param doctor The doctor entity to save
     * @return The persisted doctor object
     */
    @PostMapping
    public Doctor createDoctor(@RequestBody Doctor doctor){
        return service.createDoctor(doctor);
    }

    /**
     * GET ALL DOCTORS / FILTER BY DEPARTMENT
     * Retrieves doctors, optionally filtered by their assigned department.
     * @param departmentId Optional ID of the department to filter by
     * @return List of matching doctors
     */
    @GetMapping
    public List<Doctor> getDoctors(@RequestParam(required = false) Long departmentId){
        if (departmentId != null) {
            return service.getDoctorsByDepartment(departmentId);
        }
        return service.getDoctors();
    }

    @GetMapping("/{id}")
    public Doctor getDoctor(@PathVariable Long id){
        return service.getDoctor(id);
    }

    @PutMapping("/{id}")
    public Doctor updateDoctor(@PathVariable Long id, @RequestBody Doctor doctor){
        return service.updateDoctor(id, doctor);
    }

    @DeleteMapping("/{id}")
    public void deleteDoctor(@PathVariable Long id){
        service.deleteDoctor(id);
    }

    /**
     * UPDATE STAFF PASSWORD
     * Securely updates the password for a doctor's associated login account.
     * Used by administrators to reset passwords for staff members.
     * @param id The doctor's ID
     * @param payload Map containing the new "password"
     * @return Success or error response
     */
    @PostMapping("/{id}/password")
    public org.springframework.http.ResponseEntity<?> updatePassword(@PathVariable Long id, @RequestBody java.util.Map<String, String> payload){
        String newPassword = payload.get("password");
        if (newPassword == null || newPassword.isBlank()) {
            return org.springframework.http.ResponseEntity.badRequest().body("Password cannot be empty");
        }
        boolean updated = service.updatePassword(id, newPassword);
        if (updated) {
            return org.springframework.http.ResponseEntity.ok("Password updated successfully");
        }
        return org.springframework.http.ResponseEntity.status(org.springframework.http.HttpStatus.NOT_FOUND).body("Doctor or associated user not found");
    }
}
