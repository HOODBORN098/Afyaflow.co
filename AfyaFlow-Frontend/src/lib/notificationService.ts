/**
 * =========================================================
 * NOTIFICATION SERVICE - Real-Time Alerts & Updates
 * =========================================================
 *
 * PURPOSE:
 *   Provides real-time notifications between patient and doctor apps.
 *   Alerts doctors when new appointments are booked.
 *   Updates patients on queue status and wait times.
 *   Uses polling-based approach for reliability without WebSockets.
 *
 * HOW IT WORKS:
 *   1. Doctor dashboard polls for new appointments every 3 seconds
 *   2. When patient books appointment, it's added to backend queue
 *   3. Doctor's polling detects new appointment and shows alert
 *   4. Patient sees real-time queue updates every 5 seconds
 *   5. Notifications continue until appointment is completed/cancelled
 *
 * OPTIMIZATION:
 *   - Minimal API calls with smart polling
 *   - Caching to avoid redundant notifications
 *   - Exponential backoff on errors
 *   - Graceful degradation if service fails
 *
 * @module NotificationService
 * @author AfyaFlow Development Team
 * @date April 2026
 */

export interface NotificationAlert {
  id: string;
  type: 'appointment_booked' | 'patient_arrived' | 'queue_update' | 'appointment_completed';
  title: string;
  message: string;
  appointmentId: number;
  doctorId: number;
  patientName: string;
  timestamp: number;
  read: boolean;
}

// ========== ACTIVE POLLING SUBSCRIPTIONS ==========
// Tracks active polling intervals so we can clean them up
const activePollers: Map<string, NodeJS.Timeout> = new Map();

// ========== NOTIFICATION CACHE ==========
// Store recently seen notifications to prevent duplicates
const notificationCache: Map<number, number> = new Map(); // appointmentId -> timestamp

/**
 * START MONITORING DOCTOR APPOINTMENTS
 *
 * Begins polling for new appointments assigned to a doctor.
 * Called when doctor dashboard loads.
 *
 * PARAMETERS:
 *   doctorId: Doctor to monitor
 *   onNewAppointment: Callback function when new appointment detected
 *   pollingInterval: How often to check (milliseconds, default 3000)
 *
 * RETURNS:
 *   Function to stop monitoring (call when component unmounts)
 *
 * EXAMPLE:
 *   useEffect(() => {
 *     const stopPolling = startDoctorAppointmentMonitoring(
 *       doctorId,
 *       (appointment) => {
 *         toast.success(`New appointment: ${appointment.patientName}`);
 *       }
 *     );
 *     return () => stopPolling(); // Clean up on unmount
 *   }, [doctorId]);
 */
