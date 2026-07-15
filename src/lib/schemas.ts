import { z } from "zod";

// 1. PDF Metadata Extraction Schema
export const pdfMetadataSchema = z.object({
  title: z.string().default("Indexed PDF Ingestion"),
  authors: z.string().default("Unknown Authors"),
  journal: z.string().default("Indexed PDF Ingestion"),
  year: z.number().int().default(() => new Date().getFullYear()),
  abstract: z.string().default("Abstract extraction completed."),
  references: z.array(z.object({
    title: z.string(),
    authors: z.string(),
    journal: z.string(),
    year: z.number().int().optional()
  })).default([]),
  entities: z.array(z.object({
    name: z.string(),
    group: z.enum([
      "protein", "gene", "disease", "drug", "quantum_concept", 
      "algorithm", "optimization_method", "physics_concept", "paper", "author"
    ]).default("protein"),
    description: z.string().default("")
  })).default([]),
  relationships: z.array(z.object({
    source: z.string(),
    target: z.string(),
    relationship: z.string(),
    confidence: z.number().min(0).max(1).default(0.8)
  })).default([])
});

// 2. Hypothesis Generation Schema
export const hypothesisSchema = z.object({
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0.1).max(0.99).default(0.7),
  supportingEvidence: z.array(z.string()).default([]),
  analogousMethods: z.array(z.string()).default([]),
  indirectLinks: z.array(z.object({
    source: z.string(),
    target: z.string(),
    relation: z.string()
  })).default([]),
  computationalFeasibility: z.number().min(0).max(1).default(0.5),
  clinicalFeasibility: z.number().min(0).max(1).default(0.5),
  noveltyScore: z.number().min(0).max(1).default(0.8),
  impactScore: z.number().min(0).max(1).default(0.8)
});

// 3. Hypothesis Verification Schema
export const verificationSchema = z.object({
  criticFeedback: z.string(),
  verificationDetails: z.string(),
  noveltyScoreAdjustment: z.number().min(0).max(1).optional(),
  impactScoreAdjustment: z.number().min(0).max(1).optional(),
  confidenceAdjustment: z.number().min(0).max(1).optional()
});

// 4. Hypothesis Tournament Schema
export const tournamentSchema = z.array(z.object({
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0.1).max(0.99).default(0.7),
  supportingEvidence: z.array(z.string()).default([]),
  analogousMethods: z.array(z.string()).default([]),
  indirectLinks: z.array(z.object({
    source: z.string(),
    target: z.string(),
    relation: z.string()
  })).default([]),
  computationalFeasibility: z.number().min(0).max(1).default(0.5),
  clinicalFeasibility: z.number().min(0).max(1).default(0.5),
  noveltyScore: z.number().min(0).max(1).default(0.8),
  impactScore: z.number().min(0).max(1).default(0.8)
}));

// 5. Experimental Protocol Schema
export const experimentProtocolSchema = z.object({
  experimentProtocol: z.string(),
  requiredDatasets: z.string(),
  expectedOutcomes: z.string(),
  failureProbability: z.number().min(0.01).max(0.99).default(0.3),
  requiredEquipment: z.string()
});

// 6. Interdisciplinary Exchange Schema
export const interdisciplinarySchema = z.object({
  newTitle: z.string(),
  newDescription: z.string(),
  connectionSummary: z.string()
});

// 7. Dynamic Autonomous Discovery Schema
export const autonomousDiscoverySchema = z.object({
  title: z.string(),
  description: z.string(),
  confidence: z.number().min(0.1).max(0.99).default(0.9),
  supportingEvidence: z.array(z.string()).default([]),
  analogousMethods: z.array(z.string()).default([]),
  indirectLinks: z.array(z.object({
    source: z.string(),
    target: z.string(),
    relation: z.string()
  })).default([]),
  computationalFeasibility: z.number().min(0).max(1).default(0.8),
  clinicalFeasibility: z.number().min(0).max(1).default(0.4),
  noveltyScore: z.number().min(0.7).max(1.0).default(0.95),
  impactScore: z.number().min(0.7).max(1.0).default(0.95),
  verificationDetails: z.string().default("Verified automatically by Autonomous Peer Ingestion Agent."),
  discoveryValueScore: z.number().min(50).max(100).default(95.0),
  dvsComponents: z.object({
    novelty: z.number().min(0).max(1).default(0.95),
    impact: z.number().min(0).max(1).default(0.95),
    feasibility: z.number().min(0).max(1).default(0.8),
    cost: z.number().min(0).max(1).default(0.2),
    time: z.number().min(0).max(10).default(2.0),
    influence: z.number().min(0).max(1).default(0.9)
  }),
  contradictions: z.array(z.object({
    paperA: z.string(),
    claimA: z.string(),
    paperB: z.string(),
    claimB: z.string(),
    resolution: z.string()
  })).default([]),
  implications: z.array(z.string()).default([])
});
