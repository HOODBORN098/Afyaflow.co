/**
 * ========================================
 * PATIENT DASHBOARD - Enhanced Version
 * ========================================
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
  Notification,
  Appointment
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

export function PatientDashboard() {
  const navigate = useNavigate();

  // ========== MAIN STATE ==========
  const [patient, setPatient] = useState<Patient | null>(null);
  const [upcomingAppointment, setUpcomingAppointment] = useState<Appointment | null>(null);
  const [appointmentHistory, setAppointmentHistory] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editData, setEditData] = useState<Patient | null>(null);
  const [queueStats, setQueueStats] = useState<QueueStatsType | null>(null);

  // ========== RESCHEDULE / CANCEL ==========
  const [selectedAppointmentForAction, setSelectedAppointmentForAction] = useState<Appointment | null>(null);
  const [actionType, setActionType] = useState<'reschedule' | 'cancel' | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [isRescheduling, setIsRescheduling] = useState(false);

  // ========== TICKET ==========
  const [generatedTicket, setGeneratedTicket] = useState<{ number: string; time: string } | null>(null);
  const [showTicketModal, setShowTicketModal] = useState(false);

  // ========== MODALS ==========
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // ========== LIVE CLOCK ==========
  // FIX 3: Was initialised once and never updated — clock was frozen.
  // Now ticks every second via setInterval.
  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const clockInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // ========== NOTIFICATIONS ==========
  // FIX 2: getNotificationsApi() may return an object, null, or undefined if
  // the backend wraps results (e.g. { content: [...] }) or the call fails.
  // Array.isArray guard + fallback to [] prevents the .map crash at line 557.
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [rawNotifs, count] = await Promise.all([
          getNotificationsApi(),
          getUnreadCountApi()
        ]);

        // FIX 2: Safely extract array regardless of backend response shape
        const notifArray: Notification[] = Array.isArray(rawNotifs)
          ? rawNotifs
          : Array.isArray((rawNotifs as any)?.content)
            ? (rawNotifs as any).content
            : [];

        setNotifications(notifArray);
        setUnreadCount(typeof count === 'number' ? count : 0);
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
        // Don't crash — leave notifications as empty array
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

  // ========== DATA FETCHING ==========
  const fetchData = useCallback(async () => {
    const userId = getCurrentUserId();
    if (!userId) return;

    try {
      const patientData = await apiRequest<Patient>(`/patients/me`);
      setPatient(patientData);

      const rawAppointments = await apiRequest<any[]>(`/appointments?patientId=${patientData.id}`);
      const appointments: Appointment[] = rawAppointments.map(a => {
        let dateStr = '';
        if (Array.isArray(a.appointmentDate)) {
          const [y, m, d] = a.appointmentDate;
          dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        } else {
          dateStr = a.appointmentDate || a.date || '';
        }

        return {
          id: a.id,
          patientId: a.patient?.id || userId,
          patientName: a.patient?.name || `${patientData.firstName} ${patientData.lastName}`,
          department: a.departmentName || a.department?.name || '',
          departmentId: a.department?.id,
          doctor: a.doctor?.name || '',
          doctorId: a.doctor?.id,
          date: dateStr,
          time: a.timeSlot || a.time || '',
          status: a.status?.toLowerCase() || 'confirmed',
          queueNumber: a.queueNumber || a.patient?.patientCode || '—',
        };
      });

      // FIX 1: `now` was used as an undeclared variable (ReferenceError at line 196).
      // Replaced with `new Date()` — the correct way to get the current date.
      const now = new Date();
      const localDateStr = now.toISOString().split('T')[0];

      const sortedAppointments = [...appointments].sort((a, b) => {
        if (a.status === 'in-progress' && b.status !== 'in-progress') return -1;
        if (b.status === 'in-progress' && a.status !== 'in-progress') return 1;
        const dateA = a.date || '9999-12-31';
        const dateB = b.date || '9999-12-31';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return (a.time || '').localeCompare(b.time || '');
      });

      const upcoming = sortedAppointments.find(a => {
        if (!a.date || a.status === 'cancelled' || a.status === 'completed') return false;
        return a.status === 'in-progress' || a.date >= localDateStr;
      }) || null;

      const history = sortedAppointments.filter(a => {
        if (!a.date) return false;
        return (
          (a.date < localDateStr && a.status !== 'in-progress') ||
          a.status === 'cancelled' ||
          a.status === 'completed'
        );
      });

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
    const interval = setInterval(fetchData, 20000);
    return () => clearInterval(interval);
  }, [fetchData, navigate]);

  useEffect(() => {
    if (!upcomingAppointment?.id) return;

    const fetchQueueStatus = async () => {
      try {
        if (!upcomingAppointment.doctorId) return;
        const stats = await getQueueStatusApi(upcomingAppointment.id, upcomingAppointment.doctorId);
        setQueueStats(stats);
      } catch (err) {
        console.error('Failed to poll queue status:', err);
      }
    };

    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 10000);
    return () => clearInterval(interval);
  }, [upcomingAppointment]);

  // ========== PROFILE HANDLERS ==========
  const handleEditClick = () => { setEditData(patient); setIsEditing(true); };
  const handleCancel = () => { setIsEditing(false); setEditData(null); };

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

  // ========== APPOINTMENT HANDLERS ==========
  const handleRescheduleAppointment = async () => {
    if (!selectedAppointmentForAction || !rescheduleDate || !rescheduleTime) {
      toast.error('Please select both date and time');
      return;
    }
    setIsRescheduling(true);
    try {
      await apiRequest(`/appointments/${selectedAppointmentForAction.id}`, {
        method: 'PUT',
        body: JSON.stringify({ date: rescheduleDate, time: rescheduleTime, status: 'confirmed' }),
      });
      if (upcomingAppointment?.id === selectedAppointmentForAction.id) {
        setUpcomingAppointment({ ...upcomingAppointment, date: rescheduleDate, time: rescheduleTime });
      }
      toast.success(`Appointment rescheduled to ${rescheduleDate} at ${rescheduleTime}`);
      setActionType(null);
      setSelectedAppointmentForAction(null);
      setRescheduleDate('');
      setRescheduleTime('');
    } catch (err) {
      toast.error('Failed to reschedule appointment. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };

  const handleCancelAppointment = async () => {
    if (!selectedAppointmentForAction) return;
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    setIsRescheduling(true);
    try {
      await cancelAppointmentApi(selectedAppointmentForAction.id);
      if (upcomingAppointment?.id === selectedAppointmentForAction.id) setUpcomingAppointment(null);
      setAppointmentHistory(prev => prev.filter(a => a.id !== selectedAppointmentForAction.id));
      toast.success('Appointment cancelled successfully');
      setActionType(null);
      setSelectedAppointmentForAction(null);
    } catch (err) {
      toast.error('Failed to cancel appointment. Please try again.');
    } finally {
      setIsRescheduling(false);
    }
  };

  // ========== TICKET HANDLERS ==========
  const handleGenerateTicket = async () => {
    try {
      const ticketNumber = patient?.tokenId || `AFYA-${Math.floor(1000 + Math.random() * 9000)}`;
      setGeneratedTicket({ number: ticketNumber, time: new Date().toLocaleTimeString() });
      setShowTicketModal(true);
      toast.success('Ticket generated successfully! You can download it now.');
    } catch (err) {
      toast.error('Failed to generate ticket. Please try again.');
    }
  };

  const downloadTicket = () => {
    if (!generatedTicket || !upcomingAppointment) return;
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
    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(ticketContent));
    element.setAttribute('download', `AfyaFlow_Ticket_${generatedTicket.number}.txt`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Ticket downloaded successfully!');
  };

  // ========== RENDER ==========
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
    doctorId: upcomingAppointment?.doctorId,
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

              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-white border border-border rounded-2xl shadow-2xl z-[110] overflow-hidden animate-in slide-in-from-top-2 duration-200">
                  <div className="p-4 border-b border-border flex items-center justify-between bg-muted/30">
                    <h3 className="font-bold text-sm">Notifications</h3>
                    {unreadCount > 0 && (
                      <button onClick={handleMarkAllRead} className="text-[10px] font-bold text-primary hover:underline">
                        Mark all as read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {/* FIX 2: notifications is guaranteed to be an array here */}
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
                {/* FIX 3: currentTime now ticks — shows live time */}
                <p className="text-[10px] font-black text-primary uppercase tracking-tighter">
                  {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </p>
              </div>
            </div>
            <button onClick={() => setShowLogoutModal(true)} className="p-2 hover:bg-muted rounded-lg transition-colors">
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

        {/* Live Queue Status Banner */}
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
            <p className="text-muted-foreground font-medium mt-6">
              {queueStats ? (
                <>There are <span className="text-foreground font-bold">{queueStats.patientsAhead} patients</span> ahead of you.</>
              ) : (
                <>Connecting to live queue tracking...</>
              )}
            </p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-10">
          {/* Main Column */}
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
                  <div className="bg-white rounded-2xl border border-border p-5 flex gap-3 flex-wrap">
                    <button
                      onClick={() => { setSelectedAppointmentForAction(upcomingAppointment); setActionType('reschedule'); }}
                      className="flex-1 min-w-[150px] bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Repeat2 className="w-5 h-5" /> Reschedule
                    </button>
                    <button
                      onClick={() => { setSelectedAppointmentForAction(upcomingAppointment); setActionType('cancel'); }}
                      className="flex-1 min-w-[150px] bg-destructive/20 text-destructive py-3 rounded-xl font-bold hover:bg-destructive/30 transition-colors flex items-center justify-center gap-2"
                    >
                      <Trash2 className="w-5 h-5" /> Cancel
                    </button>
                    <button
                      onClick={handleGenerateTicket}
                      className="flex-1 min-w-[150px] bg-secondary text-white py-3 rounded-xl font-bold hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Download className="w-5 h-5" /> Get Ticket
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border border-dashed border-border p-12 text-center">
                  <Calendar className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-muted-foreground font-medium">No active appointments found</p>
                  <button onClick={() => navigate('/book-appointment')} className="mt-4 text-primary font-bold hover:underline">
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

          {/* Sidebar */}
          <div className="space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-xl shadow-slate-900/20">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-black">Profile Info</h4>
                {!isEditing && (
                  <button onClick={handleEditClick} className="text-primary hover:text-primary/80 transition-colors p-1">
                    <Activity className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isEditing && editData ? (
                <div className="space-y-4">
                  {[
                    { label: 'First Name', field: 'firstName' as const, type: 'text' },
                    { label: 'Last Name', field: 'lastName' as const, type: 'text' },
                    { label: 'Phone Number', field: 'phone' as const, type: 'tel' },
                    { label: 'Date of Birth', field: 'dob' as const, type: 'date' },
                  ].map(({ label, field, type }) => (
                    <div key={field}>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">{label}</label>
                      <input
                        type={type}
                        value={(editData[field] as string) || ''}
                        onChange={e => setEditData({ ...editData, [field]: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  ))}
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Address</label>
                    <textarea
                      value={editData.address || ''}
                      onChange={e => setEditData({ ...editData, address: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                      rows={3}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Gender</label>
                    <select
                      value={editData.gender || ''}
                      onChange={e => setEditData({ ...editData, gender: e.target.value as 'MALE' | 'FEMALE' | 'OTHER' })}
                      className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div className="pt-4 border-t border-slate-800 flex gap-2">
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex-1 bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <Check className="w-4 h-4" /> {isSaving ? 'Saving...' : 'Save'}
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={isSaving}
                      className="flex-1 bg-slate-800 text-white py-2 rounded-lg font-bold hover:bg-slate-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2"
                    >
                      <X className="w-4 h-4" /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {[
                    { label: 'Name', value: `${patient?.firstName} ${patient?.lastName}` },
                    { label: 'Phone Number', value: patient?.phone || 'Not provided' },
                    { label: 'Residential Address', value: patient?.address || 'Not provided' },
                    { label: 'Gender', value: patient?.gender || '—' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{label}</p>
                      <p className="font-bold">{value}</p>
                    </div>
                  ))}
                  <div className="pt-4 border-t border-slate-800">
                    <button onClick={handleEditClick} className="text-primary font-bold text-sm hover:underline flex items-center gap-2">
                      Edit Profile Details <Activity className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-gradient-to-br from-secondary/10 to-transparent rounded-3xl p-8 border border-secondary/20">
              <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                <Bell className="w-5 h-5" /> Patient Portal Notice
              </h4>
              <div className="bg-white rounded-xl p-3 shadow-sm border border-border">
                <p className="text-xs font-bold text-foreground mb-1">Welcome to AfyaFlow</p>
                <p className="text-[10px] text-muted-foreground">Manage your health and appointments in real-time.</p>
              </div>
            </div>

            {patient?.vitalsJson && JSON.parse(patient.vitalsJson).length > 0 && (
              <div className="bg-white rounded-3xl p-8 border border-border shadow-sm">
                <h4 className="font-bold text-foreground mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-primary" /> Health Metrics
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const vitals = JSON.parse(patient.vitalsJson!);
                    const latest = vitals[vitals.length - 1];
                    return [
                      { label: 'BP', value: latest.bloodPressure },
                      { label: 'Temp', value: `${latest.temperature}°C` },
                      { label: 'Heart Rate', value: `${latest.heartRate} bpm` },
                      { label: 'SpO2', value: `${latest.oxygenSaturation}%` },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-muted/30 p-3 rounded-xl">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{label}</p>
                        <p className="text-sm font-black text-foreground">{value}</p>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            )}

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

        {/* ── MODALS ── */}

        {actionType === 'reschedule' && selectedAppointmentForAction && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Reschedule Appointment</h2>
                <button onClick={() => { setActionType(null); setSelectedAppointmentForAction(null); }} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4 mb-6">
                <p className="text-sm text-muted-foreground">Current: {selectedAppointmentForAction.date} at {selectedAppointmentForAction.time}</p>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">New Date</label>
                  <input type="date" value={rescheduleDate} onChange={e => setRescheduleDate(e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-foreground mb-2">New Time</label>
                  <input type="time" value={rescheduleTime} onChange={e => setRescheduleTime(e.target.value)} className="w-full px-4 py-3 border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => { setActionType(null); setSelectedAppointmentForAction(null); }} className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors">
                  Cancel
                </button>
                <button onClick={handleRescheduleAppointment} disabled={isRescheduling} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  <Check className="w-5 h-5" /> {isRescheduling ? 'Rescheduling...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                <button onClick={() => { setActionType(null); setSelectedAppointmentForAction(null); }} className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors">
                  Keep It
                </button>
                <button onClick={handleCancelAppointment} disabled={isRescheduling} className="flex-1 bg-red-600 text-white py-3 rounded-xl font-bold hover:bg-red-700 transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                  <Trash2 className="w-5 h-5" /> {isRescheduling ? 'Cancelling...' : 'Cancel It'}
                </button>
              </div>
            </div>
          </div>
        )}

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
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 px-4 py-3 bg-slate-100 text-slate-700 rounded-xl font-semibold hover:bg-slate-200 transition-colors">
                  Cancel
                </button>
                <button onClick={() => { clearAccessToken(); navigate('/'); }} className="flex-1 px-4 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 shadow-lg shadow-red-600/20 transition-colors">
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}

        {showTicketModal && generatedTicket && upcomingAppointment && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-foreground">Your Queue Ticket</h2>
                <button onClick={() => setShowTicketModal(false)} className="p-1 hover:bg-muted rounded-lg">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="bg-gradient-to-br from-primary to-primary/80 text-white rounded-2xl p-8 mb-6 text-center">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-90 mb-3">Your Ticket Number</p>
                <p className="text-4xl font-black mb-2">{generatedTicket.number}</p>
                <p className="text-[10px] opacity-75">Generated at {generatedTicket.time}</p>
              </div>
              <div className="bg-muted/50 rounded-xl p-4 mb-6 space-y-2">
                <div className="text-xs text-muted-foreground uppercase font-bold mb-2">Appointment Details</div>
                {[
                  { label: 'Doctor', value: upcomingAppointment.doctor || 'Auto-assign' },
                  { label: 'Department', value: upcomingAppointment.department },
                  { label: 'Date & Time', value: `${upcomingAppointment.date} ${upcomingAppointment.time}` },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-muted-foreground">{label}:</span>
                    <span className="font-bold text-foreground">{value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowTicketModal(false)} className="flex-1 bg-muted text-foreground py-3 rounded-xl font-bold hover:bg-muted/80 transition-colors">
                  Close
                </button>
                <button onClick={downloadTicket} className="flex-1 bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2">
                  <Download className="w-5 h-5" /> Download
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}