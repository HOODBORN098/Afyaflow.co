import { Calendar, Clock, User, Building2 } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface AppointmentCardProps {
  patientName?: string;
  department?: string;
  doctor?: string;
  date?: string;
  time?: string;
  status?: 'waiting' | 'called' | 'completed' | 'missed' | 'confirmed' | 'cancelled' | 'in-progress';
  queueNumber?: string;
}

export function AppointmentCard({ 
  patientName = 'Unknown',
  department = 'Unknown',
  doctor = 'Unknown',
  date = 'Unknown',
  time = 'Unknown',
  status = 'waiting',
  queueNumber 
}: AppointmentCardProps) {

  // Safe capitalized status
  const statusText = status ? status.charAt(0).toUpperCase() + status.slice(1) : 'Waiting';

  return (
    <div className="bg-white rounded-lg border border-border p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h4 className="font-semibold text-foreground">{patientName}</h4>
          {queueNumber && (
            <p className="text-sm text-muted-foreground">Queue #{queueNumber}</p>
          )}
        </div>
        <StatusBadge status={status}>
          {statusText}
        </StatusBadge>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center text-sm text-muted-foreground">
          <Building2 className="w-4 h-4 mr-2" />
          {department}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <User className="w-4 h-4 mr-2" />
          {doctor}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="w-4 h-4 mr-2" />
          {date}
        </div>
        <div className="flex items-center text-sm text-muted-foreground">
          <Clock className="w-4 h-4 mr-2" />
          {time}
        </div>
      </div>
    </div>
  );
}