/**
 * =========================================================
 * DATA CONTEXT - Central State Management System
 * =========================================================
 *
 * PURPOSE:
 *   This is the heart of the application's data management.
 *   It acts as a centralized store for all hospital data:
 *   - Patients and their information
 *   - Doctors and their specializations
 *   - Appointments and consultations
 *   - Departments and wards
 *   - Prescriptions and medical records
 *
 * HOW IT WORKS:
 *   1. Uses React Context API for global state
 *   2. All components can access hospital data without prop drilling
 *   3. Automatically syncs with backend API
 *   4. Provides methods (functions) to Create, Read, Update, Delete data (CRUD)
 *   5. Handles API errors gracefully with notifications
 *
 * KEY RESPONSIBILITIES:
 *   • Fetch and store all hospital entities (doctors, patients, departments)
 *   • Provide CRUD operations for all entities
 *   • Keep local state in sync with backend
 *   • Handle error management and user notifications
 *   • Manage loading states for API operations
 *
 * USAGE EXAMPLE:
 *   // In any component:
 *   const { doctors, updateDoctor, deleteDoctor } = useData();
 *   
 *   // Update a doctor
 *   await updateDoctor(doctorId, { name: "New Name", department: "Cardiology" });
 *   // -> Sends PUT request to backend
 *   // -> Updates local state
 *   // -> Shows success notification
 *
 * API INTEGRATION:
 *   All methods connect to these endpoints:
 *   - GET /api/patients → fetch all patients
 *   - GET /api/doctors → fetch all doctors
 *   - PUT /api/doctors/{id} → update doctor
 *   - DELETE /api/doctors/{id} → delete doctor
 *   - GET /api/departments → fetch departments
 *   - And many more...
 *
 * @context DataContext
 * @author AfyaFlow Development Team
 * @version 2.0
 * @date April 2026
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNotification } from './NotificationContext';
import { useAuth } from './AuthContext';
import { patientApi, departmentApi, wardApi, auditApi, appointmentApi, doctorApi } from '../services/api';

// ========== TYPE DEFINITIONS ==========
// These define the shape of data in the system
// Using TypeScript ensures type safety and helps catch errors early

export type PatientStatus = 'queued' | 'in-progress' | 'served' | 'admitted';
export type AppointmentStatus = 'upcoming' | 'in-progress' | 'completed' | 'cancelled';
export type DoctorStatus = 'available' | 'in-surgery' | 'on-call' | 'off-duty';
export type Priority = 'standard' | 'urgent' | 'emergency';

// ========== INTERFACE DEFINITIONS ==========
// These define the structure of complex objects

/**
 * VITALS: Medical measurements taken during patient examination
 * Includes: temperature, blood pressure, heart rate, oxygen levels, etc.
 */
export interface Vitals {
    temperature: number;
    bloodPressure: string;
    heartRate: number;
    respiratoryRate: number;
    oxygenSaturation: number;
    weight?: number;
    recordedAt: string;
}

/**
 * PRESCRIPTION: Medication prescribed to a patient by a doctor
 * Includes: medicine name, dosage, frequency, instructions
 */
export interface Prescription {
    id: string;
    medicineName: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
    prescribedAt: string;
    prescribedBy: string;
}

/**
 * REFERRAL: Referral to another medical specialty
 * Used when a patient needs specialized care beyond current doctor
 */
export interface Referral {
    id: string;
    toSpecialty: string;
    toDoctor?: string;
    reason: string;
    urgency: 'routine' | 'urgent' | 'emergency';
    referredAt: string;
    referredBy: string;
}

/**
 * PATIENT: Complete patient information and medical history
 */
export interface Patient {
    id: string;
    tokenId: string;
    name: string;
    age: number;
    gender: 'Male' | 'Female';
    phone: string;
    nationalId: string;
    reason: string;
    assignedDoctor?: string;
    status: PatientStatus;
    registeredAt: string;
    servedAt?: string;
    diagnosis?: string;
    consultationNotes?: string;
    department: string;
    priority: Priority;
    email?: string;
    vitals?: Vitals[];
    prescriptions?: Prescription[];
    referrals?: Referral[];
}

export interface Appointment {
    id: string;
    patientName: string;
    patientId?: string;
    doctorName: string;
    department: string;
    date: string;
    time: string;
    type: 'scheduled' | 'walk-in' | 'follow-up';
    status: AppointmentStatus;
    notes?: string;
}

export interface Doctor {
    id: string;
    name: string;
    specialization: string;
    station: string;
    shift: string;
    status: DoctorStatus;
    patientsSeenToday: number;
    phone: string;
    email: string;
    departmentId?: string | number;
    department?: Department;
}

export interface InventoryItem {
    id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    lastUpdated: string;
    supplier: string;
}

export interface Department {
    id: number;
    name: string;
}

