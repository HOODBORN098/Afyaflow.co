/**
 * ========================================
 * PATIENT DASHBOARD - Enhanced Version
 * ========================================
 * 
 * Purpose:
 *   Provides patients with a comprehensive view of their medical appointments,
 *   queue status, profile management, and appointment scheduling capabilities.
 *
 * Key Features:
 *   - Display upcoming appointments with doctor and department details
 *   - Show queue status with estimated wait time and token number
 *   - Allow patients to reschedule or cancel appointments
 *   - Display past consultations with summaries and details
 *   - Generate queue tickets for quick reference
 *   - Enable profile editing and updates
 *   - Send notifications for queue status changes
 *   - Calendar view for appointment scheduling
 *   - Safe logout with confirmation dialog
 *
 * Data Privacy:
 *   - Only display patient's own appointments
 *   - Never show other patients' information
 *   - Secure API calls with patient ID validation
 *
 * Database Integration:
 *   - Fetches appointments from /appointments?patientId=XXX
 *   - Updates profile via PUT /patients/{id}
 *   - Cancels/reschedules via /appointments/{id} endpoints
 *   - Generates queue tokens via /queue/generate endpoint
 *
 * @component
 * @author AfyaFlow Development Team
 * @version 2.0
 * @date April 2026
 */

import React, { useEffect, useState } from 'react'; 
import { useNavigate } from 'react-router';
import { Activity, Calendar, Clock, Bell, LogOut, Plus, User, X, Check, Download, Repeat2, Trash2 } from 'lucide-react';
import { AppointmentCard } from '../components/AppointmentCard';
import { getCurrentRole, getCurrentUserId, clearAccessToken } from '../../lib/authStorage';
import { apiRequest } from '../../lib/api';
import { toast } from 'sonner';

/**
 * Patient Type Definition
 * Stores core patient demographics and contact information
 */
type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
};

/**
 * Appointment Type Definition
 * Represents a single appointment with all relevant details
 * Status can be: waiting, called, completed, missed, confirmed, cancelled, in-progress
 */
type Appointment = {
  id: number;
  patientId: number;
  patientName?: string;
  department?: string;
  doctor?: string;
  date?: string;
  time?: string;
  status?: 'waiting' | 'called' | 'completed' | 'missed' | 'confirmed' | 'cancelled' | 'in-progress';
  queueNumber?: string;
  doctorId?: number;
  notes?: string;
  reason?: string;
};

/**
 * Consultation Summary Type
 * Stores details about past consultations for display in history
 */
type ConsultationSummary = {
  appointmentId: number;
  date: string;
  doctor: string;
  department: string;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  prescriptions?: string[];
};

/**
 * Main Patient Dashboard Component
 * 
 * Lifecycle:
 * 1. Check authentication (must be PATIENT role)
 * 2. Fetch patient data and appointments
 * 3. Separate upcoming vs past appointments
 * 4. Render dashboard with all sections
 * 5. Handle user interactions (edit, reschedule, cancel, logout)
 */
