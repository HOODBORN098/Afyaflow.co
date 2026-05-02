import { User, Phone, Calendar } from 'lucide-react';

interface PatientCardProps {
  name: string;
  phone: string;
  age: number;
  gender: string;
  onClick?: () => void;
}

export function PatientCard({ name, phone, age, gender, onClick }: PatientCardProps) {
  return (
    <div 
      className="bg-white rounded-lg border border-border p-4 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-primary">
          <User className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{name}</h4>
          <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center">
              <Phone className="w-3 h-3 mr-1" />
              {phone}
            </div>
            <div className="flex items-center">
              <Calendar className="w-3 h-3 mr-1" />
              {age} yrs, {gender}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
