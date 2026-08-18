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
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      text: 'text-emerald-400',
      iconBg: 'bg-emerald-500/20 text-emerald-300',
    },
    amber: {
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
      text: 'text-amber-400',
      iconBg: 'bg-amber-500/20 text-amber-300',
    },
    rose: {
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      text: 'text-rose-400',
      iconBg: 'bg-rose-500/20 text-rose-300',
    },
    blue: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      text: 'text-blue-400',
      iconBg: 'bg-blue-500/20 text-blue-300',
    },
    slate: {
      bg: 'bg-slate-900/60',
      border: 'border-slate-800',
      text: 'text-white',
      iconBg: 'bg-slate-800 text-slate-300',
    },
  };

  const scheme = colorMap[color];

  return (
    <div className={`p-5 rounded-2xl border ${scheme.border} ${scheme.bg} backdrop-blur-sm relative overflow-hidden transition-all duration-200 hover:border-slate-700`}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 font-mono">
          {title}
        </p>
        <div className={`p-2.5 rounded-xl ${scheme.iconBg}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <span className={`text-2xl font-bold tracking-tight ${scheme.text}`}>
          {value}
        </span>
        {trend && (
          <span className="text-xs font-medium font-mono text-emerald-400">
            {trend}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-1 text-xs text-slate-400">
          {subtitle}
        </p>
      )}
    </div>
  );
};
