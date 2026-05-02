interface StatusBadgeProps {
  status: 'waiting' | 'called' | 'completed' | 'missed' | 'confirmed' | 'cancelled' | 'in-progress';
  children: React.ReactNode;
}

export function StatusBadge({ status, children }: StatusBadgeProps) {
  const statusStyles = {
    waiting: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    called: 'bg-blue-100 text-blue-800 border-blue-200',
    completed: 'bg-green-100 text-green-800 border-green-200',
    missed: 'bg-red-100 text-red-800 border-red-200',
    confirmed: 'bg-green-100 text-green-800 border-green-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200',
    'in-progress': 'bg-blue-100 text-blue-800 border-blue-200',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm border ${statusStyles[status]}`}>
      {children}
    </span>
  );
}
