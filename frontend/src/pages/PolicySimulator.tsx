import React, { useState, useEffect } from 'react';
import { PlaySquare, Sliders, Sparkles } from 'lucide-react';
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
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              Counterfactual Sandbox
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-mono font-medium">Historical Impact Modeling</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Policy Impact Simulator
          </h1>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl font-medium">
            Simulate how modifying enterprise thresholds affects straight-through automation rates and reviewer triage workload before deploying policy changes.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Interactive Sliders & Parameters */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-emerald-600" />
              <span>Proposed Policy Parameters</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">Interactive</span>
          </div>

          {/* Slider 1: PO Variance Tolerance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-bold">Allowed PO Variance:</span>
              <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 font-semibold">
              <span>0% (Strict)</span>
              <span>10%</span>
              <span>20% (Permissive)</span>
            </div>
          </div>

          {/* Slider 2: Auto-Approval Ceiling */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-bold">Auto-Approval Limit:</span>
              <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 font-semibold">
              <span>₹10,000</span>
              <span>₹75,000</span>
              <span>₹150,000</span>
            </div>
          </div>

          {/* Slider 3: Minimum Model Confidence */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-800 font-bold">Minimum Model Confidence:</span>
              <span className="font-mono text-emerald-800 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-500 font-semibold">
              <span>50%</span>
              <span>75%</span>
              <span>95%</span>
            </div>
          </div>

          {/* Toggle: New Vendor Review */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-800">Mandatory New Vendor Review</p>
              <p className="text-[11px] text-slate-500 font-medium">Require triage on unverified entities</p>
            </div>
            <input
              type="checkbox"
              checked={newVendorReview}
              onChange={(e) => setNewVendorReview(e.target.checked)}
              className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
            />
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center space-x-2"
          >
            <PlaySquare className="w-4 h-4" />
            <span>{isSimulating ? 'Simulating on Historical Dataset...' : 'Run Counterfactual Simulation'}</span>
          </button>
        </div>

        {/* Right: Projected Impact Matrix */}
        <div className="lg:col-span-7 space-y-6">
          {/* Executive Impact Summary */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 border border-emerald-200 space-y-3 shadow-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
                Projected Operational Impact
              </h3>
            </div>
            <p className="text-sm font-semibold text-slate-800 leading-relaxed bg-white p-3.5 rounded-xl border border-emerald-100 shadow-2xs">
              {simulationResult?.impact_summary || 'Adjust sliders on the left to see live projections.'}
            </p>
          </div>

          {/* Delta KPI Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <p className="text-[11px] font-mono uppercase font-bold text-slate-500">Automation Rate</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold font-mono text-emerald-700">
                  {prop?.automation_rate || 0}%
                </span>
                <span className="text-xs font-mono font-bold text-slate-600">
                  ({(diff?.automation_rate_delta || 0) >= 0 ? `+${diff?.automation_rate_delta}%` : `${diff?.automation_rate_delta}%`})
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Baseline: {base?.automation_rate || 0}%</p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <p className="text-[11px] font-mono uppercase font-bold text-slate-500">Review Workload</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold font-mono text-amber-700">
                  {prop?.human_review_count || 0}
                </span>
                <span className="text-xs font-mono text-slate-600 font-bold">
                  cases
                </span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">
                {(diff?.review_workload_reduction_count || 0) >= 0
                  ? `-${diff?.review_workload_reduction_count} cases avoided`
                  : `+${Math.abs(diff?.review_workload_reduction_count || 0)} extra reviews`}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm space-y-1">
              <p className="text-[11px] font-mono uppercase font-bold text-slate-500">Reviewer Time Saved</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-2xl font-extrabold font-mono text-emerald-700">
                  ~{diff?.estimated_reviewer_hours_saved || 0}
                </span>
                <span className="text-xs font-mono text-slate-600 font-bold">hours</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium">Assuming ~8m per review</p>
            </div>
          </div>

          {/* Side-by-Side Comparison Matrix */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
              Before vs After Simulation Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase text-[10px]">
                    <th className="py-2.5 px-3 font-bold rounded-l-lg">Metric</th>
                    <th className="py-2.5 px-3 font-bold">Current Policy</th>
                    <th className="py-2.5 px-3 font-bold">Proposed Policy</th>
                    <th className="py-2.5 px-3 font-bold text-right rounded-r-lg">Net Change</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-800 font-semibold font-sans">Auto-Approved Count</td>
                    <td className="py-3 px-3 text-slate-600">{base?.auto_approved_count || 0}</td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">{prop?.auto_approved_count || 0}</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-bold">
                      {(diff?.auto_approved_delta || 0) >= 0 ? `+${diff?.auto_approved_delta}` : diff?.auto_approved_delta}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-800 font-semibold font-sans">Human Review Escalations</td>
                    <td className="py-3 px-3 text-slate-600">{base?.human_review_count || 0}</td>
                    <td className="py-3 px-3 text-amber-700 font-bold">{prop?.human_review_count || 0}</td>
                    <td className="py-3 px-3 text-right font-bold text-slate-700">
                      {(diff?.review_workload_reduction_count || 0) >= 0
                        ? `-${diff?.review_workload_reduction_count}`
                        : `+${Math.abs(diff?.review_workload_reduction_count || 0)}`}
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-800 font-semibold font-sans">Blocked Critical Invoices</td>
                    <td className="py-3 px-3 text-slate-600">{base?.blocked_count || 0}</td>
                    <td className="py-3 px-3 text-rose-700 font-bold">{prop?.blocked_count || 0}</td>
                    <td className="py-3 px-3 text-right text-slate-500">0</td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3 px-3 text-slate-800 font-semibold font-sans">Automation Rate</td>
                    <td className="py-3 px-3 text-slate-600">{base?.automation_rate || 0}%</td>
                    <td className="py-3 px-3 text-emerald-700 font-bold">{prop?.automation_rate || 0}%</td>
                    <td className="py-3 px-3 text-right text-emerald-700 font-bold">
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
