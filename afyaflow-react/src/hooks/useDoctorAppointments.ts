// hooks/useDoctorAppointments.ts
import { useEffect, useState } from 'react';
import { startDoctorAppointmentMonitoring, confirmAppointment, type NewAppointment } from '../lib/notificationService';

export const useDoctorAppointments = (doctorId?: number) => {
    const [appointments, setAppointments] = useState<NewAppointment[]>([]);
    const [alert, setAlert] = useState<NewAppointment | null>(null);

    useEffect(() => {
        if (!doctorId) return;

        const handleNew = (appt: NewAppointment) => {
            setAlert(appt);
            setTimeout(() => setAlert(null), 5000);
        };

        const stop = startDoctorAppointmentMonitoring(
            doctorId,
            handleNew,
            3000,
            setAppointments
        );

        return stop;
    }, [doctorId]);

    const confirm = async (appointmentId: number) => {
        if (!doctorId) return false;
        return confirmAppointment(appointmentId, doctorId);
    };

    return { appointments, alert, confirm };
};