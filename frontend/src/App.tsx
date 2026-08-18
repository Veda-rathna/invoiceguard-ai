import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Navbar } from './components/layout/Navbar';
import { Sidebar } from './components/layout/Sidebar';

import { Dashboard } from './pages/Dashboard';
import { Invoices } from './pages/Invoices';
import { InvoiceDetail } from './pages/InvoiceDetail';
import { ReviewQueue } from './pages/ReviewQueue';
import { PolicyManagement } from './pages/PolicyManagement';
import { PolicySimulator } from './pages/PolicySimulator';
import { VendorAnalytics } from './pages/VendorAnalytics';
import { AgentObservability } from './pages/AgentObservability';
import { api } from './api/client';

export const App: React.FC = () => {
  const [reviewCount, setReviewCount] = useState(0);

  const fetchReviewCount = async () => {
    try {
      const data = await api.getReviewQueue(1, 1);
      setReviewCount(data.total);
    } catch {
      // Ignore initial connection errors
    }
  };

  useEffect(() => {
    fetchReviewCount();
    const interval = setInterval(fetchReviewCount, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900">
        <Navbar reviewCount={reviewCount} />

        <div className="flex flex-1">
          <Sidebar reviewCount={reviewCount} />

          <main className="flex-1 p-6 lg:p-8 max-w-7xl mx-auto w-full overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/invoices" element={<Invoices />} />
              <Route path="/invoices/:id" element={<InvoiceDetail />} />
              <Route path="/review" element={<ReviewQueue />} />
              <Route path="/policies" element={<PolicyManagement />} />
              <Route path="/simulator" element={<PolicySimulator />} />
              <Route path="/vendors" element={<VendorAnalytics />} />
              <Route path="/agents" element={<AgentObservability />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </Router>
  );
};
