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
      <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs font-medium">
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
        return <CheckCircle2 className="w-4 h-4 text-emerald-600" />;
      case 'WARNING':
        return <AlertCircle className="w-4 h-4 text-amber-600" />;
      case 'FAILED':
        return <XCircle className="w-4 h-4 text-rose-600" />;
      default:
        return <Clock className="w-4 h-4 text-blue-600" />;
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
    <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
      {events.map((event, idx) => {
        const AgentIcon = getAgentIcon(event.agent_name);
        return (
          <div key={idx} className="relative group">
            {/* Dot Node */}
            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white border-2 border-slate-300 flex items-center justify-center group-hover:border-emerald-500 transition-colors shadow-2xs">
              {getStatusIcon(event.status)}
            </div>

            {/* Event Box */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AgentIcon className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-900">
                    {event.agent_name.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center space-x-2 text-[11px] font-mono text-slate-500">
                  <span>{formatTime(event.timestamp)}</span>
                  {event.latency_ms > 0 && (
                    <span className="bg-slate-100 px-1.5 py-0.5 rounded text-emerald-700 font-bold border border-slate-200/60">
                      {event.latency_ms.toFixed(0)}ms
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed">
                {event.summary}
              </p>

              {event.evidence && (
                <p className="text-[11px] font-mono text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-200">
                  <span className="text-emerald-700 font-bold">Audit Evidence:</span> {event.evidence}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
