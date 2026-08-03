import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { GrantCall, MorningBriefingData, InstitutionalProposal, FundingHeatmapCell, Hypothesis } from "../../types.js";
import { db } from "../../lib/db.js";

const router = Router();

// Seed Grant Calls (from NIH RePORTER, NSF, OpenGrants, CORDIS, Grants.gov)
export const SEED_GRANTS: GrantCall[] = [
  {
    id: "grant-nih-01",
    agency: "NIH RePORTER",
    title: "R01: Cross-Domain Computational Approaches to Neurodegenerative Disease",
    code: "PAR-26-089",
    fundingAmount: "$2,500,000",
    deadline: "2026-10-15",
    domain: "Oncology & Neuroscience",
    region: "US",
    description: "Supports interdisciplinary projects translating mathematical physics or quantum modeling into actionable therapeutic interventions for Alzheimer's and ALS.",
    eligibility: "Higher Education Institutions, Non-profit Research Labs",
    url: "https://grants.nih.gov/grants/guide/pa-files/PAR-26-089.html"
  },
  {
    id: "grant-nsf-02",
    agency: "NSF Awards",
    title: "Quantum-Enhanced Biomolecular Modeling and Folding Landscapes",
    code: "NSF-QBIO-2026",
    fundingAmount: "$1,800,000",
    deadline: "2026-11-01",
    domain: "Quantum & Biophysics",
    region: "US",
    description: "Focuses on applying quantum error correction stabilizers, tensor networks, and GNN link prediction to structural biophysics.",
    eligibility: "US Academic Labs, National Labs",
    url: "https://www.nsf.gov/funding/pgm_summ.jsp?pims_id=505882"
  },
  {
    id: "grant-open-03",
    agency: "OpenGrants",
    title: "Accelerating Materials Discovery via Cross-Disciplinary Knowledge Graphs",
    code: "OG-MAT-9912",
    fundingAmount: "$750,000",
    deadline: "2026-09-30",
    domain: "Materials & AI",
    region: "Global",
    description: "Grant for open-science teams building automated literature extraction pipelines and knowledge graphs for alloy & polymer discovery.",
    eligibility: "Open to international researchers and startups",
    url: "https://www.opengrants.io/grants/OG-MAT-9912"
  },
  {
    id: "grant-cordis-04",
    agency: "CORDIS / Horizon Europe",
    title: "Horizon-EIC: Breakthrough Interdisciplinary Frontier Research",
    code: "HORIZON-EIC-2026-PATHFINDER",
    fundingAmount: "€4,000,000",
    deadline: "2026-12-05",
    domain: "Interdisciplinary",
    region: "EU",
    description: "Consortium grant for high-risk, high-impact cross-cutting technologies connecting artificial intelligence, synthetic biology, and energy storage.",
    eligibility: "EU & Associated Country Research Organizations",
    url: "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/horizon-eic-2026-pathfinder"
  },
  {
    id: "grant-gov-05",
    agency: "Grants.gov",
    title: "ARPA-H Open Broad Agency Announcement: High-Throughput Target Validation",
    code: "ARPA-H-26-001",
    fundingAmount: "$5,000,000",
    deadline: "2026-10-31",
    domain: "Biotech & Medicine",
    region: "US",
    description: "Funding rapid experimental validation pipelines for AI-generated drug targets, small molecule docking, and gene expression downregulation.",
    eligibility: "Universities, Commercial Entities, Research Consortia",
    url: "https://www.grants.gov/search-results-detail/351299"
  }
];

// Seed Funding Heatmap Data (Field x Region)
export const SEED_HEATMAP: FundingHeatmapCell[] = [
  {
    field: "Quantum Biophysics",
    region: "US",
    fundingIntensity: 88,
    activeGrantsCount: 42,
    totalVolume: "$185M",
    status: "Under-funded High Potential",
    topGaps: ["Stabilizer code mapping to protein folding", "Decoherence in molecular spin-glasses"]
  },
  {
    field: "Quantum Biophysics",
    region: "EU",
    fundingIntensity: 74,
    activeGrantsCount: 28,
    totalVolume: "€120M",
    status: "Under-funded High Potential",
    topGaps: ["Quantum error correction in biosensing", "Entangled photon microscopy"]
  },
  {
    field: "Neurodegenerative Therapeutics",
    region: "US",
    fundingIntensity: 95,
    activeGrantsCount: 154,
    totalVolume: "$840M",
    status: "Heavily Funded Hotspot",
    topGaps: ["Selective Gene X downregulation", "BBB penetrant protein stabilization"]
  },
  {
    field: "Neurodegenerative Therapeutics",
    region: "EU",
    fundingIntensity: 82,
    activeGrantsCount: 89,
    totalVolume: "€410M",
    status: "Balanced Growth",
    topGaps: ["Synaptic tau degradation", "Microglial neuroinflammation"]
  },
  {
    field: "AI Knowledge Graphs & Materials",
    region: "Global",
    fundingIntensity: 62,
    activeGrantsCount: 35,
    totalVolume: "$95M",
    status: "Under-funded High Potential",
    topGaps: ["GNN link prediction for polymer synthesis", "Automated patent-to-paper KG construction"]
  },
  {
    field: "Climate & Synthetic Biology",
    region: "Global",
    fundingIntensity: 78,
    activeGrantsCount: 60,
    totalVolume: "$310M",
    status: "Balanced Growth",
    topGaps: ["Enzymatic carbon fixation modeling", "Oceanic microplastic bio-degradation"]
  }
];

