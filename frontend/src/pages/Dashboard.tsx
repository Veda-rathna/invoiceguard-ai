import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertTriangle,
  ShieldBan,
  TrendingUp,
  ArrowRight,
  FileText
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip
} from 'recharts';

import { api } from '../api/client';
import { DashboardMetrics, Invoice } from '../types';
import { StatCard } from '../components/common/StatCard';
import { Badge } from '../components/common/Badge';
import { FileUpload } from '../components/upload/FileUpload';
import { DemoPresetSelector } from '../components/upload/DemoPresetSelector';

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentInvoices, setRecentInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [m, invs] = await Promise.all([
        api.getDashboardMetrics(),
        api.getInvoices({ size: 6 }),
      ]);
      setMetrics(m);
      setRecentInvoices(invs.items);
    } catch (err) {
      console.error('Failed to load dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleInvoiceProcessed = (invoice: Invoice) => {
    navigate(`/invoices/${invoice.id}`);
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-emerald-50/80 via-white to-teal-50/60 p-7 rounded-3xl border border-emerald-100 shadow-[0_2px_8px_rgba(0,0,0,0.03)]">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-100/80 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              Autonomous Exception Routing
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-medium">Amazon Bedrock Qwen3-VL</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 tracking-tight mt-1.5">
            Finance Operations Command Center
          </h1>
          <p className="text-sm text-slate-600 mt-1.5 max-w-2xl font-medium leading-relaxed">
            InvoiceGuard AI automates clean, low-risk invoices and intelligently routes exceptions, PO variances, and duplicate attempts to reviewers with full audit evidence.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <Link
            to="/simulator"
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs border border-slate-300 shadow-2xs transition-colors"
          >
            Policy Simulator
          </Link>
          <Link
            to="/review"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-1.5"
          >
            <span>Review Queue</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Processed"
          value={metrics?.total_processed || 0}
          subtitle="Total invoices"
          icon={FileText}
          color="slate"
        />
        <StatCard
          title="Auto-Approved"
          value={metrics?.auto_approved || 0}
          subtitle="Zero-touch clearing"
          icon={CheckCircle2}
          color="emerald"
        />
        <StatCard
          title="Human Review"
          value={metrics?.human_review || 0}
          subtitle="Requires triage"
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="Blocked"
          value={metrics?.blocked || 0}
          subtitle="Critical risk stopped"
          icon={ShieldBan}
          color="rose"
        />
        <StatCard
          title="Automation Rate"
          value={`${metrics?.automation_rate || 0}%`}
          subtitle="Finance ops efficiency"
          icon={TrendingUp}
          color="emerald"
          trend="+14% this month"
        />
      </div>

      {/* Interactive Ingestion & Demo Presets Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6">
          <FileUpload onProcessed={handleInvoiceProcessed} />
        </div>
        <div className="lg:col-span-6">
          <DemoPresetSelector onCaseTriggered={handleInvoiceProcessed} />
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Decisions Donut */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Decision Distribution
            </h3>
            <span className="text-xs text-slate-500 font-mono">Real-time</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={metrics?.decisions_distribution || []}
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {(metrics?.decisions_distribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs font-mono pt-3 border-t border-slate-100">
            <div>
              <p className="text-emerald-700 font-bold text-sm">{metrics?.auto_approved || 0}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Approved</p>
            </div>
            <div>
              <p className="text-amber-700 font-bold text-sm">{metrics?.human_review || 0}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Review</p>
            </div>
            <div>
              <p className="text-rose-700 font-bold text-sm">{metrics?.blocked || 0}</p>
              <p className="text-[10px] text-slate-500 font-semibold">Blocked</p>
            </div>
          </div>
        </div>

        {/* Top Exception Breakdown Bars */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">
              Top Exception Drivers
            </h3>
            <span className="text-xs text-slate-500 font-mono">By Frequency</span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={metrics?.exceptions_breakdown || []}
                layout="vertical"
                margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
              >
                <XAxis type="number" stroke="#94a3b8" fontSize={11} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={130} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    color: '#0f172a',
                    fontSize: '12px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                />
                <Bar dataKey="count" fill="#0284c7" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Invoices Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Recently Ingested Financial Documents
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Live updates from the LangGraph multi-agent pipeline
            </p>
          </div>
          <Link
            to="/invoices"
            className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center space-x-1"
          >
            <span>View all invoices</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3 font-bold rounded-l-lg">Invoice #</th>
                <th className="py-2.5 px-3 font-bold">Vendor</th>
                <th className="py-2.5 px-3 font-bold">Amount</th>
                <th className="py-2.5 px-3 font-bold">PO Match</th>
                <th className="py-2.5 px-3 font-bold">Risk Score</th>
                <th className="py-2.5 px-3 font-bold">Decision</th>
                <th className="py-2.5 px-3 font-bold text-right rounded-r-lg">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {recentInvoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {inv.invoice_number || inv.id}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">
                    {inv.vendor_name || 'Unknown'}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900">
                    ₹{(inv.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge variant="status" value={inv.po_match_status || 'N/A'} />
                  </td>
                  <td className="py-3.5 px-3 font-mono">
                    <span className={`font-bold ${inv.risk_score <= 30 ? 'text-emerald-700' : inv.risk_score <= 60 ? 'text-blue-700' : 'text-amber-700'}`}>
                      {inv.risk_score?.toFixed(0) || 0}/100
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge variant="decision" value={inv.decision} />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-xs font-mono text-emerald-700 hover:text-emerald-800 underline font-bold"
                    >
                      Inspect →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
