import React from 'react';
import { RefreshCw, CheckCircle2, Zap, Clock, ShieldCheck, Database, FileCode, BarChart3, AlertCircle } from 'lucide-react';

interface SpssProgressBarProps {
  isRunning: boolean;
  step: number; // 0 to 5 (0 = idle, 1 = ingestion, 2 = assumptions, 3 = syntax/matrix, 4 = inference, 5 = done)
  statusText: string;
  logMessages: string[];
  onCancel?: () => void;
  documentTitle?: string;
  analysisType?: string;
}

export default function SpssProgressBar({
  isRunning,
  step,
  statusText,
  logMessages,
  onCancel,
  documentTitle,
  analysisType
}: SpssProgressBarProps) {
  if (!isRunning && step === 0) return null;

  const stages = [
    { id: 1, label: 'Document Ingestion & Variable Detection', icon: Database, desc: 'Parsing column types and schema' },
    { id: 2, label: 'Assumption Verification & Normality', icon: ShieldCheck, desc: "Levene's & Shapiro-Wilk testing" },
    { id: 3, label: 'SPSS Syntax (.sps) & Matrix Generation', icon: FileCode, desc: 'Formulating matrix & command scripts' },
    { id: 4, label: 'Inferential Statistics & APA 7th Synthesis', icon: BarChart3, desc: 'Computing t, F, R², Cohen’s d, p-values' },
  ];

  const percentage = Math.min(100, Math.round((step / 4) * 100));

  return (
    <div className="bg-[#0B0D13] border border-indigo-500/40 rounded-xl p-4 shadow-xl flex flex-col gap-3.5 animate-fadeIn">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-indigo-500/20 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-600/30 text-indigo-300 border border-indigo-400/40 animate-pulse">
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-xs font-sans tracking-wide">
                BloxBot Agentic Statistical Processing Engine
              </span>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-bold flex items-center gap-1">
                <RefreshCw className={`w-2.5 h-2.5 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? `Step ${step}/4 (${percentage}%)` : 'Processing Complete'}
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
              Target: <span className="text-slate-200 font-medium">{documentTitle || 'Current Dataset'}</span> • Method: <span className="text-indigo-300">{analysisType?.replace(/_/g, ' ') || 'Inferential Analysis'}</span>
            </p>
          </div>
        </div>

        {isRunning && onCancel && (
          <button
            onClick={onCancel}
            className="text-[10px] font-mono px-2.5 py-1 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-colors"
          >
            Cancel Pipeline
          </button>
        )}
      </div>

      {/* Progress Bar Gauge */}
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-[11px] font-mono">
          <span className="text-indigo-300 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            {statusText || 'Executing statistical workflow...'}
          </span>
          <span className="text-emerald-400 font-bold">{percentage}%</span>
        </div>

        <div className="w-full bg-slate-900 rounded-full h-2.5 p-0.5 border border-slate-800 relative overflow-hidden">
          <div
            className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full rounded-full transition-all duration-500 ease-out shadow-[0_0_12px_rgba(99,102,241,0.6)]"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* 4-Stage Visual Milestones */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
        {stages.map((st) => {
          const isPassed = step > st.id || (!isRunning && step >= 4);
          const isCurrent = step === st.id && isRunning;
          const Icon = st.icon;

          return (
            <div
              key={st.id}
              className={`p-2.5 rounded-lg border flex flex-col gap-1 transition-all ${
                isPassed
                  ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
                  : isCurrent
                  ? 'bg-indigo-950/50 border-indigo-500 text-indigo-200 shadow-[0_0_10px_rgba(99,102,241,0.3)]'
                  : 'bg-[#0F1115] border-slate-800/80 text-slate-500'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold flex items-center gap-1">
                  <Icon className={`w-3.5 h-3.5 ${isPassed ? 'text-emerald-400' : isCurrent ? 'text-indigo-400' : 'text-slate-500'}`} />
                  Stage {st.id}
                </span>
                {isPassed ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <RefreshCw className="w-3 h-3 text-indigo-400 animate-spin" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-slate-700" />
                )}
              </div>
              <span className="text-[10px] font-sans font-bold text-slate-200 line-clamp-1">
                {st.label}
              </span>
              <span className="text-[9px] font-sans text-slate-400 line-clamp-1">
                {st.desc}
              </span>
            </div>
          );
        })}
      </div>

      {/* Live Agent Terminal Log Drawer */}
      {logMessages.length > 0 && (
        <div className="bg-[#050608] p-2.5 rounded-lg text-[10px] font-mono text-slate-300 max-h-28 overflow-y-auto flex flex-col gap-1 border border-slate-800">
          <div className="text-[9px] text-slate-500 uppercase font-bold flex items-center justify-between pb-1 border-b border-slate-900">
            <span>BloxBot Agentic Execution Log</span>
            <span>{logMessages.length} entries</span>
          </div>
          {logMessages.map((msg, i) => (
            <div key={i} className="text-slate-400 leading-tight">
              {msg}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
