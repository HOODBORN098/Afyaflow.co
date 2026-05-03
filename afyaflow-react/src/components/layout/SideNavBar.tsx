import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const allNavItems = [
  // Dashboards
  { icon: 'how_to_reg',         label: 'Reception',    path: '/',           roles: ['Receptionist'], exact: true },
  { icon: 'admin_panel_settings',label: 'Admin',        path: '/admin',      roles: ['Admin'] },
  { icon: 'stethoscope',        label: 'Doctor',       path: '/doctor',     roles: ['Doctor'] },

  // Clinical Management
  { icon: 'group',              label: 'Patients',     path: '/patients',   roles: ['Admin'] },
  { icon: 'folder_shared',      label: 'Patient EMR',  path: '/emr',        roles: ['Admin', 'Doctor'] },
  { icon: 'bed',                label: 'Wards',        path: '/wards',      roles: ['Admin'] },
  { icon: 'calendar_today',     label: 'Appointments', path: '/appointments',roles: ['Admin'] },
  { icon: 'badge',              label: 'Doctors',      path: '/doctors',    roles: ['Admin'] },
  { icon: 'inventory_2',        label: 'Inventory',    path: '/inventory',  roles: ['Admin'] },

  // Administration
  { icon: 'analytics',          label: 'Reports',      path: '/reports',    roles: ['Admin'] },
  { icon: 'clinical_notes',     label: 'Departments',  path: '/departments',roles: ['Admin'] },
  { icon: 'receipt_long',       label: 'Audit Logs',   path: '/audit',      roles: ['Admin'] },

  // Universal
  { icon: 'settings',           label: 'Settings',     path: '/settings',   roles: ['Admin', 'Doctor', 'Receptionist'] },
];

interface Props {
  isCollapsed: boolean;
}

const SideNavBar: React.FC<Props> = ({ isCollapsed }) => {
  const { user, loading } = useAuth();

  if (loading || !user) return null;

  const navItems = allNavItems.filter(item => item.roles.includes(user.role));

  return (
    <aside className={`h-screen fixed left-0 top-0 z-40 flex flex-col py-6 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 font-manrope antialiased tracking-tight text-sm font-medium transition-all duration-300 ${isCollapsed ? 'w-20 items-center' : 'w-64'}`}>
      <div className={`text-xl font-bold text-teal-900 dark:text-teal-100 mb-8 flex items-center gap-2 ${isCollapsed ? 'px-0 justify-center' : 'px-4'}`}>
        <span className="material-symbols-outlined fill-1 text-primary text-3xl">local_hospital</span>
        {!isCollapsed && <span>Afyaflow</span>}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            title={isCollapsed ? item.label : undefined}
            className={({ isActive }) =>
              `flex items-center gap-3 py-3 transition-all duration-200 ${isCollapsed ? 'justify-center px-0 w-12 rounded-xl mx-auto' : 'px-4'} ${isActive
                ? 'text-teal-900 dark:text-teal-300 font-bold border-l-[3px] border-teal-700 dark:border-teal-500 bg-teal-50/50 dark:bg-teal-900/20 scale-[0.99]'
                : 'text-slate-600 dark:text-slate-400 hover:text-teal-800 dark:hover:text-teal-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`
            }
          >
            <span className="material-symbols-outlined text-xl">{item.icon}</span>
            {!isCollapsed && <span>{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {!isCollapsed && (
        <div className="px-4 mt-auto">
          <div className="bg-surface-container-high rounded-xl p-4 flex flex-col gap-2 overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase tracking-widest text-on-surface-variant font-bold truncate">SHA/NHIF Portal</span>
              <div className="h-2 w-2 rounded-full bg-secondary shadow-[0_0_8px_rgba(44,105,78,0.6)] shrink-0" />
            </div>
            <div className="text-xs font-semibold text-primary truncate">Connected & Active</div>
            <div className="text-[10px] text-on-surface-variant truncate">Last sync: 2 mins ago</div>
          </div>
        </div>
      )}
      {isCollapsed && (
        <div className="mt-auto mx-auto pb-4">
          <div className="h-3 w-3 rounded-full bg-secondary shadow-[0_0_8px_rgba(44,105,78,0.6)] shrink-0" title="SHA/NHIF Connected" />
        </div>
      )}
    </aside>
  );
};

export default SideNavBar;