import React, { useState, useEffect } from 'react';
import { PlaySquare, Sliders, TrendingUp, Clock, CheckCircle2, AlertTriangle, ArrowRight, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { SimulationResult } from '../types';

export const PolicySimulator: React.FC = () => {
  // Configurable simulation params
  const [autoApprovalLimit, setAutoApprovalLimit] = useState(50000);
  const [maxVariance, setMaxVariance] = useState(5);
  const [minConfidence, setMinConfidence] = useState(75);
  const [newVendorReview, setNewVendorReview] = useState(true);

  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const runSimulation = async () => {
    setIsSimulating(true);
    try {
      const res = await api.runSimulation({
        auto_approval_limit: autoApprovalLimit,
        maximum_po_variance_percent: maxVariance,
        minimum_extraction_confidence: minConfidence,
        new_vendor_requires_review: newVendorReview,
      });
      setSimulationResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSimulating(false);
    }
  };

  useEffect(() => {
    runSimulation();
  }, []);

  const diff = simulationResult?.difference;
  const base = simulationResult?.baseline;
  const prop = simulationResult?.proposed;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Counterfactual Sandbox
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Historical Impact Modeling</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Policy Impact Simulator
          </h1>
          <p className="text-xs text-slate-400 mt-1 max-w-3xl">
            Simulate how changing enterprise thresholds affects straight-through automation rates and reviewer triage workload before deploying policy changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Sliders & Parameters */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-400" />
              <span>Proposed Policy Parameters</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">Interactive</span>
          </div>

          {/* Slider 1: PO Variance Tolerance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Allowed PO Variance:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                {maxVariance}% (Baseline: 5%)
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={maxVariance}
              onChange={(e) => setMaxVariance(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>0% (Strict)</span>
              <span>10%</span>
              <span>20% (Permissive)</span>
            </div>
          </div>

          {/* Slider 2: Auto-Approval Ceiling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Auto-Approval Limit:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                ₹{autoApprovalLimit.toLocaleString()} (Baseline: ₹50,000)
              </span>
            </div>
            <input
              type="range"
              min="10000"
              max="150000"
              step="5000"
              value={autoApprovalLimit}
              onChange={(e) => setAutoApprovalLimit(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>₹10,000</span>
              <span>₹75,000</span>
              <span>₹150,000</span>
            </div>
          </div>

          {/* Slider 3: Minimum Model Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-semibold">Minimum Model Confidence:</span>
              <span className="font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded">
                {minConfidence}% (Baseline: 75%)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="5"
              value={minConfidence}
              onChange={(e) => setMinConfidence(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500">
              <span>50%</span>
              <span>75%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Toggle: New Vendor Review */}
          <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold text-slate-200">Mandatory New Vendor Review</p>
              <p className="text-[11px] text-slate-400">Require triage on unverified entities</p>
            </div>
            <input
              type="checkbox"
              checked={newVendorReview}
              onChange={(e) => setNewVendorReview(e.target.checked)}
              className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center space-x-2"
          >
            <PlaySquare className="w-4 h-4" />
            <span>{isSimulating ? 'Simulating on Dataset...' : 'Run Counterfactual Simulation'}</span>
          </button>
        </div>

        {/* Right: Projected Impact Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {/* Executive Impact Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-500/30 space-y-3">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
                Projected Operational Impact
              </h3>
            </div>
            <p className="text-sm font-medium text-slate-200 leading-relaxed">
              {simulationResult?.impact_summary || 'Adjust sliders on the left to see live projections.'}
            </p>
          </div>

          {/* Delta KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-[11px] font-mono uppercase text-slate-400">Automation Rate</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  {prop?.automation_rate || 0}%
                </span>
                <span className="text-xs font-mono text-slate-400">
                  ({(diff?.automation_rate_delta || 0) >= 0 ? `+${diff?.automation_rate_delta}%` : `${diff?.automation_rate_delta}%`})
                </span>
              </div>
              <p className="text-[10px] text-slate-500">Baseline: {base?.automation_rate || 0}%</p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-[11px] font-mono uppercase text-slate-400">Review Workload</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-amber-400">
                  {prop?.human_review_count || 0}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  cases
                </span>
              </div>
              <p className="text-[10px] text-slate-500">
                {(diff?.review_workload_reduction_count || 0) >= 0
                  ? `-${diff?.review_workload_reduction_count} cases avoided`
                  : `+${Math.abs(diff?.review_workload_reduction_count || 0)} extra reviews`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-1">
              <p className="text-[11px] font-mono uppercase text-slate-400">Reviewer Time Saved</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-bold font-mono text-emerald-400">
                  ~{diff?.estimated_reviewer_hours_saved || 0}
                </span>
                <span className="text-xs font-mono text-slate-400">hours</span>
              </div>
              <p className="text-[10px] text-slate-500">Assuming ~8m per review</p>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Before vs After Simulation Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                    <th className="pb-2">Metric</th>
                    <th className="pb-2">Current Policy</th>
                    <th className="pb-2">Proposed Policy</th>
                    <th className="pb-2 text-right">Net Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  <tr>
                    <td className="py-2.5 text-slate-300">Auto-Approved Count</td>
                    <td className="py-2.5 text-slate-400">{base?.auto_approved_count || 0}</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{prop?.auto_approved_count || 0}</td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      {(diff?.auto_approved_delta || 0) >= 0 ? `+${diff?.auto_approved_delta}` : diff?.auto_approved_delta}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300">Human Review Escalations</td>
                    <td className="py-2.5 text-slate-400">{base?.human_review_count || 0}</td>
                    <td className="py-2.5 text-amber-400 font-bold">{prop?.human_review_count || 0}</td>
                    <td className="py-2.5 text-right font-bold text-slate-300">
                      {(diff?.review_workload_reduction_count || 0) >= 0
                        ? `-${diff?.review_workload_reduction_count}`
                        : `+${Math.abs(diff?.review_workload_reduction_count || 0)}`}
                    </td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300">Blocked Critical Invoices</td>
                    <td className="py-2.5 text-slate-400">{base?.blocked_count || 0}</td>
                    <td className="py-2.5 text-rose-400 font-bold">{prop?.blocked_count || 0}</td>
                    <td className="py-2.5 text-right text-slate-400">0</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 text-slate-300">Automation Rate</td>
                    <td className="py-2.5 text-slate-400">{base?.automation_rate || 0}%</td>
                    <td className="py-2.5 text-emerald-400 font-bold">{prop?.automation_rate || 0}%</td>
                    <td className="py-2.5 text-right text-emerald-400 font-bold">
                      {(diff?.automation_rate_delta || 0) >= 0 ? `+${diff?.automation_rate_delta}%` : `${diff?.automation_rate_delta}%`}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
