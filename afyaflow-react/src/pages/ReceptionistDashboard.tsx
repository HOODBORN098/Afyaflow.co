import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import DashboardCard from '../components/ui/DashboardCard';
import StatusChip from '../components/ui/StatusChip';
import PatientListModal from '../components/modals/PatientListModal';
import NewAdmissionModal from '../components/modals/NewAdmissionModal';
import { useData } from '../context/DataContext';
import type { Patient } from '../context/DataContext';

const PRIORITY_VARIANT: Record<string, 'success' | 'error' | 'neutral' | 'info'> = {
  standard: 'success',
  urgent: 'info',
  emergency: 'error',
};

/**
 * RECEPTIONIST DASHBOARD
 * Front-desk management system for walk-ins and patient routing.
 * 
 * MAIN WORKFLOWS:
 *   1. New Admission: Registering patients and assigning departments.
 *   2. Token Generation: Unique AFY-XXXX codes for queue tracking.
 *   3. Live Queue Monitoring: Visualizing waiting times and urgency.
 *   4. Ticket Printing: Physical/PDF handovers for patients.
 */
const ReceptionistDashboard: React.FC = () => {
  const { patients, departments } = useData();
  const { searchQuery } = useSearch();
  const [selectedDepartment, setSelectedDepartment] = useState('All');
  const [search, setSearch] = useState(searchQuery);
  const [lastToken, setLastToken] = useState<Patient | null>(null);
  const [isPatientListOpen, setIsPatientListOpen] = useState(false);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  // Sync local search with global search
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const filteredPatients = (selectedDepartment === 'All'
    ? patients
    : patients.filter(p => p.department === selectedDepartment))
    .filter(p => !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.tokenId.toLowerCase().includes(search.toLowerCase()));

  const queuePatients = filteredPatients
    .filter(p => p.status === 'queued' || p.status === 'in-progress')
    .sort((a, b) => {
      if (a.status === 'in-progress') return -1;
      const priorityOrder = { emergency: 0, urgent: 1, standard: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

  const activeToken = filteredPatients.find(p => p.status === 'in-progress') || queuePatients[0];
  const queueWaiting = filteredPatients.filter(p => p.status === 'queued');

  const avgWait = queueWaiting.length > 0 ? Math.round(queueWaiting.length * 3.5) : 0;
  const dailyTokens = filteredPatients.length;

  const handleAdmissionSuccess = (patient: Patient) => {
    setLastToken(patient);
    setShowAdmissionModal(false);
  };

  /**
   * HANDLE TOKEN PRINTING
   * Generates a physical-style layout for the queue ticket.
   * Opens a new window for the browser's native print dialog.
   * @param tokenId The token ID to print (defaults to active token)
   */
  const handlePrint = (tokenId?: string) => {
    const token = tokenId || lastToken?.tokenId || activeToken?.tokenId;
    if (!token) return;
    const patient = patients.find(p => p.tokenId === token) || activeToken;
    const w = window.open('', '_blank', 'width=400,height=300');
    if (!w || !patient) return;
    w.document.write(`
      <html>
        <head>
          <title>Queue Token — ${token}</title>
          <style>
            body { font-family: 'Segoe UI', sans-serif; text-align: center; padding: 30px; background: #fff; }
            .token { font-size: 72px; font-weight: 900; color: #005050; letter-spacing: -3px; }
            .name { font-size: 20px; font-weight: 700; color: #181c1c; margin: 8px 0; }
            .meta { font-size: 13px; color: #6e7979; }
            .divider { border: none; border-top: 1px dashed #bec9c8; margin: 16px 0; }
            .logo { font-size: 14px; font-weight: 800; color: #005050; letter-spacing: 2px; }
          </style>
        </head>
        <body>
          <div class="logo">AFYAFLOW</div>
          <hr class="divider" />
          <div class="token">${token}</div>
          <div class="name">${patient.name || 'Patient'}</div>
          <div class="meta">${patient.department} · ${patient.priority.toUpperCase()}</div>
          <hr class="divider" />
          <div class="meta">Nairobi West Medical Hub</div>
          <div class="meta">${new Date().toLocaleString('en-KE', { dateStyle: 'medium', timeStyle: 'short' })}</div>
      <script>window.onload = () => { window.print(); window.close(); }</script>
    </body>
  </html>
`);
    w.document.close();
  };

  const handleExportQueueCSV = () => {
    if (queuePatients.length === 0) return;
    const headers = ['Token ID', 'Patient Name', 'Department', 'Priority', 'Status', 'Registered At'].join(',');
    const rows = queuePatients.map(p => {
      const ts = new Date(p.registeredAt).toISOString();
      return [p.tokenId, `"${p.name}"`, p.department, p.priority, p.status, ts].join(',');
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afyaflow_queue_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="grid grid-cols-12 gap-8">
      {/* Welcome Header */}
      <div className="col-span-12 flex flex-col md:flex-row md:items-end justify-between gap-6 mb-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-primary">Reception Dashboard</h1>
        </div>

        {/* Department Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar max-w-full md:max-w-md lg:max-w-xl">
          <button
            onClick={() => setSelectedDepartment('All')}
            className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
              ${selectedDepartment === 'All'
                ? 'bg-primary text-on-primary border-primary shadow-md shadow-primary/20 scale-105'
                : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50'}`}
          >
            All Departments
          </button>
          {departments.map((dept) => (
            <button
              key={dept.id}
              onClick={() => setSelectedDepartment(dept.name)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all border
                ${selectedDepartment === dept.name
                  ? 'bg-secondary text-white border-secondary shadow-md shadow-secondary/20 scale-105'
                  : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-primary/50'}`}
            >
              {dept.name}
            </button>
          ))}
        </div>
      </div>

      {/* Left Column: Registration Form */}
      <div className="col-span-12 lg:col-span-5 space-y-8">
        <DashboardCard className="signature-gradient text-white flex flex-col items-center justify-center p-12 text-center rounded-3xl shadow-xl shadow-primary/20">
          <div className="h-20 w-20 rounded-full bg-white/20 flex items-center justify-center mb-6">
            <span className="material-symbols-outlined text-4xl">post_add</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight mb-2">New Admission</h2>
          <p className="text-sm opacity-90 mb-8 max-w-[250px]">
            Register walk-ins, process emergency admissions, and route patients to departments.
          </p>
          <button
            onClick={() => setShowAdmissionModal(true)}
            className="w-full bg-white text-primary font-bold uppercase tracking-widest py-4 rounded-xl hover:bg-opacity-90 transition-all shadow-lg text-[11px]"
          >
            Start Admission
          </button>

          {/* Success: newly generated token */}
          {lastToken && (
            <div className="mt-6 p-6 bg-secondary/10 border-2 border-secondary/20 rounded-3xl flex items-center justify-between relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
              <div className="absolute top-0 right-0 p-2">
                <button onClick={() => setLastToken(null)} className="text-secondary/60 hover:text-secondary">
                  <span className="material-symbols-outlined text-sm">close</span>
                </button>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black uppercase tracking-widest text-secondary mb-1">Last Token Generated</p>
                <p className="text-4xl font-black text-primary tracking-tighter">{lastToken.tokenId}</p>
                <p className="text-xs text-on-surface-variant font-bold mt-1 uppercase opacity-60">{lastToken.name}</p>
              </div>
              <button
                onClick={() => handlePrint(lastToken.tokenId)}
                className="h-16 w-16 rounded-2xl bg-secondary text-white flex flex-col items-center justify-center gap-1 shadow-lg shadow-secondary/20 hover:scale-105 transition-all relative z-10"
              >
                <span className="material-symbols-outlined">print</span>
                <span className="text-[10px] font-bold">Print</span>
              </button>
              <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-secondary/5 rounded-full blur-2xl" />
            </div>
          )}
        </DashboardCard>

        {/* Status Cards */}
        <div className="grid grid-cols-2 gap-4">
          <DashboardCard variant="low" className="p-6">
            <p className="text-xs text-on-surface-variant font-medium">Avg. Wait Time</p>
            <p className="text-2xl font-black text-primary mt-1">
              {avgWait} <span className="text-sm font-normal text-on-surface-variant">mins</span>
            </p>
          </DashboardCard>
          <DashboardCard variant="low" className="p-6">
            <p className="text-xs text-on-surface-variant font-medium">Daily Tokens</p>
            <p className="text-2xl font-black text-primary mt-1">{dailyTokens}</p>
          </DashboardCard>
        </div>
      </div>

      {/* Right Column: Queue Management */}
      <div className="col-span-12 lg:col-span-7 space-y-6">
        {/* Active Token Card */}
        {activeToken ? (
          <div className="signature-gradient rounded-3xl p-8 text-white flex justify-between items-center shadow-2xl shadow-primary-container/30 overflow-hidden relative">
            <div className="relative z-10">
              <span className="text-[10px] uppercase tracking-[0.2em] font-bold opacity-80">Now Calling</span>
              <h3 className="text-7xl font-black tracking-tighter mt-2">{activeToken.tokenId}</h3>
              <div className="flex gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <span className="text-xs font-bold">{activeToken.department}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
                  <span className="text-xs font-bold">{activeToken.name}</span>
                </div>
              </div>
            </div>
            <div className="text-right relative z-10">
              <button
                onClick={() => handlePrint()}
                className="h-24 w-24 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mb-4 hover:bg-white/20 transition-colors"
              >
                <span className="material-symbols-outlined text-5xl fill-1">volume_up</span>
              </button>
              <p className="text-xs font-bold opacity-80">
                {new Date(activeToken.registeredAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="absolute -right-12 -top-12 h-64 w-64 bg-white/5 rounded-full blur-3xl" />
          </div>
        ) : (
          <div className="bg-surface-container-lowest rounded-3xl p-8 text-center border border-outline-variant/10">
            <span className="material-symbols-outlined text-4xl text-on-surface-variant block mb-2">queue</span>
            <p className="font-bold text-on-surface-variant">No active queue</p>
            <p className="text-sm text-on-surface-variant mt-1">Register a walk-in to generate tokens</p>
          </div>
        )}

        {/* Live Queue List */}
        <DashboardCard noPadding className="bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
            <h3 className="font-bold text-on-surface">Live Queue (Waiting)</h3>
            <div className="flex gap-2">
              <button onClick={handleExportQueueCSV} className="bg-surface-container-high hover:bg-surface-container px-3 py-1 rounded-full text-xs font-bold transition-colors flex items-center gap-1 border border-outline-variant/30">
                <span className="material-symbols-outlined text-sm">download</span>
                Export CSV
              </button>
              <StatusChip label={`${queueWaiting.length} Active`} variant="info" className="lowercase" />
              <StatusChip
                label={`${queueWaiting.filter(p => p.priority === 'urgent').length} Urgent`}
                variant="neutral"
                className="lowercase"
              />
            </div>
          </div>

          <div className="divide-y divide-outline-variant/10">
            {queueWaiting.length === 0 ? (
              <div className="px-6 py-10 text-center text-sm text-on-surface-variant">
                Queue is empty
              </div>
            ) : queueWaiting.slice(0, 6).map((patient) => (
              <div key={patient.id} className="px-6 py-5 flex items-center justify-between hover:bg-surface-container-lowest transition-colors group cursor-pointer">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-surface-container-low flex items-center justify-center font-black text-primary border border-outline-variant/20 text-sm">
                    {patient.tokenId.replace('AFY-', '')}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-on-surface">{patient.name}</p>
                    <p className="text-[11px] text-on-surface-variant font-medium">
                      {patient.department} •{' '}
                      {Math.round((Date.now() - new Date(patient.registeredAt).getTime()) / 60000)} mins ago
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <StatusChip
                    label={patient.priority === 'standard' ? 'Verified' : patient.priority.charAt(0).toUpperCase() + patient.priority.slice(1)}
                    variant={PRIORITY_VARIANT[patient.priority]}
                  />
                  <button
                    onClick={() => handlePrint(patient.tokenId)}
                    className="h-8 w-8 rounded-full flex items-center justify-center text-outline group-hover:bg-primary/10 group-hover:text-primary transition-all"
                    title="Re-print token"
                  >
                    <span className="material-symbols-outlined text-sm">print</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {queueWaiting.length > 6 && (
            <div className="px-6 py-4 bg-surface-container-low text-center">
              <button
                onClick={() => setIsPatientListOpen(true)}
                className="text-xs font-bold text-primary hover:underline"
              >
                View All {queueWaiting.length} Patients in Queue
              </button>
            </div>
          )}
        </DashboardCard>
      </div>

      {/* Floating Print Button */}
      <button
        onClick={() => handlePrint()}
        className="fixed bottom-8 right-8 h-16 w-16 rounded-full signature-gradient text-white flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-105 transition-transform group z-50"
      >
        <span className="material-symbols-outlined text-3xl">print</span>
        <span className="absolute right-20 bg-primary text-white text-[10px] px-3 py-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase tracking-widest pointer-events-none">
          Re-print Token
        </span>
      </button>

      {/* Patient List Modal */}
      {isPatientListOpen && (
        <PatientListModal
          patients={queueWaiting}
          onClose={() => setIsPatientListOpen(false)}
          title="Live Queue (Waiting)"
        />
      )}
      {/* New Admission Modal */}
      {showAdmissionModal && (
        <NewAdmissionModal
          onClose={() => setShowAdmissionModal(false)}
          onSuccess={handleAdmissionSuccess}
        />
      )}
    </div>
  );
};

export default ReceptionistDashboard;