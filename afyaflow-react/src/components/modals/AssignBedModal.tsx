import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { wardApi } from '../../services/api';
import DashboardCard from '../ui/DashboardCard';
import SignatureButton from '../ui/SignatureButton';

interface AssignBedModalProps {
    patientId: string | number;
    patientName: string;
    onClose: () => void;
    onAssign: () => void;
}

const AssignBedModal: React.FC<AssignBedModalProps> = ({ patientId, patientName, onClose, onAssign }) => {
    const { wards, fetchWards, updatePatientStatus } = useData();
    const [selectedWardId, setSelectedWardId] = useState<number | string>('');
    const [selectedBedId, setSelectedBedId] = useState<number | string>('');
    const [loading, setLoading] = useState(false);

    const selectedWard = wards.find(w => String(w.id) === String(selectedWardId));
    const availableBeds = selectedWard?.beds?.filter(b => b.status === 'available') || [];

    const handleAssign = async () => {
        if (!selectedBedId) return;
        setLoading(true);
        try {
            await wardApi.updateBed(Number(selectedBedId), 'occupied', String(patientId), patientName);
            await updatePatientStatus(String(patientId), 'admitted');
            await fetchWards();
            onAssign();
            onClose();
        } catch (error) {
            console.error("Failed to assign bed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="w-full max-w-lg max-h-[80vh] flex flex-col animate-in zoom-in-95 duration-300">
                <DashboardCard noPadding className="shadow-2xl border-outline-variant/20 bg-white flex flex-col overflow-hidden">
                    <div className="px-8 py-6 border-b border-outline-variant/10 flex justify-between items-center bg-surface-container-lowest shrink-0">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center text-secondary">
                                <span className="material-symbols-outlined text-2xl">bed</span>
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-primary tracking-tight">Assign Ward & Bed</h2>
                                <p className="text-xs text-on-surface-variant font-medium">Select a location for {patientName}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-on-surface-variant hover:text-primary transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>

                    <div className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
                        <div className="space-y-4">
                            <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest pl-1">Select Ward</label>
                            <div className="grid grid-cols-1 gap-3">
                                {wards.length === 0 ? (
                                    <p className="text-sm text-on-surface-variant italic py-4">No wards available.</p>
                                ) : (
                                    <select 
                                        value={selectedWardId} 
                                        onChange={(e) => { setSelectedWardId(e.target.value); setSelectedBedId(''); }}
                                        className="w-full px-4 py-3 bg-surface-container-low border border-outline-variant/40 rounded-xl text-sm font-bold focus:ring-2 focus:ring-primary/20 outline-none"
                                    >
                                        <option value="">-- Choose a Ward --</option>
                                        {wards.map(ward => (
                                            <option key={ward.id} value={ward.id}>
                                                {ward.name} ({ward.department}) - {ward.beds?.filter(b => b.status === 'available').length} free
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                        </div>

                        {selectedWardId && (
                            <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-extrabold text-on-surface-variant uppercase tracking-widest pl-1">Select Available Bed</label>
                                <div className="grid grid-cols-4 gap-3">
                                    {availableBeds.length === 0 ? (
                                        <p className="col-span-4 text-xs text-error font-bold py-2">No available beds in this ward.</p>
                                    ) : (
                                        availableBeds.map(bed => (
                                            <button
                                                key={bed.id}
                                                onClick={() => setSelectedBedId(bed.id)}
                                                className={`py-3 rounded-xl text-xs font-black transition-all border-2 ${
                                                    String(selectedBedId) === String(bed.id)
                                                        ? 'border-secondary bg-secondary/10 text-secondary'
                                                        : 'border-outline-variant/30 hover:border-secondary/50'
                                                }`}
                                            >
                                                #{bed.bedNumber}
                                            </button>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="px-8 py-6 border-t border-outline-variant/10 bg-surface-container-lowest flex justify-end gap-4 shrink-0">
                        <SignatureButton variant="clear" onClick={onClose}>Cancel</SignatureButton>
                        <SignatureButton 
                            icon="check_circle" 
                            onClick={handleAssign} 
                            disabled={!selectedBedId || loading}
                        >
                            {loading ? 'Assigning...' : 'Assign Bed'}
                        </SignatureButton>
                    </div>
                </DashboardCard>
            </div>
        </div>
    );
};

export default AssignBedModal;
