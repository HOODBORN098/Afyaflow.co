# AfyaFlow — Full Project Documentation & Requirements

This document provides a comprehensive overview of the AfyaFlow Hospital Management System (HMS), including functional/non-functional requirements, data models, API specifications, and architecture. This information is intended for use in creating UML diagrams, Product Requirement Documents (PRD), and other technical artifacts.

---

## 1. System Architecture Overview

AfyaFlow follows a modern decoupled architecture:
- **Backend:** Spring Boot 3 REST API with Spring Security (JWT) and Spring Data JPA.
- **Database:** MySQL 8.0+ for relational data persistence.
- **Frontend:** React 18+ with TypeScript, Vite, and Recharts for visualization.
- **State Management:** Centralized via React Context API (`AuthContext`, `DataContext`, `SearchContext`, `NotificationContext`).
- **Styling:** Material Design 3 tokens implemented via Vanilla CSS/Tailwind.

---

## 2. Functional Requirements

### 2.1 Authentication & Authorization (RBAC)
- **Roles:**
  - `ADMIN`: Full system access, staff management, department/ward configuration, reports.
  - `DOCTOR`: Access to department-specific patient queues, consultation tools, and personal settings.
  - `RECEPTIONIST`: Patient registration, triage, queue management, and appointments.
  - `USER` (Patient): Access to personal medical history and profile settings.
- **Features:**
  - JWT-based authentication with `sessionStorage` persistence.
  - Google OAuth 2.0 integration for social login.
  - Role-based route protection via `ProtectedRoute` component.
  - Staff password reset capability by Admins.

### 2.2 Reception & Patient Management
- **Registration:** Capture patient demographics (Name, National ID, DOB, Gender, Phone, Email).
- **Triage:** Assign priority levels (Standard, Urgent, Emergency).
- **Token System:** Auto-generate visit tokens (Format: `AFY-XXX`) for queue tracking.
- **Department Assignment:** Direct patients to specific clinical areas.
- **Walk-in Invitations:** Automatically send account invitations to patients with emails.

### 2.3 Doctor Consultation Workflow
- **Queue Management:** View patients assigned to the doctor's specific department.
- **Consultation Tools:** 
  - **Vitals:** Record Temp, BP, Heart Rate, Respiratory Rate, SpO2, Weight.
  - **Diagnosis:** Document clinical findings and consultation notes.
  - **Prescriptions:** Issue digital prescriptions (Medicine, Dosage, Frequency, Duration).
  - **Referrals:** Generate specialist referrals with urgency levels.
- **Status Tracking:** Doctors can set their status (Available, In Surgery, On Call, Off Duty).

### 2.4 Wards & Bed Management
- **Ward Configuration:** Create wards by type (ICU, Maternity, General, Surgical, HDU) and capacity.
- **Bed Occupancy:** Visual grid showing real-time bed status (Available, Occupied, Maintenance).
- **Patient Tracking:** Link patients to specific beds during admission and track admission dates.

### 2.5 Inventory Management
- **Supply Tracking:** Monitor medical supplies, stock levels, and reorder thresholds.
- **Status Alerts:** Visual indicators for In Stock, Low Stock, and Out of Stock.

### 2.6 Reports & Analytics
- **Dashboards:** Real-time KPIs for patient volume, wait times, and occupancy.
- **Reporting Types:**
  - Patient Volume (Daily trends).
  - Department Load (Patient distribution).
  - Clinical KPIs (Wait times, discharge rates).
  - Morbidity (Disease burden/diagnoses).
- **Data Export:** All reports exportable to CSV format.

### 2.7 Audit & Compliance
- **Audit Logging:** Record all sensitive user actions (Login, Patient Registration, Prescription addition, etc.).
- **Compliance Ready:** Capture actor, role, entity, details, and timestamps for HIPAA readiness.

---

## 3. Data Model (Entities & Relationships)

### 3.1 User & Identity
- **User:** `id`, `username`, `email`, `password`, `role_id`, `authProvider`, `providerId`, `department`.
- **Role:** `id`, `name`.

