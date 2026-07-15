import React, { useState } from "react";
import { Bounty, Hypothesis } from "../types";
import { Award, Plus, Sparkles, AlertCircle, BookOpen, CheckCircle, Clock, Check, TrendingUp, HelpCircle, Users, Mail } from "lucide-react";

interface DiscoveryMarketProps {
  bounties: Bounty[];
  hypotheses: Hypothesis[];
  onCreateBounty: (bounty: Omit<Bounty, "id" | "createdAt" | "status">) => Promise<void>;
  onLinkHypothesisToBounty: (bountyId: string, hypothesisId: string) => Promise<void>;
  isCreatingBounty: boolean;
  isLinking: boolean;
}

export default function DiscoveryMarket({
  bounties,
  hypotheses,
  onCreateBounty,
  onLinkHypothesisToBounty,
  isCreatingBounty,
  isLinking
}: DiscoveryMarketProps) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newReward, setNewReward] = useState("");
  const [newDiscipline, setNewDiscipline] = useState("Medicine");
  const [selectedBountyId, setSelectedBountyId] = useState<string | null>(null);
  const [selectedHypoId, setSelectedHypoId] = useState<string>("");

  // Expert Recommender States & Logic
  const [recommenderHypoId, setRecommenderHypoId] = useState<string>("");
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [draftRecipient, setDraftRecipient] = useState("");
  const [draftSubject, setDraftSubject] = useState("");
  const [draftBody, setDraftBody] = useState("");

  const EXPERT_LABS = React.useMemo(() => [
    {
      name: "Theoretical & Computational Biophysics Group",
      institution: "Stanford University School of Medicine",
      author: "Dr. Elizabeth Vance",
      matchScore: 98,
      reason: "Pioneers in high-dimensional protein conformational simulations and molecular dynamics modeling.",
      tags: ["protein", "folding", "stabilizer", "topological"]
    },
    {
      name: "Center for Quantum Engineering & Medicine",
      institution: "Massachusetts Institute of Technology (MIT)",
      author: "Prof. Kenneth Takahashi",
      matchScore: 95,
      reason: "Developing topological quantum stabilizer error-correcting codes tailored for structural biochemistry simulations.",
      tags: ["quantum", "topological", "protein", "folding"]
    },
    {
      name: "Molecular Neurodegeneration & Therapeutics Laboratory",
      institution: "Harvard Medical School / Broad Institute",
      author: "Dr. Sarah Lin-Mendoza",
      matchScore: 96,
      reason: "Expert in synaptic protection therapeutics, specializing in in-vitro assays for Alzheimer's microglial response pathways.",
      tags: ["alzheimer", "drug z", "protein a", "gene x"]
    },
    {
      name: "Functional Genomics & Transcriptional Control Group",
      institution: "University of California, San Francisco (UCSF)",
      author: "Prof. Arthur Pendelton",
      matchScore: 92,
      reason: "Currently researching dose-dependent gene downregulation cascades using sub-nanomolar cellular threshold assays.",
      tags: ["gene x", "alzheimer", "protein a"]
    },
    {
      name: "Advanced Biomaterials & Shielding Research Unit",
      institution: "ETH Zürich, Department of Materials Science",
      author: "Dr. Hans-Dieter Weber",
      matchScore: 89,
      reason: "Focuses on block-copolymer encapsulation shells that shield fragile therapeutic complexes from protease cleavage.",
      tags: ["polymer", "shielding", "enzymatic", "cleavage", "materials"]
    }
  ], []);

  // Compute recommended labs for selected hypothesis
  const recommendedLabs = React.useMemo(() => {
    if (!recommenderHypoId) return [];
    const hypo = hypotheses.find(h => h.id === recommenderHypoId);
    if (!hypo) return [];

    const titleText = hypo.title.toLowerCase();
    const descText = hypo.description.toLowerCase();

    return EXPERT_LABS.map(lab => {
      // Calculate matching tags
      const matches = lab.tags.filter(tag => titleText.includes(tag) || descText.includes(tag));
      const matchScore = matches.length > 0
        ? Math.min(100, lab.matchScore + matches.length * 2)
        : Math.round(lab.matchScore * 0.85); // minor penalty for general-purpose matching

      return {
        ...lab,
        matchScore
      };
    }).sort((a, b) => b.matchScore - a.matchScore);
  }, [recommenderHypoId, hypotheses, EXPERT_LABS]);

  const handleDraftEmail = (lab: any) => {
    const hypo = hypotheses.find(h => h.id === recommenderHypoId);
    if (!hypo) return;

    setDraftRecipient(`${lab.author} (${lab.institution})`);
    setDraftSubject(`Collaborative Inquiry regarding "${hypo.title}"`);
    
    const implicationsStr = hypo.implications && hypo.implications.length > 0
      ? hypo.implications.map((imp, idx) => `• [Step ${idx+1}] ${imp}`).join("\n")
      : "• Evaluate sub-nanomolar dose-response bounds\n• Characterize conformational transition boundaries";

    setDraftBody(
      `Dear Dr. ${lab.author.split(" ").pop()},\n\n` +
      `I hope this message finds you well.\n\n` +
      `We have recently synthesized a high-impact research hypothesis through our Scientific Discovery Operating System (SDOS) that aligns closely with your leading work at the "${lab.name}".\n\n` +
      `Hypothesis Title: ${hypo.title}\n` +
      `DVS (Discovery Value Score): ${hypo.discoveryValueScore || 85} pts\n` +
      `Confidence Index: ${Math.round((hypo.confidence || 0.8) * 100)}%\n\n` +
      `Target Implications:\n${implicationsStr}\n\n` +
      `Given your lab's expertise, we believe a joint in-vitro validation trial or analytical peer assessment could confirm this computational lead. We are prepared to share our complete GNN topological model configurations and pathway simulation files.\n\n` +
      `Would your group be open to a brief exploratory discussion regarding this lead?\n\n` +
      `Sincerely,\n` +
      `SDOS Automated Research Coordinator`
    );
    setDraftModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDescription || !newReward) return;
    try {
      await onCreateBounty({
        title: newTitle,
        description: newDescription,
        reward: newReward,
        discipline: newDiscipline
      });
      setNewTitle("");
      setNewDescription("");
      setNewReward("");
      setShowAddForm(false);
    } catch (err) {
      console.error("Create bounty failed:", err);
    }
  };

  const handleLinkSubmit = async () => {
    if (!selectedBountyId || !selectedHypoId) return;
    try {
      await onLinkHypothesisToBounty(selectedBountyId, selectedHypoId);
      setSelectedBountyId(null);
      setSelectedHypoId("");
    } catch (err) {
      console.error("Link hypothesis to bounty failed:", err);
    }
  };

  return (
    <div id="discovery-market-view" className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full text-[11px]">
      
      {/* Left Column: Post and List of Bounties */}
      <div className="lg:col-span-2 flex flex-col gap-4 overflow-y-auto pr-1">
        
        {/* Banner */}
        <div className="bg-gradient-to-r from-violet-950/20 to-sky-950/20 border border-sky-500/10 p-4 rounded-lg flex justify-between items-center relative overflow-hidden">
          <div className="flex flex-col gap-1.5 max-w-[80%] z-10">
            <div className="flex items-center gap-1.5 text-sky-400">
              <Award className="w-4 h-4 text-sky-400 animate-pulse" />
              <span className="font-mono uppercase tracking-widest text-[9.5px]">Distributed Research Incentives</span>
            </div>
            <h2 className="text-slate-100 font-bold text-sm leading-snug">Scientific Discovery Bounty Market</h2>
            <p className="text-slate-400 leading-relaxed font-sans text-[10.5px]">
              Post high-impact challenges and set research rewards. Connect generated hypotheses with experimental proofs to claims, accelerating scientific translation.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowAddForm(!showAddForm)}
            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded flex items-center gap-1 uppercase tracking-wider font-mono text-[9px] shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            Post Bounty
          </button>
        </div>

        {/* Create Bounty Form overlay */}
        {showAddForm && (
          <form onSubmit={handleSubmit} className="bg-[#0F1115] border border-slate-800 p-4 rounded-lg flex flex-col gap-3 animate-fade-in">
            <h3 className="text-slate-100 font-bold text-[10.5px] uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-sky-400" />
              Post New Scientific Bounty Challenge
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-[8.5px] font-mono text-slate-500 uppercase">Challenge Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Hydrophobic Pocket Binder for Protein A"
                  className="bg-slate-950 border border-slate-850 rounded p-2 text-slate-300 font-sans focus:outline-none focus:border-sky-500"
                />
              </div>

              <div className="flex grid-cols-2 gap-3">
                <div className="flex-1 flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono text-slate-500 uppercase">Funding / Reward</label>
                  <input
                    type="text"
                    required
                    value={newReward}
                    onChange={(e) => setNewReward(e.target.value)}
                    placeholder="e.g., $100,000 USD"
                    className="bg-slate-950 border border-slate-850 rounded p-2 text-slate-300 font-sans focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div className="w-32 flex flex-col gap-1">
                  <label className="text-[8.5px] font-mono text-slate-500 uppercase">Discipline</label>
                  <select
                    value={newDiscipline}
                    onChange={(e) => setNewDiscipline(e.target.value)}
                    className="bg-slate-950 border border-slate-850 rounded p-2 text-slate-300 font-mono focus:outline-none focus:border-sky-500"
                  >
                    <option value="Medicine">Medicine</option>
                    <option value="Materials">Materials</option>
                    <option value="Quantum">Quantum</option>
                    <option value="Genomics">Genomics</option>
                    <option value="Astrophysics">Astrophysics</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-[8.5px] font-mono text-slate-500 uppercase">Detailed Objective & Validation Metrics Required</label>
              <textarea
                required
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Identify a pathway or small molecule that stabilizes Protein A conformations in active state and downregulates Gene X in wet-lab with >60% efficiency..."
                className="bg-slate-950 border border-slate-850 rounded p-2 text-slate-300 font-sans h-20 resize-none focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex gap-2 justify-end mt-1">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-400 font-bold rounded uppercase font-mono text-[9px]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingBounty}
                className="px-4 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded uppercase font-mono text-[9px] flex items-center gap-1"
              >
                {isCreatingBounty ? "Publishing..." : "Publish Bounty"}
              </button>
            </div>
          </form>
        )}

        {/* Bounties List */}
        <div className="flex flex-col gap-3">
          <h3 className="text-[9px] font-mono text-slate-500 uppercase tracking-widest">Active Scientific Bounties ({bounties.length})</h3>
          
          {bounties.map((bounty) => {
            const linkedHypo = hypotheses.find(h => h.id === bounty.linkedHypothesisId);
            const isOpen = bounty.status === "open";

            return (
              <div
                key={bounty.id}
                className={`bg-[#0F1115] border rounded-lg p-4 transition-all duration-300 flex flex-col gap-3 ${
                  isOpen 
                    ? "border-slate-850 hover:border-sky-500/30" 
                    : "border-emerald-500/20 bg-emerald-950/5"
                }`}
              >
                {/* Bounty Header info */}
                <div className="flex justify-between items-start gap-4">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-slate-900 border border-slate-800 text-[8px] font-mono font-bold text-slate-400 px-1.5 py-0.2 rounded uppercase">
                        {bounty.discipline}
                      </span>
                      <span className="text-slate-500 font-mono text-[8px]">{new Date(bounty.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h4 className="text-slate-200 font-bold text-xs mt-0.5">{bounty.title}</h4>
                  </div>

                  <div className="flex flex-col items-end shrink-0 gap-1.5">
                    <div className="text-right">
                      <span className="text-[8px] font-mono text-slate-500 block uppercase leading-none">Funding Award</span>
                      <span className="text-sky-400 font-mono font-bold text-xs">{bounty.reward}</span>
                    </div>
                    
                    {isOpen ? (
                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-amber-500 bg-amber-500/10 px-1.5 py-0.2 rounded uppercase">
                        <Clock className="w-3 h-3" />
                        Open Challenge
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[8px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded uppercase border border-emerald-500/20">
                        <CheckCircle className="w-3 h-3" />
                        Award Claimed
                      </span>
                    )}
                  </div>
                </div>

                {/* Bounty Objective description */}
                <p className="text-slate-400 leading-relaxed font-sans">{bounty.description}</p>

                {/* Proof & Hypothesis connection status */}
                {isOpen ? (
                  <div className="bg-[#07080A] border border-slate-900 p-3 rounded flex items-center justify-between gap-4">
                    <span className="text-slate-500 text-[9px] font-sans">
                      Have a simulated hypothesis that resolves this objective? Claim the reward by submitting your validation proof.
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedBountyId(bounty.id)}
                      className="px-3 py-1 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 font-mono font-bold text-[9px] uppercase tracking-wider rounded border border-sky-500/20 transition-all shrink-0"
                    >
                      Submit Proof Claim
                    </button>
                  </div>
                ) : (
                  linkedHypo && (
                    <div className="bg-emerald-500/5 border border-emerald-500/10 p-3 rounded flex flex-col gap-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          SUCCESSFUL REPLICATION PROOF REGISTERED
                        </span>
                        <span className="text-[8.5px] font-mono text-slate-500 uppercase">ID: {linkedHypo.id}</span>
                      </div>
                      <h5 className="font-bold text-slate-200 font-sans">{linkedHypo.title}</h5>
                      <p className="text-slate-400 leading-normal line-clamp-2">{linkedHypo.description}</p>
                    </div>
                  )
                )}

              </div>
            );
          })}
        </div>

      </div>

      {/* Right Column: Submit Proof sidebar form & Market Analytics */}
      <div className="flex flex-col gap-4">
        
        {/* Market claim overlay */}
        {selectedBountyId && (
          <div className="bg-[#0F1115] border-2 border-sky-500 p-4 rounded-lg flex flex-col gap-3 animate-fade-in shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-850 pb-1.5">
              <span className="text-[9px] font-mono text-sky-400 font-bold uppercase tracking-wider">Submit Hypothesis Proof</span>
              <button 
                onClick={() => setSelectedBountyId(null)}
                className="text-slate-500 hover:text-slate-300 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-slate-400 leading-relaxed">
              Select one of your synthesized, verified hypotheses to bridge as the validation proof for the target challenge bounty. This will transition the challenge to completed status.
            </p>

            <div className="flex flex-col gap-1 mt-1">
              <label className="text-[8px] font-mono text-slate-500 uppercase">Select Validated Hypothesis</label>
              <select
                value={selectedHypoId}
                onChange={(e) => setSelectedHypoId(e.target.value)}
                className="bg-slate-950 border border-slate-850 rounded p-2 text-slate-300 font-sans focus:outline-none focus:border-sky-500 w-full"
              >
                <option value="">-- Choose Hypothesis --</option>
                {hypotheses
                  .filter(h => h.status === "verified" && !bounties.some(b => b.linkedHypothesisId === h.id))
                  .map(h => (
                    <option key={h.id} value={h.id}>
                      [{h.discoveryPhase || "Formulated"}] {h.title}
                    </option>
                  ))}
              </select>
            </div>

            {selectedHypoId && (
              <div className="p-2.5 bg-slate-900 border border-slate-850 rounded text-slate-400 leading-normal text-[10px]">
                {hypotheses.find(h => h.id === selectedHypoId)?.description}
              </div>
            )}

            <button
              type="button"
              disabled={!selectedHypoId || isLinking}
              onClick={handleLinkSubmit}
              className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 transition-colors text-white text-[9.5px] font-mono font-bold uppercase tracking-wider py-2 rounded flex items-center justify-center gap-1 mt-1"
            >
              {isLinking ? <Clock className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              {isLinking ? "Verifying Proof..." : "Submit Proof Claim"}
            </button>
          </div>
        )}

        {/* Market Metrics & Overview */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-lg p-4 flex flex-col gap-3">
          <h3 className="text-slate-100 font-bold uppercase tracking-wider text-[10px] flex items-center gap-1.5">
            <TrendingUp className="text-sky-400 w-4 h-4" />
            Bounty Market Insights
          </h3>

          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="bg-slate-950 p-2.5 border border-slate-900 rounded">
              <span className="text-[8px] font-mono text-slate-500 block mb-0.5">TOTAL FUNDING</span>
              <span className="text-base font-mono font-bold text-sky-400">$600K</span>
            </div>
            <div className="bg-slate-950 p-2.5 border border-slate-900 rounded">
              <span className="text-[8px] font-mono text-slate-500 block mb-0.5">REPLICATED PROOFS</span>
              <span className="text-base font-mono font-bold text-emerald-400">
                {bounties.filter(b => b.status === "completed").length}
              </span>
            </div>
          </div>

          <div className="p-2.5 bg-slate-950 border border-slate-900 rounded flex gap-2 items-start text-slate-500 leading-normal">
            <AlertCircle className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
            <p className="text-[9.5px]">
              The scientific bounty marketplace provides active translation of in-silico discovery candidates into peer-reviewed published models. Verification of indirect proof links executes in microsecond loops.
            </p>
          </div>
        </div>

        {/* Expert Lab Recommender Module */}
        <div className="bg-[#0F1115] border border-slate-800 rounded-lg p-4 flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2">
            <div className="flex items-center gap-1.5">
              <Users className="text-violet-400 w-4 h-4" />
              <h3 className="text-slate-100 font-bold uppercase tracking-wider text-[10px]">Expert Lab Recommender</h3>
            </div>
            <span className="text-[8px] font-mono text-slate-500 uppercase">Lit-Tag Analyzer</span>
          </div>

          <p className="text-slate-400 leading-relaxed text-[10px]">
            Analyzes your high-value synthesized hypotheses and recommends top academic labs or primary authors for contact.
          </p>

          <div className="flex flex-col gap-1">
            <label className="text-[8px] font-mono text-slate-500 uppercase">Select Target Hypothesis</label>
            <select
              value={recommenderHypoId}
              onChange={(e) => setRecommenderHypoId(e.target.value)}
              className="bg-slate-950 border border-slate-850 rounded p-1.5 text-slate-300 font-sans focus:outline-none focus:border-sky-500 text-[10px] w-full"
            >
              <option value="">-- Choose Hypothesis --</option>
              {hypotheses.map(h => (
                <option key={h.id} value={h.id}>
                  [{h.discoveryValueScore || 85} DVS] {h.title.length > 45 ? h.title.slice(0, 45) + "..." : h.title}
                </option>
              ))}
            </select>
          </div>

          {recommenderHypoId && recommendedLabs.length > 0 && (
            <div className="flex flex-col gap-2.5 mt-1 max-h-60 overflow-y-auto pr-1">
              {recommendedLabs.map((lab, index) => (
                <div key={index} className="bg-slate-950/50 border border-slate-900 rounded p-2.5 flex flex-col gap-1.5">
                  <div className="flex items-start justify-between gap-1.5">
                    <div className="flex flex-col">
                      <span className="text-[9.5px] font-bold text-slate-200 leading-snug">{lab.name}</span>
                      <span className="text-[8px] text-slate-500 font-sans">{lab.institution}</span>
                    </div>
                    <span className="text-[8px] font-mono font-bold text-violet-400 bg-violet-500/10 px-1 rounded whitespace-nowrap">
                      {lab.matchScore}% Match
                    </span>
                  </div>

                  <p className="text-[9.2px] text-slate-400 leading-relaxed font-sans italic">{lab.reason}</p>

                  <div className="flex items-center justify-between text-[8px] font-mono border-t border-slate-900 pt-1.5 mt-0.5 text-slate-500">
                    <span>Contact: <strong className="text-slate-400 font-semibold">{lab.author}</strong></span>
                    <button
                      onClick={() => handleDraftEmail(lab)}
                      className="text-sky-400 hover:text-sky-300 cursor-pointer hover:underline font-bold"
                    >
                      Draft Collaboration Letter
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {recommenderHypoId && recommendedLabs.length === 0 && (
            <div className="text-slate-600 text-center italic py-4 text-[9.5px]">
              No relevant expert labs matched. Try updating keywords or DVS scores.
            </div>
          )}
        </div>

      </div>

      {/* Collaboration Draft Letter Modal Overlay */}
      {draftModalOpen && (
        <EmailDraftModal 
          recipient={draftRecipient}
          subject={draftSubject}
          body={draftBody}
          onClose={() => setDraftModalOpen(false)}
        />
      )}

    </div>
  );
}

interface EmailDraftModalProps {
  recipient: string;
  subject: string;
  body: string;
  onClose: () => void;
}

function EmailDraftModal({ recipient, subject, body, onClose }: EmailDraftModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in text-[11px]">
      <div className="bg-[#0F1115] border border-slate-800 rounded-lg max-w-xl w-full p-4 flex flex-col gap-3 shadow-2xl relative">
        <div className="flex items-center justify-between border-b border-slate-850 pb-2">
          <div className="flex items-center gap-1.5 text-violet-400">
            <Mail className="w-4 h-4" />
            <span className="font-mono text-[10px] font-bold uppercase tracking-wider">Drafted Outreach Letter</span>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 font-bold text-xs"
          >
            ✕
          </button>
        </div>

        <div className="flex flex-col gap-1 text-[9.5px] font-mono">
          <div className="flex gap-2">
            <span className="text-slate-500 w-16">Recipient:</span>
            <span className="text-slate-300">{recipient}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-slate-500 w-16">Subject:</span>
            <span className="text-slate-300 font-semibold">{subject}</span>
          </div>
        </div>

        <div className="bg-slate-950 border border-slate-900 rounded p-3 h-64 overflow-y-auto font-mono text-[9.5px] text-slate-300 leading-relaxed whitespace-pre-wrap select-all selection:bg-violet-500/30">
          {body}
        </div>

        <div className="flex items-center justify-between border-t border-slate-900 pt-2 text-[9px] text-slate-500 font-sans">
          <span>Tip: Click inside the box to copy or use the copy button.</span>
          <button
            type="button"
            onClick={handleCopy}
            className={`px-3 py-1.5 ${copied ? "bg-emerald-600 hover:bg-emerald-500" : "bg-violet-600 hover:bg-violet-500"} text-white font-bold rounded uppercase font-mono text-[9px] transition-colors`}
          >
            {copied ? "Copied!" : "Copy to Clipboard"}
          </button>
        </div>
      </div>
    </div>
  );
}
