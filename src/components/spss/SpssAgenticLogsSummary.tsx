import React, { useState } from 'react';
import { 
  History, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  FileText, 
  ArrowRight, 
  Download, 
  Eye, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Sliders, 
  BarChart2, 
  Copy,
  Check
} from 'lucide-react';
import { SpssAnalysisPackage } from '../../types';

export interface AgenticAnalysisLogEntry {
  id: string;
  documentId: string;
  documentTitle: string;
  timestamp: string;
  analysisType: string;
  testStatistic: string;
  significance: string;
  effectSize: string;
  pValue: number;
  confidence: number;
  apaConclusion: string;
  stepDetails: string[];
  executionTimeMs: number;
  variablesCount: number;
  casesCount: number;
}

interface SpssAgenticLogsSummaryProps {
  currentDocumentId: string;
  currentDocumentTitle: string;
  logs: AgenticAnalysisLogEntry[];
  onSelectLogForInspection?: (log: AgenticAnalysisLogEntry) => void;
  onExportLog?: (log: AgenticAnalysisLogEntry, format: 'json' | 'csv' | 'md' | 'pdf') => void;
  onOpenSyntax?: () => void;
}

export default function SpssAgenticLogsSummary({
  currentDocumentId,
  currentDocumentTitle,
  logs,
  onSelectLogForInspection,
  onExportLog,
  onOpenSyntax
}: SpssAgenticLogsSummaryProps) {
  const [expandedLogId, setExpandedLogId] = useState<string | null>(logs[0]?.id || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Filter logs for the currently open document and take the last 3
  const documentLogs = logs
    .filter(l => l.documentId === currentDocumentId || currentDocumentId === 'all')
    .slice(0, 3);

  const handleCopyApa = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="bg-[#0F1115] border border-slate-800 rounded-xl p-4 flex flex-col gap-3.5 shadow-lg">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
            <History className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                Autonomous Agentic Analysis Summary Logs
              </h3>
              <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                Last 3 Runs for Active Document
              </span>
            </div>
            <p className="text-[10.5px] text-slate-400 font-sans mt-0.5">
              Structured autonomous execution history and statistical decision logs for <strong className="text-slate-200">"{currentDocumentTitle}"</strong>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-400">
            {documentLogs.length} of 3 Available Runs
          </span>
        </div>
      </div>

      {/* Logs List (Max 3) */}
      {documentLogs.length === 0 ? (
        <div className="p-8 text-center bg-[#07080A] rounded-xl border border-dashed border-slate-800 flex flex-col items-center justify-center gap-2">
          <Bot className="w-6 h-6 text-slate-500" />
          <p className="text-xs text-slate-400 font-mono">
            No agentic analysis executed yet for this document.
          </p>
          <p className="text-[10.5px] text-slate-500 font-sans">
            Click <strong>"Run BloxBot Auto-Statistical Analysis"</strong> above to launch the autonomous protocol.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {documentLogs.map((log, index) => {
            const isExpanded = expandedLogId === log.id;
            return (
              <div 
                key={log.id}
                className={`bg-[#07080A] border rounded-xl transition-all overflow-hidden ${
                  isExpanded ? 'border-indigo-500/50 shadow-md' : 'border-slate-800/80 hover:border-slate-700'
                }`}
              >
                {/* Collapsible Card Header */}
                <div 
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  className="p-3 flex items-center justify-between gap-3 cursor-pointer select-none bg-gradient-to-r from-slate-900/40 via-transparent to-transparent"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 text-xs font-mono font-bold shrink-0">
                      #{index + 1}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold font-mono text-white">
                          {log.analysisType.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                          {log.significance.includes('Significant') ? 'Significant (p < .05)' : log.significance}
                        </span>
                        <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                          {log.confidence}% CI
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          {log.timestamp}
                        </span>
                        <span>•</span>
                        <span>{log.testStatistic}</span>
                        <span>•</span>
                        <span>{log.effectSize}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyApa(log.id, log.apaConclusion);
                      }}
                      className="p-1 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors"
                      title="Copy APA Conclusion"
                    >
                      {copiedId === log.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>

                    <div className="text-slate-400">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Details Body */}
                {isExpanded && (
                  <div className="p-3.5 border-t border-slate-800/80 flex flex-col gap-3 bg-[#0A0D14] animate-in fade-in duration-150">
                    
                    {/* APA Finding Statement */}
                    <div className="p-2.5 rounded-lg bg-[#05070B] border border-indigo-900/40 text-xs font-sans text-slate-200 italic leading-relaxed">
                      "{log.apaConclusion}"
                    </div>

                    {/* Statistical Metrics Metric Matrix */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase block">Test Statistic</span>
                        <span className="text-emerald-400 font-bold">{log.testStatistic}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase block">Effect Size</span>
                        <span className="text-amber-400 font-bold">{log.effectSize}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase block">Execution Latency</span>
                        <span className="text-sky-300 font-bold">{log.executionTimeMs} ms</span>
                      </div>
                      <div className="p-2 rounded bg-slate-900/60 border border-slate-800">
                        <span className="text-[9px] text-slate-500 uppercase block">Matrix Dim</span>
                        <span className="text-indigo-300 font-bold">{log.casesCount} Cases × {log.variablesCount} Vars</span>
                      </div>
                    </div>

                    {/* Step-by-Step Agentic Reasoning Trace */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3 text-indigo-400" />
                        BloxBot Multi-Stage Execution Steps:
                      </span>
                      <div className="bg-[#05070B] rounded-lg border border-slate-800/80 p-2.5 flex flex-col gap-1.5 text-[10.5px] font-mono text-slate-300">
                        {log.stepDetails.map((step, sIdx) => (
                          <div key={sIdx} className="flex items-start gap-2">
                            <span className="text-indigo-400 font-bold shrink-0">{sIdx + 1}.</span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-800/60">
                      {onOpenSyntax && (
                        <button
                          onClick={onOpenSyntax}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-mono flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <FileText className="w-3 h-3 text-indigo-400" />
                          <span>View .sps Syntax</span>
                        </button>
                      )}

                      {onExportLog && (
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => onExportLog(log, 'csv')}
                            className="px-2 py-1 rounded bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>CSV</span>
                          </button>
                          <button
                            onClick={() => onExportLog(log, 'json')}
                            className="px-2 py-1 rounded bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>JSON</span>
                          </button>
                          <button
                            onClick={() => onExportLog(log, 'md')}
                            className="px-2 py-1 rounded bg-purple-500/10 hover:bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-mono font-bold flex items-center gap-1 transition-colors cursor-pointer"
                          >
                            <Download className="w-3 h-3" />
                            <span>Markdown</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
