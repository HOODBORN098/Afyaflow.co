import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import { useData } from '../context/DataContext';
import DashboardCard from '../components/ui/DashboardCard';
import SignatureButton from '../components/ui/SignatureButton';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

type ReportType = 'patient_volume' | 'department_load' | 'clinical_kpis' | 'morbidity';

const COLORS = ['#005050', '#2c694e', '#6b7280', '#dc2626', '#d97706', '#7c3aed'];

const VOLUME_DATA = [
  { day: 'Mon', patients: 120, admitted: 15 },
  { day: 'Tue', patients: 132, admitted: 18 },
  { day: 'Wed', patients: 101, admitted: 12 },
  { day: 'Thu', patients: 145, admitted: 20 },
  { day: 'Fri', patients: 150, admitted: 22 },
  { day: 'Sat', patients: 90, admitted: 10 },
  { day: 'Sun', patients: 85, admitted: 8 },
];

const MORBIDITY_DATA = [
  { name: 'Malaria', value: 45 },
  { name: 'Respiratory Tract Infection', value: 38 },
  { name: 'Gastroenteritis', value: 25 },
  { name: 'Hypertension', value: 20 },
  { name: 'Diabetes', value: 15 },
];

// Dynamic department load data will be calculated inside the component
const KPI_DATA = [
  { metric: 'Avg Wait Time', value: '18 min', trend: '-2 min', good: true },
  { metric: 'Bed Occupancy', value: '78%', trend: '+5%', good: false },
  { metric: 'Patient Satisfaction', value: '4.8/5', trend: '+0.2', good: true },
  { metric: 'Treatment Success', value: '94%', trend: '+1%', good: true },
  { metric: 'Staff Ratio', value: '1:4', trend: 'steady', good: true },
  { metric: 'Readmission Rate', value: '3.2%', trend: '-0.5%', good: true },
];
const REPORT_TYPES: { key: ReportType; label: string; icon: string; desc: string }[] = [
  { key: 'patient_volume',  label: 'Patient Volume',    icon: 'group',            desc: 'Daily admissions and trends for the week' },
  { key: 'department_load', label: 'Department Load',   icon: 'apartment',        desc: 'Patient distribution across clinical areas' },
  { key: 'clinical_kpis',  label: 'Clinical KPIs',     icon: 'analytics',        desc: 'Key performance indicators for care quality' },
  { key: 'morbidity',       label: 'Morbidity Report',  icon: 'local_hospital',   desc: 'Disease burden and top diagnostic categories' },
];