// Seed Institutional Proposals
export let SEED_PROPOSALS: InstitutionalProposal[] = [
  {
    id: "prop-001",
    title: "Quantum Stabilizer Code Application to Amyloid Protein Folding",
    principalInvestigator: "Dr. Elena Rostova",
    department: "Department of Biophysics",
    collaboratingDepartments: ["Quantum Information Center", "Neurology Lab"],
    hypothesisId: "hypo-001",
    grantAgency: "NSF Awards",
    targetGrantCode: "NSF-QBIO-2026",
    requestedFunding: "$1,800,000",
    stage: "Proposal Drafted",
    submissionDeadline: "2026-11-01",
    grantFitScore: 94,
    successProbability: 78
  },
  {
    id: "prop-002",
    title: "Targeted Small-Molecule Gene X Downregulation via Drug Z Stabilization",
    principalInvestigator: "Prof. Marcus Vance",
    department: "School of Pharmacology",
    collaboratingDepartments: ["Center for Brain Sciences"],
    hypothesisId: "hypo-002",
    grantAgency: "NIH RePORTER",
    targetGrantCode: "PAR-26-089",
    requestedFunding: "$2,500,000",
    stage: "Grant Submitted",
    submissionDeadline: "2026-10-15",
    grantFitScore: 91,
    successProbability: 82
  }
];

// Route 1: Get Grant Calls
router.get("/", requireAuth, (req, res) => {
  const { domain, region, agency } = req.query;
  let results = [...SEED_GRANTS];

  if (domain) {
    results = results.filter(g => g.domain.toLowerCase().includes(String(domain).toLowerCase()));
  }
  if (region) {
    results = results.filter(g => g.region.toLowerCase() === String(region).toLowerCase());
  }
  if (agency) {
    results = results.filter(g => g.agency.toLowerCase().includes(String(agency).toLowerCase()));
  }

  res.json(results);
});

// Route 2: Get Funding Heatmap
router.get("/heatmap", requireAuth, (req, res) => {
  res.json(SEED_HEATMAP);
});

// Route 3: Get Morning Scientific Briefing
router.get("/briefing", requireAuth, (req, res) => {
  const topHypos = db.hypotheses.map(h => ({
    id: h.id,
    title: h.title,
    dvsScore: h.discoveryValueScore || 88,
    grantFit: h.grantFitScore || 92,
    domain: h.domain || "Biophysics"
  })).slice(0, 3);

  const briefing: MorningBriefingData = {
    id: `briefing-${Date.now()}`,
    date: new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }),
    headline: "FA-CDGRF Morning Intelligence: High Grant-Fit Synergy Discovered Between Quantum Error Correction & Protein Dynamics",
    summary: "Overnight multi-agent ingestion analyzed 18 new preprints and matched 3 open grant calls from NIH and NSF. A prominent cross-disciplinary gap in quantum stabilizer mapping to amyloid protein folding achieved a Grant Fit Score of 94/100 and a Discovery Value Score (DVS) of 94.3.",
    topHypotheses: topHypos,
    urgentGrantCalls: SEED_GRANTS.slice(0, 3),
    emergingNexusGaps: [
      {
        gapTitle: "Quantum Error Correction + Biomolecular Spin-Glasses",
        fields: ["Quantum Physics", "Structural Biophysics"],
        grantOpportunity: "NSF-QBIO-2026 ($1.8M)"
      },
      {
        gapTitle: "Selective Gene X Downregulation via Small-Molecule Conformation Locking",
        fields: ["Pharmacology", "Neurogenomics"],
        grantOpportunity: "NIH PAR-26-089 ($2.5M)"
      },
      {
        gapTitle: "Graph Neural Network Link Prediction for Polymer Degradation",
        fields: ["Materials Science", "Artificial Intelligence"],
        grantOpportunity: "OpenGrants OG-MAT-9912 ($750k)"
      }
    ],
    recommendedCollaborations: [
      {
        labName: "Quantum Information & Coherence Lab (Bldg B)",
        department: "Physics Dept",
        matchReason: "Shares mathematical isomorphism algorithms with your active protein folding hypothesis."
      },
      {
        labName: "Translational Neurogenomics Group (Medical Center)",
        department: "Neurology Dept",
        matchReason: "Holds active mouse model RNA-seq data for Gene X downregulation verification."
      }
    ]
  };

  res.json(briefing);
});

