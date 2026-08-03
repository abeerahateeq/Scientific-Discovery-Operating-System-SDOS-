import React, { useState, useEffect } from "react";
import { InstitutionalProposal, Hypothesis } from "../types";
import { 
  Building2, 
  Users, 
  FileText, 
  Plus, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Sparkles, 
  TrendingUp, 
  ChevronRight,
  Send,
  Award,
  AlertCircle
} from "lucide-react";

interface InstitutionalWorkspaceProps {
  hypotheses: Hypothesis[];
  onSelectHypothesis?: (h: Hypothesis) => void;
}

export default function InstitutionalWorkspace({
  hypotheses,
  onSelectHypothesis
}: InstitutionalWorkspaceProps) {
  const [proposals, setProposals] = useState<InstitutionalProposal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showAddModal, setShowAddModal] = useState<boolean>(false);

  // New proposal form state
  const [title, setTitle] = useState("");
  const [pi, setPi] = useState("");
  const [dept, setDept] = useState("");
  const [collabDepts, setCollabDepts] = useState("");
  const [grantAgency, setGrantAgency] = useState("NIH RePORTER");
  const [requestedFunding, setRequestedFunding] = useState("$1,500,000");

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/grants/proposals");
      const data = await res.json();
      if (Array.isArray(data)) setProposals(data);
    } catch (e) {
      console.error("Error fetching proposals:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !pi) return;

    try {
      const res = await fetch("/api/grants/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          principalInvestigator: pi,
          department: dept || "Biophysics Dept",
          collaboratingDepartments: collabDepts ? collabDepts.split(",").map(s => s.trim()) : ["Quantum Center"],
          grantAgency,
          requestedFunding,
          hypothesisId: hypotheses[0]?.id || "hypo-001",
          stage: "Idea formulation",
          grantFitScore: 92,
          successProbability: 78
        })
      });
      const newProp = await res.json();
      setProposals([newProp, ...proposals]);
      setShowAddModal(false);
      setTitle("");
      setPi("");
    } catch (err) {
      console.error("Error creating proposal:", err);
    }
  };

  const STAGES: InstitutionalProposal['stage'][] = [
    "Idea formulation",
    "Evidence Review",
    "Proposal Drafted",
    "Grant Submitted",
    "Awarded"
  ];

  return (
    <div className="space-y-6 animate-fade-in text-slate-100">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950 to-slate-900 border border-purple-900/60 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-purple-500/10 text-purple-400 text-xs font-mono px-3 py-1 rounded-full border border-purple-500/30 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" /> University Grant Office Workspace
              </span>
              <span className="bg-indigo-500/10 text-indigo-300 text-xs font-mono px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                Institutional Analytics & Collaboration
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              Research Office & Faculty Collaboration Dashboard
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-2xl">
              Surfaces hot topic clusters, detects cross-department faculty publication overlap, and tracks institutional grant proposal pipelines from hypothesis formulation to funding award.
            </p>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all self-start md:self-auto"
          >
            <Plus className="w-4 h-4" /> Log New Proposal Track
          </button>
        </div>
      </div>

      {/* Cross-Department Collaboration Auto-Suggestions */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
        <div className="flex items-center gap-2 mb-4">
          <Users className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-bold text-white">Cross-Department Faculty Synergy Suggestions</h2>
          <span className="text-xs text-slate-400 font-mono">(Auto-detected from publication citation overlap)</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-950 p-4 rounded-xl border border-purple-900/40">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                  Overlap Match: 96%
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">
                  Quantum Physics Center + Neurological Diseases Lab
                </h3>
              </div>
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Dr. Chen (Physics) and Dr. Reynolds (Neurology) share 4 mathematical citations on topological surface codes and biomolecular spin-glasses. Ideal for NSF-QBIO-2026 ($1.8M).
            </p>
          </div>

          <div className="bg-slate-950 p-4 rounded-xl border border-sky-900/40">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded border border-sky-500/30">
                  Overlap Match: 91%
                </span>
                <h3 className="text-sm font-bold text-white mt-1.5">
                  School of Pharmacology + Structural Genomics Center
                </h3>
              </div>
              <Coins className="w-5 h-5 text-emerald-400" />
            </div>
            <p className="text-xs text-slate-300 mt-2">
              Prof. Vance and Dr. Mori demonstrate high binding affinity alignment for Drug Z stabilization. Aligns with NIH PAR-26-089 ($2.5M).
            </p>
          </div>
        </div>
      </div>

      {/* Institutional Proposal Pipeline */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-lg backdrop-blur-md">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-sky-400" />
            <h2 className="text-lg font-bold text-white">Active Institutional Proposal Pipeline</h2>
          </div>
          <div className="text-xs text-slate-400 font-mono">
            {proposals.length} Proposals Tracked
          </div>
        </div>

        {/* Stage Columns / Kanban View */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {STAGES.map((stageName, idx) => {
            const stageProps = proposals.filter(p => p.stage === stageName);

            return (
              <div key={idx} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 mb-3">
                  <span className="text-xs font-bold text-slate-300 truncate">{stageName}</span>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2 py-0.5 rounded-full">
                    {stageProps.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageProps.map(prop => (
                    <div 
                      key={prop.id}
                      className="bg-slate-900 border border-slate-800 hover:border-purple-500/50 p-3 rounded-lg space-y-2 transition-all"
                    >
                      <div className="text-[10px] font-mono text-purple-400 font-semibold">{prop.grantAgency}</div>
                      <h4 className="text-xs font-bold text-white line-clamp-2">{prop.title}</h4>
                      <div className="text-[11px] text-slate-400">PI: {prop.principalInvestigator}</div>
                      
                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono">
                        <span className="text-emerald-400 font-bold">{prop.requestedFunding}</span>
                        <span className="text-amber-400">Fit: {prop.grantFitScore}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Proposal Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form 
            onSubmit={handleCreateProposal}
            className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scale-up"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-purple-400" /> Log Institutional Proposal
              </h3>
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Proposal Title</label>
              <input
                type="text"
                required
                placeholder="e.g., Quantum-Biophysics Grant Proposal"
                value={title}
                onChange={e => setTitle(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Principal Investigator (PI)</label>
              <input
                type="text"
                required
                placeholder="e.g., Dr. Elena Rostova"
                value={pi}
                onChange={e => setPi(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Department</label>
              <input
                type="text"
                placeholder="e.g., Department of Biophysics"
                value={dept}
                onChange={e => setDept(e.target.value)}
                className="w-full bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-800 focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">Grant Agency & Amount</label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={grantAgency}
                  onChange={e => setGrantAgency(e.target.value)}
                  className="bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-800"
                />
                <input
                  type="text"
                  value={requestedFunding}
                  onChange={e => setRequestedFunding(e.target.value)}
                  className="bg-slate-950 text-slate-200 text-xs rounded-xl p-2.5 border border-slate-800"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow-lg mt-2"
            >
              Add to Institutional Pipeline
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
