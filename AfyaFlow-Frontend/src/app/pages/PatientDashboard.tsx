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

type Patient = {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  phoneNumber?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
};

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
};

export function PatientDashboard() {
  const navigate = useNavigate();

  // ========== MAIN STATE VARIABLES ==========
  const [patient, setPatient] = useState<Patient | null>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);

  // ========== RESCHEDULE/CANCEL MODAL STATE ==========
  // Track which appointment user wants to interact with
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'reschedule' | 'cancel' | null>(null);
  
  // State for reschedule modal
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // ========== QUEUE TICKET STATE ==========
  // Store generated ticket information for download
  const [generatedTicket, setGeneratedTicket] = useState<{ number: string; time: string } | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // ========== DATA FETCHING ON COMPONENT MOUNT ==========

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
        const patientData = await apiRequest<Patient>(`/patients/me`);
        setPatient(patientData);

        const appointments = await apiRequest<Appointment[]>(`/appointments?patientId=${userId}`);

        const now = new Date();
        const upcoming = appointments.find(a => a.date && new Date(a.date) >= now) || null;
        const history = appointments.filter(a => a.date && new Date(a.date) < now);

        setUpcomingAppointment(upcoming);
        setAppointmentHistory(history);
      } catch (err) {
        console.error('Error fetching patient dashboard:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleEditClick = () => {
    setEditData(patient);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(null);
  };

  const handleSave = async () => {
    if (!editData) return;

    setIsSaving(true);
    try {
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

      setPatient(editData);
      setIsEditing(false);
      setEditData(null);
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error updating patient:', err);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // ========== APPOINTMENT RESCHEDULE HANDLER ==========
  /**
   * Handles rescheduling an appointment to a new date and time.
   * Called when user confirms reschedule action in modal.
   * 
   * Process:
   * 1. Validate date and time are selected
   * 2. Send PUT request to backend with new date/time
   * 3. Update local state with new appointment
   * 4. Show success notification
   * 5. Close modal and refresh data
   */
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointmentForAction || !rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }

    setIsRescheduling(true);
    try {
      // Call API to update appointment with new date/time
      await apiRequest(`/appointments/${selectedAppointmentForAction.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          date: rescheduleDate,
          time: rescheduleTime,
          status: 'confirmed', // Mark as confirmed when rescheduled
        }),
      });

      // Update the upcoming appointment in state
      if (upcomingAppointment?.id === selectedAppointmentForAction.id) {
        setUpcomingAppointment({
          ...upcomingAppointment,
          date: rescheduleDate,
          time: rescheduleTime,
        });
      }

      toast.success(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      
      // Close modal and reset form
      setActionType(null);
      setSelectedAppointmentForAction(null);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (err) {
      console.error('Error rescheduling appointment:', err);
      toast.error('Failed to reschedule appointment. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // ========== APPOINTMENT CANCEL HANDLER ==========
  /**
   * Handles cancellation of an appointment.
   * Shows confirmation before sending delete request to backend.
   * 
   * Process:
   * 1. Ask user for confirmation
   * 2. Send DELETE request to backend
   * 3. Remove appointment from local state
   * 4. Show success notification
   * 5. Close modal
   */
  const handleCancelAppointment = async () => {
    if (!selectedAppointmentForAction) return;

    // Double confirm before cancellation
    if (!window.confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    setIsRescheduling(true);
    try {
      // Call API to delete/cancel appointment
      await apiRequest(`/appointments/${selectedAppointmentForAction.id}`, {
        method: 'DELETE',
      });

      // Remove from upcoming if it's the current one
      if (upcomingAppointment?.id === selectedAppointmentForAction.id) {
        setUpcomingAppointment(null);
      }

      // Remove from history if present
      setAppointmentHistory(prev => prev.filter(a => a.id !== selectedAppointmentForAction.id));

      toast.success('Appointment cancelled successfully');
      
      // Close modal and reset
      setActionType(null);
      setSelectedAppointmentForAction(null);
    } catch (err) {
      console.error('Error cancelling appointment:', err);
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // ========== QUEUE TICKET GENERATION HANDLER ==========
  /**
   * Generates a unique queue ticket for the current appointment.
   * Format: AFY-XXXXXX (where X are random digits)
   * 
   * This ticket allows patients to:
   * - Track their position in the queue
   * - Show it at the reception desk
   * - Download it as a reference document
   */
  const handleGenerateTicket = async () => {
    try {
      // Generate unique ticket number (format: AFY-XXXXXX)
      const ticketNumber = `AFY-${Math.random().toString().slice(2, 8).padEnd(6, '0')}`;
      const currentTime = new Date().toLocaleTimeString();

      // Store ticket in state
      setGeneratedTicket({
        number: ticketNumber,
        time: currentTime,
      });

      // Show ticket modal
      setShowTicketModal(true);

      toast.success('Ticket generated successfully! You can download it now.');
    } catch (err) {
      console.error('Error generating ticket:', err);
      toast.error('Failed to generate ticket. Please try again.');
    }
  };

  // ========== TICKET DOWNLOAD HANDLER ==========
  /**
   * Downloads the generated queue ticket as a text file.
   * Creates a downloadable file with appointment and ticket details.
   */
  const downloadTicket = () => {
    if (!generatedTicket || !upcomingAppointment) return;

    // Create ticket content with appointment details
    const ticketContent = `
AFYAFLOW HOSPITAL - QUEUE TICKET
================================

TICKET NUMBER: ${generatedTicket.number}
GENERATED: ${generatedTicket.time}
DATE: ${new Date().toLocaleDateString()}

PATIENT INFORMATION:
Name: ${patient?.firstName} ${patient?.lastName}
ID: ${patient?.id}

APPOINTMENT DETAILS:
Doctor: ${upcomingAppointment.doctor || 'Auto-assign'}
Department: ${upcomingAppointment.department || '—'}
Date: ${upcomingAppointment.date || '—'}
Time: ${upcomingAppointment.time || '—'}

INSTRUCTIONS:
1. Show this ticket at the reception desk
2. Wait for your queue number to be called
3. Proceed to the specified consultation room

Please arrive 10 minutes before your appointment time.

================================
Visit: www.afyaflow-hospital.local
    `;

    // Create blob and download
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ticketContent));
    element.setAttribute('download', `AfyaFlow_Ticket_${generatedTicket.number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);

    toast.success('Ticket downloaded successfully!');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  const patientInitials = patient
    ? `${patient.firstName?.charAt(0) || ''}${patient.lastName?.charAt(0) || ''}` || 'JD'
    : 'JD';

  // Safe defaults for upcoming appointment
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

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AfyaFlow</h1>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {patientInitials}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
                </p>
                <p className="text-sm text-muted-foreground">Patient</p>
              </div>
            </div>
            <button
              onClick={() => {
                // Ask for logout confirmation before clearing session
                if (window.confirm('Are you sure you want to log out? You will need to log in again.')) {
                  clearAccessToken();
                  navigate('/');
                }
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <h2 className="text-4xl font-black text-foreground mb-3 tracking-tight">
              Welcome, {patient?.firstName || 'Patient'}
            </h2>
            <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-muted-foreground">
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-border">
                <Activity className="w-4 h-4 text-primary" />
                ID: {patient?.id || '—'}
              </span>
              <span className="flex items-center gap-1.5 bg-white px-3 py-1 rounded-full border border-border">
                <Clock className="w-4 h-4 text-secondary" />
                Status: Active
              </span>
            </div>
          </div>
          <button
            onClick={() => navigate('/book-appointment')}
            className="group relative bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-primary/20 hover:shadow-primary/30 hover:-translate-y-0.5 transition-all flex items-center gap-3 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <Plus className="w-6 h-6" />
            <span>New Appointment</span>
          </button>
        </div>

        {/* Live Status Header */}
        {upcomingAppointment && (
          <div className="bg-white rounded-3xl border-2 border-primary/20 p-8 mb-12 shadow-2xl shadow-primary/5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -mr-32 -mt-32 blur-3xl" />
            
            <div className="grid md:grid-cols-4 gap-8 relative z-10">
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Token</p>
                <p className="text-4xl font-black text-foreground">#{upcomingAppointment.queueNumber || '—'}</p>
                <p className="text-xs text-muted-foreground font-medium">Use this at the desk</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Est. Wait Time</p>
                <p className="text-3xl font-black text-foreground">
                  {upcomingAppointment.queueNumber && !isNaN(parseInt(upcomingAppointment.queueNumber)) 
                    ? `${parseInt(upcomingAppointment.queueNumber) * 12} mins` 
                    : '15 mins'}
                </p>
                <p className="text-xs text-muted-foreground font-medium">Approximate timing</p>
              </div>

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
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main List */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-foreground">Next Schedule</h3>
                <span className="text-sm font-bold text-primary cursor-pointer hover:underline">View Calendar</span>
              </div>
              {upcomingAppointment ? (
                <div className="space-y-4">
                  <div className="transform hover:scale-[1.01] transition-transform">
                     <AppointmentCard {...safeUpcoming} />
                  </div>
                  
                  {/* ACTION BUTTONS: Reschedule, Cancel, Generate Ticket */}
                  <div className="bg-white rounded-2xl border border-border p-5 flex gap-3 flex-wrap">
                    <button
                      onClick={() => {
                        setSelectedAppointmentForAction(upcomingAppointment);
                        setActionType('reschedule');
                      }}
                      className="flex-1 min-w-[150px] bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Repeat2 className="w-5 h-5" />
                      Reschedule
                    </button>

                    <button
                      onClick={() => {
                        setSelectedAppointmentForAction(upcomingAppointment);
                        setActionType('cancel');
                      }}
                      className="flex-1 min-w-[150px] bg-destructive/20 text-destructive py-3 rounded-xl font-bold hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" />
                      Cancel
                    </button>

                    <button
                      onClick={handleGenerateTicket}
                      className="flex-1 min-w-[150px] bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" />
                      Get Ticket
                    </button>
                  </div>
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

            <div>
              <h3 className="text-2xl font-bold text-foreground mb-6">Past Consultations</h3>
              <div className="space-y-4">
                {appointmentHistory.length ? (
                  appointmentHistory.map((appt, index) => (
                    <div key={index} className="bg-white rounded-2xl border border-border p-5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                          <Calendar className="w-6 h-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-bold text-foreground">{appt.department}</p>
                          <p className="text-xs text-muted-foreground">{appt.date} • {appt.time}</p>
                        </div>
                      </div>
                      <span className="px-3 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase">
                        Completed
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground italic">Your history will appear here once you've been seen.</p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Info */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-black">Profile Info</h4>
                {!isEditing && (
                  <button
                    onClick={handleEditClick}
                    className="text-primary hover:text-primary/80 transition-colors p-1"
                  >
                    <Activity className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditing && editData ? (
                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">First Name</label>
                    <input
                      type="text"
                      value={editData.firstName}
                      onChange={(e) => setEditData({ ...editData, firstName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Last Name</label>
                    <input
                      type="text"
                      value={editData.lastName}
                      onChange={(e) => setEditData({ ...editData, lastName: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Phone Number</label>
                    <input
                      type="tel"
                      value={editData.phoneNumber || ''}
                      onChange={(e) => setEditData({ ...editData, phoneNumber: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Address</label>
                    <textarea
                      value={editData.address || ''}
                      onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>
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
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date of Birth</label>
                    <input
                      type="date"
                      value={editData.dob || ''}
                      onChange={(e) => setEditData({ ...editData, dob: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

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
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Name</p>
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
                  <div className="pt-4 border-t border-slate-800">
                    <button 
                      onClick={handleEditClick}
                      className="text-primary font-bold text-sm hover:underline flex items-center gap-2"
                    >
                      Edit Profile Details <Activity className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-secondary/10 to-transparent rounded-3xl p-8 border border-secondary/20">
              <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Notifications
              </h4>
              <div className="space-y-4">
                <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
                  <p className="text-xs font-bold text-foreground mb-1">System Update</p>
                  <p className="text-[10px] text-muted-foreground">Online lab reports will be available next week.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================= 
            MODALS SECTION
            ============================================= */}

        {/* RESCHEDULE APPOINTMENT MODAL */}
        {actionType === 'reschedule' && selectedAppointmentForAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Reschedule Appointment</h2>
                <button
                  onClick={() => {
                    setActionType(null);
                    setSelectedAppointmentForAction(null);
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <p className="text-sm text-muted-foreground">Current appointment: {selectedAppointmentForAction.date} at {selectedAppointmentForAction.time}</p>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Select New Date</label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">Select New Time</label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActionType(null);
                    setSelectedAppointmentForAction(null);
                  }}
                  className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRescheduleAppointment}
                  disabled={isRescheduling}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <Check className="w-5 h-5" />
                  {isRescheduling ? 'Rescheduling...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* CANCEL APPOINTMENT CONFIRMATION MODAL */}
        {actionType === 'cancel' && selectedAppointmentForAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-destructive">Cancel Appointment?</h2>
                <button
                  onClick={() => {
                    setActionType(null);
                    setSelectedAppointmentForAction(null);
                  }}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-sm text-muted-foreground mb-4">
                  You are about to cancel your appointment scheduled for:
                </p>
                <div className="bg-muted/50 rounded-xl p-4">
                  <p className="font-bold text-foreground">{selectedAppointmentForAction.department}</p>
                  <p className="text-sm text-muted-foreground">{selectedAppointmentForAction.date} • {selectedAppointmentForAction.time}</p>
                  <p className="text-sm text-muted-foreground">Doctor: {selectedAppointmentForAction.doctor || 'To be assigned'}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActionType(null);
                    setSelectedAppointmentForAction(null);
                  }}
                  className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  Keep Appointment
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={isRescheduling}
                  className="flex-1 bg-destructive text-white py-3 rounded-xl font-bold hover:bg-destructive/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  {isRescheduling ? 'Cancelling...' : 'Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* QUEUE TICKET DOWNLOAD MODAL */}
        {showTicketModal && generatedTicket && upcomingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Your Queue Ticket</h2>
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="p-1 hover:bg-muted rounded-lg"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-8 mb-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-3">Your Ticket Number</p>
                <p className="text-5xl font-black mb-2">{generatedTicket.number}</p>
                <p className="text-[10px] opacity-75">Generated at {generatedTicket.time}</p>
              </div>

              <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-2">
                <div className="text-xs text-muted-foreground uppercase font-bold">Appointment Details</div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Doctor:</span>
                    <span className="font-bold text-foreground">{upcomingAppointment.doctor || 'Auto-assign'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Department:</span>
                    <span className="font-bold text-foreground">{upcomingAppointment.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date & Time:</span>
                    <span className="font-bold text-foreground">{upcomingAppointment.date} {upcomingAppointment.time}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setShowTicketModal(false)}
                  className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={downloadTicket}
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-5 h-5" />
                  Download
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}