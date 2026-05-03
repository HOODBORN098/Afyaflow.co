package com.afyaflow.demo.controller;

import com.afyaflow.demo.dto.AuthRequest;
import com.afyaflow.demo.dto.AuthResponse;
import com.afyaflow.demo.dto.RegisterRequest;
import com.afyaflow.demo.model.AuthProvider;
import com.afyaflow.demo.model.Role;
import com.afyaflow.demo.model.User;
import com.afyaflow.demo.model.Patient;
import com.afyaflow.demo.repository.RoleRepository;
import com.afyaflow.demo.repository.UserRepository;
import com.afyaflow.demo.repository.PatientRepository;
import com.afyaflow.demo.security.JwtService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import java.util.HashMap;
import java.util.Map;

/**
 * AUTH CONTROLLER: Central hub for identity management.
 * Handles JWT login, role-based registration, password updates, 
 * and persistent profile synchronization for all staff roles.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PatientRepository patientRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final com.afyaflow.demo.service.AuditService auditService;
    private final com.afyaflow.demo.service.DoctorService doctorService;
    private final com.afyaflow.demo.repository.DepartmentRepository departmentRepository;

    public AuthController(UserRepository userRepository, 
                          RoleRepository roleRepository, 
                          PatientRepository patientRepository,
                          PasswordEncoder passwordEncoder, 
                          JwtService jwtService, 
                          AuthenticationManager authenticationManager, 
                          com.afyaflow.demo.service.AuditService auditService, 
                          com.afyaflow.demo.service.DoctorService doctorService,
                          com.afyaflow.demo.repository.DepartmentRepository departmentRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.patientRepository = patientRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
        this.auditService = auditService;
        this.doctorService = doctorService;
        this.departmentRepository = departmentRepository;
    }

    @PostMapping({"/register", "/signup"})
    @SuppressWarnings("null")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            Map<String, String> response = new HashMap<>();
            response.put("message", "Email already exists");
            return ResponseEntity.badRequest().body(response);
        }

        Role userRole;
        boolean adminExists = userRepository.existsByRoleName("ADMIN");
        
        if (!adminExists) {
            userRole = roleRepository.findByName("ADMIN").orElseGet(() -> {
                Role r = new Role();
                r.setName("ADMIN");
                return roleRepository.save(r);
            });
        } else if (request.getRole() != null) {
            String requestedRole = request.getRole().toUpperCase();
            userRole = roleRepository.findByName(requestedRole).orElseGet(() -> {
                Role r = new Role();
                r.setName(requestedRole);
                return roleRepository.save(r);
            });
        } else {
            // Default to USER (PATIENT) for subsequent registrations
            userRole = roleRepository.findByName("USER").orElseGet(() -> {
                Role r = new Role();
                r.setName("USER");
                return roleRepository.save(r);
            });
        }

        User user = User.builder()
                .username(request.getEmail())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(userRole)
                .authProvider(AuthProvider.LOCAL)
                .build();

        User savedUser = userRepository.save(user);

        // ALWAYS create a Patient profile for standard registrations
        // (Unless it's an admin/staff being created, but even then it doesn't hurt or can be conditional)
        if ("USER".equals(userRole.getName().toUpperCase()) || "ADMIN".equals(userRole.getName().toUpperCase())) {
            Patient patient = Patient.builder()
                    .firstName(request.getFirstName())
                    .lastName(request.getLastName())
                    .name(request.getFirstName() + " " + (request.getLastName() != null ? request.getLastName() : ""))
                    .email(request.getEmail())
                    .phone(request.getPhoneNumber())
                    .dob(request.getDob())
                    .gender(request.getGender())
                    .address(request.getAddress())
                    .nationalId(request.getNationalId())
                    .status("ACTIVE")
                    .build();
            patientRepository.save(patient);
        }

        // Auto-create clinical profile for doctors if role is DOCTOR
        if ("DOCTOR".equals(userRole.getName().toUpperCase())) {
            try {
                com.afyaflow.demo.model.Department dept = null;
                if (request.getDepartmentId() != null) {
                    dept = departmentRepository.findById(request.getDepartmentId()).orElse(null);
                }

                com.afyaflow.demo.model.Doctor doctor = com.afyaflow.demo.model.Doctor.builder()
                        .name(request.getFirstName() + " " + (request.getLastName() != null ? request.getLastName() : ""))
                        .email(request.getEmail())
                        .specialization(request.getRole() != null ? request.getRole() : "General Practitioner")
                        .status("available")
                        .department(dept)
                        .patientsSeenToday(0)
                        .phone(request.getPhoneNumber())
                        .build();
                doctorService.createDoctor(doctor);
            } catch (Exception e) {
                System.err.println("Failed to create doctor profile: " + e.getMessage());
            }
        }

        auditService.log("USER_REGISTERED", "User", savedUser.getId().toString(), "New user registered with email: " + savedUser.getEmail() + " as role: " + userRole.getName());

        String token = jwtService.generateToken(savedUser);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .accessToken(token)
                .role(userRole.getName().toUpperCase())
                .userId(savedUser.getId())
                .build());
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow();
        
        auditService.log("USER_LOGIN", "User", user.getId().toString(), "User logged in with email: " + user.getEmail());
        
        String token = jwtService.generateToken(user);
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .accessToken(token)
                .role(user.getRole().getName().toUpperCase())
                .userId(user.getId())
                .build());
    }

    @PostMapping("/set-password")
    @SuppressWarnings("null")
    public ResponseEntity<?> setPassword(@RequestBody Map<String, String> request) {
        String email = request.get("email");
        String password = request.get("password");

        if (email == null || password == null) {
            return ResponseEntity.badRequest().body(Map.of("message", "Email and password are required"));
        }

        User user = userRepository.findByEmail(email).orElse(null);
        
        if (user == null) {
            // Create a new user account linked to the patient record
            Role userRole = roleRepository.findByName("USER").orElseGet(() -> {
                Role r = new Role();
                r.setName("USER");
                return roleRepository.save(r);
            });

            user = User.builder()
                    .username(email)
                    .email(email)
                    .password(passwordEncoder.encode(password))
                    .role(userRole)
                    .authProvider(AuthProvider.LOCAL)
                    .build();
            userRepository.save(user);
            auditService.log("ACCOUNT_CREATED_VIA_INVITE", "User", user.getId().toString(), "Account created for walk-in patient: " + email);
        } else {
            // User already exists, update password
            user.setPassword(passwordEncoder.encode(password));
            userRepository.save(user);
            auditService.log("PASSWORD_SET_VIA_INVITE", "User", user.getId().toString(), "Password reset/set for patient: " + email);
        }

        return ResponseEntity.ok(Map.of("message", "Password set successfully"));
    }
    /**
     * UPDATE PROFILE: Allows staff to update their display name, email, and department.
     * Updates are persisted to the database and a new JWT is returned.
     */
    @org.springframework.web.bind.annotation.PutMapping("/profile")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> updateProfile(
            @RequestBody Map<String, String> body,
            java.security.Principal principal) {
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String newUsername = body.get("username");
        String newEmail    = body.get("email");
        String newDept     = body.get("department");

        if (newEmail != null && !newEmail.isBlank() && !newEmail.equals(user.getEmail())) {
            if (userRepository.findByEmail(newEmail).isPresent()) {
                return ResponseEntity.badRequest().body(Map.of("message", "Email already in use"));
            }
            user.setEmail(newEmail);
            user.setUsername(newEmail);
        }
        if (newUsername != null && !newUsername.isBlank()) user.setUsername(newUsername);
        if (newDept     != null) user.setDepartment(newDept);

        if (user != null) {
            userRepository.save(user);
        }
        
        auditService.log("PROFILE_UPDATED", "User", user.getId().toString(),
                "Profile updated for: " + user.getEmail());

        String newToken = jwtService.generateToken(user);
        return ResponseEntity.ok(Map.of(
                "message", "Profile updated successfully",
                "token",   newToken,
                "username", user.getUsername(),
                "email",    user.getEmail(),
                "department", user.getDepartment() != null ? user.getDepartment() : ""
        ));
    }

    /**
     * CHANGE PASSWORD: Securely updates user credentials with current password verification.
     */
    @org.springframework.web.bind.annotation.PutMapping("/change-password")
    @org.springframework.security.access.prepost.PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(
            @RequestBody Map<String, String> body,
            java.security.Principal principal) {
        
        User user = userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));

        String currentPassword = body.get("currentPassword");
        String newPassword = body.get("newPassword");

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            return ResponseEntity.badRequest().body(Map.of("message", "Current password incorrect"));
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);
        
        auditService.log("PASSWORD_CHANGED", "User", user.getId().toString(),
                "Password changed for: " + user.getEmail());

        return ResponseEntity.ok(Map.of("message", "Password updated successfully"));
    }
}
