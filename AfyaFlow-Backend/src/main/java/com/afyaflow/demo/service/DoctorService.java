package com.afyaflow.demo.service;

import java.util.List;

import org.springframework.stereotype.Service;

import com.afyaflow.demo.model.Doctor;
import com.afyaflow.demo.repository.DoctorRepository;

@Service
@SuppressWarnings("null")
public class DoctorService {

    private final DoctorRepository repository;
    private final com.afyaflow.demo.repository.UserRepository userRepository;
    private final org.springframework.security.crypto.password.PasswordEncoder passwordEncoder;

    public DoctorService(DoctorRepository repository, 
                         com.afyaflow.demo.repository.UserRepository userRepository,
                         org.springframework.security.crypto.password.PasswordEncoder passwordEncoder) {
        this.repository = repository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public Doctor createDoctor(Doctor doctor) {
        return repository.save(doctor);
    }

    public List<Doctor> getDoctors() {
        return repository.findAll();
    }

    public Doctor getDoctor(Long id) {
        return repository.findById(id).orElse(null);
    }

    public List<Doctor> getDoctorsByDepartment(Long departmentId) {
        return repository.findByDepartmentId(departmentId);
    }

    public Doctor updateDoctor(Long id, Doctor details) {
        Doctor existing = repository.findById(id).orElse(null);
        if (existing != null) {
            existing.setName(details.getName());
            existing.setSpecialization(details.getSpecialization());
            existing.setPhone(details.getPhone());
            existing.setEmail(details.getEmail());
            existing.setDepartment(details.getDepartment());
            existing.setShift(details.getShift());
            existing.setStatus(details.getStatus());
            return repository.save(existing);
        }
        return null;
    }

    public void deleteDoctor(Long id) {
        repository.deleteById(id);
    }

    public boolean updatePassword(Long doctorId, String newPassword) {
        Doctor doctor = repository.findById(doctorId).orElse(null);
        if (doctor != null && doctor.getEmail() != null) {
            return userRepository.findByEmail(doctor.getEmail()).map(user -> {
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return true;
            }).orElse(false);
        }
        return false;
    }
}