export const getInventoryStatus = (item: InventoryItem): 'in-stock' | 'low-stock' | 'out-of-stock' => {
    if (item.quantity === 0) return 'out-of-stock';
    if (item.quantity <= item.reorderLevel) return 'low-stock';
    return 'in-stock';
};

export interface Bed {
    id: number | string;
    bedNumber: string;
    status: 'available' | 'occupied' | 'maintenance';
    patientId?: string;
    patientName?: string;
    admittedAt?: string;
}

export interface Ward {
    id: number | string;
    name: string;
    department: string;
    type: 'general' | 'icu' | 'maternity' | 'surgical' | 'hdu';
    capacity: number;
    beds?: Bed[];
}

export interface AuditLog {
    id: number;
    actorUsername: string;
    actorRole: string;
    action: string;
    entityType: string;
    entityId: string;
    details: string;
    timestamp: string;
}

interface DataContextType {
    patients: Patient[];
    setPatients: React.Dispatch<React.SetStateAction<Patient[]>>;
    appointments: Appointment[];
    setAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    doctors: Doctor[];
    setDoctors: React.Dispatch<React.SetStateAction<Doctor[]>>;
    departments: Department[];
    setDepartments: React.Dispatch<React.SetStateAction<Department[]>>;
    wards: Ward[];
    setWards: React.Dispatch<React.SetStateAction<Ward[]>>;
    inventory: InventoryItem[];
    setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
    auditLogs: AuditLog[];
    setAuditLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
    addPatient: (data: Omit<Patient, 'id' | 'tokenId' | 'registeredAt'>) => Promise<Patient>;
    updatePatientStatus: (id: string, status: PatientStatus, extra?: Partial<Patient>) => Promise<void>;
    addAppointment: (data: Omit<Appointment, 'id'>) => Promise<void>;
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => void;
    addPrescription: (patientId: string, prescription: Omit<Prescription, 'id' | 'prescribedAt'>) => void;
    addReferral: (patientId: string, referral: Omit<Referral, 'id' | 'referredAt'>) => void;
    updateVitals: (patientId: string, vitals: Omit<Vitals, 'recordedAt'>) => void;
    getDepartmentStats: () => Record<string, number>;
    addDepartment: (name: string) => Promise<void>;
    deleteDepartment: (id: number) => Promise<void>;
    fetchWards: () => Promise<void>;
    fetchAuditLogs: () => Promise<void>;
    isAssignedToBed: (patientId: string) => boolean;
    updateDoctor: (id: string, data: any) => Promise<void>;
    deleteDoctor: (id: string) => Promise<void>;
    resetStaffPassword: (id: string, password: string) => Promise<void>;
    ready: boolean;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [patients, setPatients] = useState<Patient[]>([]);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [wards, setWards] = useState<Ward[]>([]);
    const [inventory, setInventory] = useState<InventoryItem[]>([]);
    const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
    const [ready, setReady] = useState(false);
    const { notify } = useNotification();
    const { user, isAuthenticated } = useAuth();
    const isAdmin = user?.role === 'Admin';

    const fetchDepartments = useCallback(async () => {
        try {
            const response = await departmentApi.getAll();
            setDepartments(response.data);
        } catch (error) {
            console.error("Failed to fetch departments:", error);
        }
    }, []);

    const fetchWards = useCallback(async () => {
        try {
            const response = await wardApi.getAll();
            setWards(response.data);
        } catch (error) {
            console.error("Failed to fetch wards:", error);
        }
    }, []);

    const fetchDoctors = useCallback(async () => {
        try {
            const response = await doctorApi.getAll();
            setDoctors(response.data);
        } catch (error) {
            console.error("Failed to fetch doctors:", error);
        }
    }, []);

    const fetchAuditLogs = useCallback(async () => {
        if (!isAdmin) return; // Only admins can access audit logs
        try {
            const response = await auditApi.getAll();
            setAuditLogs(response.data);
        } catch (error) {
            console.error("Failed to fetch audit logs:", error);
        }
    }, [isAdmin]);

