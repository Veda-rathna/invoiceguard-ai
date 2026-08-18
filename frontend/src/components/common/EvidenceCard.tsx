import React from 'react';
import { RiskFactor } from '../../types';
import { AlertCircle, FileSearch, TrendingUp, ShieldAlert } from 'lucide-react';

interface EvidenceCardProps {
  factors: RiskFactor[];
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
        No risk factors or exceptions flagged for this transaction.
      </div>
    );
  }

  const getSeverityBadge = (severity: string) => {
    switch (severity.toUpperCase()) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-3">
      {factors.map((factor, idx) => (
        <div
          key={idx}
          className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 hover:border-slate-700 transition-colors space-y-2"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-slate-200">
                {factor.factor}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-mono font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                +{factor.contribution} pts
              </span>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold ${getSeverityBadge(
                  factor.severity
                )}`}
              >
                {factor.severity}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-300">
            {factor.description}
          </p>

          {factor.evidence && (
            <div className="mt-2 p-2 rounded bg-slate-950/60 border border-slate-800 text-xs font-mono text-emerald-400/90 flex items-start space-x-2">
              <FileSearch className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>Evidence: {factor.evidence}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
