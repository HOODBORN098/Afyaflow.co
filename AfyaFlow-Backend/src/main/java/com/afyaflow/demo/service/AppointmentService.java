package com.afyaflow.demo.service;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.afyaflow.demo.model.Appointment;
import com.afyaflow.demo.model.Doctor;
import com.afyaflow.demo.model.Patient;
import com.afyaflow.demo.repository.AppointmentRepository;
import com.afyaflow.demo.repository.DoctorRepository;
import com.afyaflow.demo.repository.PatientRepository;

@Service
public class AppointmentService {

    private final AppointmentRepository repository;
    private final DoctorRepository doctorRepository;
    private final PatientRepository patientRepository;

    private static final List<String> ALL_SLOTS = Arrays.asList(
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
        "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
        "14:00", "14:30", "15:00", "15:30", "16:00", "16:30"
    );

    public AppointmentService(AppointmentRepository repository,
                              DoctorRepository doctorRepository,
                              PatientRepository patientRepository) {
        this.repository = repository;
        this.doctorRepository = doctorRepository;
        this.patientRepository = patientRepository;
    }

    /** Legacy: used by the old afyaflow-react frontend */
    @SuppressWarnings("null")
    public Appointment createAppointment(Appointment appointment) {
        return repository.save(appointment);
    }

    public List<Appointment> getAppointments() {
        return repository.findAll();
    }

    public List<Appointment> getAppointmentsByPatient(Long patientId) {
        return repository.findByPatientId(patientId);
    }

    public List<Appointment> getAppointmentsByDoctor(Long doctorId) {
        return repository.findByDoctorId(doctorId);
    }

    /**
     * Returns available time slots for a doctor on a given date.
     * It subtracts already-booked slots from the full slot list.
     */
    public List<String> getAvailableSlots(Long doctorId, String dateStr) {
        LocalDate date = LocalDate.parse(dateStr);
        List<Appointment> existing = repository.findByDoctorId(doctorId)
            .stream()
            .filter(a -> date.equals(a.getAppointmentDate()))
            .collect(Collectors.toList());

        List<String> bookedSlots = existing.stream()
            .map(Appointment::getTimeSlot)
            .collect(Collectors.toList());

        return ALL_SLOTS.stream()
            .filter(slot -> !bookedSlots.contains(slot))
            .collect(Collectors.toList());
    }

    /**
     * Returns available time slots for a department.
     * A slot is available if at least one doctor in the department is free.
     */
    public List<String> getAvailableSlotsByDepartment(Long departmentId, String dateStr) {
        try {
            List<Doctor> doctors = doctorRepository.findByDepartmentId(departmentId);
            if (doctors == null || doctors.isEmpty()) {
                return List.of();
            }

            LocalDate date = LocalDate.parse(dateStr);
            List<Long> doctorIds = doctors.stream()
                .filter(java.util.Objects::nonNull)
                .map(Doctor::getId)
                .collect(Collectors.toList());

            // Better: single query for all appointments
            List<Appointment> allAppointments = repository.findByDoctorIdIn(doctorIds).stream()
                .filter(a -> a != null && date.equals(a.getAppointmentDate()))
                .collect(Collectors.toList());

            // A slot is available if (count of appointments in slot) < (number of doctors)
            return ALL_SLOTS.stream()
                .filter(slot -> {
                    long count = allAppointments.stream()
                        .filter(a -> slot.equals(a.getTimeSlot()))
                        .count();
                    return count < doctors.size();
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            e.printStackTrace();
            throw e;
        }
    }

    /**
     * Book an appointment for a patient identified by their email.
     * Creates and persists the appointment as CONFIRMED.
     */
    @SuppressWarnings("null")
    public Appointment bookAppointment(String patientEmail, Long doctorId, Long departmentId, String dateStr, String time) {
        Patient patient = patientRepository.findByEmail(patientEmail)
            .orElseGet(() -> {
                System.out.println("DEBUG: Patient profile missing for " + patientEmail + ". Creating minimal profile.");
                Patient p = Patient.builder()
                    .email(patientEmail)
                    .name(patientEmail.split("@")[0])
                    .firstName(patientEmail.split("@")[0])
                    .lastName("Patient")
                    .status("ACTIVE")
                    .build();
                return patientRepository.save(p);
            });

        Doctor assignedDoctor = null;

        if (doctorId != null) {
            assignedDoctor = doctorRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found: " + doctorId));
        } else if (departmentId != null) {
            // Auto-assign first available doctor in department
            List<Doctor> doctors = doctorRepository.findByDepartmentId(departmentId);
            if (doctors == null || doctors.isEmpty()) {
                throw new RuntimeException("No doctors found in department: " + departmentId);
            }
            
            LocalDate date = LocalDate.parse(dateStr);

            for (Doctor doc : doctors) {
                if (doc == null) continue;
                List<Appointment> apps = repository.findByDoctorId(doc.getId());
                boolean isBusy = apps != null && apps.stream()
                    .anyMatch(a -> a != null && date.equals(a.getAppointmentDate()) && time.equals(a.getTimeSlot()));
                
                if (!isBusy) {
                    assignedDoctor = doc;
                    break;
                }
            }
            if (assignedDoctor == null) {
                throw new RuntimeException("No available doctors in department for this slot");
            }
        } else {
            throw new RuntimeException("Either doctorId or departmentId must be provided");
        }

        Appointment appt = Appointment.builder()
            .patient(patient)
            .doctor(assignedDoctor)
            .appointmentDate(LocalDate.parse(dateStr))
            .timeSlot(time)
            .departmentName(assignedDoctor.getDepartment() != null ? assignedDoctor.getDepartment().getName() : "")
            .status("CONFIRMED")
            .type("scheduled")
            .build();

        try {
            return repository.save(appt);
        } catch (Exception e) {
            System.err.println("CRITICAL ERROR: Failed to save appointment!");
            e.printStackTrace();
            throw e;
        }
    }
}
