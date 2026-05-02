import { Clock } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface QueueCardProps {
  queueNumber: string;
  patientName: string;
  department: string;
  status: 'waiting' | 'called' | 'completed' | 'missed';
  waitingTime: string;
  onCall?: () => void;
  onComplete?: () => void;
  onMissed?: () => void;
}

export function QueueCard({ 
  queueNumber, 
  patientName, 
  department, 
  status, 
  waitingTime,
  onCall,
  onComplete,
  onMissed
}: QueueCardProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-2xl font-bold text-primary">#{queueNumber}</div>
          <h4 className="font-semibold text-foreground mt-1">{patientName}</h4>
          <p className="text-sm text-muted-foreground">{department}</p>
        </div>
        <StatusBadge status={status}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </StatusBadge>
      </div>
      
      <div className="flex items-center text-sm text-muted-foreground mb-3">
        <Clock className="w-4 h-4 mr-1" />
        Waiting: {waitingTime}
      </div>

      <div className="flex gap-2">
        {status === 'waiting' && onCall && (
          <button 
            onClick={onCall}
            className="flex-1 px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Call
          </button>
        )}
        {status === 'called' && onComplete && (
          <button 
            onClick={onComplete}
            className="flex-1 px-3 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/90 transition-colors"
          >
            Complete
          </button>
        )}
        {status === 'called' && onMissed && (
          <button 
            onClick={onMissed}
            className="px-3 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90 transition-colors"
          >
            Missed
          </button>
        )}
      </div>
    </div>
  );
}
