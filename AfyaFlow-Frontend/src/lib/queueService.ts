/**
 * =========================================================
 * QUEUE SERVICE - Appointment Queue Management
 * =========================================================
 *
 * PURPOSE:
 *   Manages appointment queues for doctors.
 *   Tracks patient positions, wait times, and status changes.
 *   Provides real-time queue information to both patients and doctors.
 *
 * KEY RESPONSIBILITIES:
 *   1. Calculate patient's position in queue
 *   2. Estimate wait time based on queue length
 *   3. Track appointment status (pending → confirmed → called → completed)
 *   4. Handle no-show appointments gracefully
 *   5. Notify doctors of new appointments
 *   6. Send queue updates to patients in real-time
 *
 * QUEUE STATUSES:
 *   - pending: Appointment just booked, waiting for confirmation
 *   - confirmed: Doctor confirmed the appointment
 *   - in-queue: Patient is in waiting queue
 *   - called: Doctor called patient from queue
 *   - completed: Service completed
 *   - no-show: Patient didn't show up (appointment still kept for records)
 *   - cancelled: Patient cancelled before appointment
 *
 * TIME CALCULATION:
 *   - Average consultation time: 15 minutes per patient
 *   - Average wait time = (queue_position - 1) * 15 minutes
 *   - Buffer time for delays: +5 minutes per position
 *
 * @module QueueService
 * @author AfyaFlow Development Team
 * @date April 2026
 */

export interface AppointmentQueueItem {
  appointmentId: number;
  patientId: number;
  patientName: string;
  doctorId: number;
  departmentId: number;
  appointmentDate: string;
  appointmentTime: string;
  status: 'pending' | 'confirmed' | 'in-queue' | 'called' | 'completed' | 'no-show' | 'cancelled';
  queuePosition?: number;
  estimatedWaitTime?: number; // in minutes
  createdAt: number;
  updatedAt: number;
}

export interface QueueStats {
  totalInQueue: number;
  userPosition: number; // 1-indexed (1 means next)
  estimatedWaitTime: number; // in minutes
  doctorStatus: 'available' | 'in-consultation' | 'break' | 'offline';
  patientsAhead: number; // How many patients before this user
}

// ========== CONSTANTS ==========
// Average time per consultation (in minutes)
const CONSULTATION_TIME_MINUTES = 15;

// Buffer time to account for overruns
const BUFFER_TIME_MINUTES = 3;

// Total time per consultation including buffer
const TOTAL_TIME_PER_PATIENT = CONSULTATION_TIME_MINUTES + BUFFER_TIME_MINUTES;

/**
 * GET QUEUE POSITION FOR PATIENT
 *
 * Calculates this patient's position in the queue for their appointment.
 * Position is determined by appointment time (earlier appointments come first).
 *
 * PARAMETERS:
 *   appointmentTime: ISO datetime string of patient's appointment
 *   allAppointments: All appointments for this doctor on this date
 *
 * RETURN VALUE:
 *   Position in queue (1 = next to be seen, 2 = after next, etc.)
 *
 * EXAMPLE:
 *   const position = getQueuePosition("2026-04-25T14:00:00", allAppointments);
 *   // Returns: 3 (patient is 3rd in queue)
 */
export const getQueuePosition = (
  appointmentTime: string,
  allAppointments: AppointmentQueueItem[]
): number => {
  try {
    const appointmentDate = new Date(appointmentTime).getTime();
    
    // Count how many confirmed/in-queue appointments are before this one
    const positionsBefore = allAppointments.filter(appt => {
      // Only count appointments that haven't been completed or cancelled
      if (appt.status === 'completed' || appt.status === 'cancelled') {
        return false;
      }
      
      const apptDate = new Date(appt.appointmentTime).getTime();
      return apptDate < appointmentDate;
    }).length;
    
    return positionsBefore + 1;
  } catch (error) {
    console.error('Error calculating queue position:', error);
    return 1;
  }
};

/**
 * CALCULATE ESTIMATED WAIT TIME
 *
 * Estimates how long patient will wait based on queue position.
 * Accounts for consultation time and buffer time for delays.
 *
 * FORMULA:
 *   Wait Time = (Position - 1) × (15 min consultation + 3 min buffer)
 *
 * EXAMPLES:
 *   Position 1 → 0 minutes (next to be seen)
 *   Position 2 → 18 minutes (one patient ahead)
 *   Position 5 → 72 minutes (four patients ahead)
 *
 * PARAMETERS:
 *   queuePosition: This patient's position in queue
 *
 * RETURN VALUE:
 *   Estimated wait time in minutes
 */
export const calculateEstimatedWaitTime = (queuePosition: number): number => {
  if (queuePosition <= 1) return 0;
  
  // Each person ahead adds TOTAL_TIME_PER_PATIENT to wait
  return (queuePosition - 1) * TOTAL_TIME_PER_PATIENT;
};

