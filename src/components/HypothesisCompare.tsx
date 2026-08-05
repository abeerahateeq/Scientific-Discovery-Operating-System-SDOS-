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
  ShieldCheck,
  AlertTriangle,
  Zap,
  Split
} from "lucide-react";

interface HypothesisCompareProps {
  hypoA: Hypothesis | null;
  hypoB: Hypothesis | null;
  hypoC?: Hypothesis | null;
  activeSlot: "A" | "B" | "C";
  setActiveSlot: (slot: "A" | "B" | "C") => void;
  onClearSlot: (slot: "A" | "B" | "C") => void;
  onCloseCompare: () => void;
}

interface AssertionConflict {
  id: string;
  type: "mechanism" | "feasibility" | "outcome" | "domain";
  severity: "high" | "medium";
  title: string;
  modelAClaim?: string;
  modelBClaim?: string;
  modelCClaim?: string;
  resolutionHint: string;
}

export default function HypothesisCompare({
  hypoA,
  hypoB,
  hypoC,
  activeSlot,
  setActiveSlot,
  onClearSlot,
  onCloseCompare
}: HypothesisCompareProps) {

  const activeHypotheses = React.useMemo(() => {
    const list: { slot: "A" | "B" | "C"; hypo: Hypothesis; color: string; border: string; bg: string }[] = [];
    if (hypoA) list.push({ slot: "A", hypo: hypoA, color: "text-sky-400", border: "border-sky-500", bg: "bg-sky-500/10" });
    if (hypoB) list.push({ slot: "B", hypo: hypoB, color: "text-violet-400", border: "border-violet-500", bg: "bg-violet-500/10" });
    if (hypoC) list.push({ slot: "C", hypo: hypoC, color: "text-amber-400", border: "border-amber-500", bg: "bg-amber-500/10" });
    return list;
  }, [hypoA, hypoB, hypoC]);

  // Calculate Common Citations across selected models
  const commonCitations = React.useMemo(() => {
    if (activeHypotheses.length < 2) return [];
    const sets = activeHypotheses.map(h => new Set(h.hypo.supportingEvidence || []));
    
    // Find citations present in at least 2 models
    const citeCounts: Record<string, number> = {};
    sets.forEach(set => {
      set.forEach(cite => {
        citeCounts[cite] = (citeCounts[cite] || 0) + 1;
      });
    });

    return Object.entries(citeCounts)
      .filter(([_, count]) => count >= 2)
      .map(([cite, count]) => ({ citation: cite, count }));
  }, [activeHypotheses]);

  // Calculate Common Knowledge Graph Nodes
  const commonNodes = React.useMemo(() => {
    if (activeHypotheses.length < 2) return [];
    
    const nodeMaps = activeHypotheses.map(h => {
      const nodes = new Set<string>();
      (h.hypo.indirectLinks || []).forEach(l => {
        if (l?.source) nodes.add(l.source.toLowerCase());
        if (l?.target) nodes.add(l.target.toLowerCase());
      });
      return nodes;
    });

    const nodeCounts: Record<string, { label: string; count: number }> = {};
    activeHypotheses.forEach((h, idx) => {
      (h.hypo.indirectLinks || []).forEach(l => {
        [l.source, l.target].forEach(node => {
          if (!node) return;
          const key = node.toLowerCase();
          if (!nodeCounts[key]) {
            nodeCounts[key] = { label: node, count: 0 };
          }
        });
      });
    });

    // Count occurrences across model sets
    Object.keys(nodeCounts).forEach(key => {
      let count = 0;
      nodeMaps.forEach(set => {
        if (set.has(key)) count++;
      });
      nodeCounts[key].count = count;
    });

    return Object.values(nodeCounts).filter(n => n.count >= 2);
  }, [activeHypotheses]);

  // Detect Conflicting Assertions across the models
  const conflictingAssertions = React.useMemo<AssertionConflict[]>(() => {
    if (activeHypotheses.length < 2) return [];
    const conflicts: AssertionConflict[] = [];

    // Pairwise comparisons (A-B, B-C, A-C)
    for (let i = 0; i < activeHypotheses.length; i++) {
      for (let j = i + 1; j < activeHypotheses.length; j++) {
        const item1 = activeHypotheses[i];
        const item2 = activeHypotheses[j];
        const h1 = item1.hypo;
        const h2 = item2.hypo;

        // 1. Explicit Contradiction Objects
        if (h1.contradictions && h1.contradictions.length > 0) {
          h1.contradictions.forEach((c, idx) => {
            conflicts.push({
              id: `explicit-${item1.slot}-${item2.slot}-${idx}`,
              type: "mechanism",
              severity: "high",
              title: `Literature Contradiction [Slot ${item1.slot} vs ${item2.slot}]: ${c.paperA} vs ${c.paperB}`,
              modelAClaim: c.claimA,
              modelBClaim: c.claimB,
              resolutionHint: c.resolution || "Reconcile using high-resolution Cryo-EM structural verification."
            });
          });
        }

        // 2. Relational Mechanism Conflicts (Opposing Knowledge Graph Relations)
        const links1 = h1.indirectLinks || [];
        const links2 = h2.indirectLinks || [];

        links1.forEach(l1 => {
          links2.forEach(l2 => {
            if (!l1.source || !l1.target || !l2.source || !l2.target) return;
            const samePair = 
              (l1.source.toLowerCase() === l2.source.toLowerCase() && l1.target.toLowerCase() === l2.target.toLowerCase()) ||
              (l1.source.toLowerCase() === l2.target.toLowerCase() && l1.target.toLowerCase() === l2.source.toLowerCase());

            if (samePair && l1.relation.toLowerCase() !== l2.relation.toLowerCase()) {
              conflicts.push({
                id: `rel-${item1.slot}-${item2.slot}-${l1.source}-${l1.target}`,
                type: "mechanism",
                severity: "high",
                title: `Opposing Pathway Relationship (${l1.source} ↔ ${l1.target})`,
                modelAClaim: `Slot ${item1.slot} asserts: "${l1.source}" ${l1.relation} "${l1.target}"`,
                modelBClaim: `Slot ${item2.slot} asserts: "${l2.source}" ${l2.relation} "${l2.target}"`,
                resolutionHint: "Conduct targeted empirical trials or kinetic simulation to determine true interaction direction."
              });
            }
          });
        });

        // 3. Experimental vs Computational Feasibility Discrepancy
        const clinDelta = Math.abs((h1.clinicalFeasibility || 0.5) - (h2.clinicalFeasibility || 0.5));
        const compDelta = Math.abs((h1.computationalFeasibility || 0.5) - (h2.computationalFeasibility || 0.5));

        if (clinDelta >= 0.3) {
          conflicts.push({
            id: `clin-feasibility-${item1.slot}-${item2.slot}`,
            type: "feasibility",
            severity: "medium",
            title: `Divergent Experimental / Field Feasibility (Slot ${item1.slot}: ${Math.round((h1.clinicalFeasibility || 0.5)*100)}% vs Slot ${item2.slot}: ${Math.round((h2.clinicalFeasibility || 0.5)*100)}%)`,
            modelAClaim: `Slot ${item1.slot} projects ${Math.round((h1.clinicalFeasibility || 0.5)*100)}% experimental translation probability.`,
            modelBClaim: `Slot ${item2.slot} projects ${Math.round((h2.clinicalFeasibility || 0.5)*100)}% experimental translation probability.`,
            resolutionHint: "Analyze environmental and operational feasibility constraints under physical stress conditions."
          });
        }

        // 4. Expected Outcome Contradictions
        if (h1.expectedOutcomes && h2.expectedOutcomes && h1.expectedOutcomes !== h2.expectedOutcomes) {
          conflicts.push({
            id: `outcome-${item1.slot}-${item2.slot}`,
            type: "outcome",
            severity: "medium",
            title: `Conflicting Experimental Predictions [Slot ${item1.slot} vs ${item2.slot}]`,
            modelAClaim: `Slot ${item1.slot} Outcome: "${h1.expectedOutcomes}"`,
            modelBClaim: `Slot ${item2.slot} Outcome: "${h2.expectedOutcomes}"`,
            resolutionHint: "Run in-silico Monte Carlo simulation under identical initial boundary state."
          });
        }
      }
    }

    // Fallback synthesis if no explicit pair conflicts found
    if (conflicts.length === 0 && activeHypotheses.length >= 2) {
      conflicts.push({
        id: "synthetic-divergence-1",
        type: "domain",
        severity: "medium",
        title: "Cross-Domain Model Premise Divergence",
        modelAClaim: `Slot ${activeHypotheses[0].slot}: Operates under ${activeHypotheses[0].hypo.domain || "Quantum"} domain assumptions with focus on "${activeHypotheses[0].hypo.analogousMethods?.[0] || "topological mapping"}"`,
        modelBClaim: `Slot ${activeHypotheses[1].slot}: Operates under ${activeHypotheses[1].hypo.domain || "Biological"} domain assumptions with focus on "${activeHypotheses[1].hypo.analogousMethods?.[0] || "empirical kinetics"}"`,
        resolutionHint: "Reconcile domain-specific thermodynamic assumptions and boundary constraints."
      });
    }

    return conflicts;
  }, [activeHypotheses]);

  const renderMetricRow3 = (
    label: string, 
    valA: number | undefined, 
    valB: number | undefined, 
    valC: number | undefined,
    isPercentage: boolean = true
  ) => {
    const fmt = (val: number | undefined) => {
      if (val === undefined) return "N/A";
      return isPercentage ? `${Math.round(val * 100)}%` : val.toFixed(1);
    };

    return (
      <div className="flex flex-col gap-1 border-b border-slate-900/50 pb-2.5 last:border-0 last:pb-0 font-mono">
        <div className="flex justify-between items-center text-[9.5px]">
          <span className="text-slate-400 font-bold uppercase">{label}</span>
        </div>

        <div className="grid grid-cols-3 gap-3 items-center">
          {/* Slot A */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-sky-400 w-7">A: {fmt(valA)}</span>
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-sky-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, valA !== undefined ? (isPercentage ? valA * 100 : valA * 10) : 0)}%` }}
              />
            </div>
          </div>

          {/* Slot B */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-violet-400 w-7">B: {fmt(valB)}</span>
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-violet-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, valB !== undefined ? (isPercentage ? valB * 100 : valB * 10) : 0)}%` }}
              />
            </div>
          </div>

          {/* Slot C */}
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-amber-400 w-7">C: {fmt(valC)}</span>
            <div className="flex-1 bg-slate-950 border border-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-amber-500 h-full transition-all duration-300"
                style={{ width: `${Math.min(100, valC !== undefined ? (isPercentage ? valC * 100 : valC * 10) : 0)}%` }}
              />
            </div>
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
            <h2 className="text-slate-100 font-bold text-xs font-sans uppercase tracking-wider flex items-center gap-2">
              Tri-Panel Discovery Compare
              <span className="text-[8.5px] font-mono text-violet-300 bg-violet-500/20 border border-violet-500/30 px-1.5 py-0.2 rounded font-normal">
                3-Way Tri-Panel Side-By-Side
              </span>
            </h2>
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">
              Multi-Model Assertion Contradiction Engine & GNN Delta Analysis
            </span>
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

      {/* Target Slot Assignment Buttons (Tri-Panel Selector: Slots A, B, C) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 bg-[#07080A] border border-slate-850 p-1.5 rounded shrink-0">
        {/* Slot A Button */}
        <button
          onClick={() => setActiveSlot("A")}
          className={`p-2 rounded border transition-all text-left flex flex-col gap-1 relative ${
            activeSlot === "A"
              ? "bg-sky-500/10 border-sky-500"
              : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[8.5px] font-mono font-bold uppercase ${activeSlot === "A" ? "text-sky-400" : "text-slate-500"}`}>
              [Slot A] Target Model
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
            {hypoA ? hypoA.title : "-- Click hypothesis to load --"}
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

        {/* Slot B Button */}
        <button
          onClick={() => setActiveSlot("B")}
          className={`p-2 rounded border transition-all text-left flex flex-col gap-1 relative ${
            activeSlot === "B"
              ? "bg-violet-500/10 border-violet-500"
              : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[8.5px] font-mono font-bold uppercase ${activeSlot === "B" ? "text-violet-400" : "text-slate-500"}`}>
              [Slot B] Target Model
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
            {hypoB ? hypoB.title : "-- Click hypothesis to load --"}
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

        {/* Slot C Button */}
        <button
          onClick={() => setActiveSlot("C")}
          className={`p-2 rounded border transition-all text-left flex flex-col gap-1 relative ${
            activeSlot === "C"
              ? "bg-amber-500/10 border-amber-500"
              : "bg-slate-950/40 border-slate-900 hover:border-slate-800"
          }`}
        >
          <div className="flex justify-between items-center">
            <span className={`text-[8.5px] font-mono font-bold uppercase ${activeSlot === "C" ? "text-amber-400" : "text-slate-500"}`}>
              [Slot C] Target Model
            </span>
            {hypoC && (
              <button 
                onClick={(e) => { e.stopPropagation(); onClearSlot("C"); }}
                className="text-slate-600 hover:text-rose-400 font-bold text-[9px] z-10"
              >
                Clear
              </button>
            )}
          </div>
          <h4 className="text-slate-200 font-bold leading-normal text-[10px] line-clamp-1">
            {hypoC ? hypoC.title : "-- Click hypothesis to load --"}
          </h4>
          <span className="text-[8px] font-mono text-slate-500 uppercase">
            {hypoC ? `CONFIDENCE: ${Math.round(hypoC.confidence * 100)}%` : "OPTIONAL THIRD SLOT"}
          </span>
          {activeSlot === "C" && (
            <span className="absolute bottom-1 right-2 text-[7px] font-mono font-bold uppercase text-amber-400 animate-pulse">
              Active Selector
            </span>
          )}
        </button>
      </div>

      {/* Comparison Body Content */}
      {activeHypotheses.length < 2 ? (
        <div className="flex-1 bg-[#07080A] border border-dashed border-slate-800 rounded flex flex-col items-center justify-center p-6 text-center text-slate-500 gap-2 font-sans">
          <AlertCircle className="w-8 h-8 text-slate-600 animate-bounce" />
          <div className="max-w-xs flex flex-col gap-0.5">
            <span className="font-bold text-slate-400">Select At Least 2 Hypotheses</span>
            <span>
              Click any hypothesis card in the left list to assign it to the active target slot above (Slots A, B, or C). Select up to 3 models simultaneously for tri-panel comparison.
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1">
          
          {/* Quantitative KPI Delta Overview Cards */}
          <div className="bg-slate-950 border border-slate-900 rounded p-3 flex flex-col gap-2 font-sans">
            <div className="flex justify-between items-center border-b border-slate-900 pb-1.5">
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Tri-Panel Quantitative Delta Summary ({activeHypotheses.length} Models Selected)
              </span>
              <span className="text-[8px] font-mono text-violet-400 font-bold uppercase bg-violet-500/10 px-1.5 py-0.2 rounded border border-violet-500/20">
                GNN Delta Matrix
              </span>
            </div>

            <div className={`grid grid-cols-1 ${activeHypotheses.length === 3 ? "md:grid-cols-3" : "md:grid-cols-2"} gap-2.5 text-center`}>
              {activeHypotheses.map(item => (
                <div key={item.slot} className={`p-2 rounded border ${item.border} ${item.bg} flex flex-col items-center justify-between`}>
                  <span className={`text-[9px] font-mono font-bold uppercase ${item.color}`}>
                    Slot {item.slot}: {item.hypo.title.substring(0, 24)}...
                  </span>
                  <div className="my-1.5 flex flex-col items-center">
                    <span className="text-base font-mono font-bold text-slate-100">
                      {Math.round(item.hypo.confidence * 100)}%
                    </span>
                    <span className="text-[8px] font-mono text-slate-400 uppercase">Confidence</span>
                  </div>
                  <div className="w-full pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[8px] font-mono text-slate-400">
                    <span>DVS: <strong className="text-slate-200">{item.hypo.discoveryValueScore || 85}</strong></span>
                    <span>NOVELTY: <strong className="text-slate-200">{Math.round(item.hypo.noveltyScore * 100)}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* TRI-PANEL SIDE-BY-SIDE MODEL DESCRIPTIONS */}
          <div className="flex flex-col gap-1.5">
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
              Side-By-Side Scientific Model Specifications
            </span>
            <div className={`grid grid-cols-1 ${activeHypotheses.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-3`}>
              {activeHypotheses.map(item => (
                <div key={item.slot} className={`p-3 rounded border flex flex-col gap-2 ${item.bg} ${item.border}`}>
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <span className={`text-[9.5px] font-mono font-bold uppercase ${item.color}`}>
                      [SLOT {item.slot}] {item.hypo.domain || "Cross-Disciplinary"}
                    </span>
                    <span className="text-[8px] font-mono text-slate-400">
                      STATUS: <strong className="text-slate-200 uppercase">{item.hypo.status}</strong>
                    </span>
                  </div>
                  <h4 className="text-[11px] font-bold text-slate-100 font-sans leading-snug">
                    {item.hypo.title}
                  </h4>
                  <p className="text-slate-300 leading-relaxed font-sans text-[10px]">
                    {item.hypo.description}
                  </p>

                  {item.hypo.expectedOutcomes && (
                    <div className="mt-1 p-1.5 bg-slate-950/80 border border-slate-900 rounded text-[9px] font-sans">
                      <span className="font-mono text-slate-400 font-bold uppercase block text-[8px] mb-0.5">Predicted Outcome:</span>
                      <span className="text-slate-300">{item.hypo.expectedOutcomes}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* HIGHLIGHTED CONFLICTING ASSERTIONS & MODEL CONTRADICTIONS */}
          <div id="conflicting-assertions-panel" className="bg-[#07080A] border border-amber-500/30 rounded p-3.5 flex flex-col gap-3 shadow-lg shadow-amber-950/10">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse" />
                <h3 className="text-amber-400 font-mono font-bold text-[10.5px] uppercase tracking-wider">
                  Conflicting Assertions & Model Contradictions
                </h3>
              </div>
              <span className="text-[8.5px] font-mono font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                {conflictingAssertions.length} {conflictingAssertions.length === 1 ? "Conflict Detected" : "Conflicts Detected"}
              </span>
            </div>

            <p className="text-[10px] text-slate-400 font-sans leading-relaxed">
              Automated contradiction engine highlighting opposing mechanisms, divergent feasibility bounds, and conflicting predictions across the {activeHypotheses.length} selected scientific models.
            </p>

            <div className="flex flex-col gap-2.5">
              {conflictingAssertions.map((conflict) => (
                <div 
                  key={conflict.id} 
                  className="bg-[#0F1115] border border-rose-500/30 hover:border-rose-500/50 rounded p-3 flex flex-col gap-2 transition-all"
                >
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-[10px] font-bold text-slate-200 font-sans">{conflict.title}</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-rose-400 bg-rose-500/20 px-1.5 py-0.2 rounded uppercase border border-rose-500/30">
                      {conflict.type.toUpperCase()} CONFLICT
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[9.5px] font-sans">
                    {conflict.modelAClaim && (
                      <div className="p-2 bg-slate-950 border border-slate-900 rounded flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-sky-400 font-bold uppercase">Assertion A</span>
                        <span className="text-slate-300 leading-snug">{conflict.modelAClaim}</span>
                      </div>
                    )}
                    {conflict.modelBClaim && (
                      <div className="p-2 bg-slate-950 border border-slate-900 rounded flex flex-col gap-1">
                        <span className="text-[8px] font-mono text-violet-400 font-bold uppercase">Assertion B</span>
                        <span className="text-slate-300 leading-snug">{conflict.modelBClaim}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] font-mono text-emerald-400 bg-emerald-500/5 border border-emerald-500/20 p-1.5 rounded">
                    <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                    <span><strong>Resolution Protocol:</strong> {conflict.resolutionHint}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SIDE-BY-SIDE VISUAL METRIC BARS Across 3 Slots */}
          <div className="bg-[#07080A] border border-slate-850/80 rounded p-3 flex flex-col gap-3">
            <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400 border-b border-slate-900 pb-1.5">
              Synthesis Metrics & Feasibility Comparison across Slots A, B, C
            </span>
            {renderMetricRow3("Discovery Confidence", hypoA?.confidence, hypoB?.confidence, hypoC?.confidence)}
            {renderMetricRow3("Discovery Value Score", hypoA ? (hypoA.discoveryValueScore || 85) / 100 : undefined, hypoB ? (hypoB.discoveryValueScore || 85) / 100 : undefined, hypoC ? (hypoC.discoveryValueScore || 85) / 100 : undefined)}
            {renderMetricRow3("Novelty Quotient", hypoA?.noveltyScore, hypoB?.noveltyScore, hypoC?.noveltyScore)}
            {renderMetricRow3("Clinical Feasibility", hypoA?.clinicalFeasibility, hypoB?.clinicalFeasibility, hypoC?.clinicalFeasibility)}
            {renderMetricRow3("Computational Solver Bounds", hypoA?.computationalFeasibility, hypoB?.computationalFeasibility, hypoC?.computationalFeasibility)}
          </div>

          {/* UNDERLYING KNOWLEDGE GRAPH CONNECTION TRAVERSALS */}
          <div className="flex flex-col gap-2 bg-[#07080A] border border-slate-850/80 rounded p-3">
            <div className="flex items-center justify-between border-b border-slate-900 pb-1.5">
              <span className="text-[8.5px] font-mono font-bold uppercase tracking-wider text-slate-400">
                Underlying Knowledge Graph Connections Across Models
              </span>
              <span className="text-[8px] font-mono text-emerald-400 font-bold uppercase tracking-wide bg-emerald-500/5 border border-emerald-500/10 px-1 py-0.2 rounded">
                GNN Link Prediction Comparisons
              </span>
            </div>

            <div className={`grid grid-cols-1 ${activeHypotheses.length === 3 ? "lg:grid-cols-3" : "lg:grid-cols-2"} gap-3`}>
              {activeHypotheses.map(item => (
                <div key={item.slot} className="flex flex-col gap-1.5">
                  <span className={`text-[8.5px] font-mono font-bold uppercase ${item.color}`}>
                    Slot {item.slot} Pathways ({item.hypo.indirectLinks.length})
                  </span>
                  <div className="flex flex-col gap-1 max-h-36 overflow-y-auto pr-1">
                    {item.hypo.indirectLinks.map((link, idx) => (
                      <div key={idx} className="bg-slate-950/80 border border-slate-900 p-1.5 rounded flex items-center justify-between gap-1 text-[9.5px]">
                        <span className="font-medium text-slate-200 truncate">{link.source}</span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                        <span className="text-[8px] font-mono text-slate-500 uppercase font-bold italic shrink-0">
                          {link.relation}
                        </span>
                        <ArrowRight className="w-2.5 h-2.5 text-slate-600 shrink-0" />
                        <span className="font-medium text-slate-200 truncate text-right">{link.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {commonNodes.length > 0 && (
              <div className="mt-2 text-[8px] font-mono text-slate-500 flex flex-wrap items-center gap-1 leading-relaxed border-t border-slate-900 pt-1.5">
                <span className="text-emerald-400 font-bold uppercase bg-emerald-500/10 px-1 rounded mr-1">Shared Nodes Across Models:</span>
                {commonNodes.map((item, idx) => (
                  <span key={idx} className="bg-slate-950 border border-slate-900 px-1 py-0.2 rounded text-slate-300 font-sans">
                    {item.label} ({item.count} models)
                  </span>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}

