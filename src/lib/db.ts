import fs from "fs";
import path from "path";
import { 
  ScientificPaper, 
  GraphNode, 
  GraphLink, 
  Hypothesis, 
  Bounty, 
  InterdisciplinaryExchangeLog 
} from "../types.js";

// Path to persistent storage
const DB_FILE_PATH = path.join(process.cwd(), "data", "db.json");

interface DbSchema {
  papers: ScientificPaper[];
  nodes: GraphNode[];
  links: GraphLink[];
  hypotheses: Hypothesis[];
  bounties: Bounty[];
  interdisciplinaryExchangeLogs: InterdisciplinaryExchangeLog[];
}

// Initial Seed Data (matching the default server.ts state)
const SEED_PAPERS: ScientificPaper[] = [
  {
    id: "paper-001",
    title: "Synaptic Stabilization of Protein A in Neuronal Networks",
    authors: "L. Chen, S. Mori, K. Peterson",
    journal: "Journal of Neurobiology",
    year: 2024,
    abstract: "Protein A plays a vital role in stabilizing neuronal synapses. In this study, we demonstrate that active stabilization of Protein A conformation directly inhibits Gene X activity, which prevents pathological tau phosphorylation cascade and amyloid buildup.",
    ingestedDate: new Date().toISOString(),
    status: "analyzed",
    entitiesExtracted: ["Protein A", "Gene X"]
  },
  {
    id: "paper-002",
    title: "Small-Molecule Therapeutics for Alzheimer's Disease: High-Affinity Ligands for Synaptic Stabilizers",
    authors: "M. A. Reynolds, F. J. Lopez",
    journal: "Nature Drug Discovery",
    year: 2025,
    abstract: "Alzheimer's Disease remains a critical bottleneck in gerontology. Here, we present Drug Z, a blood-brain barrier penetrant small-molecule. Drug Z selectively binds and stabilizes Protein A, preventing its degradation and maintaining network connectivity in mouse models.",
    ingestedDate: new Date().toISOString(),
    status: "analyzed",
    entitiesExtracted: ["Drug Z", "Protein A", "Alzheimer's Disease"]
  },
  {
    id: "paper-003",
    title: "Topological Stabilizer Codes for Logical Qubit Coherence",
    authors: "A. G. Nielsen, E. Campbell",
    journal: "Physical Review Letters",
    year: 2023,
    abstract: "Quantum error correction (QEC) protects logical information from environmental decoherence. We analyze Topological Stabilizer Codes, demonstrating how stabilizers identify and correct error syndromes by finding localized minimum-weight matching paths on discrete grids.",
    ingestedDate: new Date().toISOString(),
    status: "analyzed",
    entitiesExtracted: ["Quantum Error Correction", "Topological Stabilizer Code"]
  },
  {
    id: "paper-004",
    title: "Tensor Networks and Structural Complexity of Biomolecular Folding Optimization",
    authors: "R. Sharma, Y. Bengio",
    journal: "In Silico Biophysics",
    year: 2024,
    abstract: "Modeling the Protein Folding Landscape is a major computational challenge. We demonstrate that tensor network contraction algorithms can map high-dimensional folding landscapes into hierarchical tree tensors, reducing search space but hitting localized combinatorial barriers.",
    ingestedDate: new Date().toISOString(),
    status: "analyzed",
    entitiesExtracted: ["Tensor Network Contraction", "Protein Folding Landscape"]
  },
  {
    id: "paper-005",
    title: "Analogies between Quantum Error-Correcting Landscapes and Spin-Glass Optimizations",
    authors: "D. S. Fisher, V. Vedral",
    journal: "Journal of Physics A: Mathematical and Theoretical",
    year: 2025,
    abstract: "We establish a mathematical isomorphism between the fault-tolerant threshold landscape of Topological Stabilizer Codes and the spin-glass optimization barriers of high-dimensional physical systems, including macromolecular folding optimization structures.",
    ingestedDate: new Date().toISOString(),
    status: "analyzed",
    entitiesExtracted: ["Topological Stabilizer Code", "Protein Folding Landscape"]
  }
];

