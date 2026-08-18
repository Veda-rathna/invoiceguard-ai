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
    <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] space-y-3">
      <div className="flex items-center space-x-2">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
          Instant Evaluation Presets (Click to Test)
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Case 1: Safe */}
        <button
          onClick={() => triggerCase(1)}
          disabled={loadingCase !== null}
          className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50 text-left transition-all group disabled:opacity-50 shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-800 font-mono">
              Case 1: Safe
            </span>
            {loadingCase === 1 ? (
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 mt-1">
            Clean Invoice + PO
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            0% variance → <span className="text-emerald-700 font-bold font-mono">AUTO_APPROVE</span>
          </p>
        </button>

        {/* Case 2: Exception */}
        <button
          onClick={() => triggerCase(2)}
          disabled={loadingCase !== null}
          className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 hover:border-amber-400 hover:bg-amber-50 text-left transition-all group disabled:opacity-50 shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-800 font-mono">
              Case 2: PO Variance
            </span>
            {loadingCase === 2 ? (
              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 mt-1">
            ₹82.5k vs ₹76.1k PO
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            8.4% variance → <span className="text-amber-700 font-bold font-mono">HUMAN_REVIEW</span>
          </p>
        </button>

        {/* Case 3: Duplicate */}
        <button
          onClick={() => triggerCase(3)}
          disabled={loadingCase !== null}
          className="p-3 rounded-xl bg-rose-50/60 border border-rose-200 hover:border-rose-400 hover:bg-rose-50 text-left transition-all group disabled:opacity-50 shadow-2xs hover:shadow-xs"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-rose-800 font-mono">
              Case 3: Duplicate
            </span>
            {loadingCase === 3 ? (
              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
            ) : (
              <ShieldBan className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <p className="text-xs font-bold text-slate-800 mt-1">
            Duplicate Invoice #
          </p>
          <p className="text-[11px] text-slate-600 mt-0.5 font-medium">
            94% duplicate match → <span className="text-rose-700 font-bold font-mono">BLOCK</span>
          </p>
        </button>
      </div>
    </div>
  );
};
