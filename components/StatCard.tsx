
import { ReactNode, FC } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  description?: string;
  colorClass?: string;
  iconColorClass?: string;
}

const StatCard: FC<StatCardProps> = ({ title, value, icon, description, colorClass = 'bg-white', iconColorClass = 'bg-blue-100 text-blue-600' }) => {
  return (
    <div className={`${colorClass} p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4 transition-all hover:shadow-md`}>
      <div className={`p-4 rounded-lg flex-shrink-0 ${iconColorClass}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-sm text-slate-500 font-medium truncate">{title}</p>
        <p className="text-2xl font-bold text-slate-800 mt-0.5">{value}</p>
        {description && <p className="text-xs text-slate-400 mt-1 truncate">{description}</p>}
      </div>
    </div>
  );
};

export default StatCard;
