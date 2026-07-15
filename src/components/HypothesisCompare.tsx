import React from "react";
import { Hypothesis } from "../types";
import { 
  X, 
  GitCompare, 
  ChevronRight, 
  ArrowRight, 
  Sparkles, 
  TrendingUp, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  ShieldCheck 
} from "lucide-react";

interface HypothesisCompareProps {
  hypoA: Hypothesis | null;
  hypoB: Hypothesis | null;
  activeSlot: "A" | "B";
  setActiveSlot: (slot: "A" | "B") => void;
  onClearSlot: (slot: "A" | "B") => void;
  onCloseCompare: () => void;
}

export default function HypothesisCompare({
  hypoA,
  hypoB,
  activeSlot,
  setActiveSlot,
  onClearSlot,
  onCloseCompare
}: HypothesisCompareProps) {

  // Calculate Common Citations
  const commonCitations = React.useMemo(() => {
    if (!hypoA || !hypoB) return [];
    const setA = new Set(hypoA.supportingEvidence || []);
    return (hypoB.supportingEvidence || []).filter(cite => setA.has(cite));
  }, [hypoA, hypoB]);

  // Calculate Common Graph Nodes in indirect paths
  const commonNodes = React.useMemo(() => {
    if (!hypoA || !hypoB) return [];
    const nodesA = new Set<string>();
    hypoA.indirectLinks.forEach(link => {
      nodesA.add(link.source.toLowerCase());
      nodesA.add(link.target.toLowerCase());
    });

    const crossovers = new Set<string>();
    hypoB.indirectLinks.forEach(link => {
      const s = link.source.toLowerCase();
      const t = link.target.toLowerCase();
      if (nodesA.has(s)) crossovers.add(link.source);
      if (nodesA.has(t)) crossovers.add(link.target);
    });

    return Array.from(crossovers);
  }, [hypoA, hypoB]);

  const renderMetricRow = (
    label: string, 
    valA: number, 
    valB: number, 
    isPercentage: boolean = true
  ) => {
    const formattedA = isPercentage ? `${Math.round(valA * 100)}%` : valA.toFixed(1);
    const formattedB = isPercentage ? `${Math.round(valB * 100)}%` : valB.toFixed(1);
    const delta = valA - valB;
    const absDeltaFormatted = isPercentage ? `${Math.round(Math.abs(delta) * 100)}%` : Math.abs(delta).toFixed(1);

    return (
      <div className="flex flex-col gap-1 border-b border-slate-900/50 pb-2.5 last:border-0 last:pb-0">
        <div className="flex justify-between items-center text-[9.5px]">
          <span className="font-mono text-slate-500 uppercase">{label}</span>
          {delta !== 0 && (
            <span className={`text-[8px] font-mono font-bold px-1 py-0.2 rounded uppercase ${
              delta > 0 
                ? "text-emerald-400 bg-emerald-500/10" 
                : "text-amber-500 bg-amber-500/10"
            }`}>
              {delta > 0 ? `Slot A +${absDeltaFormatted}` : `Slot B +${absDeltaFormatted}`}
            </span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 items-center">
          {/* Slot A visual bar */}
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] w-8 text-right text-slate-300">{formattedA}</span>
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, isPercentage ? valA * 100 : valA * 10)}%` }}
              />
            </div>
          </div>

          {/* Slot B visual bar */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-full h-2 overflow-hidden">
              <div 
                className="bg-violet-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, isPercentage ? valB * 100 : valB * 10)}%` }}
              />
            </div>
            <span className="font-mono text-[9px] w-8 text-left text-slate-300">{formattedB}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div id="hypothesis-comparison-workspace" className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-4 h-full text-[11px] overflow-y-auto">
      
      {/* Compare Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-3 shrink-0">
        <div className="flex items-center gap-2">
          <GitCompare className="text-violet-400 w-4.5 h-4.5 animate-pulse" />
          <div className="flex flex-col">
            <h2 className="text-slate-100 font-bold text-xs font-sans uppercase tracking-wider">Side-By-Side Discovery Compare</h2>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">GNN Path & Confidence Delta</span>
          </div>
        </div>

        <button
          onClick={onCloseCompare}
          className="text-slate-500 hover:text-slate-300 transition-colors bg-slate-900 border border-slate-850 p-1 rounded cursor-pointer"
          title="Exit Compare Mode"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Target Slot Assignment Buttons */}
      <div className="grid grid-cols-2 gap-3 bg-[#07080A] border border-slate-850 p-1.5 rounded shrink-0">
        <button
          onClick={() => setActiveSlot("A")}
          className={`p-2.5 rounded border transition-all text-left flex flex-col gap-1 relative ${
            activeSlot === "A"
              ? "bg-sky-500/10 border-sky-500"
              : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[8.5px] font-mono font-bold uppercase ${activeSlot === "A" ? "text-sky-400" : "text-slate-500"}`}>
              [Slot A] Target Selection
            </span>
            {hypoA && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClearSlot("A"); }}
                className="text-slate-600 hover:text-rose-400 font-bold text-[9px] z-10"
              >
                Clear
              </button>
            )}
          </div>
          <h4 className="text-slate-200 font-bold leading-normal text-[10px] line-clamp-1">
            {hypoA ? hypoA.title : "-- Click a hypothesis to load --"}
          </h4>
          <span className="text-[8px] font-mono text-slate-500 uppercase">
            {hypoA ? `CONFIDENCE: ${Math.round(hypoA.confidence * 100)}%` : "EMPTY SLOT"}
          </span>
          {activeSlot === "A" && (
            <span className="absolute bottom-1 right-2 text-[7px] font-mono font-bold uppercase text-sky-400 animate-pulse">
              Active Selector
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSlot("B")}
          className={`p-2.5 rounded border transition-all text-left flex flex-col gap-1 relative ${
            activeSlot === "B"
              ? "bg-violet-500/10 border-violet-500"
              : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[8.5px] font-mono font-bold uppercase ${activeSlot === "B" ? "text-violet-400" : "text-slate-500"}`}>
              [Slot B] Target Selection
            </span>
            {hypoB && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClearSlot("B"); }}
                className="text-slate-600 hover:text-rose-400 font-bold text-[9px] z-10"
              >
                Clear
              </button>
            )}
          </div>
          <h4 className="text-slate-200 font-bold leading-normal text-[10px] line-clamp-1">
            {hypoB ? hypoB.title : "-- Click a hypothesis to load --"}
          </h4>
          <span className="text-[8px] font-mono text-slate-500 uppercase">
            {hypoB ? `CONFIDENCE: ${Math.round(hypoB.confidence * 100)}%` : "EMPTY SLOT"}
          </span>
          {activeSlot === "B" && (
            <span className="absolute bottom-1 right-2 text-[7px] font-mono font-bold uppercase text-violet-400 animate-pulse">
              Active Selector
            </span>
          )}
        </button>
      </div>

      {/* Comparison Body Content */}
      {(!hypoA || !hypoB) ? (
        <div className="flex-1 bg-[#07080A] border border-dashed border-slate-800 rounded flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2 font-sans">
          <AlertCircle className="w-8 h-8 text-slate-600 animate-bounce" />
          <div className="max-w-xs flex flex-col gap-0.5">
            <span className="font-bold text-slate-400">Slots Incomplete</span>
            <span>
              Select a hypothesis from the left-hand column list, then click slot buttons above to assign it. You must load both Slots A and B to run the analytical overlay comparison.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Delta KPI Highlight Header */}
          <div className="bg-slate-950 border border-slate-900 rounded p-3 flex flex-col gap-2 font-sans">
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-500">
              Quantitative Delta Assessment
            </span>
            <div className="grid grid-cols-3 gap-2 text-center divide-x divide-slate-900">
              <div>
                <span className="text-[8px] font-mono text-slate-500 block uppercase">Confidence Delta</span>
                <span className="text-sm font-mono font-bold text-sky-400">
                  {Math.round(Math.abs(hypoA.confidence - hypoB.confidence) * 100)}%
                </span>
                <span className="text-[7.5px] text-slate-600 block mt-0.5">
                  Winner: {hypoA.confidence > hypoB.confidence ? "Slot A" : "Slot B"}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-slate-500 block uppercase">Discovery Value</span>
                <span className="text-sm font-mono font-bold text-violet-400">
                  {Math.abs((hypoA.discoveryValueScore || 85) - (hypoB.discoveryValueScore || 85))} pts
                </span>
                <span className="text-[7.5px] text-slate-600 block mt-0.5">
                  Winner: {(hypoA.discoveryValueScore || 85) > (hypoB.discoveryValueScore || 85) ? "Slot A" : "Slot B"}
                </span>
              </div>
              <div>
                <span className="text-[8px] font-mono text-slate-500 block uppercase">Citation Crossovers</span>
                <span className="text-sm font-mono font-bold text-emerald-400">
                  {commonCitations.length} Overlaps
                </span>
                <span className="text-[7.5px] text-slate-600 block mt-0.5">
                  {commonNodes.length} crossover nodes
                </span>
              </div>
            </div>
          </div>

          {/* Description Comparisons */}
          <div className="grid grid-cols-2 gap-4 border-b border-slate-800/60 pb-3">
            <div className="flex flex-col gap-1.5 p-2 rounded bg-sky-500/2 border border-sky-500/10">
              <span className="text-[8.5px] font-mono font-bold text-sky-400 uppercase">[A] {hypoA.query}</span>
              <p className="text-slate-300 leading-relaxed font-sans text-[10px]">{hypoA.description}</p>
            </div>
            <div className="flex flex-col gap-1.5 p-2 rounded bg-violet-500/2 border border-violet-500/10">
              <span className="text-[8.5px] font-mono font-bold text-violet-400 uppercase">[B] {hypoB.query}</span>
              <p className="text-slate-300 leading-relaxed font-sans text-[10px]">{hypoB.description}</p>
            </div>
          </div>

          {/* Side-by-Side Visual Metric Bars */}
          <div className="bg-[#07080A] border border-slate-850/80 rounded p-3 flex flex-col gap-3">
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-1.5">
              Synthesis Confidence & Feasibility Analysis
            </span>
            {renderMetricRow("Discovery Confidence", hypoA.confidence, hypoB.confidence)}
            {renderMetricRow("Discovery Value Score", (hypoA.discoveryValueScore || 85) / 100, (hypoB.discoveryValueScore || 85) / 100)}
            {renderMetricRow("Novelty Quotient", hypoA.noveltyScore, hypoB.noveltyScore)}
            {renderMetricRow("Clinical Feasibility", hypoA.clinicalFeasibility || 0.7, hypoB.clinicalFeasibility || 0.7)}
            {renderMetricRow("Computational Solver bounds", hypoA.computationalFeasibility || 0.8, hypoB.computationalFeasibility || 0.8)}
          </div>

          {/* Underlying Graph Connection Traversals */}
          <div className="flex flex-col gap-2 bg-[#07080A] border border-slate-850/80 rounded p-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Underlying Knowledge Graph Connections
              </span>
              <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wide bg-emerald-500/5 border border-emerald-500/10 px-1 py-0.2 rounded">
                GNN Semantic Inference Paths
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Slot A Traversals */}
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {hypoA.indirectLinks.map((link, idx) => {
                  const isCrossoverSrc = commonNodes.includes(link.source);
                  const isCrossoverTgt = commonNodes.includes(link.target);
                  return (
                    <div key={idx} className="bg-slate-950/60 border border-slate-900 p-1.5 rounded flex items-center justify-between gap-1 text-[9.5px]">
                      <span className={`font-medium ${isCrossoverSrc ? "text-emerald-400 underline decoration-dotted font-semibold" : "text-slate-300"}`}>
                        {link.source}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase font-bold italic shrink-0">
                        {link.relation}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className={`font-medium text-right ${isCrossoverTgt ? "text-emerald-400 underline decoration-dotted font-semibold" : "text-slate-300"}`}>
                        {link.target}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Slot B Traversals */}
              <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-1">
                {hypoB.indirectLinks.map((link, idx) => {
                  const isCrossoverSrc = commonNodes.includes(link.source);
                  const isCrossoverTgt = commonNodes.includes(link.target);
                  return (
                    <div key={idx} className="bg-slate-950/60 border border-slate-900 p-1.5 rounded flex items-center justify-between gap-1 text-[9.5px]">
                      <span className={`font-medium ${isCrossoverSrc ? "text-emerald-400 underline decoration-dotted font-semibold" : "text-slate-300"}`}>
                        {link.source}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase font-bold italic shrink-0">
                        {link.relation}
                      </span>
                      <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                      <span className={`font-medium text-right ${isCrossoverTgt ? "text-emerald-400 underline decoration-dotted font-semibold" : "text-slate-300"}`}>
                        {link.target}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {commonNodes.length > 0 && (
              <div className="mt-2 text-[8px] font-mono text-slate-500 flex flex-wrap items-center gap-1 leading-relaxed">
                <span className="text-emerald-400 font-bold uppercase bg-emerald-500/10 px-1 rounded mr-1">Overlap nodes detected:</span>
                {commonNodes.map((node, idx) => (
                  <span key={idx} className="bg-slate-950 border border-slate-900 px-1 py-0.2 rounded text-slate-300 font-sans">
                    {node}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Overlapping Bibliography Citations */}
          <div className="bg-[#07080A] border border-slate-850/80 rounded p-3 flex flex-col gap-2">
            <span className="text-[8.5px] font-mono text-slate-400 font-bold uppercase tracking-wider">
              Citations and Literature Overlaps
            </span>
            <div className="flex flex-col gap-1.5">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-[9.5px] text-slate-400">
                  <span className="font-mono text-[8px] text-slate-500 uppercase block mb-1">Citations A</span>
                  {(hypoA.supportingEvidence || []).map((cite, i) => (
                    <div key={i} className="truncate select-all leading-normal text-slate-400 font-sans py-0.5">
                      • {cite}
                    </div>
                  ))}
                </div>
                <div className="text-[9.5px] text-slate-400">
                  <span className="font-mono text-[8px] text-slate-500 uppercase block mb-1">Citations B</span>
                  {(hypoB.supportingEvidence || []).map((cite, i) => (
                    <div key={i} className="truncate select-all leading-normal text-slate-400 font-sans py-0.5">
                      • {cite}
                    </div>
                  ))}
                </div>
              </div>

              {commonCitations.length > 0 && (
                <div className="mt-2 p-2 bg-emerald-500/5 border border-emerald-500/10 rounded flex flex-col gap-1">
                  <span className="text-[8px] font-mono text-emerald-400 uppercase font-bold tracking-wider">
                    Overlapping Scientific Support Articles
                  </span>
                  <div className="text-[9px] text-slate-400 flex flex-col gap-0.5 font-sans">
                    {commonCitations.map((cite, i) => (
                      <div key={i} className="truncate leading-normal text-slate-300">
                        ✓ {cite}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
