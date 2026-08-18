import React, { useEffect, useState } from 'react';
import { Building2, TrendingUp, ShieldCheck, AlertTriangle, ArrowRight, Search, FileText } from 'lucide-react';
import { api } from '../api/client';
import { VendorProfile } from '../types';
import { Link } from 'react-router-dom';

export const VendorAnalytics: React.FC = () => {
  const [vendors, setVendors] = useState<VendorProfile[]>([]);
  const [selectedVendor, setSelectedVendor] = useState<VendorProfile | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const loadVendors = async () => {
    setLoading(true);
    try {
      const data = await api.getVendors();
      setVendors(data);
      if (data.length > 0) {
        const first = await api.getVendorDetails(data[0].id || data[0].name);
        setSelectedVendor(first);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors();
  }, []);

  const handleSelectVendor = async (v: VendorProfile) => {
    try {
      const full = await api.getVendorDetails(v.id || v.name);
      setSelectedVendor(full);
    } catch (err) {
      console.error(err);
    }
  };

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) || v.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-mono font-semibold">
              Supplier Intelligence
            </span>
            <span className="text-slate-500 text-xs">•</span>
            <span className="text-slate-400 text-xs font-mono">Statistical Baselines & Anomaly Detection</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight mt-1">
            Vendor Profiles & Spend Baselines
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Track historical vendor spend distribution, detect unusual invoice amount deviations, and verify trust ratings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vendor List */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((v) => (
              <div
                key={v.id || v.name}
                onClick={() => handleSelectVendor(v)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedVendor?.name === v.name
                    ? 'bg-emerald-500/15 border-emerald-500/40 shadow-sm shadow-emerald-500/10'
                    : 'bg-slate-950/60 border-slate-850 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200">{v.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                    {v.trust_score}% Trust
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                  <span>{v.category}</span>
                  <span>{v.invoice_count} Invoices</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Selected Vendor Detail & Recent Invoices */}
        <div className="lg:col-span-7 space-y-6">
          {selectedVendor ? (
            <>
              {/* Vendor Header Card */}
              <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selectedVendor.name}</h2>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      Tax ID: {selectedVendor.tax_id || 'Not Registered'} | Category: {selectedVendor.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Verified Vendor</span>
                  </div>
                </div>

                {/* Baseline Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">Historical Invoices</p>
                    <p className="text-lg font-bold text-white mt-1">{selectedVendor.invoice_count}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">Average Amount</p>
                    <p className="text-lg font-bold text-emerald-400 mt-1">
                      ₹{selectedVendor.avg_invoice_amount?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">Median Spend</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">
                      ₹{selectedVendor.median_invoice_amount?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase">Max Single Invoice</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">
                      ₹{selectedVendor.max_invoice_amount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Invoices from Vendor */}
              <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                  Recent Invoices from {selectedVendor.name}
                </h3>

                <div className="space-y-2">
                  {(selectedVendor.recent_invoices || []).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl bg-slate-950/60 border border-slate-850 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <div>
                          <p className="font-mono font-bold text-slate-200">{inv.invoice_number || inv.id}</p>
                          <p className="text-[11px] text-slate-400">
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-mono font-bold text-white">
                          ₹{inv.total_amount?.toLocaleString() || 0}
                        </span>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-emerald-400 hover:text-emerald-300 font-semibold font-mono text-xs"
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
              Select a vendor from the list to view statistical baselines and invoice history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
