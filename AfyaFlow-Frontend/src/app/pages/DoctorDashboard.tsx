import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, Bell, LogOut, PhoneCall, CheckCircle, XCircle, User } from 'lucide-react';
import { QueueCard } from '../components/QueueCard';
import { toast } from 'sonner';
import { clearAccessToken, getCurrentRole } from '../../lib/authStorage';

export function DoctorDashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    if (getCurrentRole() !== 'DOCTOR') {
      navigate('/login');
    }
  }, [navigate]);
  const [currentPatient, setCurrentPatient] = useState({
    queueNumber: '8',
    patientName: 'Alice Johnson',
    department: 'Cardiology',
    status: 'called' as const,
    waitingTime: '5 min',
  });

  const [queue, setQueue] = useState([
    {
      queueNumber: '9',
      patientName: 'Bob Martinez',
      department: 'Cardiology',
      status: 'waiting' as const,
      waitingTime: '10 min',
    },
    {
      queueNumber: '10',
      patientName: 'Carol White',
      department: 'Cardiology',
      status: 'waiting' as const,
      waitingTime: '15 min',
    },
    {
      queueNumber: '11',
      patientName: 'David Lee',
      department: 'Cardiology',
      status: 'waiting' as const,
      waitingTime: '20 min',
    },
  ]);

  const handleCallNext = () => {
    if (queue.length > 0) {
      const nextPatient = queue[0];
      setCurrentPatient({
        ...nextPatient,
        status: 'called',
      });
      setQueue(queue.slice(1));
      toast.success(`Called patient #${nextPatient.queueNumber}`);
    }
  };

  const handleComplete = () => {
    toast.success(`Consultation completed for ${currentPatient.patientName}`);
    if (queue.length > 0) {
      handleCallNext();
    } else {
      setCurrentPatient({
        queueNumber: '-',
        patientName: 'No patients',
        department: 'Cardiology',
        status: 'waiting',
        waitingTime: '-',
      });
    }
  };

  const handleMissed = () => {
    toast.error(`Patient ${currentPatient.patientName} marked as missed`);
    handleCallNext();
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AfyaFlow</h1>
            <span className="ml-4 px-3 py-1 bg-accent/20 text-accent rounded-full text-sm font-medium">
              Doctor
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-foreground" />
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-accent text-white flex items-center justify-center">
                SW
              </div>
              <div>
                <p className="font-medium text-foreground">Dr. Sarah Williams</p>
                <p className="text-sm text-muted-foreground">Cardiologist</p>
              </div>
            </div>
            <button 
              onClick={() => {
                clearAccessToken();
                navigate('/');
              }}
              className="p-2 hover:bg-muted rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-2">Good morning, Dr. Williams!</h2>
            <p className="text-muted-foreground">You have {queue.length + 1} patients waiting today</p>
          </div>

          {/* Current Patient Section */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold mb-4">Current Patient</h3>
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-2xl p-8">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <p className="text-sm opacity-90 mb-2">Queue Number</p>
                  <h2 className="text-7xl font-bold mb-4">#{currentPatient.queueNumber}</h2>
                  <h3 className="text-2xl font-semibold mb-2">{currentPatient.patientName}</h3>
                  <p className="opacity-90">{currentPatient.department}</p>
                </div>
                <div className="w-24 h-24 rounded-full bg-white/20 flex items-center justify-center">
                  <User className="w-12 h-12" />
                </div>
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={handleComplete}
                  className="flex-1 px-6 py-4 bg-secondary text-white rounded-xl hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  <CheckCircle className="w-6 h-6" />
                  Complete Consultation
                </button>
                <button 
                  onClick={handleMissed}
                  className="px-6 py-4 bg-destructive text-white rounded-xl hover:bg-destructive/90 transition-colors flex items-center justify-center gap-2 text-lg"
                >
                  <XCircle className="w-6 h-6" />
                  Mark as Absent
                </button>
              </div>
            </div>
          </div>

          {/* Next Patient Preview */}
          {queue.length > 0 && (
            <div className="bg-white rounded-xl border border-border p-6 mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Next Patient</p>
                  <h3 className="text-2xl font-bold text-foreground">#{queue[0].queueNumber} - {queue[0].patientName}</h3>
                </div>
                <button 
                  onClick={handleCallNext}
                  className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 text-lg"
                >
                  <PhoneCall className="w-5 h-5" />
                  Call Next Patient
                </button>
              </div>
            </div>
          )}

          {/* Today's Queue */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Today's Queue ({queue.length} waiting)</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {queue.map((patient) => (
                <QueueCard 
                  key={patient.queueNumber}
                  {...patient}
                />
              ))}
            </div>
            {queue.length === 0 && (
              <div className="bg-white rounded-xl border border-border p-12 text-center">
                <CheckCircle className="w-16 h-16 text-secondary mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">All Done!</h3>
                <p className="text-muted-foreground">You have no more patients in the queue today.</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