    useEffect(() => {
        if (!isAuthenticated) {
            // Clear data state on logout
            setPatients([]);
            setAppointments([]);
            setDoctors([]);
            setDepartments([]);
            setWards([]);
            setInventory([]);
            setAuditLogs([]);
            setReady(false);
            return;
        }

        const fetchInitialData = async () => {
            try {
                await Promise.all([
                    fetchDepartments(),
                    fetchWards(),
                    fetchAuditLogs(),
                    fetchDoctors()
                ]);

                const response = await patientApi.getAll();
                const backendPatients = response.data.map((p: any) => ({
                    ...p,
                    id: String(p.id),
                    vitals: p.vitalsJson ? JSON.parse(p.vitalsJson) : [],
                    prescriptions: p.prescriptionsJson ? JSON.parse(p.prescriptionsJson) : [],
                    referrals: p.referralsJson ? JSON.parse(p.referralsJson) : []
                }));
                
                if (backendPatients.length > 0) {
                    setPatients(backendPatients);
                }
            } catch (error) {
                console.error("Failed to fetch initial data:", error);
                if (isAuthenticated) {
                    notify('Could not connect to health server. Please check your connection.', 'error', 'Connection Error');
                }
            }
            setReady(true);
        };

        fetchInitialData();

        // Set up polling for patients and appointments (every 10 seconds)
        const pollInterval = setInterval(async () => {
            try {
                const response = await patientApi.getAll();
                const backendPatients = response.data.map((p: any) => ({
                    ...p,
                    id: String(p.id),
                    vitals: p.vitalsJson ? JSON.parse(p.vitalsJson) : [],
                    prescriptions: p.prescriptionsJson ? JSON.parse(p.prescriptionsJson) : [],
                    referrals: p.referralsJson ? JSON.parse(p.referralsJson) : []
                }));
                setPatients(backendPatients);
            } catch (error) {
                console.error("Polling error:", error);
            }
        }, 10000);

        return () => clearInterval(pollInterval);
    }, [isAuthenticated, notify, fetchDepartments, fetchWards, fetchAuditLogs, fetchDoctors]);


    const addPatient = useCallback(async (data: Omit<Patient, 'id' | 'tokenId' | 'registeredAt'>): Promise<Patient> => {
        try {
            const response = await patientApi.create(data);
            const newPatient: Patient = {
                ...response.data,
                id: String(response.data.id),
                vitals: response.data.vitalsJson ? JSON.parse(response.data.vitalsJson) : [],
                prescriptions: response.data.prescriptionsJson ? JSON.parse(response.data.prescriptionsJson) : [],
                referrals: response.data.referralsJson ? JSON.parse(response.data.referralsJson) : []
            };
            setPatients(prev => [...prev, newPatient]);
            notify(`Patient ${newPatient.name} registered successfully. Token: ${newPatient.tokenId}`, 'success', 'Patient Registered');
            return newPatient;
        } catch (error) {
            notify('Failed to register patient on server.', 'error', 'Server Error');
            throw error;
        }
    }, [notify]);

    const isAssignedToBed = useCallback((patientId: string) => {
        return wards.some(ward => 
            ward.beds?.some(bed => bed.patientId === patientId && bed.status === 'occupied')
        );
    }, [wards]);

    const updatePatientStatus = useCallback(async (id: string, status: PatientStatus, extra?: Partial<Patient>) => {
        try {
            // First update locally for immediate UX
            setPatients(prev => prev.map(p => p.id === id ? { ...p, status, ...extra } : p));
            
            // Sync with backend
            await patientApi.updateStatus(id, status);
            
            if (status === 'served') {
                notify('Consultation completed and record updated.', 'success', 'Session Ended');
            }
        } catch (error) {
            notify('Failed to update patient status on server.', 'error', 'Server Error');
        }
    }, [notify]);

    const addAppointment = useCallback(async (data: Omit<Appointment, 'id'>) => {
        try {
            const response = await appointmentApi.create(data);
            setAppointments(prev => [...prev, { ...response.data, id: String(response.data.id) }]);
            notify(`Appointment scheduled for ${data.patientName}.`, 'success', 'Appointment Created');
        } catch (error) {
            console.error("Failed to create appointment:", error);
            notify(`Failed to schedule appointment for ${data.patientName}.`, 'error', 'Server Error');
        }
    }, [notify]);

    const updateAppointmentStatus = useCallback((id: string, status: AppointmentStatus) => {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
    }, []);

    const addPrescription = useCallback(async (patientId: string, rx: Omit<Prescription, 'id' | 'prescribedAt'>) => {
        const newRx: Prescription = {
            ...rx,
            id: Math.random().toString(36).substr(2, 9),
            prescribedAt: new Date().toISOString(),
        };
        
        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const updatedPrescriptions = [...(patient.prescriptions || []), newRx];
        
        try {
            await api.put(`/api/patients/${patientId}`, {
                prescriptionsJson: JSON.stringify(updatedPrescriptions)
            });
            
            setPatients(prev => prev.map(p => 
                p.id === patientId 
                    ? { ...p, prescriptions: updatedPrescriptions } 
                    : p
            ));
            notify(`Prescribed ${newRx.medicineName} to patient.`, 'success', 'Prescription Added');
        } catch (error) {
            notify('Failed to save prescription to server.', 'error', 'Server Error');
        }
    }, [notify, patients]);