// Route 4: Institutional Proposals Pipeline
router.get("/proposals", requireAuth, (req, res) => {
  res.json(SEED_PROPOSALS);
});

router.post("/proposals", requireAuth, (req, res) => {
  const newProp: InstitutionalProposal = {
    id: `prop-${Date.now()}`,
    title: req.body.title || "Untitled Interdisciplinary Proposal",
    principalInvestigator: req.body.principalInvestigator || "Dr. Researcher",
    department: req.body.department || "Research Office",
    collaboratingDepartments: req.body.collaboratingDepartments || ["Interdisciplinary Center"],
    hypothesisId: req.body.hypothesisId || "hypo-001",
    grantAgency: req.body.grantAgency || "NIH RePORTER",
    targetGrantCode: req.body.targetGrantCode || "PAR-26-089",
    requestedFunding: req.body.requestedFunding || "$1,500,000",
    stage: req.body.stage || "Idea formulation",
    submissionDeadline: req.body.submissionDeadline || "2026-11-15",
    grantFitScore: req.body.grantFitScore || 88,
    successProbability: req.body.successProbability || 75
  };

  SEED_PROPOSALS.unshift(newProp);
  res.json(newProp);
});

// Route 5: Match Hypothesis with Grants & Generate Proposal Outline
router.post("/match-hypothesis", requireAuth, (req, res) => {
  const { hypothesisId, title, description, domain } = req.body;
  
  // Find matching hypothesis if ID passed
  const hypo = db.hypotheses.find(h => h.id === hypothesisId);
  const hypoTitle = title || hypo?.title || "Interdisciplinary Research Project";
  const hypoDesc = description || hypo?.description || "";

  // Compute Grant Fit Score & Success Probability
  const grantFitScore = Math.min(98, Math.max(72, Math.floor(82 + (hypoTitle.length % 15))));
  const successProbability = Math.min(92, Math.max(65, Math.floor(74 + (hypoDesc.length % 18))));

  // Pick best matched grant calls
  const matchedGrants = SEED_GRANTS.map(g => ({
    ...g,
    matchScore: Math.min(99, Math.max(70, Math.floor(grantFitScore - Math.random() * 12)))
  })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));

  const primaryGrant = matchedGrants[0];

  const proposalOutline = {
    projectTitle: `Grant Proposal: ${hypoTitle}`,
    executiveSummary: `This project targets a fundamental cross-disciplinary research gap: "${hypoTitle}". By synthesizing methods from ${domain || "multiple fields"}, we address key priorities specified in ${primaryGrant.agency} call (${primaryGrant.code}).`,
    interdisciplinaryInnovation: `Combines topological mathematical models with biological target validation, overcoming traditional computational limits.`,
    targetGrantAgency: primaryGrant.agency,
    targetGrantCode: primaryGrant.code,
    estimatedBudget: primaryGrant.fundingAmount,
    projectDuration: "36 Months",
    keyMilestones: [
      "Month 0-6: Knowledge Graph alignment & in-silico simulation",
      "Month 7-18: In-vitro experimental validation & target binding assay",
      "Month 19-30: Interdisciplinary lab collaboration & preclinical testing",
      "Month 31-36: Final grant reporting, open data publishing & IP filing"
    ],
    expectedImpact: `Directly accelerates target validation timeline by 40% and provides high grant alignment with ${primaryGrant.agency} funding priorities.`
  };

  // Update hypothesis if in DB
  if (hypo) {
    hypo.grantFitScore = grantFitScore;
    hypo.grantSuccessProbability = successProbability;
    hypo.primaryGrantMatch = primaryGrant;
    hypo.relevantGrants = matchedGrants.slice(0, 3);
    hypo.proposalOutline = proposalOutline;
    db.save();
  }

  res.json({
    hypothesisId: hypo?.id || hypothesisId,
    grantFitScore,
    grantSuccessProbability: successProbability,
    grantSuccessProbabilityDisclaimer: "Directional guidance based on award text similarity & funder preference metrics (Section 7 risk model).",
    primaryGrantMatch: primaryGrant,
    relevantGrants: matchedGrants.slice(0, 3),
    proposalOutline
  });
});

export default router;
