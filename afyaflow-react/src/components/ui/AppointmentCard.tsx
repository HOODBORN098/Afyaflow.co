// components/AppointmentCard.tsx
import React from 'react';
import type { NewAppointment } from '../../lib/notificationService';

interface AppointmentCardProps {
    appt: NewAppointment;
    onConfirm: (id: number) => void;
}

export const AppointmentCard: React.FC<AppointmentCardProps> = ({ appt, onConfirm }) => {
    const renderAction = () => {
        // NewAppointment.status is: 'pending' | 'confirmed' | 'cancelled' | 'in-progress'
        // These are plain string literals — NOT enum values, so no dot notation
        switch (appt.status) {
            case 'pending':
            case 'confirmed':
                return (
                    <button
                        onClick={() => onConfirm(appt.id)}
                        className="opacity-0 group-hover:opacity-100 bg-primary/10 text-primary p-2 rounded-lg transition-all"
                        title="Admit to Queue"
                    >
                        <span className="material-symbols-outlined text-sm">login</span>
                    </button>
                );

            case 'in-progress':
                return (
                    <span className="text-[9px] bg-primary text-white px-1.5 py-0.5 rounded font-bold uppercase">
                        Active
                    </span>
                );

            case 'cancelled':
            default:
                return (
                    <span className="material-symbols-outlined text-secondary text-sm">
                        check_circle
                    </span>
                );
        }
    };

    return (
        <div className="flex justify-between items-center p-3 bg-surface-container-low rounded-xl border border-outline-variant/5 group">
            <div>
                <p className="text-sm font-bold text-on-surface">{appt.patientName}</p>
                <p className="text-[10px] text-on-surface-variant font-medium">
                    {appt.appointmentTime || 'Scheduled'}
                </p>
            </div>
            {renderAction()}
        </div>
    );
};