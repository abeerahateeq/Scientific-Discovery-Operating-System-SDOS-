import React from "react";
import { Hypothesis } from "../types";
import { Flame, Layers, Sparkles, TrendingUp, ShieldCheck, Cpu } from "lucide-react";

interface DiscoveryHeatmapProps {
  hypotheses: Hypothesis[];
  onSelectHypothesis?: (hypo: Hypothesis) => void;
}

interface DomainMetrics {
  domain: string;
  count: number;
  avgConfidence: number;
  avgNovelty: number;
  sampleHypotheses: Hypothesis[];
}

export default function DiscoveryHeatmap({ hypotheses, onSelectHypothesis }: DiscoveryHeatmapProps) {
  // Compute per-domain heat statistics
  const domainMap: Record<string, Hypothesis[]> = {};

  hypotheses.forEach((hypo) => {
    const d = hypo.domain || "Quantum Biophysics";
    if (!domainMap[d]) domainMap[d] = [];
    domainMap[d].push(hypo);
  });

  // Ensure standard scientific domains are included if not present
  const defaultDomains = [
    "Quantum Biophysics",
    "Physical Sciences & Information Theory",
    "Nanomaterials & Catalysis",
    "Advanced Materials & Clean Energy",
    "Complex Systems & AI Topologies",
    "Astrophysical Plasmas"
  ];

  defaultDomains.forEach((d) => {
    if (!domainMap[d]) domainMap[d] = [];
  });

  const domainsList: DomainMetrics[] = Object.keys(domainMap).map((dom) => {
    const list = domainMap[dom];
    const count = list.length;
    const avgConfidence = count > 0 
      ? Math.round((list.reduce((acc, h) => acc + (h.confidence || 0.7), 0) / count) * 100)
      : 75;
    const avgNovelty = count > 0
      ? Math.round((list.reduce((acc, h) => acc + (h.noveltyScore || 80), 0) / count))
      : 82;

    return {
      domain: dom,
      count,
      avgConfidence,
      avgNovelty,
      sampleHypotheses: list
    };
  }).sort((a, b) => b.count - a.count);

  const maxCount = Math.max(...domainsList.map(d => d.count), 1);

  return (
    <div className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-amber-400 animate-pulse" />
          <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[11px] font-sans">
            Domain Discovery Heatmap & Density Matrix
          </h3>
        </div>
        <div className="flex items-center gap-2 text-[9px] font-mono">
          <span className="flex items-center gap-1 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> High Confidence (&gt;80%)
          </span>
          <span className="flex items-center gap-1 text-sky-400">
            <span className="w-2 h-2 rounded-full bg-sky-500"></span> Active Syntheses
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2 h-2 rounded-full bg-purple-500"></span> High Novelty (&gt;85%)
          </span>
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
        {domainsList.map((item) => {
          const densityRatio = item.count / maxCount;
          let cellTheme = "bg-[#07080A] border-slate-800 text-slate-300";
          let badgeColor = "bg-slate-800 text-slate-400 border-slate-700";
          let progressColor = "bg-slate-700";

          if (item.avgConfidence >= 85) {
            cellTheme = "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.1)]";
            badgeColor = "bg-emerald-500/20 text-emerald-300 border-emerald-500/40";
            progressColor = "bg-gradient-to-r from-emerald-500 to-teal-400";
          } else if (item.avgNovelty >= 85) {
            cellTheme = "bg-purple-950/20 border-purple-500/40 hover:border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.1)]";
            badgeColor = "bg-purple-500/20 text-purple-300 border-purple-500/40";
            progressColor = "bg-gradient-to-r from-purple-500 to-pink-500";
          } else if (item.count > 0) {
            cellTheme = "bg-sky-950/20 border-sky-500/30 hover:border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.1)]";
            badgeColor = "bg-sky-500/20 text-sky-300 border-sky-500/40";
            progressColor = "bg-gradient-to-r from-sky-500 to-indigo-500";
          }

          return (
            <div
              key={item.domain}
              className={`p-3 rounded-xl border transition-all flex flex-col justify-between gap-2.5 relative group ${cellTheme}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col">
                  <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">DOMAIN CLUSTER</span>
                  <h4 className="text-[11px] font-bold text-slate-200 font-sans leading-snug">{item.domain}</h4>
                </div>
                <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${badgeColor} shrink-0`}>
                  {item.count} {item.count === 1 ? 'Hypothesis' : 'Hypotheses'}
                </span>
              </div>

              {/* Density Bar */}
              <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center text-[9px] font-mono">
                  <span className="text-slate-400">Synthesis Density</span>
                  <span className="text-slate-200 font-bold">{Math.round(densityRatio * 100)}%</span>
                </div>
                <div className="w-full bg-slate-900/80 h-1.5 rounded-full overflow-hidden border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${progressColor}`}
                    style={{ width: `${Math.max(10, Math.round(densityRatio * 100))}%` }}
                  />
                </div>
              </div>

              {/* Confidence & Novelty Scores */}
              <div className="grid grid-cols-2 gap-2 text-center text-[9px] font-mono pt-2 border-t border-slate-800/80">
                <div className="bg-[#07080A]/60 p-1.5 rounded border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px]">AVG CONFIDENCE</span>
                  <span className="text-emerald-400 font-bold">{item.avgConfidence}%</span>
                </div>
                <div className="bg-[#07080A]/60 p-1.5 rounded border border-slate-800/80">
                  <span className="text-slate-500 block text-[8px]">AVG NOVELTY</span>
                  <span className="text-purple-400 font-bold">{item.avgNovelty}%</span>
                </div>
              </div>

              {/* Top Hypothesis Preview Link */}
              {item.sampleHypotheses.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectHypothesis?.(item.sampleHypotheses[0])}
                  className="text-[9px] font-mono text-sky-400 hover:text-sky-300 underline text-left truncate flex items-center gap-1 mt-0.5 cursor-pointer"
                  title="Click to view top hypothesis in domain"
                >
                  <Sparkles className="w-2.5 h-2.5 text-sky-400 shrink-0" />
                  <span className="truncate">{item.sampleHypotheses[0].title}</span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
