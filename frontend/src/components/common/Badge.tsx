import React from 'react';

interface BadgeProps {
  variant?: 'decision' | 'risk' | 'status' | 'default';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', value, className = '' }) => {
  const getColors = () => {
    const val = (value || '').toUpperCase();

    // Decisions
    if (val === 'AUTO_APPROVE' || val === 'APPROVED' || val === 'PASS' || val === 'EXACT_MATCH') {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (val === 'HUMAN_REVIEW' || val === 'IN_REVIEW' || val === 'PARTIAL_MATCH' || val === 'WARNING') {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    if (val === 'BLOCK' || val === 'REJECTED' || val === 'FAIL' || val === 'MISMATCH' || val === 'SUSPECTED_DUPLICATE') {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }
    if (val === 'REQUEST_INFO' || val === 'INFO') {
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }

    // Risk Levels
    if (val === 'LOW') {
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
    }
    if (val === 'MEDIUM') {
      return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
    }
    if (val === 'HIGH') {
      return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    }
    if (val === 'CRITICAL') {
      return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    }

    return 'bg-slate-800 text-slate-300 border-slate-700';
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold font-mono border ${getColors()} ${className}`}
    >
      {formatText(value)}
    </span>
  );
};