const ReportsPage: React.FC = () => {
  const { patients, departments } = useData();
  const { searchQuery, setSearchQuery } = useSearch();
  const [activeReport, setActiveReport] = useState<ReportType>('patient_volume');
  const [search, setSearch] = useState(searchQuery);
  const [dateRange, setDateRange] = useState('this_week');

  const deptLoadData = React.useMemo(() => {
    if (patients.length === 0) {
      // Fallback data for demonstration if no patients exist yet
      return [
        { dept: 'General', patients: 85 },
        { dept: 'Pediatrics', patients: 45 },
        { dept: 'Maternity', patients: 35 },
        { dept: 'Surgery', patients: 25 },
        { dept: 'Orthopedics', patients: 20 },
      ];
    }
    
    const counts = patients.reduce((acc, p) => {
      const d = p.department || 'Unassigned';
      acc[d] = (acc[d] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return Object.entries(counts)
      .map(([dept, count]) => ({ dept, patients: count }))
      .sort((a, b) => b.patients - a.patients);
  }, [patients]);

  // Sync local search with global search
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchQuery(val);
  };

  const totalThisWeek  = VOLUME_DATA.reduce((s, d) => s + d.patients, 0);
  const totalAdmitted  = VOLUME_DATA.reduce((s, d) => s + d.admitted, 0);
  const currentPatients = patients.length;
  const deptCount       = departments.length;

  const handleExportCSV = () => {
    let dataToExport: any[] = [];
    if (activeReport === 'patient_volume') dataToExport = VOLUME_DATA;
    else if (activeReport === 'morbidity') dataToExport = MORBIDITY_DATA;
    else if (activeReport === 'department_load') dataToExport = deptLoadData;
    else if (activeReport === 'clinical_kpis') dataToExport = KPI_DATA;

    if (dataToExport.length === 0) return;

    const headers = Object.keys(dataToExport[0]).join(',');
    const rows    = dataToExport.map(r => Object.values(r).join(','));
    const csv     = [headers, ...rows].join('\n');
    const blob    = new Blob([csv], { type: 'text/csv' });
    const url     = URL.createObjectURL(blob);
    const a       = document.createElement('a');
    a.href = url;
    a.download = `afyaflow_${activeReport}_report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-[2.5rem] font-extrabold text-primary tracking-tight leading-none mb-2">Reports & Analytics</h1>
          <p className="text-on-surface-variant font-medium">Clinical data, performance metrics and exportable reports</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-2xl w-64 border border-outline-variant/30">
            <span className="material-symbols-outlined text-outline text-sm">search</span>
            <input 
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-outline"
              placeholder="Filter report data..."
            />
          </div>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)}
            className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 appearance-none">
            <option value="today">Today</option>
            <option value="this_week">This Week</option>
            <option value="this_month">This Month</option>
            <option value="last_month">Last Month</option>
          </select>
          <SignatureButton icon="download" onClick={handleExportCSV} variant="clear">Export CSV</SignatureButton>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Patients This Week', value: totalThisWeek,   icon: 'group',        color: 'text-primary' },
          { label: 'Total Admitted',     value: totalAdmitted,   icon: 'hotel',        color: 'text-secondary' },
          { label: 'Active Patients',    value: currentPatients, icon: 'person',       color: 'text-on-surface' },
          { label: 'Departments',        value: deptCount,        icon: 'apartment',   color: 'text-outline' },
        ].map(k => (
          <DashboardCard key={k.label} variant="low" className="p-5 flex items-center gap-4">
            <span className={`material-symbols-outlined text-3xl ${k.color}`}>{k.icon}</span>
            <div>
              <p className="text-3xl font-extrabold text-on-surface">{k.value}</p>
              <p className="text-xs text-on-surface-variant font-semibold uppercase tracking-widest">{k.label}</p>
            </div>
          </DashboardCard>
        ))}
      </div>

      {/* Report Selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {REPORT_TYPES.map(r => (
          <button key={r.key} onClick={() => setActiveReport(r.key)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${
              activeReport === r.key
                ? 'border-primary bg-primary/5 shadow-sm'
                : 'border-outline-variant/20 bg-surface-container-lowest hover:border-primary/30'}`}>
            <span className={`material-symbols-outlined text-xl mb-2 block ${activeReport === r.key ? 'text-primary' : 'text-on-surface-variant'}`}>{r.icon}</span>
            <p className={`font-bold text-sm ${activeReport === r.key ? 'text-primary' : 'text-on-surface'}`}>{r.label}</p>
            <p className="text-[10px] text-on-surface-variant mt-1">{r.desc}</p>
          </button>
        ))}
      </div>

      {/* Chart Area */}
      <DashboardCard className="p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-extrabold text-primary">
            {REPORT_TYPES.find(r => r.key === activeReport)?.label}
          </h3>
          <button onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 text-xs font-bold text-primary bg-primary/10 rounded-xl hover:bg-primary/20 transition-colors">
            <span className="material-symbols-outlined text-sm">download</span>Download CSV
          </button>
        </div>

        {/* Patient Volume Chart */}
        {activeReport === 'patient_volume' && (
          <div className="h-72 min-h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={VOLUME_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="patients" stroke="#005050" strokeWidth={2.5} dot={{ fill: '#005050', r: 5 }} name="Total Patients" />
                <Line type="monotone" dataKey="admitted" stroke="#2c694e" strokeWidth={2} dot={{ fill: '#2c694e', r: 4 }} strokeDasharray="5 3" name="Admitted" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Department Load */}
        {activeReport === 'department_load' && (
          <div className="h-72 min-h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={deptLoadData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11 }} />
                <YAxis dataKey="dept" type="category" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 11, fontWeight: 700 }} width={80} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Bar dataKey="patients" fill="#005050" radius={[0, 6, 6, 0]} name="Patients">
                  {deptLoadData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Clinical KPIs */}
        {activeReport === 'clinical_kpis' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {KPI_DATA.map(kpi => (
              <div key={kpi.metric} className="p-5 bg-surface-container-low rounded-2xl space-y-2">
                <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant">{kpi.metric}</p>
                <p className="text-3xl font-extrabold text-on-surface">{kpi.value}</p>
                <p className={`text-xs font-semibold ${kpi.good ? 'text-secondary' : 'text-amber-600'}`}>{kpi.trend} vs last week</p>
              </div>
            ))}
          </div>
        )}

        {/* Morbidity */}
        {activeReport === 'morbidity' && (
          <div className="grid grid-cols-12 gap-6 items-center">
            <div className="col-span-12 md:col-span-6 h-64 w-full" style={{ minHeight: 256 }}>
              <ResponsiveContainer width="99%" height="100%">
                <PieChart>
                  <Pie data={MORBIDITY_DATA} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={3} dataKey="value">
                    {MORBIDITY_DATA.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="col-span-12 md:col-span-6 space-y-3">
              <h4 className="text-xs font-extrabold uppercase tracking-widest text-on-surface-variant mb-4">Top Diagnoses (This {dateRange === 'today' ? 'Day' : dateRange === 'this_week' ? 'Week' : 'Month'})</h4>
              {MORBIDITY_DATA.map((item, i) => (
                <div key={item.name} className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                  <span className="text-sm text-on-surface flex-1">{item.name}</span>
                  <div className="text-right">
                    <span className="font-bold text-sm text-on-surface">{item.value}</span>
                    <span className="text-xs text-on-surface-variant ml-1">cases</span>
                  </div>
                  <div className="w-24 h-1.5 bg-surface-container rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(item.value / MORBIDITY_DATA[0].value) * 100}%`, background: COLORS[i % COLORS.length] }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </DashboardCard>
    </div>
  );
};

export default ReportsPage;
