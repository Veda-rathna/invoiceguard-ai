import React from 'react';
import { ShieldCheck, Cpu, Bell, ExternalLink, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

interface NavbarProps {
  reviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ reviewCount = 0 }) => {
  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Brand & Model Status */}
      <div className="flex items-center space-x-6">
        <Link to="/" className="flex items-center space-x-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-6 h-6 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-lg text-white tracking-tight">InvoiceGuard</span>
              <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs px-2 py-0.5 rounded-full font-mono font-semibold">AI</span>
            </div>
            <p className="text-xs text-slate-400 font-medium">Explainable Multi-Agent Finance Ops</p>
          </div>
        </Link>

        {/* Model Badge */}
        <div className="hidden lg:flex items-center space-x-2 bg-slate-800/80 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Cpu className="w-4 h-4 text-emerald-400 animate-pulse" />
          <span className="text-slate-400 font-mono">Model:</span>
          <span className="font-mono text-emerald-300 font-semibold">qwen.qwen3-vl-235b-a22b</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">AWS Bedrock Runtime</span>
        </div>
      </div>

      {/* Right Quick Actions */}
      <div className="flex items-center space-x-4">
        {/* Quick HITL review alert badge */}
        <Link
          to="/review"
          className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors ${
            reviewCount > 0
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
              : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-750'
          }`}
        >
          <Bell className={`w-3.5 h-3.5 ${reviewCount > 0 ? 'text-amber-400' : 'text-slate-400'}`} />
          <span>Review Queue</span>
          {reviewCount > 0 && (
            <span className="bg-amber-500 text-slate-950 px-1.5 py-0.2 rounded-full font-bold text-[10px]">
              {reviewCount}
            </span>
          )}
        </Link>

        {/* Demo Mode Pill */}
        <div className="flex items-center space-x-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-full text-xs font-mono text-emerald-400">
          <Zap className="w-3.5 h-3.5 fill-emerald-400" />
          <span className="hidden sm:inline">Offline Demo Fallback Ready</span>
        </div>
      </div>
    </header>
  );
};
