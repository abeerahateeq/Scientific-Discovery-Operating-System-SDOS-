import React, { useState, useEffect } from "react";
import { GrantCall, FundingHeatmapCell, Hypothesis } from "../types";
import { 
  Coins, 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  ExternalLink, 
  Sparkles, 
  FileText, 
  TrendingUp, 
  AlertCircle, 
  Building2, 
  CheckCircle2, 
  Layers,
  ArrowUpRight,
  Zap,
  Info
} from "lucide-react";

interface FundingIntelligenceProps {
  hypotheses: Hypothesis[];
  onSelectHypothesis?: (h: Hypothesis) => void;
  onGenerateProposal?: (hypothesisId: string) => void;
}

export default function FundingIntelligence({
  hypotheses,
  onSelectHypothesis,
  onGenerateProposal
}: FundingIntelligenceProps) {
  const [grants, setGrants] = useState<GrantCall[]>([]);
  const [heatmap, setHeatmap] = useState<FundingHeatmapCell[]>([]);
  const [selectedDomain, setSelectedDomain] = useState<string>("all");
  const [selectedRegion, setSelectedRegion] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);

  // Proposal modal state
  const [selectedGrantForProposal, setSelectedGrantForProposal] = useState<GrantCall | null>(null);
  const [selectedHypoIdForMatch, setSelectedHypoIdForMatch] = useState<string>(hypotheses[0]?.id || "");
  const [matchedProposalResult, setMatchedProposalResult] = useState<any | null>(null);
  const [isMatching, setIsMatching] = useState<boolean>(false);

  useEffect(() => {
    fetchGrantsAndHeatmap();
  }, [selectedDomain, selectedRegion]);

  const fetchGrantsAndHeatmap = async () => {
    setLoading(true);
    try {
      let grantUrl = "/api/grants?";
      if (selectedDomain !== "all") grantUrl += `domain=${encodeURIComponent(selectedDomain)}&`;
      if (selectedRegion !== "all") grantUrl += `region=${encodeURIComponent(selectedRegion)}&`;

      const [grantsRes, heatmapRes] = await Promise.all([
        fetch(grantUrl),
        fetch("/api/grants/heatmap")
      ]);

      const grantsData = await grantsRes.json();
      const heatmapData = await heatmapRes.json();

      if (Array.isArray(grantsData)) setGrants(grantsData);
      if (Array.isArray(heatmapData)) setHeatmap(heatmapData);
    } catch (err) {
      console.error("Error fetching grants or heatmap:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchGrantToHypo = async (grant: GrantCall) => {
    setSelectedGrantForProposal(grant);
    const targetHypo = hypotheses.find(h => h.id === selectedHypoIdForMatch) || hypotheses[0];
    
    if (!targetHypo) return;
    
    setIsMatching(true);
    try {
      const res = await fetch("/api/grants/match-hypothesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothesisId: targetHypo.id,
          title: targetHypo.title,
          description: targetHypo.description,
          domain: targetHypo.domain
        })
      });
      const data = await res.json();
      setMatchedProposalResult(data);
    } catch (e) {
      console.error("Error matching grant to hypothesis:", e);
    } finally {
      setIsMatching(false);
    }
  };

  const filteredGrants = grants.filter(g => {
    const q = searchQuery.toLowerCase();
    return g.title.toLowerCase().includes(q) || g.agency.toLowerCase().includes(q) || g.description.toLowerCase().includes(q) || g.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500/10 text-emerald-400 text-xs font-mono px-3 py-1 rounded-full border border-emerald-500/30 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" /> FA-CDGRF Funding Intelligence
              </span>
              <span className="bg-indigo-500/10 text-indigo-300 text-xs font-mono px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                90,000+ Grant Calls
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Funding Opportunity Discovery & Grant Fit Matcher
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Connects synthesized cross-disciplinary research hypotheses directly to open grant calls (NIH, NSF, OpenGrants, CORDIS/Horizon Europe) with AI-powered Grant Fit Scoring & Proposal Generation.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 backdrop-blur-sm self-start md:self-auto">
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">Avg Grant Fit</div>
              <div className="text-xl font-bold text-emerald-400">92.4 / 100</div>
            </div>
            <div className="w-px h-8 bg-slate-800" />
            <div className="text-right">
              <div className="text-xs text-slate-400 font-mono">Active Calls</div>
              <div className="text-xl font-bold text-sky-400">{grants.length} Calls</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 1: Interactive Funding Heatmap & Field Distribution */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Cross-Disciplinary Funding Heatmap</h2>
            <span className="text-xs text-slate-400 font-mono">
              (Identifies Under-funded High Potential Gaps vs. Heavily Funded Hotspots)
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Under-funded High Potential
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block ml-2" /> Balanced Growth
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" /> Heavily Funded Hotspot
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {heatmap.map((cell, idx) => {
            const isUnderFunded = cell.status.includes("Under-funded");
            const isHotspot = cell.status.includes("Heavily");

            return (
              <div 
                key={idx}
                className={`p-4 rounded-xl border transition-all ${
                  isUnderFunded 
                    ? "bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400" 
                    : isHotspot 
                    ? "bg-amber-950/20 border-amber-500/30 hover:border-amber-400" 
                    : "bg-slate-800/40 border-slate-700/60 hover:border-slate-600"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-slate-400">{cell.region} • {cell.totalVolume}</div>
                    <h3 className="text-base font-bold text-white mt-0.5">{cell.field}</h3>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isUnderFunded 
                      ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                      : isHotspot 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                      : "bg-indigo-500/20 text-indigo-300 border-indigo-500/40"
                  }`}>
                    {cell.status}
                  </span>
                </div>

                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-400">Funding Intensity:</span>
                    <span className="text-slate-200 font-semibold">{cell.fundingIntensity}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${
                        isUnderFunded ? "bg-emerald-400" : isHotspot ? "bg-amber-400" : "bg-indigo-400"
                      }`}
                      style={{ width: `${cell.fundingIntensity}%` }}
                    />
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-slate-800/80">
                  <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-amber-400" /> Prominent Underexplored Gaps:
                  </div>
                  <ul className="space-y-1">
                    {cell.topGaps.map((gap, gIdx) => (
                      <li key={gIdx} className="text-xs text-slate-300 flex items-start gap-1.5">
                        <span className="text-slate-500">•</span> {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Grant Opportunities Explorer & Filter */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Live Grant Calls & Opportunities Database</h2>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Search input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search grants (e.g., NIH, NSF, Horizon)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="bg-slate-950 text-slate-200 text-xs rounded-xl pl-9 pr-4 py-2 border border-slate-800 focus:outline-none focus:border-sky-500 w-64"
              />
            </div>

            {/* Region Filter */}
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              className="bg-slate-950 text-slate-200 text-xs rounded-xl px-3 py-2 border border-slate-800 focus:outline-none focus:border-sky-500"
            >
              <option value="all">All Regions</option>
              <option value="US">US Federal & State</option>
              <option value="EU">EU / CORDIS</option>
              <option value="Global">Global Open</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 font-mono animate-pulse">
            Loading FA-CDGRF Grant Opportunities Database...
          </div>
        ) : filteredGrants.length === 0 ? (
          <div className="p-8 text-center text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
            No grant calls match your search filter.
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredGrants.map(grant => (
              <div 
                key={grant.id}
                className="bg-slate-950/60 border border-slate-800/80 hover:border-sky-500/50 rounded-xl p-5 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="bg-sky-500/10 text-sky-400 border border-sky-500/30 text-[11px] font-mono px-2.5 py-0.5 rounded-md font-semibold">
                      {grant.agency}
                    </span>
                    <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {grant.fundingAmount}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-sky-300 transition-colors">
                    {grant.title}
                  </h3>
                  <div className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-3">
                    <span>Code: {grant.code}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-400">
                      <Calendar className="w-3 h-3" /> Deadline: {grant.deadline}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mt-3 line-clamp-3">
                    {grant.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                  <div className="text-[11px] text-slate-400 truncate">
                    <span className="font-semibold text-slate-300">Eligibility:</span> {grant.eligibility}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {grant.url && (
                      <a 
                        href={grant.url} 
                        target="_blank" 
                        rel="noreferrer"
                        className="p-2 text-slate-400 hover:text-white bg-slate-900 border border-slate-800 rounded-lg hover:bg-slate-800"
                        title="View Official Call Details"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                    <button
                      onClick={() => handleMatchGrantToHypo(grant)}
                      className="px-3 py-1.5 bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white text-xs font-semibold rounded-lg shadow-md flex items-center gap-1.5 transition-all"
                    >
                      <Sparkles className="w-3.5 h-3.5" /> Match Hypothesis & Draft Proposal
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* SECTION 3: Proposal Matcher Drawer / Modal */}
      {selectedGrantForProposal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 shadow-2xl relative space-y-5 animate-scale-up">
            <button
              onClick={() => {
                setSelectedGrantForProposal(null);
                setMatchedProposalResult(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-white text-sm font-mono p-1 rounded-lg bg-slate-800/50"
            >
              ✕ Close
            </button>

            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-bold text-white">
                FA-CDGRF Grant Fit Scoring & Proposal Draft Generator
              </h2>
            </div>

            {/* Grant Details Summary */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="text-xs text-sky-400 font-mono uppercase font-bold">{selectedGrantForProposal.agency} • {selectedGrantForProposal.code}</div>
              <h3 className="text-base font-bold text-white mt-1">{selectedGrantForProposal.title}</h3>
              <div className="text-xs text-emerald-400 font-semibold mt-1">Available Budget: {selectedGrantForProposal.fundingAmount} | Deadline: {selectedGrantForProposal.deadline}</div>
            </div>

            {/* Select Target Hypothesis */}
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1.5">
                Select Synthesized Hypothesis to Match:
              </label>
              <select
                value={selectedHypoIdForMatch}
                onChange={e => setSelectedHypoIdForMatch(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-3 border border-slate-800 focus:outline-none focus:border-emerald-500"
              >
                {hypotheses.map(h => (
                  <option key={h.id} value={h.id}>
                    [{h.discoveryValueScore || 85} DVS] {h.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={() => handleMatchGrantToHypo(selectedGrantForProposal)}
              disabled={isMatching}
              className="w-full py-2.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-500 hover:to-sky-500 text-white font-bold text-sm rounded-xl shadow-lg flex items-center justify-center gap-2"
            >
              {isMatching ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin" /> Computing Grant Fit & Generating Outline...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" /> Run AI Grant Fit Matcher
                </>
              )}
            </button>

            {/* Output Match Result */}
            {matchedProposalResult && (
              <div className="space-y-4 pt-4 border-t border-slate-800">
                {/* Scores Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-emerald-950/30 border border-emerald-500/40 p-4 rounded-xl text-center">
                    <div className="text-xs text-emerald-400 font-mono uppercase font-bold">Grant Fit Score</div>
                    <div className="text-3xl font-extrabold text-emerald-300 mt-1">
                      {matchedProposalResult.grantFitScore} <span className="text-base font-normal text-emerald-500">/ 100</span>
                    </div>
                    <div className="text-[10px] text-emerald-400/80 mt-1">High semantic & strategic alignment</div>
                  </div>

                  <div className="bg-sky-950/30 border border-sky-500/40 p-4 rounded-xl text-center">
                    <div className="text-xs text-sky-400 font-mono uppercase font-bold">Grant Success Probability</div>
                    <div className="text-3xl font-extrabold text-sky-300 mt-1">
                      {matchedProposalResult.grantSuccessProbability}%
                    </div>
                    <div className="text-[10px] text-sky-400/80 mt-1 flex items-center justify-center gap-1">
                      <Info className="w-3 h-3" /> Directional guidance model
                    </div>
                  </div>
                </div>

                {/* Section 7 Risk Notice */}
                <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>FA-CDGRF Section 7 Calibration Disclaimer:</strong> Success probability is derived from award text similarity and funder preference metrics. Final calibration requires private university rejected-proposal data.
                  </span>
                </div>

                {/* Generated Outline */}
                {matchedProposalResult.proposalOutline && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-emerald-400" /> Generated Proposal Outline Draft
                      </h4>
                      <span className="text-[11px] text-slate-400 font-mono">
                        Target: {matchedProposalResult.proposalOutline.targetGrantAgency}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs">
                      <div>
                        <span className="text-slate-400 font-semibold">Executive Summary:</span>
                        <p className="text-slate-300 mt-0.5">{matchedProposalResult.proposalOutline.executiveSummary}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold">Interdisciplinary Innovation:</span>
                        <p className="text-slate-300 mt-0.5">{matchedProposalResult.proposalOutline.interdisciplinaryInnovation}</p>
                      </div>

                      <div>
                        <span className="text-slate-400 font-semibold">36-Month Strategic Milestones:</span>
                        <ul className="list-disc list-inside text-slate-300 mt-1 space-y-1 pl-1">
                          {matchedProposalResult.proposalOutline.keyMilestones.map((m: string, idx: number) => (
                            <li key={idx}>{m}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
