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
import { 
  apiRequest, 
  getQueueStatusApi, 
  QueueStats as QueueStatsType,
  getNotificationsApi,
  getUnreadCountApi,
  markAsReadApi,
  markAllAsReadApi,
  cancelAppointmentApi,
  Notification
} from '../../lib/api';
import { toast } from 'sonner';
import { useCallback } from 'react';

type Patient = {
  id: number;
  tokenId: string;
  firstName: string;
  lastName: string;
  address: string;
  phone?: string;
  dob?: string;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  vitalsJson?: string;
  prescriptionsJson?: string;
  referralsJson?: string;
  consultationNotes?: string;
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

/**
 * PATIENT DASHBOARD COMPONENT
 * The main interface for authenticated patients.
 * Managed with React Hooks (useState, useEffect, useNavigate).
 */
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
  
  // Real-time Queue Tracking
  const [queueStats, setQueueStats] = useState<QueueStatsType | null>(null);

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

  // ========== LOGOUT MODAL STATE ==========
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ========== LIVE CLOCK STATE ==========
  const [currentTime, setCurrentTime] = useState(new Date());

  // ========== NOTIFICATION STATE ==========
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [notifs, count] = await Promise.all([
          getNotificationsApi(),
          getUnreadCountApi()
        ]);
        setNotifications(notifs);
        setUnreadCount(count);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsReadApi(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (err) {
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsReadApi();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      toast.success('All notifications marked as read');
    } catch (err) {
      toast.error('Failed to mark all as read');
    }
  };

  // ========== DATA FETCHING LOGIC ==========

  const fetchData = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const patientData = await apiRequest<Patient>(`/patients/me`);
      setPatient(patientData);

      // Fetch appointments
      const rawAppointments = await apiRequest<any[]>(`/appointments?patientId=${patientData.id}`);
      const appointments: Appointment[] = rawAppointments.map(a => ({
        id: a.id,
        patientId: a.patient?.id || userId,
        patientName: a.patient?.name,
        department: a.departmentName || a.department?.name || '',
        departmentId: a.department?.id,
        doctor: a.doctor?.name || '',
        doctorId: a.doctor?.id,
        date: a.appointmentDate || a.date,
        time: a.timeSlot || a.time,
        status: a.status?.toLowerCase() || 'confirmed',
        queueNumber: a.queueNumber || a.patient?.patientCode || '—',
      }));

      const now = new Date();
      now.setHours(0, 0, 0, 0); // Date comparison only
      
      const upcoming = appointments.find(a => a.date && new Date(a.date) >= now && a.status !== 'cancelled') || null;
      const history = appointments.filter(a => a.date && (new Date(a.date) < now || a.status === 'cancelled'));

      setUpcomingAppointment(upcoming);
      setAppointmentHistory(history);
    } catch (err) {
      console.error('Error fetching patient dashboard:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    const role = getCurrentRole();
    if (role !== 'PATIENT' && role !== 'USER') {
      navigate('/login');
      return;
    }

    fetchData();
    const interval = setInterval(fetchData, 20000); // Polling every 20 seconds
    return () => clearInterval(interval);
  }, [fetchData, navigate]);


  /**
   * EFFECT: Real-time Queue Polling
   * 
   * If the patient has an upcoming appointment, this effect polls
   * the backend every 10 seconds to get the latest position in line
   * and estimated wait time.
   */
  useEffect(() => {
    if (!upcomingAppointment || !upcomingAppointment.id) return;

    const fetchQueueStatus = async () => {
      try {
        if (!upcomingAppointment.doctorId) return;
        const stats = await getQueueStatusApi(upcomingAppointment.id, upcomingAppointment.doctorId);
        setQueueStats(stats);
      } catch (err) {
        console.error('Failed to poll queue status:', err);
      }
    };

    // Initial fetch
    fetchQueueStatus();

    // Set up interval for continuous updates (10 seconds)
    const interval = setInterval(fetchQueueStatus, 10000);

    return () => clearInterval(interval);
  }, [upcomingAppointment]);

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
          phone: editData.phone,
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
      // Call formal API to cancel appointment
      await cancelAppointmentApi(selectedAppointmentForAction.id);

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
      // Use the real patient token ID from the backend
      const ticketNumber = patient?.tokenId || `AFYA-${Math.floor(1000 + Math.random() * 9000)}`;
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
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={`relative p-2 rounded-lg transition-colors ${showNotifications ? 'bg-primary/10' : 'hover:bg-muted'}`}
              >
                <Bell className={`w-6 h-6 ${unreadCount > 0 ? 'text-primary animate-pulse' : 'text-foreground'}`} />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-destructive text-white text-[8px] font-black rounded-full flex items-center justify-center border-2 border-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-border rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => !n.isRead && handleMarkAsRead(n.id)}
                          className={`p-4 border-b border-border last:border-0 cursor-pointer transition-colors ${n.isRead ? 'opacity-60' : 'bg-primary/5 hover:bg-primary/10'}`}
                        >
                          <div className="flex items-start gap-3">
                            <div className={`w-2 h-2 mt-1.5 rounded-full shrink-0 ${n.isRead ? 'bg-muted' : 'bg-primary'}`} />
                            <div className="flex-1">
                              <p className="text-sm font-bold text-foreground leading-tight mb-1">{n.title}</p>
                              <p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p>
                              <p className="text-[9px] text-muted-foreground mt-2 font-medium">
                                {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-8 text-center">
                        <Bell className="w-8 h-8 text-muted-foreground/20 mx-auto mb-2" />
                        <p className="text-xs text-muted-foreground font-medium">No notifications yet</p>
                      </div>
                    )}
                  </div>
                  {notifications.length > 0 && (
                    <div className="p-3 bg-muted/10 border-t border-border text-center">
                      <p className="text-[10px] text-muted-foreground font-medium">Stay updated with AfyaFlow</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                {patientInitials}
              </div>
              <div>
                <p className="font-medium text-foreground">
                  {patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
                </p>
                <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowLogoutModal(true)}
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
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Your Token ID</p>
                <p className="text-3xl font-black text-foreground">{upcomingAppointment.queueNumber || '—'}</p>
                <p className="text-xs text-muted-foreground font-medium">Use this at the desk</p>
              </div>
              
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary">Est. Wait Time</p>
                <p className="text-3xl font-black text-foreground">
                  {queueStats ? `${queueStats.estimatedWaitTime} mins` : 'Syncing...'}
                </p>
                <p className="text-xs text-muted-foreground font-medium">
                  {queueStats ? `Clinic Status: ${queueStats.doctorStatus}` : 'Connecting to clinic...'}
                </p>
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
            
              <p className="text-muted-foreground font-medium">
                {queueStats ? (
                  <>
                    There are <span className="text-foreground font-bold">{queueStats.patientsAhead} patients</span> ahead of you.
                  </>
                ) : (
                  <>Connecting to live queue tracking...</>
                )}
              </p>
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
                      value={editData.phone || ''}
                      onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
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
                    <p className="font-bold">{patient?.phone || 'Not provided'}</p>
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

            {/* HEALTH METRICS SECTION [NEW] */}
            {patient?.vitalsJson && JSON.parse(patient.vitalsJson).length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Health Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const vitals = JSON.parse(patient.vitalsJson);
                    const latest = vitals[vitals.length - 1];
                    return (
                      <>
                        <div className="bg-muted/30 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">BP</p>
                          <p className="text-sm font-black text-foreground">{latest.bloodPressure}</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Temp</p>
                          <p className="text-sm font-black text-foreground">{latest.temperature}°C</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Heart Rate</p>
                          <p className="text-sm font-black text-foreground">{latest.heartRate} bpm</p>
                        </div>
                        <div className="bg-muted/30 p-3 rounded-xl">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">SpO2</p>
                          <p className="text-sm font-black text-foreground">{latest.oxygenSaturation}%</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ACTIVE PRESCRIPTIONS SECTION [NEW] */}
            {patient?.prescriptionsJson && JSON.parse(patient.prescriptionsJson).length > 0 && (
              <div className="bg-primary/5 rounded-3xl p-8 border border-primary/10">
                <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                  <Check className="w-5 h-5" /> Prescriptions
                </h4>
                <div className="space-y-3">
                  {JSON.parse(patient.prescriptionsJson).map((rx: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl p-4 border border-primary/10 shadow-sm">
                      <p className="font-bold text-sm text-foreground">{rx.medicineName}</p>
                      <p className="text-[10px] text-muted-foreground">{rx.dosage} • {rx.frequency}</p>
                      <p className="text-[9px] text-primary mt-1 font-medium">{rx.instructions}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
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
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Cancel Appointment?</h3>
              <p className="text-muted-foreground text-center mb-8">
                Are you sure you want to cancel your appointment with {selectedAppointmentForAction.department}? This action cannot be undone.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setActionType(null);
                    setSelectedAppointmentForAction(null);
                  }}
                  className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors"
                >
                  Keep It
                </button>
                <button
                  onClick={handleCancelAppointment}
                  disabled={isRescheduling}
                  className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" />
                  {isRescheduling ? 'Cancelling...' : 'Cancel It'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* LOGOUT CONFIRMATION MODAL */}
        {showLogoutModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl animate-in zoom-in-95 duration-200 border border-slate-200">
              <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <LogOut className="w-8 h-8 text-red-500 translate-x-0.5" />
              </div>
              <h3 className="text-xl font-bold text-center text-slate-900 mb-2">Ready to Leave?</h3>
              <p className="text-slate-500 text-center text-sm mb-8">
                Are you sure you want to log out? You will need to sign in again to access your dashboard.
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    clearAccessToken();
                    navigate('/');
                  }}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors"
                >
                  Sign Out
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
                <p className="text-4xl font-black mb-2">{generatedTicket.number}</p>
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