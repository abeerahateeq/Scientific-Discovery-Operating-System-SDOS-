export interface ScientificPaper {
  id: string;
  title: string;
  authors: string;
  journal: string;
  year: number;
  abstract: string;
  url?: string;
  ingestedDate: string;
  status: 'ingested' | 'processing' | 'analyzed';
  entitiesExtracted: string[];
  references?: { title: string; authors: string; journal: string; year?: number }[];
  sourceType?: 'user_uploaded' | 'system_discovered';
}

export type NodeGroup = 
  | 'protein' 
  | 'gene' 
  | 'disease' 
  | 'drug' 
  | 'quantum_concept' 
  | 'algorithm' 
  | 'optimization_method' 
  | 'physics_concept'
  | 'paper'
  | 'author';

export interface GraphNode {
  id: string;
  label: string;
  group: NodeGroup;
  val: number; // For node sizing (e.g. degree or relevance)
  description?: string;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphLink {
  id: string;
  source: string;
  target: string;
  relationship: string; // e.g. 'inhibits', 'associated with', 'treated by', 'applies', 'analogous to'
  confidence: number; // 0 to 1
  evidencePaperIds: string[];
  predicted?: boolean; // True for missing link prediction
  temporalEvents?: {
    status: 'published' | 'replicated' | 'rejected' | 'modified';
    year: number;
    details: string;
  }[];
}

export interface GrantCall {
  id: string;
  agency: string; // 'NIH RePORTER' | 'NSF Awards' | 'OpenGrants' | 'CORDIS / Horizon Europe' | 'Grants.gov'
  title: string;
  code: string;
  fundingAmount: string; // e.g. "$1,500,000" or "€2,000,000"
  deadline: string; // e.g. "2026-10-15"
  domain: string; // 'Biotech' | 'Quantum' | 'Climate' | 'Materials' | 'Oncology' | 'Interdisciplinary'
  region: 'US' | 'EU' | 'Global' | 'Asia-Pacific';
  description: string;
  eligibility: string;
  matchScore?: number; // 0 to 100
  matchedHypothesisId?: string;
  url?: string;
}

export interface GrantProposalOutline {
  projectTitle: string;
  executiveSummary: string;
  interdisciplinaryInnovation: string;
  targetGrantAgency: string;
  targetGrantCode: string;
  estimatedBudget: string;
  projectDuration: string;
  keyMilestones: string[];
  expectedImpact: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  query: string;
  description: string;
  confidence: number; // e.g. 0.62
  supportingEvidence: string[];
  analogousMethods: string[];
  indirectLinks: { source: string; target: string; relation: string }[];
  clinicalFeasibility?: number; // 0 to 1
  computationalFeasibility?: number; // 0 to 1
  noveltyScore: number; // 0 to 1
  impactScore: number; // 0 to 1
  status: 'draft' | 'critiqued' | 'verified';
  criticFeedback?: string;
  verificationDetails?: string;
  createdAt: string;
  // Experimental Simulator Design
  experimentProtocol?: string;
  requiredDatasets?: string;
  expectedOutcomes?: string;
  failureProbability?: number;
  requiredEquipment?: string;
  // Track record phase
  discoveryPhase?: 'Hypothesis' | 'Published' | 'Replicated' | 'Clinical Trial' | 'FDA Approved';
  phaseHistory?: { phase: string; year: number; note: string }[];
  // Next Level features
  discoveryValueScore?: number;
  dvsComponents?: {
    novelty: number;
    impact: number;
    feasibility: number;
    cost: number; // experimental cost index
    time: number; // time to validation in years
    influence: number; // cross-domain influence %
  };
  // FA-CDGRF Funding Intelligence
  grantFitScore?: number; // 0 to 100
  grantSuccessProbability?: number; // 0 to 100% (directional guidance)
  primaryGrantMatch?: GrantCall;
  relevantGrants?: GrantCall[];
  proposalOutline?: GrantProposalOutline;
  contradictions?: {
    id: string;
    paperA: string;
    claimA: string;
    paperB: string;
    claimB: string;
    resolution: string;
    resolvingExperiment?: string;
  }[];
  implications?: string[];
  evidenceMetrics?: {
    bridgeScore: number;          // 0 to 100
    mathSimilarity: number;       // 0 to 100
    citationOverlap: number;      // e.g. 0 to 10
    historicalSuccessRate: number; // 0 to 100
  };
  provenance?: ProvenanceItem[];
  autoDiscoveryEnabled?: boolean;
  feedbackStatus?: 'success' | 'failure' | 'modification';
  feedbackNotes?: string;
  feedbackTimestamp?: string;
  domain?: 'Medicine' | 'Materials' | 'Quantum' | 'Genomics' | 'Astrophysics';
}

export interface ProvenanceItem {
  section: 'hypothesis' | 'implications' | 'protocol';
  paperId?: string;
  paperTitle: string;
  source: 'uploaded' | 'discovered' | 'foundation_knowledge';
  contribution: string;
}

export interface ResearchNote {
  id: string;
  title: string;
  content: string;
  category: 'graph_insight' | 'hypothesis_note' | 'protocol_note' | 'literature_note';
  tags: string[];
  createdAt: string;
}

export interface MorningBriefingData {
  id: string;
  date: string;
  headline: string;
  summary: string;
  topHypotheses: { id: string; title: string; dvsScore: number; grantFit: number; domain: string }[];
  urgentGrantCalls: GrantCall[];
  emergingNexusGaps: { gapTitle: string; fields: string[]; grantOpportunity: string }[];
  recommendedCollaborations: { labName: string; department: string; matchReason: string }[];
}

export interface InstitutionalProposal {
  id: string;
  title: string;
  principalInvestigator: string;
  department: string;
  collaboratingDepartments: string[];
  hypothesisId: string;
  grantAgency: string;
  targetGrantCode: string;
  requestedFunding: string;
  stage: 'Idea formulation' | 'Evidence Review' | 'Proposal Drafted' | 'Grant Submitted' | 'Awarded' | 'Rejected';
  submissionDeadline: string;
  grantFitScore: number;
  successProbability: number;
}

export interface FundingHeatmapCell {
  field: string;
  region: 'US' | 'EU' | 'Asia-Pacific' | 'Global';
  fundingIntensity: number; // 0 to 100
  activeGrantsCount: number;
  totalVolume: string; // e.g. "$450M"
  status: 'Under-funded High Potential' | 'Balanced Growth' | 'Heavily Funded Hotspot';
  topGaps: string[];
}

export interface Bounty {
  id: string;
  title: string;
  description: string;
  reward: string;
  discipline: string;
  status: 'open' | 'completed' | 'cancelled';
  linkedHypothesisId?: string;
  createdAt: string;
}

export interface InterdisciplinaryExchangeLog {
  id: string;
  timestamp: string;
  sourceDomain: string;
  targetDomain: string;
  transferredHypothesisId: string;
  transferredHypothesisTitle: string;
  novelInterdisciplinaryConnection: string;
  status: 'success' | 'flagged_high_impact' | 'analyzed';
}

export interface LiteratureReview {
  id: string;
  title: string;
  domain: string;
  themes: { themeName: string; summary: string; supportingPapers: string[] }[];
  methodologyComparisons: { methodA: string; methodB: string; prosAndCons: string; applicability: string }[];
  consensusAndDisagreements: { topic: string; consensusPoints: string[]; conflictingClaims: string[] }[];
  researchGapsHighlighted: string[];
  fullMarkdownContent: string;
  citations: { paperId: string; citationText: string }[];
  createdAt: string;
}

export interface DraftedManuscript {
  id: string;
  title: string;
  targetVenueOrGrant: string; // e.g. 'Nature Biotechnology' or 'NIH R01 Proposal'
  authors: string[];
  abstract: string;
  introduction: string;
  relatedWork: string;
  methodology: string;
  discussion: string;
  grantProposalSection?: string;
  referencesList: string[];
  generatedAt: string;
}

export interface ExperimentPlan {
  id: string;
  hypothesisId: string;
  hypothesisTitle: string;
  suggestedMethodology: string;
  independentVariables: string[];
  dependentVariables: string[];
  recommendedControls: string[];
  requiredResources: { item: string; category: 'Compute' | 'Reagents' | 'Lab Equipment' | 'Datasets'; estimatedCost: string }[];
  totalEstimatedCostUSD: string;
  estimatedDurationMonths: number;
  evaluationMetrics: string[];
  safetyAndEthicalConsiderations: string;
}

export interface CustomResearchAgent {
  id: string;
  name: string;
  domain: string; // e.g. 'Cancer Oncology', 'Quantum Climate', 'Patent Analysis'
  description: string;
  systemPrompt: string;
  assignedTools: string[];
  workflowTrigger: 'On Paper Ingestion' | 'On Gap Detected' | 'Scheduled Daily' | 'Manual Execution';
  author: string;
  status: 'active' | 'paused';
  executionCount: number;
}

export interface ReproducibleNotebookPackage {
  id: string;
  hypothesisId: string;
  title: string;
  jupyterNotebookJson: string;
  pythonScriptContent: string;
  requirementsTxt: string;
  datasetSources: { name: string; url: string; size: string }[];
  dockerfileContent: string;
  reproductionCommand: string;
}

export type AgentName =
  | 'Research Coordinator'
  | 'Literature Search Agent'
  | 'Paper Summarizer'
  | 'Knowledge Graph Builder'
  | 'Hypothesis Generator'
  | 'Critic Agent'
  | 'Citation Verifier'
  | 'Ranking Agent';

export interface AgentStatus {
  name: AgentName;
  state: 'idle' | 'running' | 'completed' | 'error';
  currentTask?: string;
  logs: string[];
}

export interface DiscoveryResponse {
  path: string[];
  connections: { source: string; target: string; relationship: string; confidence: number }[];
  geminiExplanation: string;
}