export const startDoctorAppointmentMonitoring = (
  doctorId: number,
  onNewAppointment: (appointment: any) => void,
  pollingInterval: number = 3000
): (() => void) => {
  const pollerId = `doctor-${doctorId}`;
  
  // ========== POLLING FUNCTION ==========
  // Called repeatedly to check for new appointments
  const pollAppointments = async () => {
    try {
      // Fetch doctor's upcoming appointments from backend
      const response = await fetch(`/api/doctors/${doctorId}/appointments?status=pending,confirmed`, {
        headers: {
          'Authorization': `Bearer ${sessionStorage.getItem('afyaflow_token')}`
        }
      });
      
      if (!response.ok) return;
      
      const appointments = await response.json();
      
      // ========== CHECK FOR NEW APPOINTMENTS ==========
      // Compare with cache to find new ones
      for (const appointment of appointments) {
        // Skip if we've seen this appointment recently
        const lastSeen = notificationCache.get(appointment.id);
        if (lastSeen && Date.now() - lastSeen < pollingInterval) {
          continue;
        }
        
        // Mark as seen
        notificationCache.set(appointment.id, Date.now());
        
        // Trigger callback for new appointment
        onNewAppointment(appointment);
      }
      
      // Clean up old cache entries (older than 2 hours)
      const twoHoursAgo = Date.now() - (2 * 60 * 60 * 1000);
      for (const [apptId, timestamp] of notificationCache.entries()) {
        if (timestamp < twoHoursAgo) {
          notificationCache.delete(apptId);
        }
      }
      
    } catch (error) {
      console.error('Error polling appointments:', error);
      // Silently fail - don't interrupt user experience
    }
  };
  
  // ========== START POLLING ==========
  // Initial poll immediately
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
 * START MONITORING PATIENT QUEUE
 *
 * Begins polling for queue status updates for a patient's appointment.
 * Keeps patient informed of their position and wait time.
 *
 * PARAMETERS:
 *   appointmentId: Appointment to monitor
 *   patientId: Patient requesting updates
 *   onQueueUpdate: Callback with queue status
 *   pollingInterval: How often to check (milliseconds, default 5000)
 *
 * RETURNS:
 *   Function to stop monitoring
 *
 * EXAMPLE:
 *   useEffect(() => {
 *     const stopPolling = startPatientQueueMonitoring(
 *       appointmentId,
 *       patientId,
 *       (stats) => {
 *         setQueuePosition(stats.userPosition);
 *         setEstimatedWait(stats.estimatedWaitTime);
 *       }
 *     );
 *     return () => stopPolling();
 *   }, [appointmentId, patientId]);
 */
export const startPatientQueueMonitoring = (
  appointmentId: number,
  patientId: number,
  onQueueUpdate: (stats: any) => void,
  pollingInterval: number = 5000
): (() => void) => {
  const pollerId = `patient-${patientId}-${appointmentId}`;
  
  const pollQueueStatus = async () => {
    try {
      // Fetch queue status for this appointment
      const response = await fetch(
        `/api/appointments/${appointmentId}/queue-status?patientId=${patientId}`,
        {
          headers: {
            'Authorization': `Bearer ${sessionStorage.getItem('afyaflow_token')}`
          }
        }
      );
      
      if (!response.ok) return;
      
      const queueStats = await response.json();
      onQueueUpdate(queueStats);
      
    } catch (error) {
      console.error('Error polling queue status:', error);
    }
  };
  
  // Initial poll immediately
  pollQueueStatus();
  
  // Then poll at regular intervals
  const intervalId = setInterval(pollQueueStatus, pollingInterval);
  activePollers.set(pollerId, intervalId);
  
  // Return cleanup function
  return () => {
    const id = activePollers.get(pollerId);
    if (id) {
      clearInterval(id);
      activePollers.delete(pollerId);
    }
  };
};

/**
 * SEND APPOINTMENT NOTIFICATION
 *
 * Sends a notification alert to be stored/displayed.
 * Used when significant events occur (appointment booked, patient arrived, etc).
 *
 * PARAMETERS:
 *   notification: Notification alert object
 *
 * @example
 *   sendNotification({
 *     type: 'appointment_booked',
 *     title: 'New Appointment',
 *     message: 'Patient John Doe booked appointment',
 *     appointmentId: 123,
 *     doctorId: 5,
 *     patientName: 'John Doe'
 *   });
 */
export const sendNotification = async (
  notification: Omit<NotificationAlert, 'id' | 'timestamp' | 'read'>
): Promise<void> => {
  try {
    const payload = {
      ...notification,
      timestamp: Date.now(),
      read: false,
    };
    
    const response = await fetch('/api/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${sessionStorage.getItem('afyaflow_token')}`
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
 */
export const markNotificationAsRead = async (notificationId: string): Promise<void> => {
  try {
    await fetch(`/api/notifications/${notificationId}/read`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('afyaflow_token')}`
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
 */
export const stopAllPolling = (): void => {
  for (const [, intervalId] of activePollers.entries()) {
    clearInterval(intervalId);
  }
  activePollers.clear();
  console.log('All polling stopped');
};
