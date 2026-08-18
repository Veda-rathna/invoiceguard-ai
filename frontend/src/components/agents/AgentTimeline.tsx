import React from 'react';
import { AuditEvent } from '../../types';
import {
  FileText,
  Calculator,
  GitCompare,
  Sliders,
  AlertTriangle,
  Scale,
  Compass,
  MessageSquareText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Clock
} from 'lucide-react';

interface AgentTimelineProps {
  events?: AuditEvent[];
}

export const AgentTimeline: React.FC<AgentTimelineProps> = ({ events = [] }) => {
  if (!events || events.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs">
        No agent execution events recorded yet.
      </div>
    );
  }

  const getAgentIcon = (agent: string) => {
    switch (agent.toUpperCase()) {
      case 'DOCUMENT_AGENT':
        return FileText;
      case 'VALIDATION_AGENT':
        return Calculator;
      case 'PO_MATCHING_AGENT':
      case 'PO_AGENT':
        return GitCompare;
      case 'POLICY_AGENT':
        return Sliders;
      case 'ANOMALY_AGENT':
        return AlertTriangle;
      case 'RISK_ENGINE':
        return Scale;
      case 'DECISION_ENGINE':
      case 'DECISION_AGENT':
        return Compass;
      case 'EXPLANATION_AGENT':
        return MessageSquareText;
      case 'HUMAN_REVIEWER':
        return UserCheck;
      default:
        return Clock;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-amber-400" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-400" />;
      default:
        return <Clock className="w-4 h-4 text-blue-400" />;
    }
  };

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch {
      return ts;
    }
  };

  return (
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
      {events.map((event, idx) => {
        const AgentIcon = getAgentIcon(event.agent_name);
        return (
          <div key={idx} className="relative group">
            {/* Dot Node */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center group-hover:border-emerald-500 transition-colors">
              {getStatusIcon(event.status)}
            </div>

            {/* Event Box */}
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AgentIcon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
                    {event.agent_name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-400">
                  <span>{formatTime(event.timestamp)}</span>
                  {event.latency_ms > 0 && (
                    <span className="bg-slate-800 px-1.5 py-0.5 rounded text-emerald-400 font-semibold">
                      {event.latency_ms.toFixed(0)}ms
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-300 font-medium">
                {event.summary}
              </p>

              {event.evidence && (
                <p className="text-[11px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded border border-slate-800/80">
                  <span className="text-emerald-400 font-semibold">Audit Evidence:</span> {event.evidence}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
