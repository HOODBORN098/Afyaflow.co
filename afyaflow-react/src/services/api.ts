/**
 * =========================================================
 * API SERVICE - HTTP Communication Layer
 * =========================================================
 *
 * PURPOSE:
 *   This file is the single point of contact for all backend communication.
 *   It handles:
 *   - Creating HTTP requests to the backend API
 *   - Adding authentication tokens to every request
 *   - Managing base URL configuration
 *   - Error handling and response management
 *
 * HOW IT WORKS:
 *   1. Axios is used as the HTTP client (popular, reliable library)
 *   2. A request interceptor automatically adds JWT token to every request
 *   3. All API endpoints are exported as objects with methods
 *   4. Components call these methods to get/send data
 *   5. Responses are automatically converted to JSON
 *
 * SECURITY:
 *   - JWT token is stored in sessionStorage (cleared on browser close)
 *   - Token is sent in Authorization header: "Bearer <token>"
 *   - All requests use HTTPS in production
 *   - Token is retrieved fresh on every request (real-time updates)
 *
 * ARCHITECTURE PATTERN: "Repository Pattern"
 *   Each domain (auth, patient, doctor, etc.) has its own object.
 *   This keeps code organized and easy to maintain.
 *
 * USAGE EXAMPLE:
 *   import { doctorApi } from '../services/api';
 *   
 *   // Fetch all doctors
 *   const response = await doctorApi.getAll();
 *   
 *   // Update a doctor
 *   await doctorApi.update('123', { name: 'New Name' });
 *   
 *   // Delete a doctor
 *   await doctorApi.delete('123');
 *
 * ENVIRONMENT VARIABLES:
 *   VITE_API_URL - Backend API base URL (e.g., http://localhost:8080)
 *   Falls back to 'http://localhost:8080' if not set
 *
 * @module API Service
 * @author AfyaFlow Development Team
 * @version 2.0
 * @date April 2026
 */

import axios from 'axios';

// ========== AXIOS INSTANCE SETUP ==========
/**
 * API_BASE_URL: The root URL for all API requests.
 * 
 * This allows easy switching between environments:
 *   Development: http://localhost:8080
 *   Staging: https://staging-api.afyaflow.com
 *   Production: https://api.afyaflow.com
 * 
 * Set via VITE_API_URL environment variable
 */
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Create Axios instance with default configuration.
 * This instance is used for all HTTP requests in the application.
 */
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',  // Send/receive JSON
    },
});

// ========== REQUEST INTERCEPTOR: ADD JWT TOKEN ==========
/**
 * INTERCEPTOR: A function that runs on EVERY request before it's sent.
 * 
 * Purpose: Automatically add JWT token to Authorization header
 * Benefits:
 *   1. Don't have to add token manually on every request
 *   2. If token expires, easy to refresh it in one place
 *   3. Keeps code DRY (Don't Repeat Yourself)
 *
 * Flow:
 *   1. Check if token exists in sessionStorage
 *   2. If found, add it to request headers as: "Bearer <token>"
 *   3. Send request with authorization
 *   4. If not found, send request without token (public endpoints)
 *
 * WHY sessionStorage?
 *   - Cleared when browser closes (more secure)
 *   - Not sent to server automatically (unlike cookies)
 *   - Easy to manually clear on logout
 */
api.interceptors.request.use(
    (config) => {
        // Retrieve JWT token from browser's session storage
        const token = sessionStorage.getItem('afyaflow_token');
        
        // If token exists, add it to every request
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => Promise.reject(error)
);

// ========== API ENDPOINTS DEFINITION ==========
/**
 * Each export object represents a domain of functionality.
 * Each method represents a specific API endpoint.
 * 
 * NAMING CONVENTION:
 *   - getAll: Fetch all records
 *   - getById: Fetch specific record
 *   - create: Add new record
 *   - update: Modify existing record
 *   - delete: Remove record
 */

/**
 * AUTH API: User login and registration
 * Endpoints for authentication operations
 */
export const authApi = {
    login: (credentials: any) => api.post('/api/auth/login', credentials),
    register: (details: any) => api.post('/api/auth/register', details),
};

/**
 * PATIENT API: All patient-related operations
 * 
 * Endpoints:
 *   GET /api/patients - Get all patients
 *   GET /api/patients/{id} - Get specific patient
 *   POST /api/patients - Create new patient
 *   PUT /api/patients/{id}/status - Update patient status
 *   DELETE /api/patients/{id} - Delete patient
 */
export const patientApi = {
    getAll: () => api.get('/api/patients'),
    getById: (id: string | number) => api.get(`/api/patients/${id}`),
    create: (data: any) => api.post('/api/patients', data),
    updateStatus: (id: string | number, status: string) => 
        api.put(`/api/patients/${id}/status`, null, { params: { status } }),
    delete: (id: string | number) => api.delete(`/api/patients/${id}`),
};

/**
 * DEPARTMENT API: Hospital departments (Cardiology, Neurology, etc.)
 */
export const departmentApi = {
    getAll: () => api.get('/api/departments'),
    create: (data: { name: string }) => api.post('/api/departments', data),
    delete: (id: number) => api.delete(`/api/departments/${id}`),
};

/**
 * WARD API: Hospital wards and hospital beds management
 * 
 * Wards: Different areas of the hospital
 * Beds: Individual patient beds within a ward
 */
export const wardApi = {
    getAll: () => api.get('/api/wards'),
    create: (data: any) => api.post('/api/wards', data),
    getBeds: (wardId: number | string) => api.get(`/api/wards/${wardId}/beds`),
    updateBed: (bedId: number | string, status: string, patientId?: string, patientName?: string) => 
        api.put(`/api/wards/beds/${bedId}`, null, { params: { status, patientId, patientName } }),
};

/**
 * DOCTOR API: Doctor management and operations
 * 
 * Endpoints:
 *   GET /api/doctors - Get all doctors
 *   PUT /api/doctors/{id} - Update doctor details (name, specialization, department)
 *   DELETE /api/doctors/{id} - Remove doctor from system
 *   POST /api/doctors/{id}/password - Reset doctor's password
 */
export const doctorApi = {
    getAll: () => api.get('/api/doctors'),
    update: (id: string | number, data: any) => api.put(`/api/doctors/${id}`, data),
    delete: (id: string | number) => api.delete(`/api/doctors/${id}`),
    updatePassword: (id: string | number, password: string) => api.post(`/api/doctors/${id}/password`, { password }),
};

/**
 * APPOINTMENT API: Patient appointment scheduling and management
 */
export const appointmentApi = {
    getAll: () => api.get('/api/appointments'),
    create: (data: any) => api.post('/api/appointments', data),
};

/**
 * AUDIT API: System audit logs and tracking
 */
export const auditApi = {
    getAll: () => api.get('/api/audit'),
};

/**
 * NOTIFICATION API: User alerts and notifications
 */
export const notificationApi = {
    getAll: () => api.get('/api/notifications'),
    getUnreadCount: () => api.get('/api/notifications/unread-count'),
    markAsRead: (id: number) => api.patch(`/api/notifications/${id}/read`),
    markAllRead: () => api.post('/api/notifications/read-all'),
};

// ========== DEFAULT EXPORT ==========
// Export the configured Axios instance for custom requests
export default api;
