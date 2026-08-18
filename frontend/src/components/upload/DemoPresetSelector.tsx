import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, ShieldBan, Sparkles, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { Invoice } from '../../types';

interface DemoPresetSelectorProps {
  onCaseTriggered: (invoice: Invoice) => void;
}

export const DemoPresetSelector: React.FC<DemoPresetSelectorProps> = ({ onCaseTriggered }) => {
  const [loadingCase, setLoadingCase] = useState<number | null>(null);

  const triggerCase = async (caseId: number) => {
    setLoadingCase(caseId);
    try {
      const inv = await api.triggerDemoCase(caseId);
      onCaseTriggered(inv);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCase(null);
    }
  };

  return (
    <div className="p-4 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-3">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-emerald-400" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
          Instant Demo Presets (Evaluation Mode)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Case 1: Safe */}
        <button
          onClick={() => triggerCase(1)}
          disabled={loadingCase !== null}
          className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 hover:border-emerald-500/50 text-left transition-all group disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-400 font-mono">
              Case 1: Safe
            </span>
            {loadingCase === 1 ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-1">
            Valid Invoice + PO
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            0% variance, clean math → <span className="text-emerald-400 font-semibold font-mono">AUTO_APPROVE</span>
          </p>
        </button>

        {/* Case 2: Exception */}
        <button
          onClick={() => triggerCase(2)}
          disabled={loadingCase !== null}
          className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:border-amber-500/50 text-left transition-all group disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-400 font-mono">
              Case 2: PO Variance
            </span>
            {loadingCase === 2 ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-1">
            ₹82,500 vs ₹76,100 PO
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            8.4% variance &gt; 5% → <span className="text-amber-400 font-semibold font-mono">HUMAN_REVIEW</span>
          </p>
        </button>

        {/* Case 3: Duplicate */}
        <button
          onClick={() => triggerCase(3)}
          disabled={loadingCase !== null}
          className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/50 text-left transition-all group disabled:opacity-50"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-400 font-mono">
              Case 3: Duplicate
            </span>
            {loadingCase === 3 ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
            ) : (
              <ShieldBan className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <p className="text-xs font-semibold text-slate-200 mt-1">
            Duplicate Invoice #
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            94% similarity match → <span className="text-rose-400 font-semibold font-mono">BLOCK</span>
          </p>
        </button>
      </div>
    </div>
  );
};
