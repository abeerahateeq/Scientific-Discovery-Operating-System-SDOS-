import React, { useState, useEffect, useMemo } from "react";
import { 
  BookOpen, 
  FileText, 
  TestTube, 
  Bot, 
  Terminal, 
  Sparkles, 
  Download, 
  Copy, 
  Check, 
  Play, 
  Plus, 
  DollarSign, 
  Clock, 
  Layers, 
  ShieldAlert, 
  Share2, 
  Code,
  FileSpreadsheet,
  CheckCircle2,
  RefreshCw,
  Cpu,
  Filter,
  Upload,
  Globe,
  Database
} from "lucide-react";
import { 
  Hypothesis, 
  LiteratureReview, 
  DraftedManuscript, 
  ExperimentPlan, 
  CustomResearchAgent, 
  ReproducibleNotebookPackage,
  ScientificPaper
} from "../types";
import LiteratureReviewAgent from "./LiteratureReviewAgent";

interface ResearchOSWorkspaceProps {
  hypotheses: Hypothesis[];
  papers?: ScientificPaper[];
  onSelectHypothesis?: (hypothesis: Hypothesis) => void;
}

export default function ResearchOSWorkspace({ hypotheses, papers = [], onSelectHypothesis }: ResearchOSWorkspaceProps) {
  const [activeSubTab, setActiveSubTab] = useState<"lit_review" | "paper_drafter" | "experiment_plan" | "custom_agents" | "reproducible_notebook">("lit_review");
  const [selectedHypothesisId, setSelectedHypothesisId] = useState<string>(hypotheses[0]?.id || "");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // States for outputs
  const [litReview, setLitReview] = useState<LiteratureReview | null>(null);
  const [manuscript, setManuscript] = useState<DraftedManuscript | null>(null);
  const [experimentPlan, setExperimentPlan] = useState<ExperimentPlan | null>(null);
  const [customAgents, setCustomAgents] = useState<CustomResearchAgent[]>([]);
  const [notebookPkg, setNotebookPkg] = useState<ReproducibleNotebookPackage | null>(null);

  // Custom agent creation form
  const [newAgentName, setNewAgentName] = useState("");
  const [newAgentDomain, setNewAgentDomain] = useState("Quantum & Materials Science");
  const [newAgentPrompt, setNewAgentPrompt] = useState("");
  const [showAgentModal, setShowAgentModal] = useState(false);

  // Proposal Investor / Funding Program Selection state
  const [selectedFunderMode, setSelectedFunderMode] = useState<string>("grant-nsf-02");
  const [customFunderName, setCustomFunderName] = useState("Schmidt Science Fellows / DOE Energy Science");
  const [customFunderCode, setCustomFunderCode] = useState("SCHMIDT-DOE-2026");
  const [customTargetBudget, setCustomTargetBudget] = useState("$2,500,000");
  const [customFunderFocus, setCustomFunderFocus] = useState("Cross-domain physical simulation & rapid experimental translation");

  // Citation Evidence Filter toggle state ("all" | "user_uploaded" | "system_discovered")
  const [citationFilterMode, setCitationFilterMode] = useState<"all" | "user_uploaded" | "system_discovered">("all");

  const selectedHypo = hypotheses.find(h => h.id === selectedHypothesisId) || hypotheses[0];

  // Filter evidence based on user-uploaded vs system-discovered citation source
  const filteredEvidence = useMemo(() => {
    if (!selectedHypo || !selectedHypo.supportingEvidence) return [];
    const evidenceList = selectedHypo.supportingEvidence;
    if (citationFilterMode === "all") return evidenceList;

    const userUploadedTitles = papers
      .filter(p => p.sourceType === 'user_uploaded' || p.id.startsWith('usr') || p.id.startsWith('paper-usr'))
      .map(p => p.title.toLowerCase());

    if (citationFilterMode === "user_uploaded") {
      return evidenceList.filter(cite => {
        const lower = cite.toLowerCase();
        return lower.includes("user") || lower.includes("upload") || userUploadedTitles.some(t => lower.includes(t));
      });
    }

    if (citationFilterMode === "system_discovered") {
      return evidenceList.filter(cite => {
        const lower = cite.toLowerCase();
        return !lower.includes("user") && !userUploadedTitles.some(t => lower.includes(t));
      });
    }

    return evidenceList;
  }, [selectedHypo, citationFilterMode, papers]);

  useEffect(() => {
    fetchCustomAgents();
  }, []);

  const fetchCustomAgents = async () => {
    try {
      const res = await fetch("/api/research-os/custom-agents");
      if (res.ok) {
        const data = await res.json();
        setCustomAgents(data);
      }
    } catch (e) {
      console.error("Failed to fetch custom agents", e);
    }
  };

  const generateLitReview = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/research-os/literature-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: selectedHypo?.title || "Quantum Biophysics and Molecular Aggregation",
          domain: selectedHypo?.domain || "Quantum Biophysics",
          paperIds: []
        })
      });
      if (res.ok) {
        const data = await res.json();
        setLitReview(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateDraftManuscript = async () => {
    setIsLoading(true);
    try {
      let invName = "NSF Awards";
      let invCode = "NSF-QBIO-2026";
      let invBudget = "$1,800,000";
      let invFocus = "Quantum-Enhanced Biomolecular Modeling and Physical State Landscapes";

      if (selectedFunderMode === "grant-nih-01") {
        invName = "NIH RePORTER";
        invCode = "PAR-26-089";
        invBudget = "$2,500,000";
        invFocus = "Cross-Domain Computational Approaches & Translational Interventions";
      } else if (selectedFunderMode === "grant-doe-01") {
        invName = "DOE Office of Science";
        invCode = "DOE-BES-2026";
        invBudget = "$3,000,000";
        invFocus = "Advanced Materials & Computational Physical Science";
      } else if (selectedFunderMode === "grant-darpa-01") {
        invName = "DARPA Defense Sciences";
        invCode = "DARPA-DSO-2026";
        invBudget = "$4,500,000";
        invFocus = "High-Risk Unconventional Physical & Algorithmic Paradigms";
      } else if (selectedFunderMode === "custom") {
        invName = customFunderName;
        invCode = customFunderCode;
        invBudget = customTargetBudget;
        invFocus = customFunderFocus;
      }

      const res = await fetch("/api/research-os/draft-manuscript", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: selectedHypo?.title || "Topological Decoders for Rapid Physical State Search",
          hypothesisId: selectedHypo?.id,
          venue: `${invName} (${invCode})`,
          investorName: invName,
          agencyCode: invCode,
          targetBudget: invBudget,
          investorFocus: invFocus
        })
      });
      if (res.ok) {
        const data = await res.json();
        setManuscript(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateExperimentPlan = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/research-os/design-experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothesisId: selectedHypo?.id,
          hypothesisTitle: selectedHypo?.title
        })
      });
      if (res.ok) {
        const data = await res.json();
        setExperimentPlan(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const generateNotebookPackage = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/research-os/generate-notebook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hypothesisId: selectedHypo?.id,
          hypothesisTitle: selectedHypo?.title
        })
      });
      if (res.ok) {
        const data = await res.json();
        setNotebookPkg(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgentName || !newAgentPrompt) return;
    try {
      const res = await fetch("/api/research-os/custom-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newAgentName,
          domain: newAgentDomain,
          systemPrompt: newAgentPrompt,
          assignedTools: ["Literature Search", "KG Link Prediction", "Grant Matcher"],
          workflowTrigger: "Manual Execution",
          author: "Researcher User"
        })
      });
      if (res.ok) {
        const newAgent = await res.json();
        setCustomAgents([newAgent, ...customAgents]);
        setShowAgentModal(false);
        setNewAgentName("");
        setNewAgentPrompt("");
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleCopy = (text: string, sectionId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const handleDownload = (filename: string, content: string) => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#030406] text-slate-100 overflow-hidden font-sans">
      {/* OS Top Navigation Bar */}
      <div className="p-4 bg-[#07080A] border-b border-slate-850 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shrink-0">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h1 className="text-base font-bold uppercase tracking-wider text-white">
              End-to-End AI Research Operating System
            </h1>
            <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-bold">
              FA-CDGRF OS v2.6
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Complete lifecycle automation: Literature Review &rarr; Paper & Grant Drafting &rarr; Experiment Protocol &rarr; Custom Agents &rarr; Executable Notebooks
          </p>
        </div>

        {/* Selected Target Hypothesis Selector & Citation Filter Toggle */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-950 p-2 rounded-lg border border-slate-800 w-full md:w-auto">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-slate-400 uppercase whitespace-nowrap">Target Hypothesis:</span>
            <select 
              value={selectedHypothesisId}
              onChange={(e) => setSelectedHypothesisId(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-xs text-emerald-300 rounded px-2 py-1 focus:outline-none focus:border-emerald-500 max-w-[200px] sm:max-w-xs truncate font-mono"
            >
              {hypotheses.map(h => (
                <option key={h.id} value={h.id}>
                  {h.title}
                </option>
              ))}
            </select>
          </div>

          {/* Citation Evidence Source Filter Toggle */}
          <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded border border-slate-800 text-[9px] font-mono">
            <button
              id="citation-filter-all"
              onClick={() => setCitationFilterMode("all")}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold flex items-center gap-1 ${
                citationFilterMode === "all"
                  ? "bg-sky-500/20 text-sky-300 border border-sky-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Show all citations and supporting evidence"
            >
              <Database className="w-3 h-3 text-sky-400" />
              <span>All Evidence</span>
            </button>

            <button
              id="citation-filter-user"
              onClick={() => setCitationFilterMode("user_uploaded")}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold flex items-center gap-1 ${
                citationFilterMode === "user_uploaded"
                  ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Filter evidence to user-uploaded papers only"
            >
              <Upload className="w-3 h-3 text-purple-400" />
              <span>User Papers Only</span>
            </button>

            <button
              id="citation-filter-system"
              onClick={() => setCitationFilterMode("system_discovered")}
              className={`px-2 py-1 rounded transition-all cursor-pointer font-bold flex items-center gap-1 ${
                citationFilterMode === "system_discovered"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Filter evidence to system-discovered papers & arXiv/PubMed indexes"
            >
              <Globe className="w-3 h-3 text-emerald-400" />
              <span>System Papers Only</span>
            </button>
          </div>
        </div>
      </div>

      {/* Workspace Sub-tabs Navigation */}
      <div className="flex items-center gap-1 px-4 bg-[#0A0C10] border-b border-slate-800 overflow-x-auto text-xs shrink-0">
        <button
          onClick={() => setActiveSubTab("lit_review")}
          className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "lit_review"
              ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>1. Literature Review Generator</span>
        </button>

        <button
          onClick={() => setActiveSubTab("paper_drafter")}
          className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "paper_drafter"
              ? "border-sky-400 text-sky-400 bg-sky-500/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>2. AI Paper & Grant Drafter</span>
        </button>

        <button
          onClick={() => setActiveSubTab("experiment_plan")}
          className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "experiment_plan"
              ? "border-amber-400 text-amber-400 bg-amber-500/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <TestTube className="w-3.5 h-3.5" />
          <span>3. Experiment Protocol Designer</span>
        </button>

        <button
          onClick={() => setActiveSubTab("custom_agents")}
          className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "custom_agents"
              ? "border-purple-400 text-purple-400 bg-purple-500/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Bot className="w-3.5 h-3.5" />
          <span>4. Custom Research Agents</span>
        </button>

        <button
          onClick={() => setActiveSubTab("reproducible_notebook")}
          className={`flex items-center gap-2 px-3.5 py-2.5 font-medium border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeSubTab === "reproducible_notebook"
              ? "border-emerald-400 text-emerald-400 bg-emerald-500/10 font-bold"
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50"
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>5. Reproducible Notebook & Package</span>
        </button>
      </div>

      {/* Main OS View Content Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">

        {/* Citation Filter Active State Banner */}
        <div id="citation-filter-banner" className="bg-[#07080A] border border-slate-800 rounded-lg p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-sky-400 shrink-0" />
            <div>
              <span className="font-mono text-slate-400 text-[10px] uppercase block font-bold">
                Active Citation Filter ({citationFilterMode === "all" ? "All Evidence" : citationFilterMode === "user_uploaded" ? "User-Uploaded Papers Only" : "System-Discovered Papers Only"}):
              </span>
              <span className="text-slate-200 font-medium">
                Showing <strong className="text-sky-400">{filteredEvidence.length}</strong> of <strong className="text-slate-300">{selectedHypo?.supportingEvidence?.length || 0}</strong> citation evidence sources for "{selectedHypo?.title.substring(0, 45)}..."
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {filteredEvidence.slice(0, 3).map((cite, idx) => (
              <span key={idx} className="text-[9px] font-mono bg-slate-950 border border-slate-850 text-slate-300 px-2 py-0.5 rounded truncate max-w-[200px]">
                • {cite}
              </span>
            ))}
            {filteredEvidence.length > 3 && (
              <span className="text-[9px] font-mono text-sky-400 font-bold bg-sky-500/10 px-1.5 py-0.5 rounded border border-sky-500/20">
                +{filteredEvidence.length - 3} more
              </span>
            )}
            {filteredEvidence.length === 0 && (
              <span className="text-[9px] font-mono text-amber-400 italic">
                No citations match the selected source filter mode.
              </span>
            )}
          </div>
        </div>

        {/* 1. LITERATURE REVIEW GENERATOR */}
        {activeSubTab === "lit_review" && (
          <div className="space-y-6">
            <LiteratureReviewAgent papers={papers} />
          </div>
        )}

        {/* 2. AI PAPER & GRANT PROPOSAL DRAFTER */}
        {activeSubTab === "paper_drafter" && (
          <div className="space-y-6">
            <div className="bg-[#07080A] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <FileText className="text-sky-400 w-4 h-4" />
                  AI Manuscript & Grant Proposal Auto-Drafter
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Drafts complete, citation-backed paper manuscripts and funder-tailored grant proposal sections linked directly to your selected investor or funding agency.
                </p>
              </div>
              <button
                onClick={generateDraftManuscript}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer disabled:opacity-50 shrink-0 shadow-lg shadow-sky-500/10"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{manuscript ? "Re-Draft Proposal & Manuscript" : "Draft Funder-Tailored Proposal"}</span>
              </button>
            </div>

            {/* Target Investor & Funding Project Selector Panel */}
            <div id="investor-funder-selector-panel" className="bg-[#07080A] border border-sky-500/30 rounded-lg p-4 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-slate-850 pb-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                    Target Funder / Investor Linkage Configuration
                  </span>
                </div>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Select or attach any funding agency or custom investor
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">
                    Choose Funding Agency / Investment Program:
                  </label>
                  <select
                    value={selectedFunderMode}
                    onChange={(e) => setSelectedFunderMode(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-sky-500 font-sans"
                  >
                    <option value="grant-nsf-02">NSF Awards (NSF-QBIO-2026) — $1.8M</option>
                    <option value="grant-nih-01">NIH RePORTER (PAR-26-089) — $2.5M</option>
                    <option value="grant-doe-01">DOE Office of Science (DOE-BES-2026) — $3.0M</option>
                    <option value="grant-darpa-01">DARPA Defense Sciences (DARPA-DSO-2026) — $4.5M</option>
                    <option value="custom"> Custom Funder / Investor (Attach Custom Funder Details)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-mono uppercase text-slate-400 mb-1.5 font-bold">
                    Linked Research Hypothesis:
                  </label>
                  <select
                    value={selectedHypothesisId}
                    onChange={(e) => setSelectedHypothesisId(e.target.value)}
                    className="w-full bg-slate-950 text-slate-200 text-xs rounded-lg p-2.5 border border-slate-800 focus:outline-none focus:border-sky-500 font-sans truncate"
                  >
                    {hypotheses.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.title}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Custom Funder Input Fields if 'custom' is selected */}
              {selectedFunderMode === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-950/80 p-3 rounded-lg border border-slate-800 animate-fade-in">
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1 font-bold">
                      Funder / Investor Name:
                    </label>
                    <input
                      type="text"
                      value={customFunderName}
                      onChange={(e) => setCustomFunderName(e.target.value)}
                      placeholder="e.g. Schmidt Futures / Horizon Europe"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1 font-bold">
                      Agency / Program Code:
                    </label>
                    <input
                      type="text"
                      value={customFunderCode}
                      onChange={(e) => setCustomFunderCode(e.target.value)}
                      placeholder="e.g. SCHMIDT-2026-X"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1 font-bold">
                      Target Budget Amount:
                    </label>
                    <input
                      type="text"
                      value={customTargetBudget}
                      onChange={(e) => setCustomTargetBudget(e.target.value)}
                      placeholder="e.g. $2,000,000"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <label className="block text-[9px] font-mono uppercase text-slate-400 mb-1 font-bold">
                      Funder Strategic Priority / Focus:
                    </label>
                    <input
                      type="text"
                      value={customFunderFocus}
                      onChange={(e) => setCustomFunderFocus(e.target.value)}
                      placeholder="e.g. High-risk cross-disciplinary physical simulation and open research translation"
                      className="w-full bg-slate-900 border border-slate-800 rounded p-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {manuscript ? (
              <div className="bg-[#07080A] border border-slate-800 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-sky-400 uppercase font-bold">Target Venue / Grant: {manuscript.targetVenueOrGrant}</span>
                    <h2 className="text-lg font-bold text-white">{manuscript.title}</h2>
                    <p className="text-xs text-slate-400 mt-1">Authors: {manuscript.authors.join(", ")}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(JSON.stringify(manuscript, null, 2), "manuscript")}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      {copiedSection === "manuscript" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy All Sections</span>
                    </button>
                  </div>
                </div>

                {/* Abstract */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase font-mono">1. Abstract</h3>
                  <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-200 leading-relaxed font-serif italic">
                    {manuscript.abstract}
                  </div>
                </div>

                {/* Introduction */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase font-mono">2. Introduction</h3>
                  <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-300 leading-relaxed">
                    {manuscript.introduction}
                  </div>
                </div>

                {/* Related Work */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase font-mono">3. Related Work & Citations</h3>
                  <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-300 leading-relaxed">
                    {manuscript.relatedWork}
                  </div>
                </div>

                {/* Methodology */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase font-mono">4. Methodology & Algorithm Design</h3>
                  <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-300 leading-relaxed whitespace-pre-wrap font-mono">
                    {manuscript.methodology}
                  </div>
                </div>

                {/* Discussion */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-sky-400 uppercase font-mono">5. Discussion & Impact</h3>
                  <div className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-300 leading-relaxed">
                    {manuscript.discussion}
                  </div>
                </div>

                {/* Grant Proposal Section */}
                {manuscript.grantProposalSection && (
                  <div className="space-y-2 bg-emerald-500/5 p-4 rounded-lg border border-emerald-500/30">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-emerald-400" />
                      6. Funder Alignment & Grant Proposal Outline
                    </h3>
                    <div className="text-xs text-slate-200 whitespace-pre-wrap font-mono leading-relaxed">
                      {manuscript.grantProposalSection}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-12 text-center bg-[#07080A] border border-slate-850 rounded-lg space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Manuscript Drafted Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "Draft Manuscript & Proposal" above to generate a full publication draft for <strong>{selectedHypo?.title}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 3. EXPERIMENT PROTOCOL DESIGNER */}
        {activeSubTab === "experiment_plan" && (
          <div className="space-y-6">
            <div className="bg-[#07080A] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <TestTube className="text-amber-400 w-4 h-4" />
                  Comprehensive Experiment Protocol & Resource Planner
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Translates hypotheses into concrete wet-lab and computational protocols, specifying variables, controls, required compute/reagents, budget ($ USD), timeline, and evaluation metrics.
                </p>
              </div>
              <button
                onClick={generateExperimentPlan}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{experimentPlan ? "Re-Design Protocol" : "Design Experiment Protocol"}</span>
              </button>
            </div>

            {experimentPlan ? (
              <div className="bg-[#07080A] border border-slate-800 rounded-lg p-6 space-y-6">
                {/* Header Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950 p-4 rounded-lg border border-slate-850">
                  <div className="flex items-center gap-3">
                    <DollarSign className="w-8 h-8 text-emerald-400 p-1.5 bg-emerald-500/10 rounded-lg border border-emerald-500/20" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Estimated Total Cost</span>
                      <div className="text-base font-bold text-emerald-400 font-mono">{experimentPlan.totalEstimatedCostUSD}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-8 h-8 text-sky-400 p-1.5 bg-sky-500/10 rounded-lg border border-sky-500/20" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Projected Timeline</span>
                      <div className="text-base font-bold text-sky-400 font-mono">{experimentPlan.estimatedDurationMonths} Months</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Layers className="w-8 h-8 text-amber-400 p-1.5 bg-amber-500/10 rounded-lg border border-amber-500/20" />
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 uppercase">Target Hypothesis</span>
                      <div className="text-xs font-bold text-slate-200 truncate">{experimentPlan.hypothesisTitle}</div>
                    </div>
                  </div>
                </div>

                {/* Suggested Methodology */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-amber-400 uppercase font-mono">Suggested Protocol & Methodology</h3>
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-850 text-xs text-slate-200 leading-relaxed font-mono">
                    {experimentPlan.suggestedMethodology}
                  </div>
                </div>

                {/* Variables & Controls */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-slate-950 p-3.5 rounded border border-slate-850 space-y-2">
                    <span className="text-xs font-bold text-sky-400 uppercase font-mono">Independent Variables</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {experimentPlan.independentVariables.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded border border-slate-850 space-y-2">
                    <span className="text-xs font-bold text-purple-400 uppercase font-mono">Dependent Variables</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {experimentPlan.dependentVariables.map((v, i) => <li key={i}>{v}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded border border-slate-850 space-y-2">
                    <span className="text-xs font-bold text-emerald-400 uppercase font-mono">Experimental Controls</span>
                    <ul className="list-disc list-inside text-xs text-slate-300 space-y-1">
                      {experimentPlan.recommendedControls.map((c, i) => <li key={i}>{c}</li>)}
                    </ul>
                  </div>
                </div>

                {/* Resource Estimation Matrix */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-slate-200 uppercase font-mono">Resource & Equipment Budget Breakdown</h3>
                  <div className="overflow-x-auto border border-slate-850 rounded-lg">
                    <table className="w-full text-left text-xs text-slate-300">
                      <thead className="bg-slate-950 text-slate-400 font-mono text-[10px] uppercase border-b border-slate-850">
                        <tr>
                          <th className="p-3">Resource Item</th>
                          <th className="p-3">Category</th>
                          <th className="p-3 text-right">Estimated Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850 bg-slate-900/30">
                        {experimentPlan.requiredResources.map((r, i) => (
                          <tr key={i}>
                            <td className="p-3 font-medium text-white">{r.item}</td>
                            <td className="p-3">
                              <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                                {r.category}
                              </span>
                            </td>
                            <td className="p-3 text-right font-mono text-emerald-400 font-bold">{r.estimatedCost}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Evaluation Metrics */}
                <div className="space-y-2">
                  <h3 className="text-xs font-bold text-emerald-400 uppercase font-mono">Quantitative Validation Metrics</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {experimentPlan.evaluationMetrics.map((m, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded border border-slate-850 text-xs text-slate-300 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{m}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#07080A] border border-slate-850 rounded-lg space-y-3">
                <TestTube className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Experiment Protocol Designed Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "Design Experiment Protocol" above to plan resource, cost, and control parameters for <strong>{selectedHypo?.title}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* 4. CUSTOM & DOMAIN-SPECIFIC RESEARCH AGENTS */}
        {activeSubTab === "custom_agents" && (
          <div className="space-y-6">
            <div className="bg-[#07080A] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Bot className="text-purple-400 w-4 h-4" />
                  Custom & Domain-Specific AI Research Agents
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Create, configure, and orchestrate domain-expert AI agents (e.g. Cancer Oncology Agent, Quantum Climate Agent, IP Scout) with targeted system prompts, tools, and triggers.
                </p>
              </div>
              <button
                onClick={() => setShowAgentModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Create Custom Agent</span>
              </button>
            </div>

            {/* Custom Agents Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {customAgents.map((agent) => (
                <div key={agent.id} className="bg-[#07080A] border border-slate-800 hover:border-purple-500/40 rounded-lg p-4 flex flex-col justify-between gap-4 transition-all">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 border border-purple-500/30 px-2 py-0.5 rounded font-bold uppercase">
                        {agent.domain}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        {agent.status}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white">{agent.name}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{agent.description}</p>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-850">
                    <div className="bg-slate-950 p-2 rounded text-[10px] font-mono text-slate-400 line-clamp-2 italic">
                      "{agent.systemPrompt}"
                    </div>

                    <div className="flex flex-wrap gap-1">
                      {agent.assignedTools.map((t, i) => (
                        <span key={i} className="text-[9px] font-mono bg-slate-900 text-slate-300 px-1.5 py-0.5 rounded border border-slate-800">
                          {t}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1">
                      <span>Trigger: {agent.workflowTrigger}</span>
                      <span>Executions: {agent.executionCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Modal for Creating New Agent */}
            {showAgentModal && (
              <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <div className="bg-[#07080A] border border-purple-500/40 rounded-xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
                    <Bot className="text-purple-400 w-4 h-4" />
                    Configure New Domain Expert Agent
                  </h3>
                  
                  <form onSubmit={createAgent} className="space-y-3 text-xs">
                    <div>
                      <label className="block text-slate-400 font-mono mb-1">Agent Name</label>
                      <input 
                        type="text" 
                        value={newAgentName}
                        onChange={(e) => setNewAgentName(e.target.value)}
                        placeholder="e.g. Alzheimer's Tau Aggregation Scout"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-400 font-mono mb-1">Domain Focus</label>
                      <select 
                        value={newAgentDomain}
                        onChange={(e) => setNewAgentDomain(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500"
                      >
                        <option value="Cancer Oncology">Cancer Oncology</option>
                        <option value="Quantum Biophysics">Quantum Biophysics</option>
                        <option value="Climate AI Materials">Climate AI Materials</option>
                        <option value="Patent & IP Scouting">Patent & IP Scouting</option>
                        <option value="Synthetic Genomics">Synthetic Genomics</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 font-mono mb-1">System Instructions / Prompt</label>
                      <textarea 
                        value={newAgentPrompt}
                        onChange={(e) => setNewAgentPrompt(e.target.value)}
                        placeholder="e.g. Focus on docking mechanisms, target binding kinetics, and FDA trial disclosures..."
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-3 py-2 text-white focus:outline-none focus:border-purple-500 font-mono"
                        required
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
                      <button 
                        type="button"
                        onClick={() => setShowAgentModal(false)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded"
                      >
                        Cancel
                      </button>
                      <button 
                        type="submit"
                        className="px-4 py-1.5 bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold rounded"
                      >
                        Deploy Agent
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 5. REPRODUCIBLE RESEARCH PACKAGE & EXECUTABLE NOTEBOOKS */}
        {activeSubTab === "reproducible_notebook" && (
          <div className="space-y-6">
            <div className="bg-[#07080A] border border-slate-800 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                  <Terminal className="text-emerald-400 w-4 h-4" />
                  1-Click Executable Reproducible Research Package
                </h2>
                <p className="text-xs text-slate-400 max-w-2xl">
                  Generates a complete reproducible package containing Jupyter Notebooks, PyTorch Python scripts, Dockerfile container setups, requirements.txt, and linked dataset repositories.
                </p>
              </div>
              <button
                onClick={generateNotebookPackage}
                disabled={isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded transition-all cursor-pointer disabled:opacity-50 shrink-0"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                <span>{notebookPkg ? "Re-Generate Package" : "Generate 1-Click Package"}</span>
              </button>
            </div>

            {notebookPkg ? (
              <div className="bg-[#07080A] border border-slate-800 rounded-lg p-6 space-y-6">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-b border-slate-850 pb-4">
                  <div>
                    <span className="text-[10px] font-mono text-emerald-400 uppercase font-bold">FA-CDGRF Executable Environment</span>
                    <h2 className="text-base font-bold text-white">{notebookPkg.title}</h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDownload("experiment_notebook.ipynb", notebookPkg.jupyterNotebookJson)}
                      className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-xs flex items-center gap-1.5 font-bold cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .ipynb Notebook</span>
                    </button>
                    <button
                      onClick={() => handleDownload("run_experiment.py", notebookPkg.pythonScriptContent)}
                      className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded text-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <Code className="w-3.5 h-3.5 text-sky-400" />
                      <span>Download .py Script</span>
                    </button>
                  </div>
                </div>

                {/* Reproduction Command Banner */}
                <div className="bg-slate-950 border border-emerald-900/40 p-3.5 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 overflow-x-auto font-mono text-xs text-emerald-400">
                    <Terminal className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span className="text-slate-400 font-bold">1-Command Container Reproduce:</span>
                    <code className="bg-slate-900 px-2 py-1 rounded text-emerald-300 font-bold">{notebookPkg.reproductionCommand}</code>
                  </div>
                  <button
                    onClick={() => handleCopy(notebookPkg.reproductionCommand, "docker_cmd")}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs shrink-0 cursor-pointer"
                  >
                    {copiedSection === "docker_cmd" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* PyTorch Script Output Preview */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 uppercase font-mono">Python Simulation Script (run_experiment.py)</span>
                    <button
                      onClick={() => handleCopy(notebookPkg.pythonScriptContent, "pyscript")}
                      className="text-[10px] font-mono text-slate-400 hover:text-slate-200 flex items-center gap-1"
                    >
                      {copiedSection === "pyscript" ? "Copied!" : "Copy Code"}
                    </button>
                  </div>
                  <pre className="bg-slate-950 p-4 rounded border border-slate-850 text-xs text-slate-300 font-mono overflow-x-auto max-h-64 leading-relaxed">
                    {notebookPkg.pythonScriptContent}
                  </pre>
                </div>

                {/* Dataset Sources */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-200 uppercase font-mono">Bundled Open-Access Datasets</span>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {notebookPkg.datasetSources.map((ds, i) => (
                      <div key={i} className="bg-slate-950 p-3 rounded border border-slate-850 text-xs space-y-1">
                        <div className="font-bold text-white truncate">{ds.name}</div>
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                          <a href={ds.url} target="_blank" rel="noreferrer" className="text-sky-400 hover:underline">Link Source</a>
                          <span>{ds.size}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Container Configurations */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-amber-400 uppercase font-mono">requirements.txt</span>
                    <pre className="bg-slate-950 p-3 rounded border border-slate-850 text-[11px] text-slate-300 font-mono">
                      {notebookPkg.requirementsTxt}
                    </pre>
                  </div>
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-purple-400 uppercase font-mono">Dockerfile</span>
                    <pre className="bg-slate-950 p-3 rounded border border-slate-850 text-[11px] text-slate-300 font-mono">
                      {notebookPkg.dockerfileContent}
                    </pre>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center bg-[#07080A] border border-slate-850 rounded-lg space-y-3">
                <Terminal className="w-10 h-10 text-slate-600 mx-auto" />
                <h3 className="text-sm font-bold text-slate-300">No Executable Package Generated Yet</h3>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  Click "Generate 1-Click Package" above to output Jupyter notebooks, Python scripts, and Docker containers for <strong>{selectedHypo?.title}</strong>.
                </p>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
