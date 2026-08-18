import React, { useState } from 'react';
import { X, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { api } from '../../api/client';
import { Invoice } from '../../types';

interface ReviewModalProps {
  invoice: Invoice | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: (updated: Invoice) => void;
}

export const ReviewModal: React.FC<ReviewModalProps> = ({
  invoice,
  isOpen,
  onClose,
  onActionComplete,
}) => {
  const [comment, setComment] = useState('');
  const [reviewerUser, setReviewerUser] = useState('Senior Finance Reviewer');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !invoice) return null;

  const handleAction = async (action: 'APPROVE' | 'REJECT' | 'REQUEST_INFO') => {
    setIsSubmitting(true);
    try {
      const updated = await api.submitReviewAction(
        invoice.id,
        action,
        reviewerUser,
        comment
      );
      onActionComplete(updated);
      onClose();
    } catch (err) {
      console.error('Failed to submit reviewer action', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 text-slate-900 animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 font-mono">
              Human Review: #{invoice.invoice_number || invoice.id}
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              Vendor: <span className="text-slate-800 font-semibold">{invoice.vendor_name || 'Unknown'}</span> | Amount: <span className="text-emerald-700 font-bold font-mono">₹{(invoice.total_amount || 0).toLocaleString()}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason / Exception Context */}
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
          <p className="font-bold font-mono uppercase text-[11px] text-amber-800">
            Escalation Reason:
          </p>
          <p className="leading-relaxed font-medium">{invoice.decision_reason || 'Manual review required by risk policy.'}</p>
        </div>

        {/* Reviewer inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Reviewer Name / Role
            </label>
            <input
              type="text"
              value={reviewerUser}
              onChange={(e) => setReviewerUser(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Audit Notes & Justification (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Verified price difference with vendor over email, approved one-time variance..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs font-medium"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={() => handleAction('APPROVE')}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Approve</span>
          </button>

          <button
            onClick={() => handleAction('REQUEST_INFO')}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold text-xs shadow-2xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
            <span>Request Info</span>
          </button>

          <button
            onClick={() => handleAction('REJECT')}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs shadow-2xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
};
