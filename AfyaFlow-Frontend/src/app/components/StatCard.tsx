import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  iconColor?: string;
}

export function StatCard({ title, value, icon: Icon, trend, iconColor = 'text-primary' }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border border-border p-6 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{title}</p>
          <h3 className="text-3xl font-semibold text-foreground">{value}</h3>
          {trend && <p className="text-xs text-muted-foreground mt-2">{trend}</p>}
        </div>
        <div className={`p-3 rounded-lg bg-muted ${iconColor}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
