import React from 'react';
import { ShieldCheck, Cpu, Bell, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  reviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ reviewCount = 0 }) => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_3px_rgba(0,0,0,0.04)]">
      {/* Brand & Model Status */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-white font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-slate-900 tracking-tight">InvoiceGuard</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">AI</span>
            </div>
            <p className="text-xs text-slate-500 font-medium">Explainable Multi-Agent Finance Operations</p>
          </div>
        </Link>

        {/* Model Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs text-slate-600 shadow-2xs">
          <Cpu className="w-4 h-4 text-emerald-600 animate-pulse" />
          <span className="text-slate-500 font-medium">Model:</span>
          <span className="font-mono text-emerald-700 font-bold">qwen.qwen3-vl-235b-a22b</span>
          <span className="text-slate-300">|</span>
          <span className="text-slate-500">AWS Bedrock Runtime</span>
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center space-x-3">
        {/* Quick HITL review alert badge */}
        <Link
          to="/review"
          className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl border text-xs font-semibold transition-all shadow-2xs ${
            reviewCount > 0
              ? 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100/80 hover:border-amber-400'
              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${reviewCount > 0 ? 'text-amber-600' : 'text-slate-400'}`} />
          <span>Review Queue</span>
          {reviewCount > 0 && (
            <span className="bg-amber-500 text-white px-2 py-0.2 rounded-full font-bold text-[10px] font-mono shadow-xs">
              {reviewCount}
            </span>
          )}
        </Link>

        {/* Demo Mode Pill */}
        <div className="flex items-center space-x-1.5 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-emerald-700 shadow-2xs">
          <Zap className="w-3.5 h-3.5 fill-emerald-600 text-emerald-600" />
          <span className="hidden sm:inline">Offline Demo Fallback Ready</span>
        </div>
      </div>
    </header>
  );
};
