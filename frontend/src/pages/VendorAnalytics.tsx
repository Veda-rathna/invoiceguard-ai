import React, { useEffect, useState } from 'react';
import { ShieldCheck, Search, FileText } from 'lucide-react';
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
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs px-2.5 py-0.5 rounded-full font-mono font-bold">
              Supplier Intelligence
            </span>
            <span className="text-slate-300 text-xs">•</span>
            <span className="text-slate-500 text-xs font-mono font-medium">Statistical Baselines & Anomaly Detection</span>
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
            Vendor Profiles & Spend Baselines
          </h1>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Track historical vendor spend distribution, detect anomalous invoice amount spikes, and verify supplier trust ratings.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Vendor List */}
        <div className="lg:col-span-5 p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search vendor directory..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 shadow-2xs font-medium"
            />
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((v) => (
              <div
                key={v.id || v.name}
                onClick={() => handleSelectVendor(v)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedVendor?.name === v.name
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{v.name}</span>
                  <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded border border-emerald-200">
                    {v.trust_score}% Trust
                  </span>
                </div>

                <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500 font-mono font-medium">
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
              <div className="p-6 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">{selectedVendor.name}</h2>
                    <p className="text-xs text-slate-500 font-mono mt-0.5 font-medium">
                      Tax ID: {selectedVendor.tax_id || 'Not Registered'} | Category: {selectedVendor.category}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-bold font-mono">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>Verified Vendor</span>
                  </div>
                </div>

                {/* Baseline Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Historical Invoices</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-1">{selectedVendor.invoice_count}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Average Amount</p>
                    <p className="text-lg font-extrabold text-emerald-700 mt-1">
                      ₹{selectedVendor.avg_invoice_amount?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Median Spend</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                      ₹{selectedVendor.median_invoice_amount?.toLocaleString() || 0}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                    <p className="text-[10px] text-slate-500 uppercase font-bold">Max Invoice</p>
                    <p className="text-lg font-extrabold text-slate-900 mt-1">
                      ₹{selectedVendor.max_invoice_amount?.toLocaleString() || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recent Invoices from Vendor */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-3">
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-800">
                  Recent Invoices from {selectedVendor.name}
                </h3>

                <div className="space-y-2">
                  {(selectedVendor.recent_invoices || []).map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between text-xs hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <FileText className="w-4 h-4 text-emerald-600" />
                        <div>
                          <p className="font-mono font-bold text-slate-900">{inv.invoice_number || inv.id}</p>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="font-mono font-extrabold text-slate-900">
                          ₹{inv.total_amount?.toLocaleString() || 0}
                        </span>
                        <Link
                          to={`/invoices/${inv.id}`}
                          className="text-emerald-700 hover:text-emerald-800 font-bold font-mono text-xs"
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
            <div className="p-12 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
              Select a vendor from the list to view statistical baselines and invoice history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