### 3.2 Clinical Records
- **Patient:** `id`, `patientCode` (Token), `firstName`, `lastName`, `email`, `phone`, `age`, `dob`, `gender`, `address`, `nationalId`, `status`, `department`, `priority`, `diagnosis`, `consultationNotes`, `registeredAt`.
- **Vitals:** `temperature`, `bloodPressure`, `heartRate`, `respiratoryRate`, `oxygenSaturation`, `weight`, `recordedAt`.
- **Prescription:** `id`, `medicineName`, `dosage`, `frequency`, `duration`, `instructions`, `prescribedAt`, `prescribedBy`.
- **Referral:** `id`, `toSpecialty`, `reason`, `urgency`, `referredAt`, `referredBy`.

### 3.3 Staff & Infrastructure
- **Doctor:** `id`, `name`, `email`, `specialization`, `status`, `department_id`, `shift`, `patientsSeenToday`, `phone`.
- **Department:** `id`, `name`.
- **Ward:** `id`, `name`, `type`, `department_id`, `capacity`.
- **Bed:** `id`, `bedNumber`, `status`, `ward_id`, `patient_id`, `patientName`, `admittedAt`.

### 3.4 Operational Data
- **Queue:** `id`, `queueNumber`, `queueDate`, `status`, `patient_id`, `doctor_id`, `department_id`.
- **Appointment:** `id`, `patientName`, `patientId`, `doctorName`, `department`, `date`, `time`, `type` (Scheduled/Walk-in/Follow-up), `status`, `notes`.
- **InventoryItem:** `id`, `name`, `category`, `quantity`, `unit`, `reorderLevel`, `lastUpdated`, `supplier`.
- **AuditLog:** `id`, `actorUsername`, `actorRole`, `action`, `entityType`, `entityId`, `details`, `timestamp`.

---

## 4. API Specification (REST Endpoints)

### 4.1 Auth API (`/api/auth`)
- `POST /login`: Authenticate and return JWT + Role + UserID.
- `POST /register`: Register new staff or patient.
- `POST /set-password`: Handle password set for invited patients.

### 4.2 Patient API (`/api/patients`)
- `GET /`: List all patients.
- `GET /me`: Get current logged-in patient profile.
- `GET /{id}`: Get patient details.
- `POST /`: Create new patient record (auto-generates Token).
- `PUT /{id}/status`: Update visit status (queued, in-progress, served, admitted).
- `DELETE /{id}`: Remove patient record.

### 4.3 Doctor API (`/api/doctors`)
- `GET /`: List all doctors (filterable by department).
- `GET /{id}`: Get doctor profile.
- `PUT /{id}`: Update doctor profile/status.
- `POST /{id}/password`: Reset staff password.
- `DELETE /{id}`: Remove doctor record.

### 4.4 Ward & Bed API (`/api/wards`)
- `GET /`: List all wards.
- `POST /`: Create new ward.
- `GET /{wardId}/beds`: Get all beds in a ward.
- `PUT /beds/{bedId}`: Update bed status, occupant, and admission info.

### 4.5 Other APIs
- **Appointments:** `GET /api/appointments`, `POST /api/appointments`.
- **Departments:** `GET /api/departments`, `POST /api/departments`, `DELETE /api/departments/{id}`.
- **Audit:** `GET /api/audit`: Retrieve compliance logs.

---

## 5. Technical Requirements (Non-Functional)

### 5.1 Security
- **JWT Security:** Tokens contain claims for role and department isolation.
- **Data Protection:** BCrypt hashing for all credentials.
- **Access Control:** Doctors are isolated to their own department's queue.

### 5.2 Performance
- **Optimized UI:** React 18 with Vite ensures sub-second page transitions.
- **Scalable State:** Context-based state minimizes redundant API calls.
- **Visuals:** Responsive charts using Recharts for high-density data viewing.

### 5.3 Usability
- **Design System:** Custom Material Design implementation with HSL color tokens.
- **Micro-animations:** Hover effects and transitions for enhanced user feedback.
- **Mobile Ready:** Responsive layouts for clinical use on mobile/tablet devices.

---

## 6. Development & Deployment

### 6.1 Backend Tech
- Java 21, Spring Boot 3.4.1, Spring Security, Hibernate/JPA, Lombok, Maven.

### 6.2 Frontend Tech
- React 18, TypeScript, Vite, Axios, React Router 7, Recharts, Lucide Icons.

### 6.3 Deployment
- **Database:** MySQL 8.0.
- **Frontend Port:** 5174 (Development).
- **Backend Port:** 8080 (REST API).
