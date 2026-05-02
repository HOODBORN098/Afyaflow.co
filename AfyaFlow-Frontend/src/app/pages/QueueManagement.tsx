import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, ArrowLeft, Filter, Search } from 'lucide-react';
import { QueueCard } from '../components/QueueCard';
import { StatusBadge } from '../components/StatusBadge';
import { toast } from 'sonner';
import {
  callQueueApi,
  completeQueueApi,
  getQueueApi,
  missedQueueApi,
  type QueueApiResponse,
} from '../../lib/api';
import { getCurrentRole } from '../../lib/authStorage';

export function QueueManagement() {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'all' | 'waiting' | 'called' | 'completed' | 'missed'>('all');

  const [queueData, setQueueData] = useState<QueueApiResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [search, setSearch] = useState('');

  const refreshQueue = async () => {
    setIsLoading(true);
    try {
      const data = await getQueueApi();
      setQueueData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load queue';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  // useEffect(() => {
  //   const role = getCurrentRole();
  //   if (!role || !['DOCTOR', 'RECEPTIONIST', 'ADMIN'].includes(role)) {
  //     navigate('/login');
  //     return;
  //   }
  //   void refreshQueue();
  // }, [navigate]);

  const updateLocal = (updated: QueueApiResponse) => {
    setQueueData((prev) => prev.map((q) => (q.id === updated.id ? updated : q)));
  };

  const handleCallPatient = async (queueId: number, queueNumber: number) => {
    try {
      const updated = await callQueueApi(queueId);
      updateLocal(updated);
      toast.success(`Called patient #${queueNumber}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to call patient';
      toast.error(message);
    }
  };

  const handleCompletePatient = async (queueId: number, queueNumber: number) => {
    try {
      const updated = await completeQueueApi(queueId);
      updateLocal(updated);
      toast.success(`Patient #${queueNumber} marked as completed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to complete patient';
      toast.error(message);
    }
  };

  const handleMissedPatient = async (queueId: number, queueNumber: number) => {
    try {
      const updated = await missedQueueApi(queueId);
      updateLocal(updated);
      toast.error(`Patient #${queueNumber} marked as missed`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to mark missed';
      toast.error(message);
    }
  };

  const normalized = useMemo(() => {
    return queueData.map((q) => {
      const patientName = q.patient ? `${q.patient.firstName} ${q.patient.lastName}` : 'Unknown patient';
      const department = q.department?.name || 'Unknown department';
      const status = (q.status || 'waiting') as 'waiting' | 'called' | 'completed' | 'missed';
      // TODO: compute from timestamps once backend stores them
      const waitingTime = '-';
      return { ...q, patientName, department, status, waitingTime };
    });
  }, [queueData]);

  const filteredQueue = normalized
    .filter(q => filterStatus === 'all' || q.status === filterStatus)
    .filter(q => 
      !search || 
      q.patientName.toLowerCase().includes(search.toLowerCase()) ||
      q.queueNumber.toString().includes(search) ||
      q.department.toLowerCase().includes(search.toLowerCase())
    );

  const stats = {
    waiting: normalized.filter(q => q.status === 'waiting').length,
    called: normalized.filter(q => q.status === 'called').length,
    completed: normalized.filter(q => q.status === 'completed').length,
    missed: normalized.filter(q => q.status === 'missed').length,
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Queue Management</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Bar */}
      <div className="bg-white border-b border-border">
        <div className="px-6 py-4">
          <div className="grid grid-cols-4 gap-6">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Waiting</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.waiting}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Called</p>
              <p className="text-3xl font-bold text-primary">{stats.called}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Completed</p>
              <p className="text-3xl font-bold text-secondary">{stats.completed}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Missed</p>
              <p className="text-3xl font-bold text-destructive">{stats.missed}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {isLoading && (
            <div className="mb-4 text-sm text-muted-foreground">Loading queue…</div>
          )}
          {/* Filters */}
          <div className="bg-white rounded-xl border border-border p-6 mb-6">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 flex-1">
                <Filter className="w-5 h-5 text-muted-foreground" />
                <span className="font-medium">Filter:</span>
                <button
                  onClick={() => setFilterStatus('all')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'all' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  All ({queueData.length})
                </button>
                <button
                  onClick={() => setFilterStatus('waiting')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'waiting' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Waiting ({stats.waiting})
                </button>
                <button
                  onClick={() => setFilterStatus('called')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'called' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Called ({stats.called})
                </button>
                <button
                  onClick={() => setFilterStatus('completed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'completed' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Completed ({stats.completed})
                </button>
                <button
                  onClick={() => setFilterStatus('missed')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    filterStatus === 'missed' ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  Missed ({stats.missed})
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search queue..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          {/* Queue Table */}
          <div className="bg-white rounded-xl border border-border overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Queue #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Patient Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Department</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Waiting Time</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Status</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredQueue.map((patient) => (
                  <tr key={patient.id} className="hover:bg-muted/50">
                    <td className="px-6 py-4">
                      <span className="text-2xl font-bold text-primary">#{patient.queueNumber}</span>
                    </td>
                    <td className="px-6 py-4 font-medium">{patient.patientName}</td>
                    <td className="px-6 py-4 text-muted-foreground">{patient.department}</td>
                    <td className="px-6 py-4 text-muted-foreground">{patient.waitingTime}</td>
                    <td className="px-6 py-4">
                      <StatusBadge status={patient.status}>
                        {patient.status.charAt(0).toUpperCase() + patient.status.slice(1)}
                      </StatusBadge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-2">
                        {patient.status === 'waiting' && (
                          <button
                            onClick={() => void handleCallPatient(patient.id, patient.queueNumber)}
                            className="px-3 py-1 bg-primary text-primary-foreground rounded hover:bg-primary/90 transition-colors text-sm"
                          >
                            Call
                          </button>
                        )}
                        {patient.status === 'called' && (
                          <>
                            <button
                              onClick={() => void handleCompletePatient(patient.id, patient.queueNumber)}
                              className="px-3 py-1 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 transition-colors text-sm"
                            >
                              Complete
                            </button>
                            <button
                              onClick={() => void handleMissedPatient(patient.id, patient.queueNumber)}
                              className="px-3 py-1 bg-destructive text-destructive-foreground rounded hover:bg-destructive/90 transition-colors text-sm"
                            >
                              Missed
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
