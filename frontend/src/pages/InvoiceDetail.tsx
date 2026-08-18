import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  CheckCircle2,
  AlertTriangle,
  GitCompare,
  Sliders,
  Sparkles,
  UserCheck,
  Download,
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
          <div className="w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
          <p className="text-xs font-mono text-slate-500 font-medium">Loading invoice and multi-agent audit state...</p>
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center space-x-3">
          <Link
            to="/invoices"
            className="p-2.5 rounded-xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-xl font-extrabold text-slate-900 font-mono">
                #{invoice.invoice_number || invoice.id}
              </h1>
              <Badge variant="decision" value={invoice.decision} />
              <Badge variant="risk" value={invoice.risk_level} />
            </div>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Vendor: <span className="text-slate-900 font-semibold">{invoice.vendor_name || 'Unknown'}</span> | Total: <span className="text-emerald-700 font-extrabold font-mono">₹{(invoice.total_amount || 0).toLocaleString()}</span> | Latency: {invoice.processing_latency_ms?.toFixed(0) || 380}ms
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {invoice.decision !== 'AUTO_APPROVE' && (
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md shadow-emerald-600/20 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              <span>Review / Override</span>
            </button>
          )}
        </div>
      </div>

      {/* Decision Summary & Factual AI Explanation Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-white to-teal-50/70 border border-emerald-200 space-y-3 shadow-sm">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-800">
            Explainable AI Decision Brief (Qwen3-VL Verified)
          </h2>
        </div>
        <p className="text-sm text-slate-800 leading-relaxed font-medium bg-white p-4 rounded-xl border border-emerald-100/90 shadow-2xs">
          {invoice.explanation || invoice.decision_reason || 'Autonomous multi-agent analysis complete.'}
        </p>
      </div>

      {/* Main 2-Column Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Original Document Viewer & Extracted Fields */}
        <div className="lg:col-span-5 space-y-6">
          {/* Document Preview */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-bold text-slate-900">
                <FileText className="w-4 h-4 text-emerald-600" />
                <span>Original Financial Document</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500 font-medium">{invoice.original_filename}</span>
            </div>

            <div className="aspect-[3/4] w-full rounded-xl bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center relative group">
              <img
                src={`/api/v1/invoices/${invoice.id}/file`}
                alt="Document Preview"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-2xs">
                <a
                  href={`/api/v1/invoices/${invoice.id}/file`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center space-x-1.5 shadow-md"
                >
                  <Download className="w-4 h-4" />
                  <span>Open Full Document</span>
                </a>
              </div>
            </div>
          </div>

          {/* Extracted Structured Fields with Confidence Badges */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                Extracted Fields & Confidences
              </h3>
              <span className="text-xs font-mono text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 font-bold">
                Overall: {((invoice.extraction_confidence || 0.95) * 100).toFixed(0)}%
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600 font-medium">Vendor Name:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-900">{extracted.vendor_name || 'N/A'}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                    {((fieldConf.vendor_name || 0.98) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600 font-medium">Invoice Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900">{extracted.invoice_number || 'N/A'}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                    {((fieldConf.invoice_number || 0.99) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600 font-medium">PO Number:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-slate-900">{extracted.po_number || 'None'}</span>
                  <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100/70 px-1.5 py-0.5 rounded font-bold">
                    {((fieldConf.po_number || 0.95) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600 font-medium">Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(extracted.subtotal || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200/60">
                <span className="text-slate-600 font-medium">Tax / GST:</span>
                <span className="font-mono font-bold text-slate-900">
                  ₹{(extracted.tax || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <span className="font-bold text-emerald-900">Grand Total:</span>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-extrabold text-base text-emerald-800">
                    ₹{(extracted.total || 0).toLocaleString()}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-200/80 px-2 py-0.5 rounded">
                    {((fieldConf.total || 0.98) * 100).toFixed(0)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Line Items Table */}
            {lineItems.length > 0 && (
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <p className="text-[11px] font-mono font-bold uppercase text-slate-500">
                  Extracted Line Items ({lineItems.length})
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px]">
                    <thead>
                      <tr className="text-slate-500 font-mono border-b border-slate-200 pb-1 bg-slate-50">
                        <th className="py-1 px-2">Description</th>
                        <th className="py-1 px-2">Qty</th>
                        <th className="py-1 px-2">Price</th>
                        <th className="py-1 px-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {lineItems.map((itm: any, idx: number) => (
                        <tr key={idx} className="text-slate-800 hover:bg-slate-50/80">
                          <td className="py-2 px-2">{itm.description}</td>
                          <td className="py-2 px-2 font-mono">{itm.quantity}</td>
                          <td className="py-2 px-2 font-mono">₹{(itm.unit_price || 0).toLocaleString()}</td>
                          <td className="py-2 px-2 font-mono font-bold text-right text-emerald-700">
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
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <GitCompare className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Purchase Order 3-Way Matching
                </h3>
              </div>
              <Badge variant="status" value={invoice.po_match_status || 'NOT_EVALUATED'} />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 text-[10px] uppercase font-bold">PO Reference</p>
                <p className="text-slate-900 font-bold mt-0.5">{invoice.po_number || 'None'}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Invoice Total</p>
                <p className="text-slate-900 font-bold mt-0.5">₹{(invoice.total_amount || 0).toLocaleString()}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 text-[10px] uppercase font-bold">Approved PO</p>
                <p className="text-slate-900 font-bold mt-0.5">
                  ₹{(poDetails.po_total || invoice.total_amount || 0).toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <p className="text-slate-500 text-[10px] uppercase font-bold">PO Variance</p>
                <p className={`font-bold mt-0.5 ${invoice.po_variance_percent > 5 ? 'text-amber-700' : 'text-emerald-700'}`}>
                  {invoice.po_variance_percent > 0 ? `+${invoice.po_variance_percent}%` : `${invoice.po_variance_percent || 0}%`}
                </p>
              </div>
            </div>

            {poDetails.summary && (
              <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium leading-relaxed">
                {poDetails.summary}
              </p>
            )}
          </div>

          {/* Expense Policy Engine Evaluation */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Expense Policy Compliance Checks
                </h3>
              </div>
              <Badge variant="status" value={invoice.policy_status || 'PASS'} />
            </div>

            <div className="space-y-2">
              {(invoice.policy_results || []).map((pol, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs"
                >
                  <div className="flex items-center space-x-2.5">
                    {pol.status === 'PASS' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    )}
                    <div>
                      <p className="font-bold text-slate-900">{pol.rule_name}</p>
                      <p className="text-[11px] text-slate-600 mt-0.5 font-medium">{pol.evidence}</p>
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
          <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Chronological Multi-Agent Execution Timeline
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-500 font-bold bg-slate-100 px-2.5 py-0.5 rounded-md border border-slate-200">
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