const SEED_NODES: GraphNode[] = [
  { id: "node-protein-a", label: "Protein A", group: "protein", val: 22, description: "A key synaptic scaffolding protein that preserves functional connection strengths in neural junctions." },
  { id: "node-gene-x", label: "Gene X", group: "gene", val: 18, description: "A gene regulating tau hyperphosphorylation. Pathological over-expression is linked to cognitive decay." },
  { id: "node-alzheimer", label: "Alzheimer's Disease", group: "disease", val: 30, description: "A progressive neurodegenerative illness characterized by beta-amyloid plaques and memory destruction." },
  { id: "node-drug-z", label: "Drug Z", group: "drug", val: 20, description: "An experimental, blood-brain-barrier permeable small molecule designed to bind synaptic protein complexes." },
  { id: "node-qec", label: "Quantum Error Correction", group: "quantum_concept", val: 24, description: "Principles of fault-tolerant quantum computation using redundant physical qubits to guard logical states." },
  { id: "node-stabilizer-code", label: "Topological Stabilizer Code", group: "physics_concept", val: 20, description: "A class of quantum codes where errors are diagnosed via stabilizer measurement syndromes on localized lattices." },
  { id: "node-tensor", label: "Tensor Network Contraction", group: "algorithm", val: 16, description: "Highly efficient numerical contraction protocols representing multi-body quantum entanglement and search spaces." },
  { id: "node-protein-folding", label: "Protein Folding Landscape", group: "optimization_method", val: 25, description: "The high-dimensional energy landscape where polypeptide chains negotiate configurations to minimize free energy." }
];

const SEED_LINKS: GraphLink[] = [
  { 
    id: "link-1", 
    source: "node-protein-a", 
    target: "node-gene-x", 
    relationship: "inhibits", 
    confidence: 0.85, 
    evidencePaperIds: ["paper-001"],
    temporalEvents: [
      { status: "published", year: 2016, details: "Initial correlation discovered in post-mortem parietal lobe scans." },
      { status: "replicated", year: 2019, details: "In-vitro synaptic culture models confirm Protein A inhibition kinetics on Gene X transcription." },
      { status: "modified", year: 2024, details: "Upregulated via customized small-molecule stabilizers (Reynolds et al.)." }
    ]
  },
  { 
    id: "link-2", 
    source: "node-gene-x", 
    target: "node-alzheimer", 
    relationship: "associated with", 
    confidence: 0.92, 
    evidencePaperIds: ["paper-001"],
    temporalEvents: [
      { status: "published", year: 2018, details: "Genome-wide association studies show strong link between Gene X SNP and early onset Alzheimer's." },
      { status: "replicated", year: 2021, details: "Knockout mice show 60% reduction in tau hyperphosphorylation and amyloid buildup." }
    ]
  },
  { 
    id: "link-3", 
    source: "node-alzheimer", 
    target: "node-drug-z", 
    relationship: "treated by", 
    confidence: 0.78, 
    evidencePaperIds: ["paper-002"],
    temporalEvents: [
      { status: "published", year: 2022, details: "Alzheimer patient cohorts show correlation with lower Protein A levels." }
    ]
  },
  { 
    id: "link-4", 
    source: "node-drug-z", 
    target: "node-protein-a", 
    relationship: "stabilizes", 
    confidence: 0.90, 
    evidencePaperIds: ["paper-002"],
    temporalEvents: [
      { status: "published", year: 2023, details: "In-silico molecular docking predicts high binding affinity of Drug Z to Protein A ligand pocket." },
      { status: "replicated", year: 2025, details: "Nature Drug Discovery publishes animal trial demonstrating in-vivo synaptic protection." }
    ]
  },
  { 
    id: "link-5", 
    source: "node-qec", 
    target: "node-stabilizer-code", 
    relationship: "applies", 
    confidence: 0.95, 
    evidencePaperIds: ["paper-003"],
    temporalEvents: [
      { status: "published", year: 2023, details: "Topological code stabilizer syndromes validated on superconducting logical qubits." }
    ]
  },
  { 
    id: "link-6", 
    source: "node-tensor", 
    target: "node-protein-folding", 
    relationship: "models", 
    confidence: 0.82, 
    evidencePaperIds: ["paper-004"],
    temporalEvents: [
      { status: "published", year: 2024, details: "Contraction algorithms reduce dimensional bounds of 100-residue proteins." }
    ]
  },
  { 
    id: "link-7", 
    source: "node-stabilizer-code", 
    target: "node-protein-folding", 
    relationship: "isomorphic to", 
    confidence: 0.72, 
    evidencePaperIds: ["paper-005"],
    temporalEvents: [
      { status: "published", year: 2025, details: "Isomorphism established linking fault-tolerance stabilizer code thresholds to biomolecular spin-glasses." }
    ]
  },
  {
    id: "link-predicted-drug-z-gene-x",
    source: "node-drug-z",
    target: "node-gene-x",
    relationship: "indirectly downregulates",
    confidence: 0.87,
    evidencePaperIds: [],
    predicted: true,
    temporalEvents: [
      { status: "modified", year: 2026, details: "Synthesized by SDOS missing link prediction engine. Mathematical confidence computed at 87%." }
    ]
  }
];

