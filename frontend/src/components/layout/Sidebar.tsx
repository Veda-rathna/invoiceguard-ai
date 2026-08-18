import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  UserCheck,
  Sliders,
  PlaySquare,
  Building2,
  Activity,
  Layers
} from 'lucide-react';

interface SidebarProps {
  reviewCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ reviewCount = 0 }) => {
  const navItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
    { to: '/invoices', label: 'Invoices Explorer', icon: FileText },
    { to: '/review', label: 'HITL Review Queue', icon: UserCheck, badge: reviewCount },
    { to: '/policies', label: 'Expense Policies', icon: Sliders },
    { to: '/simulator', label: 'Policy Simulator', icon: PlaySquare },
    { to: '/vendors', label: 'Vendor Analytics', icon: Building2 },
    { to: '/agents', label: 'Agent Observability', icon: Activity },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-semibold tracking-wider text-slate-500 uppercase font-mono">
            Navigation
          </p>
          <nav className="mt-2 space-y-1">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.exact}
                className={({ isActive }) =>
                  `flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
                  }`
                }
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="bg-amber-500 text-slate-950 px-2 py-0.5 rounded-full text-xs font-bold font-mono">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Multi-Agent Architecture Indicator */}
        <div className="p-3.5 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2">
          <div className="flex items-center space-x-2 text-xs font-semibold text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>Active LangGraph Agents</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5 text-[11px] font-mono text-slate-400">
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Doc Intel</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Validation</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>PO Match</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Policy</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Anomaly</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Risk Engine</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Version info */}
      <div className="p-3 border-t border-slate-800/80 text-xs text-slate-500 font-mono space-y-1">
        <div className="flex justify-between items-center">
          <span>LangGraph Core</span>
          <span className="text-slate-400">v0.0.30</span>
        </div>
        <div className="flex justify-between items-center">
          <span>Bedrock Runtime</span>
          <span className="text-emerald-400">Active</span>
        </div>
      </div>
    </aside>
  );
};
