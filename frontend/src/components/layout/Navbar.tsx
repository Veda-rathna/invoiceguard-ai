import React, { useEffect, useState } from 'react';
import { ShieldCheck, Cpu, Bell, Zap, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../../api/client';

interface NavbarProps {
  reviewCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({ reviewCount = 0 }) => {
  const [bedrockLive, setBedrockLive] = useState<boolean | null>(null);

  useEffect(() => {
    api.getBedrockStatus()
      .then((status) => {
        setBedrockLive(Boolean(status?.client_initialized && !status?.demo_mode));
      })
      .catch(() => {
        setBedrockLive(false);
      });
  }, []);

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

        {/* Dynamic Bedrock Live Status Pill */}
        {bedrockLive ? (
          <Link
            to="/observability"
            className="flex items-center space-x-1.5 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-800 shadow-2xs transition-colors"
            title="Amazon Bedrock Runtime Connected and Active"
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span className="hidden sm:inline">Bedrock Live API Active</span>
          </Link>
        ) : (
          <Link
            to="/observability"
            className="flex items-center space-x-1.5 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-mono font-medium text-amber-800 shadow-2xs transition-colors"
            title="Running in Demo Fallback Mode"
          >
            <Zap className="w-3.5 h-3.5 fill-amber-600 text-amber-600" />
            <span className="hidden sm:inline">Offline Demo Fallback</span>
          </Link>
        )}
      </div>
    </header>
  );
};
