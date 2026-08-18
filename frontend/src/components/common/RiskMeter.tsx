import React from 'react';
import { AlertTriangle, CheckCircle, ShieldAlert, AlertOctagon } from 'lucide-react';

interface RiskMeterProps {
  score: number;
  level?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskMeter: React.FC<RiskMeterProps> = ({ score, level, size = 'md' }) => {
  const normalized = Math.min(100, Math.max(0, score));

  const getRiskInfo = () => {
    if (normalized <= 30) {
      return {
        label: 'LOW RISK',
        color: 'text-emerald-700',
        bg: 'bg-emerald-500',
        borderColor: 'border-emerald-200',
        badgeBg: 'bg-emerald-50 text-emerald-800',
        icon: CheckCircle,
        desc: 'Eligible for straight-through automation',
      };
    }
    if (normalized <= 60) {
      return {
        label: 'MEDIUM RISK',
        color: 'text-blue-700',
        bg: 'bg-blue-500',
        borderColor: 'border-blue-200',
        badgeBg: 'bg-blue-50 text-blue-800',
        icon: AlertTriangle,
        desc: 'Requires secondary verification',
      };
    }
    if (normalized <= 80) {
      return {
        label: 'HIGH RISK',
        color: 'text-amber-700',
        bg: 'bg-amber-500',
        borderColor: 'border-amber-200',
        badgeBg: 'bg-amber-50 text-amber-800',
        icon: ShieldAlert,
        desc: 'Escalated to Human Review queue',
      };
    }
    return {
      label: 'CRITICAL RISK',
      color: 'text-rose-700',
      bg: 'bg-rose-500',
      borderColor: 'border-rose-200',
      badgeBg: 'bg-rose-50 text-rose-800',
      icon: AlertOctagon,
      desc: 'Blocked to prevent potential financial loss',
    };
  };

  const info = getRiskInfo();
  const Icon = info.icon;

  return (
    <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Icon className={`w-5 h-5 ${info.color}`} />
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
            Composite Risk Score
          </span>
        </div>
        <span className={`text-xl font-extrabold font-mono ${info.color}`}>
          {normalized.toFixed(0)}
          <span className="text-xs text-slate-400">/100</span>
        </span>
      </div>

      {/* Progress Track */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200/80">
        <div
          className={`h-full rounded-full transition-all duration-500 ${info.bg}`}
          style={{ width: `${normalized}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs">
        <span className={`font-mono font-bold px-2 py-0.5 rounded-md border ${info.badgeBg} ${info.borderColor}`}>
          {level ? level.toUpperCase() : info.label}
        </span>
        <span className="text-slate-500 text-[11px] font-medium">{info.desc}</span>
      </div>
    </div>
  );
};
