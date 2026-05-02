import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import type { Patient, Priority } from '../../context/DataContext';
import SignatureButton from '../ui/SignatureButton';
import DashboardCard from '../ui/DashboardCard';
import Input from '../ui/Input';
import { z } from 'zod';
import { toast } from 'sonner';

/**
 * ADMISSION SCHEMA
 * Validates new patient records before registration.
 */
const admissionSchema = z.object({
    name: z.string().min(3, "Patient name must be at least 3 characters"),
    age: z.string().refine(v => !isNaN(parseInt(v)) && parseInt(v) > 0, "Age must be a positive number"),
    phone: z.string().regex(/^\d{9,10}$/, "Phone must be 9 or 10 digits"),
    nationalId: z.string().min(6, "ID must be at least 6 digits"),
    reason: z.string().min(5, "Please provide a more detailed reason for visit"),
    department: z.string().min(1, "Please select a department"),
});

interface Props {
    onClose: () => void;
    onSuccess: (patient: Patient) => void;
}

const PRIORITY_OPTIONS: { value: Priority; label: string; desc: string; color: string; bg: string }[] = [
    { value: 'standard', label: 'Standard', desc: 'Routine visit', color: 'text-on-surface-variant', bg: 'bg-surface-container-high' },
    { value: 'urgent', label: 'Urgent', desc: 'Needs prompt attention', color: 'text-secondary', bg: 'bg-secondary/10' },
    { value: 'emergency', label: 'Emergency', desc: 'Immediate care required', color: 'text-error', bg: 'bg-error/10' },
];

