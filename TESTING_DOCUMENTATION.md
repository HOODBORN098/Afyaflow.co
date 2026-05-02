# AfyaFlow - Testing & Verification Documentation

This document describes the manual and automated testing procedures used to ensure system stability.

## 1. Manual Smoke Test Suite

### ✅ Authentication Flow
1. **Test**: Register a new patient.
2. **Expected**: User is redirected to login, login succeeds, and they land on the Patient Dashboard.
3. **Status**: Verified

### ✅ Appointment Booking (End-to-End)
1. **Test**: Patient selects a department, chooses a slot, and books.
2. **Expected**: Appointment appears in "Upcoming" section. Doctor receives a real-time notification.
3. **Status**: Verified

### ✅ Queue Synchronization
1. **Test**: Receptionist admits a walk-in patient.
2. **Expected**: Token is generated and printed. Patient appears in Doctor's "Live Queue".
3. **Status**: Verified

### ✅ Admin Operations
1. **Test**: Admin edits a doctor's department.
2. **Expected**: Changes persist in the database and show up immediately in the staff list.
3. **Status**: Verified

## 2. Automated Validation (Frontend)

### Zod Schema Validation
- **Register Form**: Validates email format, phone length (9-10 digits), and password strength (min 8 chars, 1 uppercase, 1 number).
- **Admission Form**: Validates mandatory fields and prevents future dates for DOB.

### API Interceptors
- **Auth**: Automatically attaches `Bearer <token>` to all outgoing requests.
- **Error Handling**: Catches 401/403 errors and redirects to login, showing a "Session Expired" notification.

## 3. Backend Verification

### Integration Tests
- **AppointmentServiceTests**: Validates slot calculation logic and prevents double-booking the same doctor at the same time.
- **QueueCalculation**: Validates that `position` and `wait_time` update correctly when appointments are cancelled or served.

## 4. UI/UX Consistency
- **Modals**: All modals tested for scrollability on small screens (`max-h-[80vh]`).
- **Notifications**: Sonner toasts tested for visibility and auto-dismissal.
