import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, RefreshCw, ArrowRight } from 'lucide-react';
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
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Financial Documents Explorer
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Searchable repository of all processed invoices, PO reconciliations, and risk scores.
          </p>
        </div>

        <button
          onClick={loadInvoices}
          className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Ledger</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by vendor name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs font-medium"
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
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
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
            className="px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-700 font-semibold focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
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
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                <th className="py-2.5 px-3 font-bold rounded-l-lg">Invoice #</th>
                <th className="py-2.5 px-3 font-bold">Vendor</th>
                <th className="py-2.5 px-3 font-bold">Date</th>
                <th className="py-2.5 px-3 font-bold">Total Amount</th>
                <th className="py-2.5 px-3 font-bold">PO #</th>
                <th className="py-2.5 px-3 font-bold">PO Variance</th>
                <th className="py-2.5 px-3 font-bold">Extraction Conf</th>
                <th className="py-2.5 px-3 font-bold">Risk Score</th>
                <th className="py-2.5 px-3 font-bold">Routing Decision</th>
                <th className="py-2.5 px-3 font-bold text-right rounded-r-lg">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {invoices.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                    {inv.invoice_number || inv.id}
                  </td>
                  <td className="py-3.5 px-3 text-slate-700 font-medium">
                    {inv.vendor_name || 'Unknown'}
                  </td>
                  <td className="py-3.5 px-3 text-slate-500 font-mono">
                    {inv.invoice_date ? new Date(inv.invoice_date).toLocaleDateString() : 'N/A'}
                  </td>
                  <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900">
                    ₹{(inv.total_amount || 0).toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 font-mono text-slate-600">
                    {inv.po_number || '—'}
                  </td>
                  <td className="py-3.5 px-3 font-mono">
                    {inv.po_variance_percent ? (
                      <span className={inv.po_variance_percent > 5 ? 'text-amber-700 font-bold' : 'text-slate-600'}>
                        {inv.po_variance_percent > 0 ? `+${inv.po_variance_percent}%` : `${inv.po_variance_percent}%`}
                      </span>
                    ) : (
                      <span className="text-slate-400">0.0%</span>
                    )}
                  </td>
                  <td className="py-3.5 px-3 font-mono">
                    <span className={inv.extraction_confidence < 0.75 ? 'text-amber-700 font-bold' : 'text-emerald-700 font-bold'}>
                      {(inv.extraction_confidence * 100).toFixed(0)}%
                    </span>
                  </td>
                  <td className="py-3.5 px-3 font-mono">
                    <span
                      className={`font-bold ${
                        inv.risk_score <= 30
                          ? 'text-emerald-700'
                          : inv.risk_score <= 60
                          ? 'text-blue-700'
                          : inv.risk_score <= 80
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {inv.risk_score?.toFixed(0) || 0}/100
                    </span>
                  </td>
                  <td className="py-3.5 px-3">
                    <Badge variant="decision" value={inv.decision} />
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <Link
                      to={`/invoices/${inv.id}`}
                      className="text-xs font-mono text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center space-x-1"
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
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
          <span>
            Showing {invoices.length} of {total} records (Page {page} of {totalPages})
          </span>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-medium shadow-2xs transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 disabled:opacity-40 text-slate-700 font-medium shadow-2xs transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
