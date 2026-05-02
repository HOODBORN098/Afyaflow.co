import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, Bell, LogOut, Users, Calendar, Clock, TrendingUp } from 'lucide-react';
import { StatCard } from '../components/StatCard';
import { toast } from 'sonner';
import { createDepartmentApi, createDoctorByAdminApi, createReceptionistByAdminApi, getAdminAnalyticsApi, getDepartmentsApi } from '../../lib/api';
import { clearAccessToken, getCurrentRole } from '../../lib/authStorage';

export function AdminDashboard() {
  const navigate = useNavigate();

  const [analytics, setAnalytics] = useState<any>(null);
  const [departments, setDepartments] = useState<any[]>([]);
  const [newDepartmentName, setNewDepartmentName] = useState('');

  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    password: '',
    departmentId: '',
  });

  const [receptionistForm, setReceptionistForm] = useState({
    name: '',
    email: '',
    password: '',
  });

  const loadAdminData = async () => {
    try {
      const [analyticsData, departmentsData] = await Promise.all([
        getAdminAnalyticsApi(),
        getDepartmentsApi(),
      ]);
      setAnalytics(analyticsData);
      setDepartments(departmentsData);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load admin data';
      toast.error(message);
    }
  };

  useEffect(() => {
    if (getCurrentRole() !== 'ADMIN') {
      navigate('/login');
      return;
    }
    void loadAdminData();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-muted">
      {/* Header */}
      <header className="bg-white border-b border-border">
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-8 h-8 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">AfyaFlow</h1>
            <span className="ml-4 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              Admin
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <Bell className="w-6 h-6 text-foreground" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-destructive rounded-full"></span>
            </button>
            <div className="flex items-center gap-3 pl-4 border-l border-border">
              <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                AD
              </div>
              <div>
                <p className="font-medium text-foreground">Admin User</p>
                <p className="text-sm text-muted-foreground">Administrator</p>
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
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Key Metrics */}
          <div className="grid md:grid-cols-4 gap-6">
            <StatCard title="Total Patients" value={analytics?.totalPatients ?? 0} icon={Users} trend="From database" />
            <StatCard title="Total Appointments" value={analytics?.totalAppointments ?? 0} icon={Calendar} trend="From database" />
            <StatCard title="Queue Items" value={analytics?.totalQueueItems ?? 0} icon={Clock} trend="From database" />
            <StatCard title="System Users" value={analytics?.totalUsers ?? 0} icon={TrendingUp} trend="All roles" />
          </div>

          {/* Forms */}
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Add Department */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm">
              <h3 className="text-lg font-semibold mb-4">Create Department</h3>
              <input
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                placeholder="Department name"
                className="w-full px-4 py-2 border border-border rounded-lg mb-3"
              />
              <button
                onClick={async () => {
                  if (!newDepartmentName.trim()) return;
                  try {
                    await createDepartmentApi(newDepartmentName.trim());
                    toast.success('Department created');
                    setNewDepartmentName('');
                    await loadAdminData();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to create department';
                    toast.error(message);
                  }
                }}
                className="w-full bg-primary text-white py-2 rounded-lg hover:bg-primary/90"
              >
                Add Department
              </button>
            </div>

            {/* Register Doctor */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-3">
              <h3 className="text-lg font-semibold mb-2">Register Doctor</h3>
              <input placeholder="Name" className="w-full px-4 py-2 border border-border rounded-lg"
                value={doctorForm.name} onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })} />
              <input placeholder="Email" className="w-full px-4 py-2 border border-border rounded-lg"
                value={doctorForm.email} onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })} />
              <input type="password" placeholder="Password" className="w-full px-4 py-2 border border-border rounded-lg"
                value={doctorForm.password} onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })} />
              <select className="w-full px-4 py-2 border border-border rounded-lg"
                value={doctorForm.departmentId}
                onChange={(e) => setDoctorForm({ ...doctorForm, departmentId: e.target.value })}>
                <option value="">Select department</option>
                {departments.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <button
                onClick={async () => {
                  if (!doctorForm.departmentId) return;
                  try {
                    await createDoctorByAdminApi({
                      name: doctorForm.name,
                      email: doctorForm.email,
                      password: doctorForm.password,
                      departmentId: Number(doctorForm.departmentId),
                    });
                    toast.success('Doctor created');
                    setDoctorForm({ name: '', email: '', password: '', departmentId: '' });
                    await loadAdminData();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to create doctor';
                    toast.error(message);
                  }
                }}
                className="w-full bg-secondary text-white py-2 rounded-lg hover:bg-secondary/90"
              >
                Register Doctor
              </button>
            </div>

            {/* Register Receptionist */}
            <div className="bg-white p-6 rounded-xl border border-border shadow-sm space-y-3">
              <h3 className="text-lg font-semibold mb-2">Register Receptionist</h3>
              <input placeholder="Name" className="w-full px-4 py-2 border border-border rounded-lg"
                value={receptionistForm.name} onChange={(e) => setReceptionistForm({ ...receptionistForm, name: e.target.value })} />
              <input placeholder="Email" className="w-full px-4 py-2 border border-border rounded-lg"
                value={receptionistForm.email} onChange={(e) => setReceptionistForm({ ...receptionistForm, email: e.target.value })} />
              <input type="password" placeholder="Password" className="w-full px-4 py-2 border border-border rounded-lg"
                value={receptionistForm.password} onChange={(e) => setReceptionistForm({ ...receptionistForm, password: e.target.value })} />
              <button
                onClick={async () => {
                  try {
                    await createReceptionistByAdminApi(receptionistForm);
                    toast.success('Receptionist created');
                    setReceptionistForm({ name: '', email: '', password: '' });
                    await loadAdminData();
                  } catch (err) {
                    const message = err instanceof Error ? err.message : 'Failed to create receptionist';
                    toast.error(message);
                  }
                }}
                className="w-full bg-accent text-white py-2 rounded-lg hover:bg-accent/90"
              >
                Register Receptionist
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}