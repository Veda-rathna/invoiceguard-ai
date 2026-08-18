import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  GitCompare,
  Sliders,
  AlertOctagon,
  Sparkles,
  UserCheck,
  Download,
  Info,
  Clock,
  Layers
} from 'lucide-react';

import { api } from '../api/client';
import { Invoice } from '../types';
import { Badge } from '../components/common/Badge';
import { RiskMeter } from '../components/common/RiskMeter';
import { EvidenceCard } from '../components/common/EvidenceCard';
import { AgentTimeline } from '../components/agents/AgentTimeline';
import { ReviewModal } from '../components/review/ReviewModal';

export const InvoiceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const loadInvoice = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await api.getInvoiceById(id);
      setInvoice(data);
    } catch (err) {
      console.error('Failed to load invoice', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoice();
  }, [id]);

  if (loading || !invoice) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-400">Loading invoice and multi-agent audit state...</p>
        </div>
      </div>
    );
  }

  const extracted: any = invoice.extracted_data || {};
  const fieldConf = invoice.field_confidence || {};
  const poDetails: any = invoice.po_match_details || {};
  const lineItems = extracted.line_items || [];

  return (
    <div className="space-y-6 pb-16">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/invoices"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-extrabold text-white font-mono">
                #{invoice.invoice_number || invoice.id}
              </h1>
              <Badge variant="decision" value={invoice.decision} />
              <Badge variant="risk" value={invoice.risk_level} />
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Vendor: <span className="text-slate-200 font-medium">{invoice.vendor_name || 'Unknown'}</span> | Total: <span className="text-emerald-400 font-bold font-mono">₹{(invoice.total_amount || 0).toLocaleString()}</span> | Processed in {invoice.processing_latency_ms?.toFixed(0) || 380}ms
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.decision !== 'AUTO_APPROVE' && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-lg shadow-emerald-500/20 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Review / Override</span>
            </button>
          )}
        </div>
      </div>

      {/* Decision Summary & Factual AI Explanation Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-850 border border-slate-800 space-y-3 shadow-lg">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-400" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
            Explainable AI Decision Brief (Qwen3-VL Verified)
          </h2>
        </div>
        <p className="text-sm text-slate-200 leading-relaxed font-medium bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80">
          {invoice.explanation || invoice.decision_reason || 'Autonomous multi-agent analysis complete.'}
        </p>
      </div>

      {/* Main 2-Column Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Original Document Viewer & Extracted Fields */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Preview */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-200">
                <FileText className="w-4 h-4 text-emerald-400" />
                <span>Original Financial Document</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">{invoice.original_filename}</span>
            </div>

            <div className="aspect-[3/4] w-full rounded-xl bg-slate-950 border border-slate-800 overflow-hidden flex items-center justify-center relative group">
              <img
                src={`/api/v1/invoices/${invoice.id}/file`}
                alt="Document Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  // Fallback if image not directly previewable
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <a
                  href={`/api/v1/invoices/${invoice.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-3.5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl text-xs flex items-center space-x-1.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Open Full Document</span>
                </a>
              </div>
            </div>
          </div>

          {/* Extracted Structured Fields with Confidence Badges */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                Extracted Fields & Confidences
              </h3>
              <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Overall: {((invoice.extraction_confidence || 0.95) * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <span className="text-slate-400">Vendor Name:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-slate-200">{extracted.vendor_name || 'N/A'}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    {((fieldConf.vendor_name || 0.98) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <span className="text-slate-400">Invoice Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-200">{extracted.invoice_number || 'N/A'}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    {((fieldConf.invoice_number || 0.99) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <span className="text-slate-400">PO Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono text-slate-200">{extracted.po_number || 'None'}</span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded">
                    {((fieldConf.po_number || 0.95) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <span className="text-slate-400">Subtotal:</span>
                <span className="font-mono font-semibold text-slate-200">
                  ₹{(extracted.subtotal || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-850">
                <span className="text-slate-400">Tax / GST:</span>
                <span className="font-mono font-semibold text-slate-200">
                  ₹{(extracted.tax || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                <span className="font-bold text-emerald-300">Grand Total:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-extrabold text-sm text-emerald-400">
                    ₹{(extracted.total || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/20 px-1.5 py-0.2 rounded">
                    {((fieldConf.total || 0.98) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            {lineItems.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <p className="text-[11px] font-mono font-semibold uppercase text-slate-400">
                  Extracted Line Items ({lineItems.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-slate-500 font-mono border-b border-slate-800 pb-1">
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th className="text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/40">
                      {lineItems.map((itm: any, idx: number) => (
                        <tr key={idx} className="text-slate-300">
                          <td className="py-1.5 pr-2">{itm.description}</td>
                          <td className="py-1.5 font-mono">{itm.quantity}</td>
                          <td className="py-1.5 font-mono">₹{(itm.unit_price || 0).toLocaleString()}</td>
                          <td className="py-1.5 font-mono font-bold text-right text-emerald-400">
                            ₹{(itm.total || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: PO 3-Way Reconciliation, Policies, Risk Factors & Agent Timeline */}
        <div className="lg:col-span-7 space-y-6">
          {/* Purchase Order 3-Way Match Card */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Purchase Order 3-Way Matching
                </h3>
              </div>
              <Badge variant="status" value={invoice.po_match_status || 'NOT_EVALUATED'} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[10px]">PO Reference</p>
                <p className="text-slate-200 font-bold mt-0.5">{invoice.po_number || 'None'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[10px]">Invoice Total</p>
                <p className="text-slate-200 font-bold mt-0.5">₹{(invoice.total_amount || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[10px]">Approved PO Amount</p>
                <p className="text-slate-200 font-bold mt-0.5">
                  ₹{(poDetails.po_total || invoice.total_amount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                <p className="text-slate-500 text-[10px]">PO Variance</p>
                <p className={`font-bold mt-0.5 ${invoice.po_variance_percent > 5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {invoice.po_variance_percent > 0 ? `+${invoice.po_variance_percent}%` : `${invoice.po_variance_percent || 0}%`}
                </p>
              </div>
            </div>

            {poDetails.summary && (
              <p className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-xl border border-slate-850">
                {poDetails.summary}
              </p>
            )}
          </div>

          {/* Expense Policy Engine Evaluation */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Expense Policy Compliance Checks
                </h3>
              </div>
              <Badge variant="status" value={invoice.policy_status || 'PASS'} />
            </div>

            <div className="space-y-2">
              {(invoice.policy_results || []).map((pol, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/60 border border-slate-850 text-xs"
                >
                  <div className="flex items-center space-x-2">
                    {pol.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    )}
                    <div>
                      <p className="font-semibold text-slate-200">{pol.rule_name}</p>
                      <p className="text-[11px] text-slate-400">{pol.evidence}</p>
                    </div>
                  </div>
                  <Badge variant="status" value={pol.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Calibrated Risk Score & Evidence Breakdown */}
          <div className="space-y-4">
            <RiskMeter score={invoice.risk_score || 0} level={invoice.risk_level} />
            <EvidenceCard factors={invoice.risk_factors || []} />
          </div>

          {/* Agent Execution Timeline */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-400" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Chronological Multi-Agent Execution Timeline
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                {invoice.audit_events?.length || 0} Audit Events
              </span>
            </div>
            <AgentTimeline events={invoice.audit_events} />
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <ReviewModal
        invoice={invoice}
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        onActionComplete={(updated) => setInvoice(updated)}
      />
    </div>
  );
};
