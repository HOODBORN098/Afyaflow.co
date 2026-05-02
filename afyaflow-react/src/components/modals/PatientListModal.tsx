import React from 'react';
import DashboardCard from '../ui/DashboardCard';
import StatusChip from '../ui/StatusChip';
import type { Patient } from '../../context/DataContext';

interface PatientListModalProps {
  patients: Patient[];
  onClose: () => void;
  onSelect?: (patient: Patient) => void;
  title?: string;
}

const PatientListModal: React.FC<PatientListModalProps> = ({ 
  patients, 
  onClose, 
  onSelect,
  title = "Patient Registry"
}) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
        <DashboardCard noPadding className="flex-1 flex flex-col shadow-2xl border-outline-variant/20 bg-white">
          {/* Header */}
          <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
            <div>
              <h2 className="text-2xl font-black text-primary tracking-tight">{title}</h2>
              <p className="text-xs text-on-surface-variant font-medium mt-0.5">{patients.length} records found in total</p>
            </div>
            <button 
              onClick={onClose}
              className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-on-surface-variant"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-surface-container-lowest z-10 shadow-sm">
                <tr>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant border-b border-outline-variant/10">Token</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant border-b border-outline-variant/10">Patient Name</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant border-b border-outline-variant/10">Status</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant border-b border-outline-variant/10">Department</th>
                  <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.15em] text-on-surface-variant border-b border-outline-variant/10">Reg. Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {patients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center">
                      <span className="material-symbols-outlined text-4xl text-on-surface-variant opacity-20 block mb-2">person_search</span>
                      <p className="text-on-surface-variant font-bold">No patients found</p>
                    </td>
                  </tr>
                ) : (
                  patients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      onClick={() => onSelect?.(patient)}
                      className={`group hover:bg-primary/5 transition-colors cursor-pointer`}
                    >
                      <td className="px-8 py-4">
                        <span className="font-black text-primary text-sm">{patient.tokenId}</span>
                      </td>
                      <td className="px-8 py-4">
                        <div>
                          <p className="text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{patient.name}</p>
                          <p className="text-[10px] text-on-surface-variant font-medium lowercase">
                            {patient.age}y · {patient.gender} · {patient.phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-8 py-4">
                        <StatusChip label={patient.status} variant={patient.status === 'queued' ? 'info' : patient.status === 'in-progress' ? 'warning' : 'success'} />
                      </td>
                      <td className="px-8 py-4">
                        <span className="text-xs font-bold text-on-surface-variant uppercase tracking-wider">{patient.department}</span>
                      </td>
                      <td className="px-8 py-4 text-xs font-medium text-on-surface-variant">
                        {new Date(patient.registeredAt).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="px-8 py-4 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end">
            <button 
              onClick={onClose}
              className="px-6 py-2 bg-on-surface text-white text-xs font-bold rounded-xl hover:bg-on-surface/90 transition-all font-manrope uppercase tracking-widest"
            >
              Close Registry
            </button>
          </div>
        </DashboardCard>
      </div>
    </div>
  );
};

export default PatientListModal;
