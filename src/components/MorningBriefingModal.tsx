import React, { useState, useEffect } from "react";
import { MorningBriefingData } from "../types";
import { 
  Sun, 
  Sparkles, 
  Coins, 
  Clock, 
  TrendingUp, 
  Building2, 
  FileText, 
  X, 
  Zap, 
  CheckCircle2, 
  ArrowRight,
  Copy,
  Download
} from "lucide-react";

interface MorningBriefingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHypothesis?: (hypothesisOrId: any) => void;
}

export default function MorningBriefingModal({
  isOpen,
  onClose,
  onSelectHypothesis
}: MorningBriefingModalProps) {
  const [briefing, setBriefing] = useState<MorningBriefingData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      fetchBriefing();
    }
  }, [isOpen]);

  const fetchBriefing = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grants/briefing");
      const data = await res.json();
      setBriefing(data);
    } catch (e) {
      console.error("Error fetching morning briefing:", e);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!briefing) return;
    const text = `# ${briefing.headline}\nDate: ${briefing.date}\n\n${briefing.summary}\n\nTop Hypotheses:\n` +
      briefing.topHypotheses.map(h => `- ${h.title} (DVS: ${h.dvsScore}, Grant Fit: ${h.grantFit})`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative p-6 space-y-6 animate-scale-up text-slate-100">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Sun className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="text-xs font-mono text-amber-400 uppercase font-bold tracking-widest flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" /> FA-CDGRF Morning Scientific Briefing
              </div>
              <h2 className="text-xl font-extrabold text-white">Daily Intelligence Briefing</h2>
              <div className="text-xs text-slate-400 font-mono mt-0.5">{briefing?.date || "August 1, 2026"}</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono rounded-lg border border-slate-700 flex items-center gap-1.5"
            >
              {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied" : "Copy Briefing"}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 font-mono animate-pulse">
            Synthesizing morning research & funding briefing...
          </div>
        ) : briefing ? (
          <div className="space-y-6">
            {/* Headline Callout */}
            <div className="bg-gradient-to-r from-amber-950/30 via-indigo-950/40 to-slate-900 border border-amber-500/30 rounded-xl p-4">
              <h3 className="text-base font-bold text-amber-200 leading-snug">
                {briefing.headline}
              </h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {briefing.summary}
              </p>
            </div>

            {/* Top Hypotheses with High Grant Fit */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-400" /> Overnight Generated Hypotheses (High Grant Fit)
              </h4>
              <div className="space-y-2">
                {briefing.topHypotheses.map(h => (
                  <div
                    key={h.id}
                    onClick={() => {
                      if (onSelectHypothesis) onSelectHypothesis(h);
                      onClose();
                    }}
                    className="p-3 bg-slate-950/80 border border-slate-800/80 hover:border-emerald-500/50 rounded-xl flex items-center justify-between gap-3 cursor-pointer group transition-all"
                  >
                    <div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {h.domain}
                      </span>
                      <h5 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors mt-1">
                        {h.title}
                      </h5>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono">DVS Score</div>
                        <div className="text-sm font-bold text-amber-400">{h.dvsScore}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-400 font-mono">Grant Fit</div>
                        <div className="text-sm font-bold text-emerald-400">{h.grantFit}/100</div>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Urgent Grant Calls */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-3 flex items-center gap-2">
                <Coins className="w-4 h-4 text-sky-400" /> Urgent Closing Grant Opportunities
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {briefing.urgentGrantCalls.map(g => (
                  <div key={g.id} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-mono text-sky-400 font-semibold">{g.agency}</span>
                      <span className="font-bold text-emerald-400">{g.fundingAmount}</span>
                    </div>
                    <h5 className="text-xs font-bold text-slate-200 line-clamp-1">{g.title}</h5>
                    <div className="text-[10px] font-mono text-amber-400 mt-2 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Deadline: {g.deadline}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Emerging Nexus Gaps */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-amber-400" /> Emerging Cross-Disciplinary Nexus Gaps
              </h4>
              <div className="space-y-2">
                {briefing.emergingNexusGaps.map((gap, idx) => (
                  <div key={idx} className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{gap.gapTitle}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Fields: {gap.fields.join(" + ")}
                      </div>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded border border-emerald-500/20 shrink-0">
                      {gap.grantOpportunity}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Suggested Lab Collaborations */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 font-bold tracking-wider mb-3 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-400" /> Suggested Inter-Departmental Collaborations
              </h4>
              <div className="space-y-2">
                {briefing.recommendedCollaborations.map((collab, idx) => (
                  <div key={idx} className="p-3 bg-indigo-950/20 border border-indigo-900/40 rounded-xl text-xs">
                    <div className="font-bold text-indigo-200">{collab.labName} ({collab.department})</div>
                    <div className="text-[11px] text-slate-300 mt-1">{collab.matchReason}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
