import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle, RefreshCw } from 'lucide-react';
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
            <span className="bg-amber-50 text-amber-800 border border-amber-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              Human-in-the-Loop Triage
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-mono font-medium">Sorted by Highest Risk First</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            HITL Review Queue
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Review escalated transactions with policy violations, PO amount variances, or visual extraction uncertainty.
          </p>
        </div>

        <button
          onClick={loadQueue}
          className="flex items-center space-x-2 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold border border-slate-300 shadow-2xs transition-colors w-fit"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh Queue ({total})</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
        {invoices.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto" />
            <h3 className="text-base font-bold text-slate-900">Review Queue is Clear!</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto font-medium">
              All transactions have either been straight-through auto-approved or audited by the finance operations team.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-mono uppercase text-[10px]">
                  <th className="py-2.5 px-3 font-bold rounded-l-lg">Risk Priority</th>
                  <th className="py-2.5 px-3 font-bold">Invoice #</th>
                  <th className="py-2.5 px-3 font-bold">Vendor</th>
                  <th className="py-2.5 px-3 font-bold">Amount</th>
                  <th className="py-2.5 px-3 font-bold">Escalation Reason</th>
                  <th className="py-2.5 px-3 font-bold">Status</th>
                  <th className="py-2.5 px-3 font-bold text-right rounded-r-lg">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-3 font-mono">
                      <span className="font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-md border border-amber-200">
                        {inv.risk_score?.toFixed(0) || 0}/100 Risk
                      </span>
                    </td>
                    <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                      {inv.invoice_number || inv.id}
                    </td>
                    <td className="py-3.5 px-3 text-slate-700 font-medium">
                      {inv.vendor_name || 'Unknown'}
                    </td>
                    <td className="py-3.5 px-3 font-mono font-extrabold text-slate-900">
                      ₹{(inv.total_amount || 0).toLocaleString()}
                    </td>
                    <td className="py-3.5 px-3 text-slate-600 max-w-xs truncate font-medium">
                      {inv.decision_reason || 'Policy rule review required.'}
                    </td>
                    <td className="py-3.5 px-3">
                      <Badge variant="status" value={inv.reviewer_status || 'UNASSIGNED'} />
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      <Link
                        to={`/invoices/${inv.id}`}
                        className="px-2.5 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-mono font-semibold shadow-2xs transition-colors inline-block"
                      >
                        Inspect
                      </Link>
                      <button
                        onClick={() => openReview(inv)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all"
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