const SEED_HYPOTHESES: Hypothesis[] = [
  {
    id: "hypo-001",
    title: "Topological Stabilizer Mapping for Protein Folding Landscapes",
    query: "Has anyone connected quantum computing error correction techniques with protein folding optimization?",
    description: "This hypothesis proposes that the localized correction syndrome algorithms used in Topological Stabilizer Codes can be mapped onto the localized energetic landscape of Protein Folding. By treating amino acid interactions as physical stabilizer generators, we can leverage Minimum-Weight Perfect Matching (MWPM) algorithms from quantum physics to resolve localized fold optimization bottlenecks, bypassing the exponential complexity faced by current tensor network contraction methodologies.",
    confidence: 0.91,
    supportingEvidence: ["paper-003", "paper-004", "paper-005"],
    analogousMethods: [
      "Minimum-Weight Perfect Matching for topological syndrome decoding",
      "Spin-glass Hamiltonian isomorphism in high-dimensional folding states"
    ],
    indirectLinks: [
      { source: "Quantum Error Correction", target: "Topological Stabilizer Code", relation: "applies" },
      { source: "Topological Stabilizer Code", target: "Protein Folding Landscape", relation: "isomorphic to" },
      { source: "Tensor Network Contraction", target: "Protein Folding Landscape", relation: "models" }
    ],
    computationalFeasibility: 0.85,
    clinicalFeasibility: 0.20,
    noveltyScore: 0.96,
    impactScore: 0.99,
    status: "verified",
    verificationDetails: "Mathematical validation indicates that logical stabilizer thresholds correspond to folding transition phase bounds. Citation verify agent verified direct analogies in Paper 5.",
    discoveryPhase: "Published",
    phaseHistory: [
      { phase: "Hypothesis", year: 2026, note: "Formulated by SDOS Evolutionary Tournament" },
      { phase: "Published", year: 2026, note: "Mathematical model published in the Journal of Quantum Biophysics." }
    ],
    discoveryValueScore: 94.3,
    dvsComponents: {
      novelty: 0.96,
      impact: 0.99,
      feasibility: 0.85,
      cost: 0.22,
      time: 2.4,
      influence: 0.91
    },
    grantFitScore: 94,
    grantSuccessProbability: 82,
    primaryGrantMatch: {
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
    proposalOutline: {
      projectTitle: "Grant Proposal: Topological Stabilizer Mapping for Protein Folding Landscapes",
      executiveSummary: "This project targets a fundamental cross-disciplinary gap between quantum error correction decoders and biomolecular folding landscapes. Leverages Minimum-Weight Perfect Matching to bypass exponential tensor contraction limits.",
      interdisciplinaryInnovation: "Bridges quantum error syndrome topology and structural biophysics.",
      targetGrantAgency: "NSF Awards",
      targetGrantCode: "NSF-QBIO-2026",
      estimatedBudget: "$1,800,000",
      projectDuration: "36 Months",
      keyMilestones: [
        "Month 0-6: Knowledge Graph alignment & in-silico simulation",
        "Month 7-18: In-vitro experimental validation & target binding assay",
        "Month 19-30: Interdisciplinary lab collaboration & preclinical testing",
        "Month 31-36: Final grant reporting, open data publishing & IP filing"
      ],
      expectedImpact: "Directly accelerates target validation timeline by 40% and provides high grant alignment with NSF funding priorities."
    },
    contradictions: [
      {
        id: "contra-1",
        paperA: "Paper #003 (Quantum Syndrome decoders)",
        claimA: "Stabilizer decoders require perfectly static qubits with 2D planar constraints for error syndrome matching.",
        paperB: "Paper #005 (Biomolecular Spin-Glasses)",
        claimB: "Biomolecular folding pathways are inherently non-planar, exhibiting high-dimensional thermodynamic fluctuation.",
        resolution: "Dimensionality matching. The surface codes must be mapped onto a 3D manifold, allowing thermal fluctuations to serve as natural entropic stabilizer decays."
      }
    ],
    implications: [
      "Localized stabilizer matching decoders bypass NP-hard protein folding grids.",
      "Protein dynamics can be modeled as active quantum error corrections.",
      "Highly specific therapeutic peptides can be designed in silico in seconds.",
      "Customized enzymes can be synthesized for direct targeted amyloid-beta degradation."
    ],
    createdAt: new Date().toISOString()
  },
  {
    id: "hypo-002",
    title: "Experimental Compound Drug Z-induced Synaptic Protection Pathway",
    query: "Find pathways that selectively downregulate Alzheimer's-associated gene X",
    description: "This hypothesis proposes a pathway where the experimental compound Drug Z crosses the blood-brain barrier to selectively lock and stabilize Protein A, keeping it in an active state. In turn, the sustained activity of stabilized Protein A down-regulates Gene X expression, which ultimately prevents hyperphosphorylation of amyloid-beta precursors and halts neurodegeneration.",
    confidence: 0.84,
    supportingEvidence: ["paper-001", "paper-002"],
    analogousMethods: [
      "Protein Conformation Thermal Stabilization",
      "RNA interference pathway simulation of Gene X"
    ],
    indirectLinks: [
      { source: "Drug Z", target: "Protein A", relation: "stabilizes" },
      { source: "Protein A", target: "Gene X", relation: "inhibits" },
      { source: "Gene X", target: "Alzheimer's Disease", relation: "associated with" }
    ],
    computationalFeasibility: 0.65,
    clinicalFeasibility: 0.72,
    noveltyScore: 0.88,
    impactScore: 0.95,
    status: "verified",
    verificationDetails: "In-silico molecular docking has validated the Drug Z binding affinity. GNN-predicted links were successfully verified against Paper #002.",
    discoveryPhase: "Replicated",
    phaseHistory: [
      { phase: "Hypothesis", year: 2026, note: "Formulated by SDOS GNN Missing Link Engine" },
      { phase: "Published", year: 2026, note: "Preprint launched on bioRxiv for peer feedback." },
      { phase: "Replicated", year: 2026, note: "In-vitro testing in cortical neuron cultures replicated downregulation metrics." }
    ],
    discoveryValueScore: 82.5,
    dvsComponents: {
      novelty: 0.88,
      impact: 0.95,
      feasibility: 0.65,
      cost: 0.40,
      time: 1.2,
      influence: 0.75
    },
    grantFitScore: 91,
    grantSuccessProbability: 79,
    primaryGrantMatch: {
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
    createdAt: new Date().toISOString()
  }
];

const SEED_BOUNTIES: Bounty[] = [
  {
    id: "bounty-1",
    title: "Alzheimer's Receptor Conformation Stabilizer",
    description: "Postulate a functional small-molecule binding pocket ligand that stabilizes human GPCR Class A receptor conformations under dynamic thermal fluctuations to block synaptic toxic cascades.",
    reward: "$150,000 USD",
    discipline: "Medicine",
    status: "open",
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bounty-2",
    title: "Room-Temperature Polymer Quantum Decoders",
    description: "Synthesize an organic poly-conjugated polymer material with stable topological syndrome defect codes capable of passive error correction under ambient temperatures (298K).",
    reward: "$250,000 USD",
    discipline: "Materials",
    status: "open",
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: "bounty-3",
    title: "Mitochondrial ROS Downregulator via Peptide-Y",
    description: "Propose a targetable cell-penetrating peptide sequence modeled around the Y-motif that crosses both blood-brain and inner mitochondrial barriers to reduce reactive oxygen species selectively in hyper-excited neurons.",
    reward: "$100,000 USD",
    discipline: "Genomics",
    status: "completed",
    linkedHypothesisId: "hypo-002",
    createdAt: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const SEED_EXCHANGE_LOGS: InterdisciplinaryExchangeLog[] = [
  {
    id: "ex-1",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    sourceDomain: "Quantum",
    targetDomain: "Medicine",
    transferredHypothesisId: "hypo-001",
    transferredHypothesisTitle: "Topological Stabilizer Mapping for Protein Folding Landscapes",
    novelInterdisciplinaryConnection: "Transferred surface-code stabilizer syndromic decoders to map biochemical protein fold grids, speeding up peptide structure formulation.",
    status: "flagged_high_impact"
  }
];

class JsonDatabase {
  private data!: DbSchema;

  constructor() {
    this.init();
  }

  private init() {
    try {
      const dir = path.dirname(DB_FILE_PATH);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.data = JSON.parse(fileContent);
        console.log(`[JSON Database] Loaded existing database from ${DB_FILE_PATH}`);
      } else {
        this.data = {
          papers: SEED_PAPERS,
          nodes: SEED_NODES,
          links: SEED_LINKS,
          hypotheses: SEED_HYPOTHESES,
          bounties: SEED_BOUNTIES,
          interdisciplinaryExchangeLogs: SEED_EXCHANGE_LOGS
        };
        this.save();
        console.log(`[JSON Database] Initialized and seeded new database at ${DB_FILE_PATH}`);
      }
    } catch (err) {
      console.error("[JSON Database] Error loading/initializing database, falling back to in-memory:", err);
      this.data = {
        papers: SEED_PAPERS,
        nodes: SEED_NODES,
        links: SEED_LINKS,
        hypotheses: SEED_HYPOTHESES,
        bounties: SEED_BOUNTIES,
        interdisciplinaryExchangeLogs: SEED_EXCHANGE_LOGS
      };
    }
  }

  public save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), "utf-8");
    } catch (err) {
      console.error("[JSON Database] Failed to write database to disk:", err);
    }
  }

  // Getters & Setters
  get papers(): ScientificPaper[] {
    return this.data.papers;
  }
  set papers(val: ScientificPaper[]) {
    this.data.papers = val;
    this.save();
  }

  get nodes(): GraphNode[] {
    return this.data.nodes;
  }
  set nodes(val: GraphNode[]) {
    this.data.nodes = val;
    this.save();
  }

  get links(): GraphLink[] {
    return this.data.links;
  }
  set links(val: GraphLink[]) {
    this.data.links = val;
    this.save();
  }

  get hypotheses(): Hypothesis[] {
    return this.data.hypotheses;
  }
  set hypotheses(val: Hypothesis[]) {
    this.data.hypotheses = val;
    this.save();
  }

  get bounties(): Bounty[] {
    return this.data.bounties;
  }
  set bounties(val: Bounty[]) {
    this.data.bounties = val;
    this.save();
  }

  get interdisciplinaryExchangeLogs(): InterdisciplinaryExchangeLog[] {
    return this.data.interdisciplinaryExchangeLogs;
  }
  set interdisciplinaryExchangeLogs(val: InterdisciplinaryExchangeLog[]) {
    this.data.interdisciplinaryExchangeLogs = val;
    this.save();
  }

  // Deletion and Reset Helpers
  public deletePaper(paperId: string) {
    this.data.papers = this.data.papers.filter((p) => p.id !== paperId);

    // Clean up graph nodes tied to this paper
    const paperNodeId = `paper-node-${paperId}`;
    this.data.nodes = this.data.nodes.filter(
      (n) => n.id !== paperId && n.id !== paperNodeId
    );

    // Clean up links referencing this paper or paper node
    this.data.links = this.data.links.filter((l) => {
      const s = typeof l.source === "string" ? l.source : (l.source as any).id;
      const t = typeof l.target === "string" ? l.target : (l.target as any).id;
      if (s === paperNodeId || t === paperNodeId || s === paperId || t === paperId) {
        return false;
      }
      if (l.evidencePaperIds && l.evidencePaperIds.includes(paperId)) {
        l.evidencePaperIds = l.evidencePaperIds.filter((id) => id !== paperId);
      }
      return true;
    });

    // Clean up hypotheses evidence
    this.data.hypotheses.forEach((h) => {
      if (h.supportingEvidence) {
        h.supportingEvidence = h.supportingEvidence.filter((id) => id !== paperId);
      }
    });

    this.save();
  }

  public clearAllPapers() {
    this.data.papers = [];
    this.data.nodes = [];
    this.data.links = [];
    this.data.hypotheses = [];
    this.save();
  }

  public deleteHypothesis(hypothesisId: string) {
    this.data.hypotheses = this.data.hypotheses.filter((h) => h.id !== hypothesisId);
    this.save();
  }

  public deleteHypothesesBatch(ids: string[]) {
    this.data.hypotheses = this.data.hypotheses.filter((h) => !ids.includes(h.id));
    this.save();
  }

  public clearAllHypotheses() {
    this.data.hypotheses = [];
    this.save();
  }

  public restoreSeedData() {
    this.data = {
      papers: JSON.parse(JSON.stringify(SEED_PAPERS)),
      nodes: JSON.parse(JSON.stringify(SEED_NODES)),
      links: JSON.parse(JSON.stringify(SEED_LINKS)),
      hypotheses: JSON.parse(JSON.stringify(SEED_HYPOTHESES)),
      bounties: JSON.parse(JSON.stringify(SEED_BOUNTIES)),
      interdisciplinaryExchangeLogs: JSON.parse(JSON.stringify(SEED_EXCHANGE_LOGS))
    };
    this.save();
  }
}

export const db = new JsonDatabase();
