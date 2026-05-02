/**
 * =========================================================
 * NOTIFICATION SERVICE - Doctor Appointment Alerts
 * =========================================================
 *
 * PURPOSE:
 *   Provides real-time notifications to doctors when new appointments are booked.
 *   Polls the backend for pending/confirmed appointments.
 *   Shows toast alerts when new appointments arrive.
 *   Uses caching to prevent duplicate notifications.
 *
 * HOW IT WORKS:
 *   1. Doctor dashboard calls startDoctorAppointmentMonitoring()
 *   2. Service polls backend every 3 seconds
 *   3. When new appointment detected, callback is triggered
 *   4. Dashboard shows toast notification
 *   5. Polling stops when component unmounts
 *
 * INTEGRATION WITH DOCTOR DASHBOARD:
 *   - Shows "New Appointment" notifications in a toast
 *   - Displays patient name, department, and appointment time
 *   - Doctor can accept/confirm appointment from alert
 *   - Adds to queue automatically when confirmed
 *
 * @module NotificationService
 * @author AfyaFlow Development Team
 * @date April 2026
 */

// ========== TYPES & INTERFACES ==========

export interface NewAppointment {
  id: number;
  patientName: string;
  patientId: number;
  department: string;
  appointmentTime: string;
  reason: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
}

export interface QueueStats {
  userPosition: number;
  totalInQueue: number;
  estimatedWaitTime: number;
  doctorStatus: string;
  patientsAhead: number;
}

// ========== ACTIVE POLLING SUBSCRIPTIONS ==========
// Tracks active polling intervals so we can clean them up
const activePollers: Map<string, ReturnType<typeof setInterval>> = new Map();

// ========== NOTIFICATION CACHE ==========
// Store recently seen appointments to prevent duplicate alerts
const appointmentCache: Map<number, number> = new Map(); // appointmentId -> timestamp

/**
 * START MONITORING DOCTOR APPOINTMENTS
 *
 * Begins polling for new appointments assigned to a doctor.
 * Called when doctor dashboard loads.
 *
 * PARAMETERS:
 *   doctorId: Doctor ID to monitor
 *   onNewAppointment: Callback function when new appointment detected
 *   pollingInterval: How often to check (milliseconds, default 3000 = 3 seconds)
 *
 * RETURNS:
 *   Function to stop monitoring (call when component unmounts)
 *
 * EXAMPLE:
 *   useEffect(() => {
 *     const stopPolling = startDoctorAppointmentMonitoring(
 *       doctorId,
 *       (appointment) => {
 *         showToast(`New appointment from ${appointment.patientName}`);
 *       },
 *       3000
 *     );
 *     return () => stopPolling(); // Clean up on unmount
 *   }, [doctorId]);
 *
 * @param {number} doctorId - The doctor's ID
 * @param {function} onNewAppointment - Callback with appointment details
 * @param {number} pollingInterval - Polling frequency in milliseconds
 * @returns {function} Cleanup function to stop polling
 */
