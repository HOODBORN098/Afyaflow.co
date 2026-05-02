# AfyaFlow - Grading Rubric Compliance Report

This document outlines how the AfyaFlow project satisfies the core requirements for the university grading rubric.

## 1. Core Application Features

### ✅ Patient Management & Registration
- **Implementation**: `ReceptionistDashboard.tsx` and `NewAdmissionModal.tsx` allow for full patient registration and token generation.
- **Verification**: Walk-in patients are assigned a unique token (e.g., AFY-1023) and routed to the correct department queue.

### ✅ Appointment Scheduling & Queue System
- **Implementation**: Real-time queue tracking in `PatientDashboard.tsx` and `DoctorDashboard.tsx`.
- **Verification**: The system calculates "Patients Ahead" and "Estimated Wait Time" (15 mins/patient) based on confirmed appointments.

### ✅ Role-Based Access Control (RBAC)
- **Implementation**: JWT-based authentication with roles: `Admin`, `Doctor`, `Receptionist`, `Patient`.
- **Verification**: Each dashboard (e.g., `AdminDashboard`) is protected by a `ProtectedRoute` component that validates the user's role.

## 2. Technical Complexity

### ✅ Full-Stack Integration
- **Backend**: Spring Boot (Java) with JPA/Hibernate for persistence.
- **Frontend**: React (TypeScript) with Vite and Tailwind CSS.
- **Database**: MySQL/H2 with relational mappings between Doctors, Patients, and Appointments.

### ✅ Real-Time Synchronization
- **Polling Mechanism**: Implemented 10-second polling in `DataContext.tsx` and `PatientDashboard.tsx` to keep the UI in sync without manual refreshes.

### ✅ Advanced UI/UX
- **Design**: Modern "Nairobi West Medical Hub" aesthetic with Glassmorphism, smooth transitions, and responsive layouts.
- **Feedback**: Integrated Sonner toast notifications for all critical actions (login, booking, status updates).

## 3. Data Integrity & Persistence

### ✅ Database Relationships
- **One-to-Many**: Department -> Doctors, Patient -> Appointments.
- **ManyToMany**: Doctors assigned to multiple wards/shifts (simulated via relational mapping).

### ✅ Input Validation
- **Frontend**: Heavy Zod/Regex validation in `Register.tsx` and `NewAdmissionModal.tsx`.
- **Backend**: Jakarta Bean Validation (`@Valid`) in controllers to ensure data sanitization.

## 4. Documentation

### ✅ Professional Codebase
- **Commenting**: All major controllers and components include Javadoc-style headers and inline logic explanations.
- **Guides**: `PRODUCTION_DEPLOYMENT_GUIDE.md` provides full instructions for running the stack locally and in production.

## 5. Grading Checklist

| Requirement | Status | File Reference |
|-------------|--------|----------------|
| Multi-user Roles | ✅ Complete | `App.tsx`, `ProtectedRoute.tsx` |
| Database Persistence | ✅ Complete | `AfyaFlow-Backend/src/main/resources/application.properties` |
| CRUD Operations | ✅ Complete | `DoctorController.java`, `PatientController.java` |
| Analytical Reports | ✅ Complete | `ReportsPage.tsx`, `AdminAnalyticsService.java` |
| Responsive Design | ✅ Complete | All components use Tailwind grid/flex systems |
