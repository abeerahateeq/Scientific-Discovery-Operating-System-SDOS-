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
    cost: number; // experimental cost index (0 to 1, where 1 means low cost or high budget efficiency, or we map it to % score)
    time: number; // time to validation in years
    influence: number; // cross-domain influence %
  };
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
  feedbackStatus?: 'success' | 'failure' | 'modification';
  feedbackNotes?: string;
  feedbackTimestamp?: string;
  domain?: 'Medicine' | 'Materials' | 'Quantum' | 'Genomics' | 'Astrophysics';
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