/**
 * GET QUEUE STATS FOR PATIENT
 *
 * Provides complete queue information for a specific patient.
 * Called regularly to keep patient dashboard updated.
 *
 * PARAMETERS:
 *   patientAppointmentTime: Patient's appointment time
 *   doctorId: Doctor ID
 *   allAppointments: All appointments for this doctor
 *   doctorStatus: Current status of the doctor
 *
 * RETURN VALUE:
 *   QueueStats object with position, wait time, and doctor status
 *
 * EXAMPLE:
 *   const stats = getQueueStats(
 *     "2026-04-25T14:00:00",
 *     5,
 *     allAppointments,
 *     "available"
 *   );
 *   // Returns queue position, wait time, doctor status
 */
export const getQueueStats = (
  patientAppointmentTime: string,
  doctorId: number,
  allAppointments: AppointmentQueueItem[],
  doctorStatus: string = 'available'
): QueueStats => {
  try {
    // Filter to only this doctor's appointments
    const doctorAppointments = allAppointments.filter(
      appt => appt.doctorId === doctorId && 
              appt.status !== 'cancelled'
    );
    
    const position = getQueuePosition(patientAppointmentTime, doctorAppointments);
    const estimatedWait = calculateEstimatedWaitTime(position);
    const patientsAhead = position - 1;
    
    return {
      totalInQueue: doctorAppointments.filter(
        appt => appt.status === 'in-queue' || appt.status === 'confirmed'
      ).length,
      userPosition: position,
      estimatedWaitTime: estimatedWait,
      doctorStatus: doctorStatus as 'available' | 'in-consultation' | 'break' | 'offline',
      patientsAhead,
    };
  } catch (error) {
    console.error('Error getting queue stats:', error);
    return {
      totalInQueue: 0,
      userPosition: 1,
      estimatedWaitTime: 0,
      doctorStatus: 'available',
      patientsAhead: 0,
    };
  }
};

/**
 * HANDLE NO-SHOW APPOINTMENT
 *
 * Marks appointment as no-show without deleting it.
 * Keeps record for analytics and prevents system crashes.
 * Also bumps next patient in queue.
 *
 * PARAMETERS:
 *   appointmentId: ID of appointment to mark as no-show
 *   doctorId: Doctor ID
 *   allAppointments: Current appointments list
 *
 * RETURN VALUE:
 *   Updated appointments list with status changed to 'no-show'
 *
 * EXAMPLE:
 *   const updated = handleNoShowAppointment(123, 5, appointments);
 *   // Marks appointment 123 as no-show
 *   // Updates state with new appointments list
 */
export const handleNoShowAppointment = (
  appointmentId: number,
  doctorId: number,
  allAppointments: AppointmentQueueItem[]
): AppointmentQueueItem[] => {
  try {
    return allAppointments.map(appt => {
      // Mark this appointment as no-show
      if (appt.appointmentId === appointmentId) {
        return {
          ...appt,
          status: 'no-show' as const,
          updatedAt: Date.now(),
        };
      }
      return appt;
    });
  } catch (error) {
    console.error('Error handling no-show:', error);
    return allAppointments;
  }
};

/**
 * GET DOCTOR'S QUEUE
 *
 * Returns all appointments in queue for a specific doctor.
 * Sorted by appointment time (earliest first).
 *
 * PARAMETERS:
 *   doctorId: Doctor ID
 *   allAppointments: All appointments
 *   date: Optional filter by specific date
 *
 * RETURN VALUE:
 *   Filtered and sorted list of appointments for this doctor
 */
export const getDoctorQueue = (
  doctorId: number,
  allAppointments: AppointmentQueueItem[],
  date?: string
): AppointmentQueueItem[] => {
  try {
    let filtered = allAppointments.filter(
      appt => appt.doctorId === doctorId && 
              appt.status !== 'cancelled' &&
              appt.status !== 'completed'
    );
    
    if (date) {
      filtered = filtered.filter(appt => appt.appointmentDate === date);
    }
    
    // Sort by appointment time
    return filtered.sort((a, b) => {
      const timeA = new Date(a.appointmentTime).getTime();
      const timeB = new Date(b.appointmentTime).getTime();
      return timeA - timeB;
    });
  } catch (error) {
    console.error('Error getting doctor queue:', error);
    return [];
  }
};

/**
 * FORMAT WAIT TIME FOR DISPLAY
 *
 * Converts minutes to human-readable format.
 *
 * EXAMPLES:
 *   0 → "Next"
 *   15 → "15 mins"
 *   60 → "1 hour"
 *   90 → "1 hour 30 mins"
 *
 * PARAMETERS:
 *   minutes: Wait time in minutes
 *
 * RETURN VALUE:
 *   Formatted string for display to user
 */
export const formatWaitTime = (minutes: number): string => {
  if (minutes === 0) return 'Next';
  if (minutes < 60) return `${minutes} mins`;
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) return `${hours} hour${hours > 1 ? 's' : ''}`;
  return `${hours} hour${hours > 1 ? 's' : ''} ${mins} mins`;
};
