import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, RefreshCw, ArrowRight, ExternalLink } from 'lucide-react';
import { api } from '../api/client';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';

export const Invoices: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [riskFilter, setRiskFilter] = useState('');

  const loadInvoices = async () => {
    setLoading(true);
    try {
      const data = await api.getInvoices({
        page,
        size: 15,
        vendor_name: search || undefined,
        decision: decisionFilter || undefined,
        risk_level: riskFilter || undefined,
      });
      setInvoices(data.items);
      setTotal(data.total);
      setTotalPages(data.total_pages);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [page, decisionFilter, riskFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadInvoices();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            Financial Documents Explorer
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Complete searchable ledger of all processed invoices, PO reconciliations, and risk scores.
          </p>
        </div>

        <button
          onClick={loadInvoices}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          />
        </form>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          {/* Decision Filter */}
          <select
            value={decisionFilter}
            onChange={(e) => {
              setDecisionFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Decisions</option>
            <option value="AUTO_APPROVE">Auto Approved</option>
            <option value="HUMAN_REVIEW">Human Review</option>
            <option value="BLOCK">Blocked</option>
          </select>

          {/* Risk Filter */}
          <select
            value={riskFilter}
            onChange={(e) => {
              setRiskFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-emerald-500"
          >
            <option value="">All Risk Tiers</option>
            <option value="LOW">Low (0-30)</option>
            <option value="MEDIUM">Medium (31-60)</option>
            <option value="HIGH">High (61-80)</option>
            <option value="CRITICAL">Critical (81-100)</option>
          </select>
        </div>
      </div>

      {/* Invoices Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                <th className="pb-3 font-semibold">Invoice #</th>
                <th className="pb-3 font-semibold">Vendor</th>
                <th className="pb-3 font-semibold">Date</th>
                <th className="pb-3 font-semibold">Total Amount</th>
                <th className="pb-3 font-semibold">PO #</th>
                <th className="pb-3 font-semibold">PO Variance</th>
                <th className="pb-3 font-semibold">Extraction Conf</th>
                <th className="pb-3 font-semibold">Risk Score</th>
                <th className="pb-3 font-semibold">Routing Decision</th>
                <th className="pb-3 font-semibold text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                  <td className="py-3.5 font-mono text-slate-200 font-bold">
                    {inv.invoice_number || inv.id}
                  </td>
                  <td className="py-3.5 text-slate-300">
                    {inv.vendor_name || 'Unknown'}
                  </td>
                  <td className="py-3.5 text-slate-400 font-mono">
                    {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 font-mono font-bold text-white">
                    ₹{(inv.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 font-mono text-slate-300">
                    {inv.po_number || '—'}
                  </td>
                  <td className="py-3.5 font-mono">
                    {inv.po_variance_percent ? (
                      <span className={inv.po_variance_percent > 5 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                        {inv.po_variance_percent > 0 ? `+${inv.po_variance_percent}%` : `${inv.po_variance_percent}%`}
                      </span>
                    ) : (
                      <span className="text-slate-500">0.0%</span>
                    )}
                  </td>
                  <td className="py-3.5 font-mono">
                    <span className={inv.extraction_confidence < 0.75 ? 'text-amber-400 font-bold' : 'text-emerald-400'}>
                      {(inv.extraction_confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3.5 font-mono">
                    <span
                      className={`font-bold ${
                        inv.risk_score <= 30
                          ? 'text-emerald-400'
                          : inv.risk_score <= 60
                          ? 'text-blue-400'
                          : inv.risk_score <= 80
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {inv.risk_score?.toFixed(0) || 0}/100
                    </span>
                  </td>
                  <td className="py-3.5">
                    <Badge variant="decision" value={inv.decision} />
                  </td>
                  <td className="py-3.5 text-right">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-xs font-mono text-emerald-400 hover:text-emerald-300 font-semibold inline-flex items-center space-x-1"
                    >
                      <span>View</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-800 text-xs text-slate-400">
          <span>
            Showing {invoices.length} of {total} records (Page {page} of {totalPages})
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
