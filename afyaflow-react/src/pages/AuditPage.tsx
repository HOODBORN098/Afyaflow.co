import React, { useState, useEffect } from 'react';
import { useSearch } from '../context/SearchContext';
import DashboardCard from '../components/ui/DashboardCard';
import StatusChip from '../components/ui/StatusChip';
import { useData } from '../context/DataContext';

const ACTION_CONFIG: Record<string, { icon: string; variant: 'success' | 'info' | 'neutral' | 'error' | 'warning'; label: string }> = {
  USER_LOGIN:         { icon: 'login',         variant: 'success', label: 'Login' },
  USER_REGISTERED:    { icon: 'person_add',    variant: 'success', label: 'User Registered' },
  PATIENT_REGISTERED: { icon: 'person_add',    variant: 'success', label: 'Patient Registered' },
  PATIENT_STATUS_UPDATED: { icon: 'sync',      variant: 'info',    label: 'Status Updated' },
  // Map remaining from standard audit actions if needed
  PRESCRIPTION_ADDED: { icon: 'medication',   variant: 'success', label: 'Prescription Added' },
  LOGOUT:             { icon: 'logout',        variant: 'neutral', label: 'Logout' },
  PATIENT_VIEWED:     { icon: 'visibility',    variant: 'info',    label: 'Record Viewed' },
  REFERRAL_CREATED:   { icon: 'send',          variant: 'info',    label: 'Referral Created' },
  DEPARTMENT_ADDED:   { icon: 'apartment',    variant: 'success', label: 'Dept. Added' },
  DEPARTMENT_DELETED: { icon: 'delete',        variant: 'error',   label: 'Dept. Deleted' },
  REPORT_GENERATED:   { icon: 'description',  variant: 'neutral', label: 'Report Generated' },
  STAFF_REGISTERED:   { icon: 'badge',         variant: 'success', label: 'Staff Registered' },
};

const ROLES = ['All Roles', 'Admin', 'Doctor', 'Receptionist'];
const ACTIONS_FILTER = ['All Actions', 'USER_LOGIN', 'PATIENT_REGISTERED', 'PRESCRIPTION_ADDED', 'REFERRAL_CREATED', 'DEPARTMENT_ADDED', 'DEPARTMENT_DELETED', 'REPORT_GENERATED'];

const AuditPage: React.FC = () => {
  const { auditLogs } = useData();
  const { searchQuery, setSearchQuery } = useSearch();
  const [search, setSearch]         = useState(searchQuery);

  // Sync local search with global search
  useEffect(() => {
    setSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setSearchQuery(val);
  };
  const [roleFilter, setRoleFilter] = useState('All Roles');
  const [actionFilter, setActionFilter] = useState('All Actions');

  const filtered = auditLogs
    .filter(e => roleFilter   === 'All Roles'    || e.actorRole === roleFilter)
    .filter(e => actionFilter === 'All Actions'  || e.action    === actionFilter)
    .filter(e =>
      !search ||
      e.actorUsername.toLowerCase().includes(search.toLowerCase()) ||
      e.details.toLowerCase().includes(search.toLowerCase())
    );

  // Stats
  const todayLogins   = auditLogs.filter(e => e.action === 'USER_LOGIN').length;
  const criticalEvents = auditLogs.filter(e => e.action === 'DEPARTMENT_DELETED').length;
  const uniqueActors   = new Set(auditLogs.map(e => e.actorUsername)).size;

  const handleExportCSV = () => {
    if (filtered.length === 0) return;
    const headers = ['Timestamp', 'Actor', 'Role', 'Action', 'Entity Type', 'Entity ID', 'Details'].join(',');
    const rows = filtered.map(e => {
      const ts = new Date(e.timestamp).toISOString();
      const details = `"${e.details.replace(/"/g, '""')}"`;
      return [ts, e.actorUsername, e.actorRole, e.action, e.entityType, e.entityId, details].join(',');
    });
    const csv = [headers, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `afyaflow_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-[2.5rem] font-extrabold text-primary tracking-tight leading-none mb-2">Audit Logs</h1>
        <p className="text-on-surface-variant font-medium">Complete activity trail for compliance and accountability</p>
      </div>

      {/* KPI Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Events',     value: auditLogs.length, icon: 'receipt_long',   color: 'text-primary' },
          { label: 'Active Users',     value: uniqueActors,       icon: 'group',           color: 'text-secondary' },
          { label: 'Logins Today',     value: todayLogins,        icon: 'login',           color: 'text-on-surface' },
          { label: 'Critical Actions', value: criticalEvents,     icon: 'warning',         color: 'text-error' },
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

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-surface-container-low px-4 py-2.5 rounded-2xl border border-outline-variant/30 flex-1 min-w-[200px]">
          <span className="material-symbols-outlined text-outline text-sm">search</span>
          <input value={search} onChange={e => handleSearchChange(e.target.value)}
            className="bg-transparent border-none focus:outline-none text-sm w-full placeholder:text-outline"
            placeholder="Search actor or details…" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
          {ROLES.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={actionFilter} onChange={e => setActionFilter(e.target.value)}
          className="px-4 py-2.5 bg-surface-container-low border border-outline-variant/30 rounded-2xl text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all appearance-none">
          {ACTIONS_FILTER.map(a => <option key={a}>{a}</option>)}
        </select>
      </div>

      {/* Log Table */}
      <DashboardCard noPadding>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-outline-variant/10">
                {['Timestamp', 'Actor', 'Action', 'Entity', 'Details', 'IP Address'].map(h => (
                  <th key={h} className="px-6 py-4 text-left text-[10px] font-extrabold uppercase tracking-widest text-on-surface-variant">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/10">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-on-surface-variant text-sm">No audit events match your filters</td>
                </tr>
              ) : filtered.map(entry => {
                const cfg = ACTION_CONFIG[entry.action];
                return (
                  <tr key={entry.id} className="hover:bg-surface-container-low transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs text-on-surface-variant whitespace-nowrap">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-semibold text-on-surface">{entry.actorUsername}</p>
                      <p className="text-[10px] text-on-surface-variant">{entry.actorRole}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusChip label={cfg?.label || entry.action} variant={cfg?.variant || 'neutral'} dot />
                    </td>
                    <td className="px-6 py-4 text-sm text-on-surface-variant">{entry.entityType} ({entry.entityId})</td>
                    <td className="px-6 py-4 text-sm text-on-surface max-w-xs truncate" title={entry.details}>{entry.details}</td>
                    <td className="px-6 py-4">
                      <span className="font-mono text-[10px] text-on-surface-variant bg-surface-container-high px-2 py-1 rounded">N/A</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-outline-variant/10 flex justify-between items-center">
          <p className="text-xs text-on-surface-variant">Showing {filtered.length} of {auditLogs.length} events</p>
          <button onClick={handleExportCSV} className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
        </div>
      </DashboardCard>
    </div>
  );
};

export default AuditPage;
