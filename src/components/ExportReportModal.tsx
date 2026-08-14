import React, { useState } from 'react';
import { Download, FileText, Table, Check, X, ShieldCheck, FileJson, Loader2 } from 'lucide-react';
import { Hypothesis, GraphNode, GraphLink } from '../types';
import { exportDashboardToCSV, exportDashboardToPDF, DashboardStats } from '../utils/exportReport';
import { classifyTopicDomain } from '../config/domainTemplates';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: DashboardStats;
  hypotheses: Hypothesis[];
  nodes?: GraphNode[];
  links?: GraphLink[];
  userName?: string;
}

export default function ExportReportModal({
  isOpen,
  onClose,
  stats,
  hypotheses,
  nodes,
  links,
  userName
}: ExportReportModalProps) {
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [isExportingJSON, setIsExportingJSON] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExportCSV = () => {
    setIsExportingCSV(true);
    setTimeout(() => {
      try {
        exportDashboardToCSV(stats, hypotheses);
        setExportSuccess("CSV Dataset constructed & downloaded successfully!");
        setTimeout(() => setExportSuccess(null), 3000);
      } catch (err) {
        console.error("CSV Export error:", err);
      } finally {
        setIsExportingCSV(false);
      }
    }, 400);
  };

  const handleExportPDF = () => {
    setIsExportingPDF(true);
    setTimeout(() => {
      try {
        exportDashboardToPDF(stats, hypotheses, userName);
        setExportSuccess("Formal PDF Report generated with jsPDF & downloaded!");
        setTimeout(() => setExportSuccess(null), 3500);
      } catch (err) {
        console.error("PDF Export error:", err);
      } finally {
        setIsExportingPDF(false);
      }
    }, 500);
  };

  const handleExportGraphJSON = () => {
    setIsExportingJSON(true);
    setTimeout(() => {
      try {
        const graphData = {
          version: "1.0",
          exportedAt: new Date().toISOString(),
          exporter: userName || "Discovery Scholar",
          stats,
          nodes: nodes || [],
          links: links || [],
          hypothesesCount: hypotheses.length,
          hypotheses: hypotheses.map(h => ({
            id: h.id,
            title: h.title,
            domain: h.domain || classifyTopicDomain(h.title + " " + (h.query || "")).domainName,
            status: h.status,
            noveltyScore: h.noveltyScore,
            confidence: h.confidence
          }))
        };
        const jsonStr = JSON.stringify(graphData, null, 2);
        const blob = new Blob([jsonStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `knowledge_graph_backup_${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        setExportSuccess("Knowledge Graph structure JSON backup downloaded!");
        setTimeout(() => setExportSuccess(null), 3000);
      } catch (err) {
        console.error("JSON Export error:", err);
      } finally {
        setIsExportingJSON(false);
      }
    }, 450);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-[#0D0F16] border border-sky-500/40 rounded-2xl max-w-xl w-full p-6 text-slate-200 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400">
              <Download className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white font-sans uppercase tracking-wide">
                Export Discovery & Knowledge Graph Data
              </h3>
              <p className="text-[11px] text-slate-400 font-mono">
                Generate executive PDF, CSV dataset, or JSON Knowledge Graph backup
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/80 hover:bg-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Success Alert */}
        {exportSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 font-mono">
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* System Stats Preview Cards */}
        <div className="mb-5 bg-[#07090E] border border-slate-800 rounded-xl p-3.5">
          <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block mb-2.5">
            Included Discovery Metrics Summary
          </span>
          <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono">
            <div className="bg-[#0F121B] p-2 rounded border border-slate-800">
              <span className="text-slate-500 block text-[9px]">LITERATURE</span>
              <span className="text-sky-400 font-bold text-xs">{stats.totalPapers} Papers</span>
            </div>
            <div className="bg-[#0F121B] p-2 rounded border border-slate-800">
              <span className="text-slate-500 block text-[9px]">GRAPH NODES</span>
              <span className="text-purple-400 font-bold text-xs">{nodes ? nodes.length : stats.totalNodes} Nodes</span>
            </div>
            <div className="bg-[#0F121B] p-2 rounded border border-slate-800">
              <span className="text-slate-500 block text-[9px]">HYPOTHESES</span>
              <span className="text-amber-400 font-bold text-xs">{stats.totalHypotheses} Items</span>
            </div>
          </div>
        </div>

        {/* Report Export Format Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
          
          {/* PDF Export Button Card */}
          <button
            id="export-pdf-action-btn"
            onClick={handleExportPDF}
            disabled={isExportingPDF}
            className="group p-3.5 bg-gradient-to-br from-sky-900/40 to-slate-900 border border-sky-500/40 hover:border-sky-400 rounded-xl flex flex-col items-start justify-between gap-2 text-left transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-lg disabled:opacity-60"
          >
            <div className="w-7 h-7 rounded-lg bg-sky-500/20 border border-sky-400/50 flex items-center justify-center text-sky-400 group-hover:animate-bounce transition-transform">
              {isExportingPDF ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-300" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-white font-mono uppercase tracking-wide flex items-center gap-1.5">
                PDF Executive
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">
                Formatted formal report generated with jsPDF.
              </p>
            </div>
            <span className="text-[9.5px] font-mono text-sky-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {isExportingPDF ? "Generating..." : "Download PDF \u2192"}
            </span>
          </button>

          {/* CSV Export Button Card */}
          <button
            id="export-csv-action-btn"
            onClick={handleExportCSV}
            disabled={isExportingCSV}
            className="group p-3.5 bg-gradient-to-br from-emerald-900/40 to-slate-900 border border-emerald-500/40 hover:border-emerald-400 rounded-xl flex flex-col items-start justify-between gap-2 text-left transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-lg disabled:opacity-60"
          >
            <div className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400 group-hover:animate-bounce transition-transform">
              {isExportingCSV ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-300" />
              ) : (
                <Table className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-white font-mono uppercase tracking-wide flex items-center gap-1.5">
                CSV Data
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">
                Structured spreadsheet from filtered hypotheses.
              </p>
            </div>
            <span className="text-[9.5px] font-mono text-emerald-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {isExportingCSV ? "Exporting..." : "Download CSV \u2192"}
            </span>
          </button>

          {/* JSON Graph Backup Button Card */}
          <button
            id="export-json-action-btn"
            onClick={handleExportGraphJSON}
            disabled={isExportingJSON}
            className="group p-3.5 bg-gradient-to-br from-purple-900/40 to-slate-900 border border-purple-500/40 hover:border-purple-400 rounded-xl flex flex-col items-start justify-between gap-2 text-left transition-all hover:scale-[1.03] active:scale-95 cursor-pointer shadow-lg disabled:opacity-60"
          >
            <div className="w-7 h-7 rounded-lg bg-purple-500/20 border border-purple-400/50 flex items-center justify-center text-purple-400 group-hover:animate-bounce transition-transform">
              {isExportingJSON ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-300" />
              ) : (
                <FileJson className="w-3.5 h-3.5" />
              )}
            </div>
            <div>
              <div className="text-[11px] font-extrabold text-white font-mono uppercase tracking-wide flex items-center gap-1.5">
                Graph JSON
              </div>
              <p className="text-[10px] text-slate-400 font-sans mt-0.5 leading-tight">
                Full Knowledge Graph structure & discovery backup.
              </p>
            </div>
            <span className="text-[9.5px] font-mono text-purple-400 font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform">
              {isExportingJSON ? "Backing up..." : "JSON Backup \u2192"}
            </span>
          </button>

        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
            <span>Automated Intelligence Discovery Backup</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white underline font-sans cursor-pointer"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}

