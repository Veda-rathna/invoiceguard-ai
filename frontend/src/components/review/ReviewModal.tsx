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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-white">
              Human Review Action: #{invoice.invoice_number || invoice.id}
            </h3>
            <p className="text-xs text-slate-400">
              Vendor: {invoice.vendor_name || 'Unknown'} | Amount: ₹{(invoice.total_amount || 0).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reason / Exception Context */}
        <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-300 space-y-1">
          <p className="font-semibold font-mono uppercase text-[11px]">
            Escalation Reason:
          </p>
          <p>{invoice.decision_reason || 'Manual review required by risk policy.'}</p>
        </div>

        {/* Reviewer inputs */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Reviewer Name / Role
            </label>
            <input
              type="text"
              value={reviewerUser}
              onChange={(e) => setReviewerUser(e.target.value)}
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1">
              Audit Notes & Justification (Optional)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Verified price difference with vendor over email, approved variance..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2.5 pt-2">
          <button
            onClick={() => handleAction('APPROVE')}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
            <span>Approve</span>
          </button>

          <button
            onClick={() => handleAction('REQUEST_INFO')}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-bold text-xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <HelpCircle className="w-4 h-4" />}
            <span>Request Info</span>
          </button>

          <button
            onClick={() => handleAction('REJECT')}
            disabled={isSubmitting}
            className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition-all disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
            <span>Reject</span>
          </button>
        </div>
      </div>
    </div>
  );
};
