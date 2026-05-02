import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, Bell, LogOut, UserPlus, Clock, Calendar, Users, Search } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { AppointmentCard } from '../components/AppointmentCard';
import { PatientCard } from '../components/PatientCard';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@radix-ui/react-dialog';
import { clearAccessToken, getCurrentRole } from '../../lib/authStorage';

export function ReceptionistDashboard() {
  const navigate = useNavigate();
  // useEffect(() => {
  //   if (getCurrentRole() !== 'RECEPTIONIST') {
  //     navigate('/login');
  //   }
  // }, [navigate]);
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [patientForm, setPatientForm] = useState({
    fullName: '',
    phone: '',
    age: '',
    gender: 'male',
    address: '',
  });

  const todaysAppointments = [
    {
      patientName: 'Alice Johnson',
      department: 'Cardiology',
      doctor: 'Dr. Sarah Williams',
      date: 'March 7, 2026',
      time: '10:00 AM',
      status: 'waiting' as const,
      queueNumber: '8',
    },
    {
      patientName: 'Bob Martinez',
      department: 'General Medicine',
      doctor: 'Dr. James Smith',
      date: 'March 7, 2026',
      time: '10:30 AM',
      status: 'confirmed' as const,
      queueNumber: '9',
    },
    {
      patientName: 'Carol White',
      department: 'Pediatrics',
      doctor: 'Dr. Emily Chen',
      date: 'March 7, 2026',
      time: '11:00 AM',
      status: 'confirmed' as const,
      queueNumber: '10',
    },
  ];

  const recentPatients = [
    { name: 'Alice Johnson', phone: '+254 712 345 678', age: 45, gender: 'Female' },
    { name: 'Bob Martinez', phone: '+254 723 456 789', age: 32, gender: 'Male' },
    { name: 'Carol White', phone: '+254 734 567 890', age: 28, gender: 'Female' },
  ];

  const handleRegisterPatient = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Registering patient:', patientForm);
    setShowRegistrationForm(false);
    setPatientForm({ fullName: '', phone: '', age: '', gender: 'male', address: '' });
  };

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AfyaFlow</h1>
            <span className="ml-4 px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm font-medium">
              Receptionist
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-secondary text-white flex items-center justify-center">
                MW
              </div>
              <div>
                <p className="font-medium text-foreground">Mary Wilson</p>
                <p className="text-sm text-muted-foreground">Receptionist</p>
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
        <div className="max-w-7xl mx-auto">
          {/* Welcome Section */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">Welcome, Mary!</h2>
              <p className="text-muted-foreground">Today is Saturday, March 7, 2026</p>
            </div>
            <button 
              onClick={() => setShowRegistrationForm(true)}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <UserPlus className="w-5 h-5" />
              Register New Patient
            </button>
          </div>

          {/* Stats */}
          <div className="grid md:grid-cols-4 gap-6 mb-8">
            <StatCard 
              title="Today's Appointments"
              value="24"
              icon={Calendar}
              trend="+3 from yesterday"
              iconColor="text-primary"
            />
            <StatCard 
              title="Waiting Patients"
              value="8"
              icon={Clock}
              trend="Average wait: 15 min"
              iconColor="text-yellow-600"
            />
            <StatCard 
              title="Checked In"
              value="16"
              icon={Users}
              trend="67% of total"
              iconColor="text-secondary"
            />
            <StatCard 
              title="Total Patients"
              value="156"
              icon={Users}
              trend="This week"
              iconColor="text-accent"
            />
          </div>

          {/* Search Bar */}
          <div className="mb-8">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search patients by name, phone, or ID..."
                className="w-full pl-12 pr-4 py-4 bg-white border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Today's Appointments */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold">Today's Appointments</h3>
                <button 
                  onClick={() => navigate('/queue')}
                  className="text-primary hover:underline text-sm"
                >
                  View Queue →
                </button>
              </div>
              <div className="space-y-4">
                {todaysAppointments.map((appointment, index) => (
                  <AppointmentCard key={index} {...appointment} />
                ))}
              </div>
            </div>

            {/* Recent Patients */}
            <div>
              <h3 className="text-xl font-semibold mb-4">Recent Patients</h3>
              <div className="space-y-4">
                {recentPatients.map((patient, index) => (
                  <PatientCard key={index} {...patient} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Patient Registration Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-border p-6">
              <h2 className="text-2xl font-bold">Register New Patient</h2>
            </div>
            
            <form onSubmit={handleRegisterPatient} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name *</label>
                <input
                  type="text"
                  value={patientForm.fullName}
                  onChange={(e) => setPatientForm({ ...patientForm, fullName: e.target.value })}
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={patientForm.phone}
                    onChange={(e) => setPatientForm({ ...patientForm, phone: e.target.value })}
                    placeholder="+254 700 000 000"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Age *</label>
                  <input
                    type="number"
                    value={patientForm.age}
                    onChange={(e) => setPatientForm({ ...patientForm, age: e.target.value })}
                    placeholder="25"
                    className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Gender *</label>
                <div className="grid grid-cols-3 gap-3">
                  {['male', 'female', 'other'].map((gender) => (
                    <button
                      key={gender}
                      type="button"
                      onClick={() => setPatientForm({ ...patientForm, gender })}
                      className={`px-4 py-3 rounded-lg border transition-colors ${
                        patientForm.gender === gender
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-white border-border hover:bg-muted'
                      }`}
                    >
                      {gender.charAt(0).toUpperCase() + gender.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Address</label>
                <textarea
                  value={patientForm.address}
                  onChange={(e) => setPatientForm({ ...patientForm, address: e.target.value })}
                  placeholder="123 Main Street, City"
                  rows={3}
                  className="w-full px-4 py-3 bg-muted border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRegistrationForm(false)}
                  className="flex-1 px-6 py-3 border-2 border-border rounded-lg hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
