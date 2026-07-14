import React, { useState } from "react";
import { 
  Sparkles, 
  TrendingUp, 
  BookOpen, 
  Compass, 
  HelpCircle, 
  Cpu, 
  Activity, 
  Zap,
  ArrowRight,
  Filter,
  BarChart2
} from "lucide-react";
import { Hypothesis } from "../types";

interface GlobalGapDetectorProps {
  onInitiateGapRun: (query: string) => void;
  isGenerating: boolean;
}

const DISCIPLINES = [
  { name: "Cancer Research", volume: 10, fillChar: "█", fillPercent: 100 },
  { name: "Climate Change", volume: 8, fillChar: "█", fillPercent: 80 },
  { name: "Quantum Computing", volume: 5, fillChar: "█", fillPercent: 50 },
  { name: "Marine Biology", volume: 2, fillChar: "█", fillPercent: 20 },
  { name: "Synthetic Ecology", volume: 0.5, fillChar: "░", fillPercent: 5 }
];

// Matrix representing underexplored intersection gaps between disciplines
// Scale: 100 is highly underexplored with massive potential, 0 has been thoroughly mapped already.
const INTERSECTION_DATA: Record<string, Record<string, {
  gapScore: number;
  papersCount: number;
  saliency: number;
  proposedQuery: string;
  shortDesc: string;
  proposedHypothesisTitle: string;
}>> = {
  "Cancer Research": {
    "Cancer Research": { gapScore: 10, papersCount: 14500, saliency: 25, proposedQuery: "", shortDesc: "Highly explored standard oncology pathways", proposedHypothesisTitle: "" },
    "Climate Change": { gapScore: 45, papersCount: 124, saliency: 62, proposedQuery: "Analyze physiological adaptation bounds of solid tumor hypoxia models under localized atmospheric temperature hyper-variables.", shortDesc: "Climate temperature models applied to solid tumor hypoxia progression", proposedHypothesisTitle: "Macro-climatic Thermal Bounds for Intracellular Hypoxic Resignation" },
    "Quantum Computing": { gapScore: 82, papersCount: 12, saliency: 92, proposedQuery: "Implement quantum topological syndrome decoders on multi-spectral genomic cancer mutation sequences.", shortDesc: "Quantum error correction algorithms mapping somatic mutations", proposedHypothesisTitle: "Fault-Tolerant Genomic Syndrome Decoding for Cancer Driver Mutations" },
    "Marine Biology": { gapScore: 89, papersCount: 4, saliency: 95, proposedQuery: "Synthesize targeted anti-tumor compounds using deep-sea benthic sponge metabolomics and GNN sequence locks.", shortDesc: "Deep-sea sponge chemical scaffolds inhibiting active oncology receptors", proposedHypothesisTitle: "Benthic Sponge Sesterterpenoid Receptor Locking for Oncology Apoptosis" },
    "Synthetic Ecology": { gapScore: 94, papersCount: 1, saliency: 98, proposedQuery: "Model solid tumor micro-environments as synthetic ecological niches utilizing multi-agent competitive carrying capacities.", shortDesc: "Multi-agent ecological predator-prey dynamics inside tumor vascular niches", proposedHypothesisTitle: "Ecological Carrying Capacity Modeling for Angiogenesis Niches" }
  },
  "Climate Change": {
    "Cancer Research": { gapScore: 45, papersCount: 124, saliency: 62, proposedQuery: "Analyze physiological adaptation bounds of solid tumor hypoxia models under localized atmospheric temperature hyper-variables.", shortDesc: "Climate temperature models applied to solid tumor hypoxia progression", proposedHypothesisTitle: "Macro-climatic Thermal Bounds for Intracellular Hypoxic Resignation" },
    "Climate Change": { gapScore: 15, papersCount: 9200, saliency: 30, proposedQuery: "", shortDesc: "Standard carbon cycles and ocean heating models", proposedHypothesisTitle: "" },
    "Quantum Computing": { gapScore: 78, papersCount: 18, saliency: 89, proposedQuery: "Model room-temperature quantum entanglement stability within ribosomal carbon capture structures.", shortDesc: "Quantum mechanics modeling for photosynthesis-like carbon sequestration", proposedHypothesisTitle: "Quantum Spin-Glass Optimization for Ribosomal Carbon Fixation" },
    "Marine Biology": { gapScore: 68, papersCount: 450, saliency: 78, proposedQuery: "Analyze localized photosynthetic shifts in phytoplankton under accelerated ocean thermal boundaries.", shortDesc: "Phytoplankton thermal adaptability under high ocean temperatures", proposedHypothesisTitle: "Phytoplanktonic Thermal Resilience Bounds under Rapid Ocean Warps" },
    "Synthetic Ecology": { gapScore: 92, papersCount: 3, saliency: 97, proposedQuery: "Design synthetic micro-algae ribozyme arrays to stabilize ocean carbon cycles in toxic marine areas.", shortDesc: "Synthetic micro-ecology designed to survive and sequester carbon in chemical runoff", proposedHypothesisTitle: "Synthetic Extremophile Carbon Sequestration Ribozyme Arrays" }
  },
  "Quantum Computing": {
    "Cancer Research": { gapScore: 82, papersCount: 12, saliency: 92, proposedQuery: "Implement quantum topological syndrome decoders on multi-spectral genomic cancer mutation sequences.", shortDesc: "Quantum error correction algorithms mapping somatic mutations", proposedHypothesisTitle: "Fault-Tolerant Genomic Syndrome Decoding for Cancer Driver Mutations" },
    "Climate Change": { gapScore: 78, papersCount: 18, saliency: 89, proposedQuery: "Model room-temperature quantum entanglement stability within ribosomal carbon capture structures.", shortDesc: "Quantum mechanics modeling for photosynthesis-like carbon sequestration", proposedHypothesisTitle: "Quantum Spin-Glass Optimization for Ribosomal Carbon Fixation" },
    "Quantum Computing": { gapScore: 20, papersCount: 4500, saliency: 35, proposedQuery: "", shortDesc: "Classical qubits and quantum gate simulations", proposedHypothesisTitle: "" },
    "Marine Biology": { gapScore: 91, papersCount: 2, saliency: 96, proposedQuery: "Model marine bio-luminescence luciferin spin state channels using topological surface code stabilizer decoders.", shortDesc: "Spin-coherence modeling of natural bioluminescent signaling", proposedHypothesisTitle: "Bioluminescent Spin-Coherence Modeling via Stabilizer Syndromes" },
    "Synthetic Ecology": { gapScore: 96, papersCount: 0, saliency: 99, proposedQuery: "Model competitive species distribution bounds in synthetic ecological niches using high-density quantum lattice algorithms.", shortDesc: "High-density quantum lattices simulating complex carrying capacity shifts", proposedHypothesisTitle: "Quantum Lattice-Assisted Carry Bounds for Synthetic Ecology" }
  },
  "Marine Biology": {
    "Cancer Research": { gapScore: 89, papersCount: 4, saliency: 95, proposedQuery: "Synthesize targeted anti-tumor compounds using deep-sea benthic sponge metabolomics and GNN sequence locks.", shortDesc: "Deep-sea sponge chemical scaffolds inhibiting active oncology receptors", proposedHypothesisTitle: "Benthic Sponge Sesterterpenoid Receptor Locking for Oncology Apoptosis" },
    "Climate Change": { gapScore: 68, papersCount: 450, saliency: 78, proposedQuery: "Analyze localized photosynthetic shifts in phytoplankton under accelerated ocean thermal boundaries.", shortDesc: "Phytoplankton thermal adaptability under high ocean temperatures", proposedHypothesisTitle: "Phytoplanktonic Thermal Resilience Bounds under Rapid Ocean Warps" },
    "Quantum Computing": { gapScore: 91, papersCount: 2, saliency: 96, proposedQuery: "Model marine bio-luminescence luciferin spin state channels using topological surface code stabilizer decoders.", shortDesc: "Spin-coherence modeling of natural bioluminescent signaling", proposedHypothesisTitle: "Bioluminescent Spin-Coherence Modeling via Stabilizer Syndromes" },
    "Marine Biology": { gapScore: 12, papersCount: 3800, saliency: 20, proposedQuery: "", shortDesc: "Coral bleaching studies and standard marine taxonomy", proposedHypothesisTitle: "" },
    "Synthetic Ecology": { gapScore: 84, papersCount: 19, saliency: 88, proposedQuery: "Design synthetic marine biofilms to accelerate plastic decomposition without disturbing deep-benthic ecosystems.", shortDesc: "Plastic-degrading synthetic communities structured for marine pressures", proposedHypothesisTitle: "De-Polymerizing Marine Biofilms for Benthic Plastic Scavenging" }
  },
  "Synthetic Ecology": {
    "Cancer Research": { gapScore: 94, papersCount: 1, saliency: 98, proposedQuery: "Model solid tumor micro-environments as synthetic ecological niches utilizing multi-agent competitive carrying capacities.", shortDesc: "Multi-agent ecological predator-prey dynamics inside tumor vascular niches", proposedHypothesisTitle: "Ecological Carrying Capacity Modeling for Angiogenesis Niches" },
    "Climate Change": { gapScore: 92, papersCount: 3, saliency: 97, proposedQuery: "Design synthetic micro-algae ribozyme arrays to stabilize ocean carbon cycles in toxic marine areas.", shortDesc: "Synthetic micro-ecology designed to survive and sequester carbon in chemical runoff", proposedHypothesisTitle: "Synthetic Extremophile Carbon Sequestration Ribozyme Arrays" },
    "Quantum Computing": { gapScore: 96, papersCount: 0, saliency: 99, proposedQuery: "Model competitive species distribution bounds in synthetic ecological niches using high-density quantum lattice algorithms.", shortDesc: "High-density quantum lattices simulating complex carrying capacity shifts", proposedHypothesisTitle: "Quantum Lattice-Assisted Carry Bounds for Synthetic Ecology" },
    "Marine Biology": { gapScore: 84, papersCount: 19, saliency: 88, proposedQuery: "Design synthetic marine biofilms to accelerate plastic decomposition without disturbing deep-benthic ecosystems.", shortDesc: "Plastic-degrading synthetic communities structured for marine pressures", proposedHypothesisTitle: "De-Polymerizing Marine Biofilms for Benthic Plastic Scavenging" },
    "Synthetic Ecology": { gapScore: 8, papersCount: 320, saliency: 15, proposedQuery: "", shortDesc: "Standard artificial ecosystems and localized bio-domes", proposedHypothesisTitle: "" }
  }
};

