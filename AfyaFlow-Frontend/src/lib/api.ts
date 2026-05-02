import { getAccessToken } from './authStorage';

export type AuthResponse = {
  userId: number;
  role: string;
  accessToken: string;
};

export type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
};

export type Appointment = {
  id: number;
  patientId: number;
  patientName: string;
  department: string;
  doctor: string;
  date: string;
  time: string;
  status: 'waiting' | 'called' | 'completed' | 'missed' | 'confirmed' | 'cancelled' | 'in-progress';
  queueNumber?: string;
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
  dob: string; // YYYY-MM-DD
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: string;
};

type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string>;
};

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
  options?: { includeAuth?: boolean },
): Promise<T> {
  const token = getAccessToken();
  const includeAuth = options?.includeAuth ?? true;

  const headers = new Headers(init.headers);
  if (includeAuth && token) headers.set('Authorization', `Bearer ${token}`);

  const hasBody = init.body !== undefined && init.body !== null;
  if (hasBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(path, {
    ...init,
    headers,
  });

  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');

  if (!res.ok) {
    let message = res.statusText;
    if (isJson) {
      const body = (await res.json()) as any;
      message = body?.details || body?.message || message;
    } else {
      message = await res.text();
    }
    throw new Error(message || 'Request failed');
  }

  if (res.status === 204) return undefined as T;

  if (!isJson) {
    // Best-effort for non-json responses
    const text = await res.text();
    return text as unknown as T;
  }

  return (await res.json()) as T;
}

export function roleToRoute(role: string): string {
  switch (role) {
    case 'PATIENT':
    case 'USER':
      return '/patient';
    case 'RECEPTIONIST':
      return '/receptionist';
    case 'DOCTOR':
      return '/doctor';
    case 'ADMIN':
      return '/admin';
    default:
      return '/';
  }
}

export function loginApi(body: LoginRequest) {
  return apiRequest<AuthResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { includeAuth: false });
}

export function registerApi(body: RegisterRequest) {
  return apiRequest<AuthResponse>('/auth/register', {
    method: 'POST',
    body: JSON.stringify(body),
  }, { includeAuth: false });
}

// Queue
export type QueueApiResponse = {
  id: number;
  queueNumber: number;
  queueDate: string; // YYYY-MM-DD
  status: string | null;
  patient?: { firstName: string; lastName: string };
  department?: { name: string };
};

export function getQueueApi() {
  return apiRequest<QueueApiResponse[]>('/queue', { method: 'GET' });
}

export function callQueueApi(queueId: number) {
  return apiRequest<QueueApiResponse>(`/queue/${queueId}/call`, { method: 'PATCH' });
}

export function completeQueueApi(queueId: number) {
  return apiRequest<QueueApiResponse>(`/queue/${queueId}/complete`, { method: 'PATCH' });
}

export function missedQueueApi(queueId: number) {
  return apiRequest<QueueApiResponse>(`/queue/${queueId}/missed`, { method: 'PATCH' });
}

export type Department = { id: number; name: string };
export type Doctor = { id: number; name: string; department?: Department };
export type Receptionist = { id: number; name: string };
export type AdminAnalytics = {
  totalUsers: number;
  totalPatients: number;
  totalDoctors: number;
  totalReceptionists: number;
  totalAppointments: number;
  totalQueueItems: number;
};
export type AdminLogEntry = { message: string };

export function getDepartmentsApi() {
  return apiRequest<Department[]>('/departments', { method: 'GET' });
}

export function createDepartmentApi(name: string) {
  return apiRequest<Department>('/departments', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function createDoctorByAdminApi(body: {
  name: string;
  email: string;
  password: string;
  departmentId: number;
}) {
  return apiRequest<Doctor>('/admin/doctors', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function createReceptionistByAdminApi(body: {
  name: string;
  email: string;
  password: string;
}) {
  return apiRequest<Receptionist>('/admin/receptionists', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getAdminAnalyticsApi() {
  return apiRequest<AdminAnalytics>('/admin/analytics', { method: 'GET' });
}

export function getAdminLogsApi() {
  return apiRequest<AdminLogEntry[]>('/admin/logs', { method: 'GET' });
}

/**
 * Fetch available time slots for a specific doctor (Staff Flow) or Department (Patient Flow)
 */
export function getAvailableSlotsApi(date: string, options: { doctorId?: number; departmentId?: number }) {
  let query = `date=${date}`;
  if (options.doctorId) query += `&doctorId=${options.doctorId}`;
  if (options.departmentId) query += `&departmentId=${options.departmentId}`;
  
  return apiRequest<string[]>(`/appointments/available-slots?${query}`, { method: 'GET' });
}

/**
 * Book an appointment. Supports doctor-direct or department-auto-assign.
 */
export function bookAppointmentApi(body: {
  doctorId?: number;
  departmentId?: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
}) {
  return apiRequest<Appointment>('/appointments', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function getDoctorsByDepartmentApi(departmentId: number): Promise<Doctor[]> {
  return apiRequest<Doctor[]>(`/doctors?departmentId=${departmentId}`, { method: 'GET' }, { includeAuth: true });
}