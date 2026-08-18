import React from 'react';

interface BadgeProps {
  variant?: 'decision' | 'risk' | 'status' | 'default';
  value: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ variant = 'default', value, className = '' }) => {
  const getColors = () => {
    const val = (value || '').toUpperCase();

    // Decisions & Positive Statuses
    if (val === 'AUTO_APPROVE' || val === 'APPROVED' || val === 'PASS' || val === 'EXACT_MATCH') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    // Review & Warning Statuses
    if (val === 'HUMAN_REVIEW' || val === 'IN_REVIEW' || val === 'PARTIAL_MATCH' || val === 'WARNING') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    // Block & Critical Statuses
    if (val === 'BLOCK' || val === 'REJECTED' || val === 'FAIL' || val === 'MISMATCH' || val === 'SUSPECTED_DUPLICATE') {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }
    // Info Statuses
    if (val === 'REQUEST_INFO' || val === 'INFO' || val === 'PO_NOT_REQUIRED') {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }

    // Risk Levels
    if (val === 'LOW') {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
    if (val === 'MEDIUM') {
      return 'bg-blue-50 text-blue-800 border-blue-200';
    }
    if (val === 'HIGH') {
      return 'bg-amber-50 text-amber-800 border-amber-200';
    }
    if (val === 'CRITICAL') {
      return 'bg-rose-50 text-rose-800 border-rose-200';
    }

    return 'bg-slate-100 text-slate-700 border-slate-200';
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