    const addReferral = useCallback(async (patientId: string, ref: Omit<Referral, 'id' | 'referredAt'>) => {
        const newRef: Referral = {
            ...ref,
            id: Math.random().toString(36).substr(2, 9),
            referredAt: new Date().toISOString(),
        };

        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const updatedReferrals = [...(patient.referrals || []), newRef];

        try {
            // Update patient in the backend: Move to new department and set as queued
            await api.put(`/api/patients/${patientId}`, {
                referralsJson: JSON.stringify(updatedReferrals),
                department: newRef.toSpecialty,
                assignedDoctor: newRef.toDoctor || "",
                status: 'queued'
            });

            setPatients(prev => prev.map(p => 
                p.id === patientId 
                    ? { 
                        ...p, 
                        referrals: updatedReferrals,
                        department: newRef.toSpecialty,
                        assignedDoctor: newRef.toDoctor || p.assignedDoctor,
                        status: 'queued'
                      } 
                    : p
            ));
            notify(`Patient referred to ${newRef.toSpecialty}${newRef.toDoctor ? ` (Dr. ${newRef.toDoctor})` : ''}.`, 'info', 'Patient Transferred');
        } catch (error) {
            notify('Failed to save referral to server.', 'error', 'Server Error');
        }
    }, [notify, patients]);

    const updateVitals = useCallback(async (patientId: string, v: Omit<Vitals, 'recordedAt'>) => {
        const newVitals: Vitals = {
            ...v,
            recordedAt: new Date().toISOString(),
        };

        const patient = patients.find(p => p.id === patientId);
        if (!patient) return;

        const updatedVitalsList = [...(patient.vitals || []), newVitals];

        try {
            await api.put(`/api/patients/${patientId}`, {
                vitalsJson: JSON.stringify(updatedVitalsList)
            });

            setPatients(prev => prev.map(p => 
                p.id === patientId 
                    ? { ...p, vitals: updatedVitalsList } 
                    : p
            ));
            notify('Vitals updated successfully.', 'success', 'Vitals Recorded');
        } catch (error) {
            notify('Failed to save vitals to server.', 'error', 'Server Error');
        }
    }, [notify, patients]);

    const getDepartmentStats = useCallback(() => {
        const stats: Record<string, number> = {};
        patients.filter(p => p.status === 'queued' || p.status === 'in-progress').forEach(p => {
            stats[p.department] = (stats[p.department] || 0) + 1;
        });
        return stats;
    }, [patients]);

    const addDepartment = useCallback(async (name: string) => {
        try {
            const response = await departmentApi.create({ name });
            setDepartments(prev => [...prev, response.data]);
            notify(`Department ${name} added successfully.`, 'success', 'Department Added');
        } catch (error) {
            notify('Failed to add department.', 'error', 'Server Error');
        }
    }, [notify]);

    const deleteDepartment = useCallback(async (id: number) => {
        try {
            await departmentApi.delete(id);
            setDepartments(prev => prev.filter(d => d.id !== id));
            notify('Department removed successfully.', 'success', 'Department Deleted');
        } catch (error) {
            notify('Failed to delete department.', 'error', 'Server Error');
        }
    }, [notify]);

    const updateDoctor = useCallback(async (id: string, data: any) => {
        try {
            const response = await doctorApi.update(id, data);
            setDoctors(prev => prev.map(d => d.id === id ? response.data : d));
            notify(`Doctor ${data.name} updated successfully.`, 'success', 'Staff Updated');
        } catch (error) {
            notify('Failed to update doctor technical records.', 'error', 'Server Error');
        }
    }, [notify]);

    const deleteDoctor = useCallback(async (id: string) => {
        try {
            await doctorApi.delete(id);
            setDoctors(prev => prev.filter(d => d.id !== id));
            notify('Staff member removed from system.', 'success', 'Staff Deleted');
        } catch (error) {
            notify('Failed to delete staff member.', 'error', 'Server Error');
        }
    }, [notify]);

    const resetStaffPassword = useCallback(async (id: string, password: string) => {
        try {
            await doctorApi.updatePassword(id, password);
            notify('Staff credentials updated safely.', 'success', 'Password Reset');
        } catch (error) {
            notify('Failed to reset staff password.', 'error', 'Server Error');
        }
    }, [notify]);

    return (
        <DataContext.Provider value={{
            patients,
            setPatients,
            appointments,
            setAppointments,
            doctors,
            setDoctors,
            departments,
            setDepartments,
            wards,
            setWards,
            inventory,
            setInventory,
            auditLogs,
            setAuditLogs,
            addPatient,
            updatePatientStatus,
            addAppointment,
            updateAppointmentStatus,
            addPrescription,
            addReferral,
            updateVitals,
            getDepartmentStats,
            addDepartment,
            deleteDepartment,
            fetchWards,
            fetchAuditLogs,
            isAssignedToBed,
            updateDoctor,
            deleteDoctor,
            resetStaffPassword,
            ready
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => {
    const ctx = useContext(DataContext);
    if (!ctx) throw new Error('useData must be within DataProvider');
    return ctx;
};