import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router';
import { Activity, ArrowLeft, Search, Filter, Mail, Phone, MapPin } from 'lucide-react';
import { getDoctorsApi, getDepartmentsApi, type Doctor, type Department } from '../../lib/api';

export function DoctorsView() {
  const navigate = useNavigate();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [search, setSearch] = useState('');
  const [selectedDept, setSelectedDept] = useState<string>('All');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [doctorsData, deptsData] = await Promise.all([
          getDoctorsApi(),
          getDepartmentsApi()
        ]);
        setDoctors(doctorsData);
        setDepartments(deptsData);
      } catch (err) {
        console.error('Failed to fetch doctors info:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredDoctors = doctors.filter(dr => {
    const matchesSearch = dr.name.toLowerCase().includes(search.toLowerCase()) || 
                         (dr.specialization || '').toLowerCase().includes(search.toLowerCase());
    const matchesDept = selectedDept === 'All' || dr.department?.name === selectedDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/')} 
              className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            >
              <ArrowLeft className="w-6 h-6 text-slate-600" />
            </button>
            <div className="flex items-center gap-2">
              <Activity className="w-8 h-8 text-blue-600" />
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">AfyaFlow Specialists</h1>
            </div>
          </div>
          <button 
            onClick={() => navigate('/book-appointment')}
            className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-600/20"
          >
            Book Appointment
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row gap-8 mb-12">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by name or specialty..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm"
            />
          </div>

          {/* Department Filter */}
          <div className="w-full md:w-64 relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <select 
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 transition-all shadow-sm appearance-none"
            >
              <option value="All">All Departments</option>
              {departments.map(d => (
                <option key={d.id} value={d.name}>{d.name}</option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <Activity className="w-12 h-12 text-blue-600 animate-spin" />
            <p className="font-bold text-slate-500">Loading our medical team...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredDoctors.map((dr) => (
              <div key={dr.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 group overflow-hidden">
                <div className="p-8">
                  <div className="flex items-center gap-6 mb-8">
                    <div className="w-24 h-24 rounded-2xl bg-blue-50 overflow-hidden shrink-0">
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(dr.name)}&background=random&size=200`} 
                        alt={dr.name} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 mb-1">{dr.name}</h3>
                      <p className="text-blue-600 font-bold text-sm">{dr.specialization || 'Medical Specialist'}</p>
                      <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                        {dr.department?.name || 'General Medicine'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <Mail className="w-4 h-4" />
                      <span>{dr.email || 'info@afyaflow.co'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-sm font-medium">
                      <Phone className="w-4 h-4" />
                      <span>{dr.phone || 'N/A'}</span>
                    </div>
                  </div>

                  <button 
                    onClick={() => navigate(`/book-appointment?doctorId=${dr.id}`)}
                    className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold hover:bg-blue-600 transition-all flex items-center justify-center gap-2"
                  >
                    Schedule Consultation
                  </button>
                </div>
                <div className="px-8 py-3 bg-slate-50 border-t border-slate-100 text-center">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Next Available: Today</p>
                </div>
              </div>
            ))}

            {filteredDoctors.length === 0 && (
              <div className="col-span-full py-24 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                <p className="text-xl font-bold text-slate-400">No specialists found matching your criteria.</p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="bg-slate-900 text-slate-400 py-12 mt-24">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <Activity className="w-8 h-8 text-blue-400 mx-auto mb-4" />
          <p className="font-bold text-white mb-2">AfyaFlow Healthcare System</p>
          <p className="text-sm">Connecting you with the best medical care in Kenya.</p>
        </div>
      </footer>
    </div>
  );
}
