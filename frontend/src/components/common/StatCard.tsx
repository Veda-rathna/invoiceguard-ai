import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color?: 'emerald' | 'amber' | 'rose' | 'blue' | 'slate';
  trend?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color = 'slate',
  trend,
}) => {
  const colorMap = {
    emerald: {
      iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
      valueColor: 'text-slate-900',
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
      valueColor: 'text-slate-900',
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-600 border border-rose-100',
      valueColor: 'text-slate-900',
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
      valueColor: 'text-slate-900',
    },
    slate: {
      iconBg: 'bg-slate-100 text-slate-600 border border-slate-200/80',
      valueColor: 'text-slate-900',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md hover:border-slate-300 transition-all duration-200 relative overflow-hidden flex flex-col justify-between">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 font-mono">
          {title}
        </p>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className={`text-2xl font-extrabold tracking-tight ${scheme.valueColor}`}>
          {value}
        </span>
        {trend && (
          <span className="text-xs font-bold font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1.5 text-xs text-slate-500 font-medium">
          {subtitle}
        </p>
      )}
    </div>
  );
};
