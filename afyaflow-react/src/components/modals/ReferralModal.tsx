import React, { useState } from 'react';
import DashboardCard from '../ui/DashboardCard';
import SignatureButton from '../ui/SignatureButton';
import { useData } from '../../context/DataContext';
import type { Referral } from '../../context/DataContext';

interface ReferralModalProps {
  onClose: () => void;
  onRefer: (referral: Omit<Referral, 'id' | 'referredAt'>) => void;
  doctorName: string;
}

const ReferralModal: React.FC<ReferralModalProps> = ({ onClose, onRefer, doctorName }) => {
  const { departments, doctors } = useData();
  const [form, setForm] = useState({
    toSpecialty: departments[0]?.name || 'General',
    toDoctor: '',
    reason: '',
    urgency: 'routine' as 'routine' | 'urgent' | 'emergency',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.reason) return;
    onRefer({
      ...form,
      referredBy: doctorName
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300">
        <DashboardCard className="shadow-2xl border-outline-variant/20 bg-white flex flex-col overflow-hidden p-0">
          <div className="p-8 pb-4 shrink-0 border-b border-outline-variant/10">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black text-primary tracking-tight">Refer Patient</h2>
                <p className="text-xs text-on-surface-variant font-medium mt-1">Transfer care to another department</p>
              </div>
              <button 
                onClick={onClose}
                className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-on-surface-variant"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
            <div className="p-8 space-y-5 overflow-y-auto custom-scrollbar">
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Target Department</label>
                <select 
                  value={form.toSpecialty}
                  onChange={e => {
                    const dept = e.target.value;
                    setForm(f => ({ ...f, toSpecialty: dept, toDoctor: '' }));
                  }}
                  className="w-full px-4 py-4 bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/40 appearance-none outline-none transition-all"
                >
                  {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Target Specialist</label>
                <select 
                  value={form.toDoctor}
                  onChange={e => setForm(f => ({ ...f, toDoctor: e.target.value }))}
                  className="w-full px-4 py-4 bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/40 appearance-none outline-none transition-all"
                >
                  <option value="">Any Available</option>
                  {doctors
                    .filter(d => d.department?.name === form.toSpecialty || d.specialization === form.toSpecialty)
                    .map(d => <option key={d.id} value={d.name}>{d.name}</option>)
                  }
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Urgency</label>
              <div className="grid grid-cols-3 gap-2">
                {['routine', 'urgent', 'emergency'].map(u => (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, urgency: u as any }))}
                    className={`py-2 rounded-xl text-[10px] font-bold uppercase tracking-widest border-2 transition-all ${
                      form.urgency === u 
                        ? 'bg-primary/10 border-primary text-primary' 
                        : 'bg-white border-outline-variant/10 text-on-surface-variant hover:border-primary/20'
                    }`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Reason for Referral</label>
              <textarea 
                required
                value={form.reason}
                onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full h-32 bg-surface-container-low text-on-surface text-sm font-medium px-4 py-3 rounded-2xl border-2 border-transparent focus:border-primary/20 focus:bg-white focus:outline-none transition-all resize-none"
                placeholder="Briefly explain why this patient needs specialist review..."
              />
            </div>

            </div>

            <div className="p-6 border-t border-outline-variant/10 bg-surface-container-lowest shrink-0 flex gap-4">
              <SignatureButton variant="clear" type="button" onClick={onClose} className="flex-1">
                Cancel
              </SignatureButton>
              <SignatureButton icon="send" type="submit" className="flex-1">
                Generate Referral
              </SignatureButton>
            </div>
          </form>
        </DashboardCard>
      </div>
    </div>
  );
};

export default ReferralModal;