export default function GlobalGapDetector({ onInitiateGapRun, isGenerating }: GlobalGapDetectorProps) {
  const [selectedX, setSelectedX] = useState<string>("Quantum Computing");
  const [selectedY, setSelectedY] = useState<string>("Marine Biology");

  const activeGap = INTERSECTION_DATA[selectedY]?.[selectedX] || {
    gapScore: 50,
    papersCount: 5,
    saliency: 70,
    proposedQuery: "Model interdisciplinary scientific gaps.",
    shortDesc: "Standard unexplored interdisciplinary intersection.",
    proposedHypothesisTitle: "Interdisciplinary Convergence Mechanism"
  };

  const handleRunGapBridge = () => {
    if (activeGap.proposedQuery && !isGenerating) {
      onInitiateGapRun(activeGap.proposedQuery);
    }
  };

  return (
    <div id="global-gap-detector-panel" className="grid grid-cols-1 xl:grid-cols-3 gap-4 h-full text-[11px] animate-fade-in">
      
      {/* Column 1 & 2: Gap Visualization and Grid Heatmap */}
      <div className="xl:col-span-2 flex flex-col gap-4">
        
        {/* Masthead */}
        <div className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-1">
          <div className="flex items-center gap-1.5">
            <Compass className="text-sky-400 w-4 h-4 animate-spin-slow" />
            <span className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Macro-Science Diagnostics</span>
          </div>
          <h2 className="text-slate-100 font-bold text-xs uppercase tracking-wider font-sans">Global Literature Research Gap Detector</h2>
          <p className="text-slate-400 font-sans text-[10.5px]">
            Analyzing multi-million paper citation databases to compute missing links at the boundaries of standard disciplines. Identify underexplored cross-domain vectors with high theoretical impact.
          </p>
        </div>

        {/* Lit Density & Underexplored Gaps Chart */}
        <div className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-sky-400" />
              Human Publication Density & Exploratory Boundaries
            </h3>
            <span className="text-[8px] font-mono text-slate-500 uppercase">INDEXED PROPORTIONS</span>
          </div>

          <div className="flex flex-col gap-3">
            {DISCIPLINES.map((d) => {
              // Generate the block representation requested by the user
              // e.g. ██████████ or ░
              const blockCount = Math.round(d.fillPercent / 10);
              const blocks = "█".repeat(blockCount) + "░".repeat(Math.max(0, 10 - blockCount));

              return (
                <div key={d.name} className="flex flex-col md:flex-row md:items-center justify-between gap-1 md:gap-4">
                  <div className="w-40 shrink-0 flex items-center justify-between">
                    <span className="text-slate-300 font-bold font-sans">{d.name}</span>
                    <span className="text-[8.5px] font-mono text-slate-500">Vol: {d.volume}M papers</span>
                  </div>
                  
                  {/* The visual block representation */}
                  <div className="flex-1 flex items-center gap-3">
                    <div className="font-mono text-sky-400 tracking-wider text-xs bg-[#07080A] px-2.5 py-1 rounded border border-slate-850/60 select-none">
                      {blocks}
                    </div>
                    <div className="flex-1 bg-[#07080A] h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          d.fillPercent > 70 ? "bg-emerald-500" : d.fillPercent > 30 ? "bg-amber-500" : "bg-sky-500"
                        }`} 
                        style={{ width: `${d.fillPercent}%` }} 
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Interactive Intersection Heatmap Matrix */}
        <div className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-violet-400" />
              Cross-Disciplinary Gap Intensity Matrix (Select Cell)
            </h3>
            <span className="text-[8px] font-mono text-slate-500 uppercase">AI GNN COMPUTED POTENTIALS</span>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[480px] grid grid-cols-6 gap-1.5 font-mono text-[9px] text-center p-1 select-none">
              
              {/* Header corner cell */}
              <div className="bg-[#07080A]/40 border border-transparent rounded p-2 flex items-center justify-center text-slate-600 italic">
                DISCIPLINE
              </div>

              {/* Column Headers */}
              {DISCIPLINES.map((d) => (
                <div key={d.name} className="bg-[#07080A]/80 border border-slate-850/80 rounded p-1.5 text-slate-400 font-semibold flex items-center justify-center break-words line-clamp-2 leading-tight">
                  {d.name.split(" ")[0]}
                </div>
              ))}

              {/* Rows */}
              {DISCIPLINES.map((rowD) => (
                <React.Fragment key={rowD.name}>
                  {/* Row Header */}
                  <div className="bg-[#07080A]/80 border border-slate-850/80 rounded p-1.5 text-slate-400 font-semibold flex items-center justify-start text-left truncate leading-none">
                    {rowD.name}
                  </div>

                  {/* Intersection cells */}
                  {DISCIPLINES.map((colD) => {
                    const isSelf = rowD.name === colD.name;
                    const cell = INTERSECTION_DATA[rowD.name]?.[colD.name] || { gapScore: 50 };
                    
                    const isSelected = selectedX === colD.name && selectedY === rowD.name;

                    // Color mapping based on Gap score
                    // High gap score (underexplored) -> vibrant glowing violet/sky cyan
                    // Low gap score (explored) -> dark slate
                    const heatClass = isSelf 
                      ? "bg-slate-950/60 border-slate-900/40 text-slate-700 cursor-not-allowed"
                      : cell.gapScore >= 90
                      ? "bg-violet-950/40 hover:bg-violet-950/60 border-violet-500/25 text-violet-300 cursor-pointer animate-pulse"
                      : cell.gapScore >= 75
                      ? "bg-sky-950/30 hover:bg-sky-950/50 border-sky-500/20 text-sky-300 cursor-pointer"
                      : "bg-[#07080A] hover:bg-[#16181D] border-slate-850 text-slate-500 cursor-pointer";

                    const selectBorderClass = isSelected
                      ? "ring-2 ring-sky-400 border-sky-400 scale-105 z-10 shadow-lg shadow-sky-950/20"
                      : "";

                    return (
                      <button
                        key={colD.name}
                        disabled={isSelf}
                        onClick={() => {
                          setSelectedX(colD.name);
                          setSelectedY(rowD.name);
                        }}
                        className={`border rounded p-2.5 transition-all flex flex-col justify-center items-center gap-0.5 min-h-[44px] ${heatClass} ${selectBorderClass}`}
                      >
                        {isSelf ? (
                          <span className="text-[8px] text-slate-700 uppercase font-bold">MAPPED</span>
                        ) : (
                          <>
                            <span className="text-[11.5px] font-bold font-mono leading-none">{cell.gapScore}</span>
                            <span className="text-[7.5px] uppercase text-slate-500 scale-90 block leading-none">GAP</span>
                          </>
                        )}
                      </button>
                    );
                  })}
                </React.Fragment>
              ))}

            </div>
          </div>
          <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono uppercase mt-1 px-1">
            <span>Legend: Gap score 90+ = Critical boundary voids</span>
            <span>Click any cell to inspect predictive linkages</span>
          </div>
        </div>

      </div>

      {/* Column 3: Intersection Inspector and Bridge query synthesis */}
      <div id="gap-inspector-panel" className="bg-[#0F1115] border border-slate-800 rounded p-4 flex flex-col gap-4 overflow-y-auto h-full justify-between">
        
        <div className="flex flex-col gap-4">
          
          <div className="flex items-center gap-1.5 border-b border-slate-850 pb-2 shrink-0">
            <Zap className="text-sky-400 w-4 h-4 animate-bounce" />
            <h3 className="text-slate-200 font-bold uppercase tracking-wider text-[11px]">Interdisciplinary Gap Inspector</h3>
          </div>

          {/* Active coordinates info */}
          <div className="bg-[#07080A] border border-slate-850 p-3 rounded-md flex flex-col gap-2">
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">SELECTED CONVERGENCE SECTOR</span>
            <div className="flex flex-col gap-1.5 font-sans">
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-slate-200 text-xs">{selectedX}</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Vector X</span>
              </div>
              <div className="flex items-center justify-between text-slate-300">
                <span className="font-bold text-slate-200 text-xs">{selectedY}</span>
                <span className="text-[8px] font-mono text-slate-500 uppercase">Vector Y</span>
              </div>
            </div>
          </div>

          {selectedX === selectedY ? (
            <div className="text-center py-8 text-slate-600">
              <HelpCircle className="w-6 h-6 mx-auto mb-1 text-slate-700" />
              <p className="font-sans leading-relaxed text-[11.5px]">Select an intersection between different disciplines to load GNN prediction models.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 animate-fade-in">
              {/* Gap Metrics row */}
              <div className="grid grid-cols-2 gap-2.5">
                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">GNN Prediction Saliency</span>
                  <span className="text-base font-mono text-violet-400 font-bold">{activeGap.saliency}%</span>
                  <p className="text-[7.5px] text-slate-500 uppercase tracking-wider mt-0.5">HIGH-POTENTIAL</p>
                </div>
                <div className="bg-slate-900/50 border border-slate-850 p-2.5 rounded text-center">
                  <span className="text-[8px] font-mono text-slate-500 uppercase block mb-1">Indexed Literature Papers</span>
                  <span className="text-base font-mono text-amber-500 font-bold">{activeGap.papersCount}</span>
                  <p className="text-[7.5px] text-slate-500 uppercase tracking-wider mt-0.5">PUBMED/ARXIV VOL</p>
                </div>
              </div>

              {/* Short description */}
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-mono text-slate-500 uppercase tracking-wider">Gap Context Diagnosis</span>
                <p className="text-slate-300 text-[11px] leading-relaxed font-sans p-2 bg-[#07080A] rounded border border-slate-850">
                  {activeGap.shortDesc}
                </p>
              </div>

              {/* Proposed breakthrough mechanism */}
              {activeGap.proposedHypothesisTitle && (
                <div className="p-3 bg-gradient-to-br from-violet-500/5 to-sky-500/5 border border-sky-500/10 rounded-md flex flex-col gap-1">
                  <span className="text-[8px] font-mono text-sky-400 font-bold uppercase tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-sky-400" />
                    AI-Formulated Bridge Candidate
                  </span>
                  <h4 className="text-slate-100 font-bold font-sans text-[11.5px] leading-snug mt-0.5">{activeGap.proposedHypothesisTitle}</h4>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Gap Run synthesis Button */}
        {selectedX !== selectedY && activeGap.proposedQuery && (
          <div className="flex flex-col gap-2 shrink-0 border-t border-slate-850 pt-3">
            <span className="text-[8.5px] text-slate-500 font-sans italic leading-relaxed">
              *Ready to launch. Our stateful multi-agent orchestrator will search literature arrays, extract entities, build a temporary graph model, and execute ranking loops to synthesize this breakthrough.
            </span>
            <button
              onClick={handleRunGapBridge}
              disabled={isGenerating}
              className="w-full py-2 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 disabled:text-slate-500 transition-all text-white font-bold rounded text-[11px] uppercase tracking-wider flex items-center justify-center gap-1.5"
            >
              {isGenerating ? (
                <>
                  <Activity className="w-4 h-4 animate-spin" />
                  Bridging Gap... Orchestrator Engaged
                </>
              ) : (
                <>
                  <Cpu className="w-4 h-4 fill-current" />
                  Bridge Gap: Synthesize Model
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        )}

      </div>

    </div>
  );
}