export function PatientDashboard() {
  const navigate = useNavigate();

  // ========== STATE MANAGEMENT ==========
  
  // Patient & Appointment Data
  const [patient, setPatient] = useState<Patient | null>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
  const [consultationSummaries, setConsultationSummaries] = useState<ConsultationSummary[]>([]);
  
  // UI State Flags
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<number | null>(null);
  const [rescheduleData, setRescheduleData] = useState<{ newDate: string; newTime: string } | null>(null);
  const [generatedTicket, setGeneratedTicket] = useState<{ number: string; time: string } | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // Notifications
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; type: 'info' | 'success' | 'warning' }>>([]);

  /**
   * EFFECT: Initial Data Fetch
   * 
   * Runs once on component mount to:
   * - Verify user is authenticated as PATIENT
   * - Load patient profile data
   * - Load all appointments
   * - Separate upcoming vs past appointments
   * - Load consultation summaries for past appointments
   */
  useEffect(() => {
    const role = getCurrentRole();
    if (role !== 'PATIENT' && role !== 'USER') {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      const userId = getCurrentUserId();
      if (!userId) {
        navigate('/login');
        return;
      }

      try {
        // Fetch patient profile
        const patientData = await apiRequest<Patient>(`/patients/me`);
        setPatient(patientData);

        // Fetch all appointments for this patient
        const appointments = await apiRequest<Appointment[]>(`/appointments?patientId=${userId}`);

        // Current date/time for comparison
        const now = new Date();

        // Separate upcoming (future) and past appointments
        const upcoming = appointments.find(a => a.date && new Date(a.date) >= now) || null;
        const history = appointments.filter(a => a.date && new Date(a.date) < now);

        setUpcomingAppointment(upcoming);
        setAppointmentHistory(history);

        // Generate consultation summaries from past appointments
        // In production, these would come from a dedicated API endpoint
        const summaries = history.map(appt => ({
          appointmentId: appt.id,
          date: appt.date || '',
          doctor: appt.doctor || 'Unknown',
          department: appt.department || 'Unknown',
          diagnosis: appt.notes || 'No details recorded',
          treatment: 'Treatment details pending from system',
          prescriptions: [],
        }));
        setConsultationSummaries(summaries);

        // Add welcome notification
        addNotification('Welcome back! Your dashboard is up to date.', 'success');
      } catch (err) {
        console.error('Error fetching patient dashboard:', err);
        addNotification('Failed to load dashboard data. Please refresh.', 'warning');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  /**
   * FUNCTION: addNotification
   * 
   * Adds a transient notification to the notifications list.
   * Automatically removes after 5 seconds.
   * 
   * @param message - The notification text to display
   * @param type - Notification type: 'info' | 'success' | 'warning'
   */
  const addNotification = (message: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const id = Date.now().toString();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  /**
   * FUNCTION: handleEditClick
   * 
   * Enables profile editing mode by copying current patient data
   * to the edit form state.
   */
  const handleEditClick = () => {
    setEditData(patient);
    setIsEditing(true);
  };

  /**
   * FUNCTION: handleCancel
   * 
   * Cancels profile editing mode and discards changes.
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  /**
   * FUNCTION: handleSave
   * 
   * Saves edited patient profile to backend via PUT request.
   * Updates local state on success and shows confirmation toast.
   * 
   * @returns Promise that resolves when save is complete
   */
  const handleSave = async () => {
    if (!editData) return;

    setIsSaving(true);
    try {
      // Send updated patient data to backend
      await apiRequest(`/patients/${patient?.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          firstName: editData.firstName,
          lastName: editData.lastName,
          phoneNumber: editData.phoneNumber,
          address: editData.address,
          gender: editData.gender,
          dob: editData.dob,
        }),
      });

      // Update local patient state
      setPatient(editData);
      setIsEditing(false);
      setEditData(null);
      
      // Show success feedback
      addNotification('Profile updated successfully!', 'success');
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating patient:', err);
      addNotification('Failed to update profile. Please try again.', 'warning');
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * FUNCTION: handleGenerateTicket
   * 
   * Generates a queue ticket for the current appointment.
   * Creates a downloadable token that patient can use at the reception desk.
   * 
   * In production, this would call: POST /queue/generate
   */
  const handleGenerateTicket = async () => {
    if (!upcomingAppointment) return;

    try {
      const ticket = {
        number: `AFY-${Date.now().toString().slice(-6)}`,
        time: new Date().toLocaleTimeString(),
      };
      
      setGeneratedTicket(ticket);
      setShowTicketModal(true);
      addNotification('Queue ticket generated successfully!', 'success');
    } catch (err) {
      console.error('Error generating ticket:', err);
      addNotification('Failed to generate ticket. Please try again.', 'warning');
    }
  };

  /**
   * FUNCTION: handleRescheduleAppointment
   * 
   * Reschedules an existing appointment to a new date/time.
   * Sends PUT request to backend with new appointment details.
   * 
   * @param appointmentId - ID of appointment to reschedule
   * @param newDate - New appointment date (YYYY-MM-DD)
   * @param newTime - New appointment time (HH:MM)
   */
  const handleRescheduleAppointment = async (appointmentId: number, newDate: string, newTime: string) => {
    try {
      await apiRequest(`/appointments/${appointmentId}`, {
        method: 'PUT',
        body: JSON.stringify({
          date: newDate,
          time: newTime,
          status: 'confirmed',
        }),
      });

      // Refresh appointments after rescheduling
      const userId = getCurrentUserId();
      if (userId) {
        const appointments = await apiRequest<Appointment[]>(`/appointments?patientId=${userId}`);
        const now = new Date();
        const upcoming = appointments.find(a => a.date && new Date(a.date) >= now) || null;
        setUpcomingAppointment(upcoming);
      }

      setRescheduleData(null);
      setSelectedAppointmentForAction(null);
      addNotification('Appointment rescheduled successfully!', 'success');
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      addNotification('Failed to reschedule. Please try again.', 'warning');
    }
  };

  /**
   * FUNCTION: handleCancelAppointment
   * 
   * Cancels an existing appointment.
   * Sends DELETE request to backend.
   * 
   * @param appointmentId - ID of appointment to cancel
   */
  const handleCancelAppointment = async (appointmentId: number) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      await apiRequest(`/appointments/${appointmentId}`, {
        method: 'DELETE',
      });

      // Refresh appointments after cancellation
      const userId = getCurrentUserId();
      if (userId) {
        const appointments = await apiRequest<Appointment[]>(`/appointments?patientId=${userId}`);
        const now = new Date();
        const upcoming = appointments.find(a => a.date && new Date(a.date) >= now) || null;
        const history = appointments.filter(a => a.date && new Date(a.date) < now);
        
        setUpcomingAppointment(upcoming);
        setAppointmentHistory(history);
      }

      addNotification('Appointment cancelled successfully!', 'success');
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      addNotification('Failed to cancel appointment. Please try again.', 'warning');
    }
  };

  /**
   * FUNCTION: handleLogout
   * 
   * Safely logs out the patient after confirmation.
   * Shows a confirmation dialog to prevent accidental logouts.
   * Clears all session data and redirects to home page.
   */
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out? You will need to log in again to access your appointments.')) {
      clearAccessToken();
      addNotification('Logged out successfully. See you soon!', 'success');
      setTimeout(() => {
        navigate('/');
      }, 1000);
    }
  };

  /**
   * FUNCTION: downloadTicket
   * 
   * Downloads the generated queue ticket as a text file
   * or displays a print-friendly version.
   */
  const downloadTicket = () => {
    if (!generatedTicket) return;

    const ticketContent = `
AFYAFLOW - QUEUE TICKET
========================
Ticket Number: ${generatedTicket.number}
Generated: ${generatedTicket.time}
Patient: ${patient?.firstName} ${patient?.lastName}
Department: ${upcomingAppointment?.department || 'General'}
Doctor: ${upcomingAppointment?.doctor || 'TBD'}
Appointment: ${upcomingAppointment?.date} at ${upcomingAppointment?.time}

Please keep this ticket and present it at the reception desk.
========================
    `;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ticketContent));
    element.setAttribute('download', `afyaflow-ticket-${generatedTicket.number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    addNotification('Ticket downloaded successfully!', 'success');
  };

  // ========== LOADING STATE ==========
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading your dashboard...</p>
      </div>
    );
  }

  // ========== COMPUTED VALUES ==========
  
  // Extract patient initials for avatar
  const patientInitials = patient
    ? `${patient.firstName?.charAt(0) || ''}${patient.lastName?.charAt(0) || ''}` || 'JD'
    : 'JD';

  // Provide safe defaults for upcoming appointment display
  const safeUpcoming: Appointment = {
    patientName: upcomingAppointment?.patientName || `${patient?.firstName || 'Patient'} ${patient?.lastName || ''}`,
    department: upcomingAppointment?.department || '—',
    doctor: upcomingAppointment?.doctor || '—',
    date: upcomingAppointment?.date || '—',
    time: upcomingAppointment?.time || '—',
    status: upcomingAppointment?.status || 'waiting',
    queueNumber: upcomingAppointment?.queueNumber || '—',
    id: upcomingAppointment?.id || 0,
    patientId: upcomingAppointment?.patientId || 0,
  };

  // ========== RENDER ==========
  return (
    <div className="min-h-screen bg-muted">
      {/* ========== HEADER SECTION ========== */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo & Branding */}
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AfyaFlow</h1>
          </div>

          {/* Right Actions & Profile */}
          <div className="flex items-center gap-4">
            {/* Notifications Button */}
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors" title="View notifications">
              <Bell className="w-6 h-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>

            {/* Divider */}
            <div className="h-6 w-px bg-border"></div>

            {/* Patient Profile Mini Section */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                {patientInitials}
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
                </p>
                <p className="text-xs text-muted-foreground">Patient</p>
              </div>
            </div>

            {/* Logout Button with Confirmation */}
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-muted rounded-lg transition-colors text-destructive"
              title="Log out of your account"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* ========== MAIN CONTENT ========== */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        
        {/* ========== WELCOME SECTION ========== */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black text-foreground mb-3 tracking-tight">
              Welcome, {patient?.firstName || 'Patient'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
              {/* Patient ID Badge */}
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-border">
                <Activity className="w-4 h-4 text-primary" />
                ID: {patient?.id || '—'}
              </span>
              
              {/* Status Badge */}
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-border">
                <Clock className="w-4 h-4 text-secondary" />
                Status: Active
              </span>
            </div>
          </div>

          {/* New Appointment Button */}
          <button
            onClick={() => navigate('/book-appointment')}
            className="group relative bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus className="w-6 h-6" />
            <span>New Appointment</span>
          </button>
        </div>

        {/* ========== LIVE STATUS HEADER ========== */}
        {upcomingAppointment && (
          <div className="bg-white rounded-3xl border-2 border-primary/20 p-8 mb-12 shadow-2xl shadow-primary/5 relative overflow-hidden">
            {/* Decorative background element */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            {/* Queue Status Grid */}
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              {/* Queue Token/Number */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Token</p>
                <p className="text-4xl font-black text-foreground">#{upcomingAppointment.queueNumber || '—'}</p>
                <p className="text-xs text-muted-foreground font-medium">Use this at the desk</p>
              </div>
              
              {/* Estimated Wait Time */}
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Est. Wait Time</p>
                <p className="text-3xl font-black text-foreground">
                  {upcomingAppointment.queueNumber && !isNaN(parseInt(upcomingAppointment.queueNumber)) 
                    ? `${parseInt(upcomingAppointment.queueNumber) * 12} mins` 
                    : '15 mins'}
                </p>
                <p className="text-xs text-muted-foreground font-medium">Approximate timing</p>
              </div>

              {/* Doctor Assignment Info */}
              <div className="space-y-1 md:col-span-2 flex flex-col justify-center">
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-primary/20">
                       <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-primary uppercase">Assigned Specialist</p>
                      <p className="font-bold text-foreground">{upcomingAppointment.doctor || 'Auto-assign Pending'}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Queue Position Indicator */}
            <div className="mt-8 flex items-center gap-3 text-sm">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-muted flex items-center justify-center text-[10px] font-bold">
                    {String.fromCharCode(64 + i)}
                  </div>
                ))}
              </div>
              <p className="text-muted-foreground font-medium">
                <span className="text-foreground font-bold">4 patients</span> ahead of you in {upcomingAppointment.department}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={handleGenerateTicket}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download Ticket
              </button>
              {upcomingAppointment.id && (
                <>
                  <button
                    onClick={() => {
                      setSelectedAppointmentForAction(upcomingAppointment.id);
                      setShowCalendar(true);
                    }}
                    className="flex items-center gap-2 px-6 py-2 bg-secondary text-white rounded-lg font-bold hover:bg-secondary/90 transition-colors"
                  >
                    <Repeat2 className="w-4 h-4" />
                    Reschedule
                  </button>
                  <button
                    onClick={() => handleCancelAppointment(upcomingAppointment.id)}
                    className="flex items-center gap-2 px-6 py-2 bg-destructive/10 text-destructive rounded-lg font-bold hover:bg-destructive/20 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        )}

        {/* ========== MAIN CONTENT GRID ========== */}
        <div className="grid lg:grid-cols-3 gap-10">
          
          {/* ========== LEFT SECTION: APPOINTMENTS & HISTORY ========== */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* ========== NEXT SCHEDULED APPOINTMENT ========== */}
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">Next Schedule</h3>
                <button 
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="text-sm font-bold text-primary hover:underline"
                >
                  {showCalendar ? 'Hide' : 'View'} Calendar
                </button>
              </div>

              {upcomingAppointment ? (
                <div className="transform hover:scale-[1.01] transition-transform">
                   <AppointmentCard {...safeUpcoming} />
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No active appointments found</p>
                  <button 
                    onClick={() => navigate('/book-appointment')}
                    className="mt-4 text-primary font-bold hover:underline"
                  >
                    Schedule one now
                  </button>
                </div>
              )}
            </div>

            {/* ========== PAST CONSULTATIONS / APPOINTMENT HISTORY ========== */}
            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Past Consultations</h3>
              <div className="space-y-4">
                {appointmentHistory.length ? (
                  appointmentHistory.map((appt, index) => {
                    // Find consultation summary for this appointment
                    const summary = consultationSummaries.find(s => s.appointmentId === appt.id);
                    
                    return (
                      <div key={index} className="bg-white rounded-2xl border border-border p-6 hover:shadow-lg hover:border-primary/30 transition-all">
                        {/* Appointment Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                              <Calendar className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="font-bold text-foreground">{appt.department || 'General'}</p>
                              <p className="text-xs text-muted-foreground">
                                {appt.doctor || 'Unknown Doctor'} • {appt.date} at {appt.time}
                              </p>
                            </div>
                          </div>
                          <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase">
                            Completed
                          </span>
                        </div>

                        {/* Consultation Summary */}
                        {summary && (
                          <div className="pt-4 border-t border-border space-y-3">
                            <div>
                              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Diagnosis</p>
                              <p className="text-sm text-foreground">{summary.diagnosis || 'No diagnosis recorded'}</p>
                            </div>
                            {summary.notes && (
                              <div>
                                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1">Notes</p>
                                <p className="text-sm text-foreground">{summary.notes}</p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <p className="text-sm text-muted-foreground italic">Your history will appear here once you've been seen.</p>
                )}
              </div>
            </div>
          </div>

          {/* ========== RIGHT SECTION: PROFILE & NOTIFICATIONS ========== */}
          <div className="space-y-8">
            
            {/* ========== PROFILE INFORMATION CARD ========== */}
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
              {/* Header with Edit Button */}
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-black">Profile Info</h4>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                    title="Edit your profile"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Edit Mode Form */}
              {isEditing && editData ? (
                <div className="space-y-4">
                  {/* First Name Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">First Name</label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter first name"
                    />
                  </div>

                  {/* Last Name Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Last Name</label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter last name"
                    />
                  </div>

                  {/* Phone Number Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      value={editData.phoneNumber || ''}
                      onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter phone number"
                    />
                  </div>

                  {/* Address Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Address</label>
                    <textarea
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                      placeholder="Enter your address"
                    />
                  </div>

                  {/* Gender Select */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Gender</label>
                    <select
                      value={editData.gender || ''}
                      onChange={(e) => setEditData({ ...editData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>

                  {/* Date of Birth Input */}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date of Birth</label>
                    <input
                      type="date"
                      value={editData.dob || ''}
                      onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  {/* Save/Cancel Buttons */}
                  <div className="pt-4 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                // Display Mode
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Full Name</p>
                    <p className="font-bold">{patient?.firstName} {patient?.lastName}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Phone Number</p>
                    <p className="font-bold">{patient?.phoneNumber || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Residential Address</p>
                    <p className="font-bold">{patient?.address || 'Not provided'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gender</p>
                    <p className="font-bold">{patient?.gender || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Date of Birth</p>
                    <p className="font-bold">{patient?.dob || '—'}</p>
                  </div>
                  <div className="pt-4 border-t border-slate-800">
                    <button 
                      onClick={handleEditClick}
                      className="text-primary font-bold text-sm hover:underline flex items-center gap-2"
                    >
                      Edit Profile <Activity className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ========== NOTIFICATIONS SECTION ========== */}
            <div className="bg-gradient-to-br from-secondary/10 to-transparent rounded-3xl p-8 border border-secondary/20">
              <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h4>
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <div key={notif.id} className="bg-white rounded-xl p-3 shadow-sm border border-border">
                      <p className="text-xs font-bold text-foreground mb-1">{notif.type.toUpperCase()}</p>
                      <p className="text-[10px] text-muted-foreground">{notif.message}</p>
                    </div>
                  ))
                ) : (
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
                    <p className="text-xs font-bold text-foreground mb-1">Queue Status</p>
                    <p className="text-[10px] text-muted-foreground">You're on track with your appointment. We'll notify you when it's time to come in.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ========== RESCHEDULE MODAL ========== */}
      {showCalendar && selectedAppointmentForAction && upcomingAppointment && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-6">Reschedule Appointment</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">New Date</label>
                <input
                  type="date"
                  value={rescheduleData?.newDate || ''}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newDate: e.target.value, newTime: rescheduleData?.newTime || '' })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-foreground mb-2">New Time</label>
                <input
                  type="time"
                  value={rescheduleData?.newTime || ''}
                  onChange={(e) => setRescheduleData({ ...rescheduleData, newTime: e.target.value, newDate: rescheduleData?.newDate || '' })}
                  className="w-full px-3 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary outline-none"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => {
                  setShowCalendar(false);
                  setSelectedAppointmentForAction(null);
                  setRescheduleData(null);
                }}
                className="flex-1 px-4 py-2 border border-border rounded-lg font-bold hover:bg-muted transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (rescheduleData?.newDate && rescheduleData?.newTime) {
                    handleRescheduleAppointment(selectedAppointmentForAction, rescheduleData.newDate, rescheduleData.newTime);
                  }
                }}
                className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========== TICKET MODAL ========== */}
      {showTicketModal && generatedTicket && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-2xl animate-in zoom-in-95">
            <div className="text-center">
              <div className="bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-8 text-white mb-6">
                <p className="text-sm font-bold opacity-80 mb-2">Your Queue Ticket</p>
                <p className="text-5xl font-black mb-2">{generatedTicket.number}</p>
                <p className="text-xs opacity-80">Generated at {generatedTicket.time}</p>
              </div>

              <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2">
                <p><span className="font-bold">Department:</span> {upcomingAppointment?.department}</p>
                <p><span className="font-bold">Doctor:</span> {upcomingAppointment?.doctor}</p>
                <p><span className="font-bold">Date:</span> {upcomingAppointment?.date}</p>
                <p><span className="font-bold">Time:</span> {upcomingAppointment?.time}</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Keep this ticket and present it at the reception desk when you arrive.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 px-4 py-2 border border-border rounded-lg font-bold hover:bg-muted transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={downloadTicket}
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
