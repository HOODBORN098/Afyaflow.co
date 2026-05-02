/**
 * =========================================================
 * BOOKING SERVICE - Appointment Data Persistence
 * =========================================================
 *
 * PURPOSE:
 *   This service handles persistent storage of appointment booking data.
 *   It allows users to continue booking even if they're not logged in,
 *   then restore their selections after logging in without losing progress.
 *
 * HOW IT WORKS:
 *   1. When user selects department/doctor/date/time, data is saved to localStorage
 *   2. If user logs out or session expires, data is preserved
 *   3. After login, data is automatically restored and pre-populated
 *   4. User sees "Resume Booking" option with their previous selections
 *   5. After successful booking, data is cleared
 *
 * KEY FUNCTIONS:
 *   - saveBookingData(): Save current booking progress
 *   - getBookingData(): Retrieve saved booking data
 *   - clearBookingData(): Delete saved data (after success or on demand)
 *   - hasBookingData(): Check if there's pending booking data
 *
 * STORAGE KEY: 'afyaflow_booking_draft'
 *   Stored in browser's localStorage (persists across sessions)
 *
 * @module BookingService
 * @author AfyaFlow Development Team
 * @date April 2026
 */

export interface BookingDraft {
  selectedDepartment: number | null;
  selectedDoctor: number | null;
  selectedDate: string;
  selectedTime: string;
  departmentName?: string;
  doctorName?: string;
  createdAt: number; // Timestamp for tracking age of draft
}

// ========== LOCAL STORAGE KEY ==========
// This key identifies where booking data is stored in browser
const BOOKING_DRAFT_KEY = 'afyaflow_booking_draft';

/**
 * SAVE BOOKING DATA
 *
 * Persists the current appointment selection to browser storage.
 * Called every time user makes a selection (department, doctor, date, time).
 *
 * PARAMETERS:
 *   data: BookingDraft object with all selections
 *
 * EXAMPLE:
 *   saveBookingData({
 *     selectedDepartment: 1,
 *     selectedDoctor: 5,
 *     selectedDate: "2026-04-25",
 *     selectedTime: "14:00",
 *     departmentName: "Cardiology",
 *     doctorName: "Dr. Smith"
 *   });
 */
export const saveBookingData = (data: BookingDraft): void => {
  try {
    const dataToStore = {
      ...data,
      createdAt: Date.now(), // Add timestamp
    };
    localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(dataToStore));
    console.log('Booking data saved:', dataToStore);
  } catch (error) {
    console.error('Failed to save booking data:', error);
    // Silently fail - don't interrupt user experience
  }
};

/**
 * GET BOOKING DATA
 *
 * Retrieves previously saved booking selections from storage.
 * Returns null if no booking data exists.
 *
 * EXAMPLE:
 *   const draft = getBookingData();
 *   if (draft) {
 *     // User has previous booking selections
 *     setSelectedDepartment(draft.selectedDepartment);
 *   }
 *
 * RETURN VALUE:
 *   BookingDraft object if found, null if not
 */
export const getBookingData = (): BookingDraft | null => {
  try {
    const data = localStorage.getItem(BOOKING_DRAFT_KEY);
    if (!data) return null;
    
    const parsed = JSON.parse(data) as BookingDraft;
    
    // Check if draft is older than 24 hours (optional)
    const ageInHours = (Date.now() - parsed.createdAt) / (1000 * 60 * 60);
    if (ageInHours > 24) {
      console.log('Booking draft is too old, clearing');
      clearBookingData();
      return null;
    }
    
    return parsed;
  } catch (error) {
    console.error('Failed to get booking data:', error);
    return null;
  }
};

/**
 * HAS BOOKING DATA
 *
 * Quickly checks if user has pending booking data without parsing.
 * Useful for showing "Resume Booking" button/option.
 *
 * EXAMPLE:
 *   if (hasBookingData()) {
 *     showResumeBookingButton();
 *   }
 *
 * RETURN VALUE:
 *   true if booking data exists, false otherwise
 */
export const hasBookingData = (): boolean => {
  try {
    return localStorage.getItem(BOOKING_DRAFT_KEY) !== null;
  } catch {
    return false;
  }
};

/**
 * CLEAR BOOKING DATA
 *
 * Removes all saved booking selections from storage.
 * Called after successful booking or when user clicks "Start New Booking".
 *
 * EXAMPLE:
 *   // After successful booking
 *   await bookAppointmentApi(bookingData);
 *   clearBookingData(); // Clean up
 */
export const clearBookingData = (): void => {
  try {
    localStorage.removeItem(BOOKING_DRAFT_KEY);
    console.log('Booking data cleared');
  } catch (error) {
    console.error('Failed to clear booking data:', error);
  }
};

/**
 * GET BOOKING AGE
 *
 * Returns how old the booking draft is in hours.
 * Useful for displaying "You started this booking 2 hours ago" message.
 *
 * RETURN VALUE:
 *   Number of hours since booking was created, or -1 if no draft exists
 */
export const getBookingAge = (): number => {
  const draft = getBookingData();
  if (!draft) return -1;
  return Math.floor((Date.now() - draft.createdAt) / (1000 * 60 * 60));
};

/**
 * VALIDATE BOOKING DATA
 *
 * Checks if booking data is complete and valid.
 * Returns true only if all required fields are filled.
 *
 * RETURN VALUE:
 *   true if all fields are selected, false otherwise
 */
export const isBookingDataComplete = (): boolean => {
  const draft = getBookingData();
  if (!draft) return false;
  return !!(
    draft.selectedDepartment &&
    draft.selectedDoctor &&
    draft.selectedDate &&
    draft.selectedTime
  );
};