const NewAdmissionModal: React.FC<Props> = ({ onClose, onSuccess }) => {
    const { addPatient, doctors, departments } = useData();
    const [form, setForm] = useState({
        name: '',
        age: '',
        gender: 'Male' as 'Male' | 'Female',
        phone: '',
        nationalId: '',
        reason: '',
        email: '',
        department: (departments.find(d => d.name.toLowerCase() === 'general') || departments[0])?.name || 'General',
        priority: 'standard' as Priority,
        assignedDoctor: '',
    });
    const [submitting, setSubmitting] = useState(false);

    const set = (field: string, val: string) => {
        setForm(f => {
            const next = { ...f, [field]: val };
            // If department changed, auto-select the first doctor in that department
            if (field === 'department') {
                const deptDoctors = doctors.filter(d => d.department?.name === val || d.specialization === val);
                next.assignedDoctor = deptDoctors[0]?.name || '';
            }
            return next;
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validate with Zod
        const validation = admissionSchema.safeParse(form);
        if (!validation.success) {
            const firstError = validation.error.issues[0];
            toast.error(firstError.message);
            return;
        }

        setSubmitting(true);
        // Simulate net delay for premium feel
        await new Promise(r => setTimeout(r, 800));
        const patient = await addPatient({
            name: form.name,
            age: parseInt(form.age),
            gender: form.gender,
            phone: form.phone.startsWith('+254') ? form.phone : `+254${form.phone}`,
            nationalId: form.nationalId,
            reason: form.reason,
            email: form.email,
            department: form.department,
            priority: form.priority,
            status: 'queued',
            assignedDoctor: form.assignedDoctor || undefined,
        });
        setSubmitting(false);
        onSuccess(patient);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
                <DashboardCard noPadding className="flex-1 flex flex-col overflow-hidden shadow-2xl border-outline-variant/20 bg-white">
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full signature-gradient flex items-center justify-center text-white shadow-lg shadow-primary/20">
                                <span className="material-symbols-outlined text-2xl">person_add</span>
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-primary tracking-tight">New Admission</h2>
                                <p className="text-xs text-on-surface-variant font-medium mt-0.5">Register a new patient and generate a queue token</p>
                            </div>
                        </div>
                        <button 
                            onClick={onClose}
                            className="h-10 w-10 rounded-full flex items-center justify-center hover:bg-surface-container-low transition-colors text-on-surface-variant"
                        >
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    {/* Body */}
                    <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                        {/* Priority Selection */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest pl-1">Priority Level</label>
                            <div className="grid grid-cols-3 gap-3">
                                {PRIORITY_OPTIONS.map(opt => (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        onClick={() => set('priority', opt.value)}
                                        className={`p-4 rounded-2xl border-2 text-left transition-all relative overflow-hidden group ${
                                            form.priority === opt.value
                                                ? `border-primary/50 ${opt.bg}`
                                                : 'border-outline-variant/10 bg-white hover:border-primary/20'
                                        }`}
                                    >
                                        <p className={`font-black text-sm ${form.priority === opt.value ? 'text-primary' : 'text-on-surface'}`}>{opt.label}</p>
                                        <p className="text-[10px] text-on-surface-variant font-medium mt-0.5">{opt.desc}</p>
                                        {form.priority === opt.value && (
                                          <div className="absolute top-2 right-2">
                                            <span className={`material-symbols-outlined text-xs ${opt.color}`}>check_circle</span>
                                          </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Basic Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <Input 
                                label="Full Name *" 
                                placeholder="e.g. Jane Wanjiru" 
                                required 
                                value={form.name} 
                                onChange={e => set('name', e.target.value)} 
                            />
                            <Input 
                                label="National ID / Passport *" 
                                placeholder="e.g. 29384756" 
                                required 
                                value={form.nationalId} 
                                onChange={e => set('nationalId', e.target.value)} 
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <Input 
                                label="Age *" 
                                type="number"
                                placeholder="34" 
                                required 
                                value={form.age} 
                                onChange={e => set('age', e.target.value)} 
                            />
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Gender *</label>
                                <select 
                                    value={form.gender} 
                                    onChange={e => set('gender', e.target.value)}
                                    className="w-full px-4 py-4 bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/40 appearance-none outline-none transition-all"
                                >
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                            </div>
                            <Input 
                                label="Phone Number *" 
                                prefix="+254"
                                placeholder="712 345 678" 
                                required 
                                value={form.phone} 
                                onChange={e => set('phone', e.target.value)} 
                            />
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            <Input 
                                label="Email Address (Optional)" 
                                placeholder="patient@example.com" 
                                type="email"
                                value={form.email} 
                                onChange={e => set('email', e.target.value)} 
                            />
                        </div>

                        {/* Clinical Info */}
                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Department *</label>
                                <select 
                                    required 
                                    value={form.department} 
                                    onChange={e => set('department', e.target.value)}
                                    className="w-full px-4 py-4 bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/40 appearance-none outline-none transition-all"
                                >
                                    {departments.map(d => <option key={d.id} value={d.name}>{d.name}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Assign Specialist</label>
                                <select 
                                    value={form.assignedDoctor} 
                                    onChange={e => set('assignedDoctor', e.target.value)}
                                    className="w-full px-4 py-4 bg-surface-container-highest rounded-xl text-sm font-bold text-on-surface focus:ring-2 focus:ring-primary/40 appearance-none outline-none transition-all"
                                >
                                    <option value="">Auto-assign (Recommended)</option>
                                    {doctors
                                        .filter(d => d.department?.name === form.department)
                                        .map(d => <option key={d.id} value={d.name}>{d.name}</option>)
                                    }
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[11px] font-extrabold uppercase tracking-widest text-on-surface-variant px-1 block">Reason for Visit *</label>
                            <textarea 
                                required 
                                value={form.reason} 
                                onChange={e => set('reason', e.target.value)} 
                                rows={3}
                                className="w-full px-4 py-4 bg-surface-container-highest rounded-2xl text-sm font-medium text-on-surface focus:ring-2 focus:ring-primary/40 outline-none transition-all resize-none placeholder:text-outline/50"
                                placeholder="Describe the patient's chief complaint..." 
                            />
                        </div>
                    </form>

                    {/* Footer Actions */}
                    <div className="px-8 py-6 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end gap-4">
                        <SignatureButton variant="clear" onClick={onClose}>
                            Cancel
                        </SignatureButton>
                        <SignatureButton 
                            icon={submitting ? 'progress_activity' : 'qr_code_2'} 
                            onClick={(e: React.MouseEvent) => { e.preventDefault(); handleSubmit(e as any); }}
                            disabled={submitting}
                        >
                            {submitting ? 'Admitting...' : 'Register & Generate Token'}
                        </SignatureButton>
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};

export default NewAdmissionModal;