import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { UserCheck, ShieldAlert, ArrowRight, CheckCircle, XCircle, HelpCircle, RefreshCw } from 'lucide-react';
import { api } from '../api/client';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';
import { ReviewModal } from '../components/review/ReviewModal';

export const ReviewQueue: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await api.getReviewQueue(1, 50);
      setInvoices(data.items);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const openReview = (inv: Invoice) => {
    setSelectedInvoice(inv);
    setIsModalOpen(true);
  };

  const handleActionComplete = (updated: Invoice) => {
    setInvoices((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Human-in-the-Loop Triage
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Sorted by Highest Risk First</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            HITL Review Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review escalated transactions with policy violations, PO amount variances, or low extraction confidence.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="flex items-center space-x-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold border border-slate-700 transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue ({total})</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
        {invoices.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
            <h3 className="text-sm font-bold text-slate-200">Review Queue is Clear!</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All transactions have either been straight-through auto-approved or audited by the operations team.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-mono uppercase text-[10px]">
                  <th className="pb-3 font-semibold">Risk Priority</th>
                  <th className="pb-3 font-semibold">Invoice #</th>
                  <th className="pb-3 font-semibold">Vendor</th>
                  <th className="pb-3 font-semibold">Amount</th>
                  <th className="pb-3 font-semibold">Escalation Reason</th>
                  <th className="pb-3 font-semibold">Status</th>
                  <th className="pb-3 font-semibold text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-850/50 transition-colors">
                    <td className="py-3.5 font-mono">
                      <span className="font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        {inv.risk_score?.toFixed(0) || 0}/100 Risk
                      </span>
                    </td>
                    <td className="py-3.5 font-mono font-bold text-slate-200">
                      {inv.invoice_number || inv.id}
                    </td>
                    <td className="py-3.5 text-slate-300">
                      {inv.vendor_name || 'Unknown'}
                    </td>
                    <td className="py-3.5 font-mono font-bold text-white">
                      ₹{(inv.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 text-slate-300 max-w-xs truncate">
                      {inv.decision_reason || 'Policy rule review required.'}
                    </td>
                    <td className="py-3.5">
                      <Badge variant="status" value={inv.reviewer_status || 'UNASSIGNED'} />
                    </td>
                    <td className="py-3.5 text-right space-x-2">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono font-semibold transition-colors"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => openReview(inv)}
                        className="px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-sm"
                      >
                        Triage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Action Modal */}
      <ReviewModal
        invoice={selectedInvoice}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
};
