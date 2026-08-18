import React, { useEffect, useState } from 'react';
import { Save, CheckCircle2, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { PolicyRule } from '../types';

export const PolicyManagement: React.FC = () => {
  const [policies, setPolicies] = useState<PolicyRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const loadPolicies = async () => {
    setLoading(true);
    try {
      const data = await api.getPolicies();
      setPolicies(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPolicies();
  }, []);

  const handleUpdate = async (rule: PolicyRule) => {
    setSavingKey(rule.rule_key);
    setSuccessMsg(null);
    try {
      await api.updatePolicy(rule.rule_key, {
        threshold_value: rule.threshold_value,
        bool_value: rule.bool_value,
        is_active: rule.is_active,
        severity_if_failed: rule.severity_if_failed,
        risk_points: rule.risk_points,
      });
      setSuccessMsg(`Policy '${rule.name}' updated successfully!`);
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingKey(null);
    }
  };

  const handleFieldChange = (index: number, field: keyof PolicyRule, value: any) => {
    const next = [...policies];
    next[index] = { ...next[index], [field]: value };
    setPolicies(next);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              Deterministic Governance
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-mono font-medium">Dynamic Rule Configuration</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Enterprise Expense Policies
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Configure automated approval ceilings, PO matching tolerances, and compliance rules evaluated by the Policy Agent.
          </p>
        </div>

        <button
          onClick={loadPolicies}
          className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Reload Rules</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 font-bold flex items-center space-x-2 shadow-2xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Rules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {policies.map((rule, idx) => (
          <div
            key={rule.id || rule.rule_key}
            className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold">
                  {rule.category}
                </span>
                <label className="flex items-center space-x-2 cursor-pointer text-xs">
                  <span className="text-slate-600 font-mono text-[11px] font-semibold">Active</span>
                  <input
                    type="checkbox"
                    checked={rule.is_active}
                    onChange={(e) => handleFieldChange(idx, 'is_active', e.target.checked)}
                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                  />
                </label>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{rule.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                {rule.description}
              </p>
            </div>

            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                {/* Threshold input if numeric */}
                {rule.threshold_value !== undefined && rule.threshold_value !== null && (
                  <div>
                    <label className="block text-slate-600 text-[11px] mb-1 font-mono font-bold">
                      Threshold ({rule.unit || 'Value'})
                    </label>
                    <input
                      type="number"
                      value={rule.threshold_value}
                      onChange={(e) =>
                        handleFieldChange(idx, 'threshold_value', parseFloat(e.target.value) || 0)
                      }
                      className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                    />
                  </div>
                )}

                {/* Risk Points */}
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-mono font-bold">
                    Penalty Risk Points
                  </label>
                  <input
                    type="number"
                    value={rule.risk_points}
                    onChange={(e) =>
                      handleFieldChange(idx, 'risk_points', parseFloat(e.target.value) || 0)
                    }
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs"
                  />
                </div>

                {/* Severity */}
                <div>
                  <label className="block text-slate-600 text-[11px] mb-1 font-mono font-bold">
                    Severity on Failure
                  </label>
                  <select
                    value={rule.severity_if_failed}
                    onChange={(e) => handleFieldChange(idx, 'severity_if_failed', e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>

              <button
                onClick={() => handleUpdate(rule)}
                disabled={savingKey === rule.rule_key}
                className="w-full py-2 bg-slate-900 hover:bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1.5 transition-colors disabled:opacity-50 shadow-2xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingKey === rule.rule_key ? 'Saving Changes...' : 'Save Policy Parameters'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
