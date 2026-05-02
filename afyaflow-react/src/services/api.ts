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
 * @module API Service
 * @author AfyaFlow Development Team
 * @version 2.0
 * @date April 2026
 */

import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = sessionStorage.getItem('afyaflow_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const authApi = {
    login: (credentials: any) => api.post('/api/auth/login', credentials),
    register: (details: any) => api.post('/api/auth/register', details),
};

/**
 * PATIENT API
 *
 * FIX: Added `update` method (PUT /api/patients/{id}) used by:
 *   - addPrescription  → saves prescriptionsJson
 *   - addReferral      → saves referralsJson + department + status
 *   - updateVitals     → saves vitalsJson
 *
 * `updateStatus` is intentionally kept separate — it hits a dedicated
 * /status endpoint with query params, which is a different backend route.
 */
export const patientApi = {
    getAll: () => api.get('/api/patients'),
    getById: (id: string | number) => api.get(`/api/patients/${id}`),
    create: (data: any) => api.post('/api/patients', data),
    // ✅ NEW: full patient record update (prescriptions, referrals, vitals, etc.)
    update: (id: string | number, data: any) => api.put(`/api/patients/${id}`, data),
    // kept separate — hits /status with query params, different backend route
    updateStatus: (id: string | number, status: string) =>
        api.put(`/api/patients/${id}/status`, null, { params: { status } }),
    delete: (id: string | number) => api.delete(`/api/patients/${id}`),
};

export const departmentApi = {
    getAll: () => api.get('/api/departments'),
    create: (data: { name: string }) => api.post('/api/departments', data),
    delete: (id: number) => api.delete(`/api/departments/${id}`),
};

export const wardApi = {
    getAll: () => api.get('/api/wards'),
    create: (data: any) => api.post('/api/wards', data),
    getBeds: (wardId: number | string) => api.get(`/api/wards/${wardId}/beds`),
    updateBed: (bedId: number | string, status: string, patientId?: string, patientName?: string) =>
        api.put(`/api/wards/beds/${bedId}`, null, { params: { status, patientId, patientName } }),
};

export const doctorApi = {
    getAll: () => api.get('/api/doctors'),
    update: (id: string | number, data: any) => api.put(`/api/doctors/${id}`, data),
    delete: (id: string | number) => api.delete(`/api/doctors/${id}`),
    updatePassword: (id: string | number, password: string) =>
        api.post(`/api/doctors/${id}/password`, { password }),
};

export const appointmentApi = {
    getAll: () => api.get('/api/appointments'),
    create: (data: any) => api.post('/api/appointments', data),
};

export const auditApi = {
    getAll: () => api.get('/api/audit'),
};

export const notificationApi = {
    getAll: () => api.get('/api/notifications'),
    getUnreadCount: () => api.get('/api/notifications/unread-count'),
    markAsRead: (id: number) => api.patch(`/api/notifications/${id}/read`),
    markAllRead: () => api.post('/api/notifications/read-all'),
};

export default api;