export const startDoctorAppointmentMonitoring = (
  doctorId: number,
  onNewAppointment: (appointment: NewAppointment) => void,
  pollingInterval: number = 3000,
  onUpdate?: (appointments: NewAppointment[]) => void
): (() => void) => {
  const pollerId = `doctor-${doctorId}`;

  /**
   * POLLING FUNCTION
   * Called repeatedly to check for new appointments
   */
  const pollAppointments = async () => {
    try {
      // Fetch doctor's upcoming appointments from backend
      // Status: pending (just booked) and confirmed (accepted by doctor)
      const token = sessionStorage.getItem('afyaflow_token');
      if (!token) {
        console.warn('No auth token found for doctor appointment monitoring');
        return;
      }

      const response = await fetch(
        `/api/appointments?doctorId=${doctorId}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired - stop polling
          const cleanupFn = activePollers.get(pollerId);
          if (cleanupFn) {
            clearInterval(cleanupFn);
            activePollers.delete(pollerId);
          }
        }
        return;
      }

      const rawAppointments: any[] = await response.json();
      
      // Map backend fields to frontend interface
      const appointments: NewAppointment[] = rawAppointments.map(a => ({
        id: a.id,
        patientName: a.patient?.name || `${a.patient?.firstName || ''} ${a.patient?.lastName || ''}`.trim() || 'Patient',
        patientId: a.patient?.id,
        department: a.departmentName,
        appointmentTime: `${a.appointmentDate} ${a.appointmentTime}`,
        reason: a.patient?.reason || 'Consultation',
        status: a.status?.toLowerCase() || 'pending',
        createdAt: a.appointmentDate
      }));

      // Trigger update callback with full list
      if (onUpdate) {
        onUpdate(appointments);
      }

      // ========== CHECK FOR NEW APPOINTMENTS ==========
      // Compare with cache to find ones we haven't alerted about yet
      for (const appointment of appointments) {
        // Skip if we've seen this appointment recently (within the polling interval)
        const lastSeen = appointmentCache.get(appointment.id);
        if (lastSeen && Date.now() - lastSeen < pollingInterval) {
          continue;
        }

        // Mark as seen
        appointmentCache.set(appointment.id, Date.now());

        // Trigger callback for new appointment
        onNewAppointment(appointment, appointments);
      }

      // ========== CLEANUP OLD CACHE ENTRIES ==========
      // Remove entries older than 2 hours to prevent memory leaks
      const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
      for (const [apptId, timestamp] of appointmentCache.entries()) {
        if (timestamp < twoHoursAgo) {
          appointmentCache.delete(apptId);
        }
      }
    } catch (error) {
      console.error('Error polling appointments:', error);
      // Silently fail - don't interrupt user experience
      // The polling will retry on the next interval
    }
  };

  // ========== START POLLING ==========
  // Poll immediately for appointments that came in before we started monitoring
  pollAppointments();

  // Then poll at regular intervals
  const intervalId = setInterval(pollAppointments, pollingInterval);
  activePollers.set(pollerId, intervalId);

  // ========== RETURN CLEANUP FUNCTION ==========
  // Call this to stop polling when component unmounts
  return () => {
    const id = activePollers.get(pollerId);
    if (id) {
      clearInterval(id);
      activePollers.delete(pollerId);
    }
  };
};

/**
 * GET QUEUE STATUS FOR APPOINTMENT
 *
 * Fetches current queue position and estimated wait time for an appointment.
 * Useful for dashboard display and real-time updates.
 *
 * PARAMETERS:
 *   appointmentId: The appointment ID to check
 *   doctorId: The doctor handling this appointment
 *
 * RETURNS:
 *   Promise<QueueStats> with position, wait time, and doctor status
 *
 * @param {number} appointmentId - The appointment ID
 * @param {number} doctorId - The doctor's ID
 * @returns {Promise<QueueStats>} Queue statistics
 */
export const getQueueStatus = async (
  appointmentId: number,
  doctorId: number
): Promise<QueueStats | null> => {
  try {
    const token = sessionStorage.getItem('afyaflow_token');
    if (!token) return null;

    const response = await fetch(
      `/api/appointments/${appointmentId}/queue-status?doctorId=${doctorId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Error fetching queue status:', error);
    return null;
  }
};

/**
 * CONFIRM APPOINTMENT
 *
 * Marks an appointment as confirmed by the doctor.
 * Called when doctor accepts a pending appointment.
 *
 * PARAMETERS:
 *   appointmentId: The appointment to confirm
 *   doctorId: The doctor confirming it
 *
 * RETURNS:
 *   Promise<boolean> Success status
 *
 * @param {number} appointmentId - The appointment ID
 * @param {number} doctorId - The doctor's ID
 * @returns {Promise<boolean>} True if successful
 */
export const confirmAppointment = async (
  appointmentId: number,
  doctorId: number
): Promise<boolean> => {
  try {
    const token = sessionStorage.getItem('afyaflow_token');
    if (!token) return false;

    const response = await fetch(
      `/api/appointments/${appointmentId}/confirm`,
      {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ doctorId, status: 'confirmed' })
      }
    );

    return response.ok;
  } catch (error) {
    console.error('Error confirming appointment:', error);
    return false;
  }
};

/**
 * SEND NOTIFICATION
 *
 * Sends a notification alert to the backend to be stored and displayed.
 * Used when significant events occur (appointment booked, patient arrived, etc).
 *
 * PARAMETERS:
 *   type: Type of notification
 *   title: Notification title
 *   message: Notification message
 *   appointmentId: Related appointment ID
 *   doctorId: Related doctor ID
 *   patientName: Patient's name
 *
 * @param {Object} notification - Notification details
 * @returns {Promise<void>}
 */
export const sendNotification = async (notification: {
  type: 'appointment_booked' | 'appointment_confirmed' | 'patient_called' | 'appointment_completed' | 'no_show';
  title: string;
  message: string;
  appointmentId: number;
  doctorId: number;
  patientName: string;
}): Promise<void> => {
  try {
    const token = sessionStorage.getItem('afyaflow_token');
    if (!token) return;

    const payload = {
      ...notification,
      timestamp: new Date().toISOString(),
      read: false
    };

    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.warn('Failed to send notification');
    }
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

/**
 * MARK NOTIFICATION AS READ
 *
 * Updates notification read status when user views it.
 *
 * PARAMETERS:
 *   notificationId: ID of notification to mark as read
 *
 * @param {string} notificationId - The notification ID
 * @returns {Promise<void>}
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    const token = sessionStorage.getItem('afyaflow_token');
    if (!token) return;

    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

/**
 * STOP ALL ACTIVE POLLING
 *
 * Clears all active polling intervals.
 * Call this when app closes or on cleanup.
 * Prevents memory leaks from abandoned intervals.
 */
export const stopAllPolling = (): void => {
  for (const [, intervalId] of activePollers.entries()) {
    clearInterval(intervalId);
  }
  activePollers.clear();
  console.log('All appointment polling stopped');
};

/**
 * CLEAR NOTIFICATION CACHE
 *
 * Resets the notification cache. Useful for testing or force-refresh.
 */
export const clearNotificationCache = (): void => {
  appointmentCache.clear();
};
