import React from 'react';
import { RiskFactor } from '../../types';
import { AlertCircle, FileSearch } from 'lucide-react';

interface EvidenceCardProps {
  factors: RiskFactor[];
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
        No risk factors or exceptions flagged for this transaction.
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-3">
      {factors.map((factor, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-bold text-slate-900">
                {factor.factor}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                +{factor.contribution} pts
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-bold ${getSeverityBadge(
                  factor.severity
                )}`}
              >
                {factor.severity}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 font-medium">
            {factor.description}
          </p>

          {factor.evidence && (
            <div className="mt-2 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-emerald-800 flex items-start space-x-2">
              <FileSearch className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Evidence: {factor.evidence}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
