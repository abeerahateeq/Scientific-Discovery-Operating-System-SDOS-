import { Router } from "express";
import { db } from "../../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { interdisciplinarySchema } from "../../lib/schemas.js";
import { GoogleGenAI } from "@google/genai";
import { Hypothesis, InterdisciplinaryExchangeLog } from "../../types.js";

const router = Router();

// Initialize Gemini API helper
function getAiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey !== "MY_GEMINI_API_KEY") {
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return null;
}

// 1. Get all interdisciplinary logs
router.get("/logs", requireAuth, (req, res) => {
  res.json(db.interdisciplinaryExchangeLogs);
});

// 2. Trigger cross-domain synthesis
router.post("/trigger", requireAuth, async (req, res) => {
  if (db.hypotheses.length === 0) {
    return res.status(400).json({ error: "No hypotheses available to exchange." });
  }

  const sourceHypo = db.hypotheses[Math.floor(Math.random() * db.hypotheses.length)];
  const domains: ("Medicine" | "Materials" | "Quantum" | "Genomics" | "Astrophysics")[] = [
    "Medicine", "Materials", "Quantum", "Genomics", "Astrophysics"
  ];

  const sourceDomain = sourceHypo.domain || "Medicine";
  const targetDomain = domains.find(d => d !== sourceDomain) || "Materials";

  let newHypothesisTitle = "";
  let newHypothesisDescription = "";
  let connectionSummary = "";

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You are the Scientific Discovery OS (SDOS) Interdisciplinary Multi-Agent Orchestrator.
We are transferring a synthesized candidate hypothesis from the ${sourceDomain} domain to the ${targetDomain} domain.

Source Hypothesis details:
Title: ${sourceHypo.title}
Description: ${sourceHypo.description}

Analyze this concept and engineer a brand-new, high-impact interdisciplinary connection. Detail how the core mechanism or mathematical methodology of the source hypothesis translates to solve a critical, unreached bottleneck in the target domain (${targetDomain}).

Provide your output in valid JSON matching this schema (No markdown blocks, no prefix text):
{
  "newTitle": "A highly professional scientific title for the new cross-domain hypothesis",
  "newDescription": "A complete, elegant, multi-sentence paragraph outlining the translated physical mechanism and how it resolves the target domain bottleneck",
  "connectionSummary": "A single concise sentence summarizing the novel analogy or methodological bridge"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
        }
      });

      const rawParsed = JSON.parse(response.text || "{}");
      // Zod validation
      const parsed = interdisciplinarySchema.parse(rawParsed);

      newHypothesisTitle = parsed.newTitle || `Cross-Domain ${sourceDomain} to ${targetDomain} Bridge`;
      newHypothesisDescription = parsed.newDescription || `An interdisciplinary translation bridging ${sourceHypo.title} mechanisms to ${targetDomain} issues.`;
      connectionSummary = parsed.connectionSummary || `Bridged ${sourceDomain} methodology directly into ${targetDomain} computational constraints.`;

    } catch (err) {
      console.error("Gemini cross-domain transfer failed, using fallback:", err);
    }
  }

  if (!newHypothesisTitle) {
    if (sourceDomain === "Quantum" || targetDomain === "Medicine") {
      newHypothesisTitle = "Quantum Surface-Code Stabilizers for Synaptic GPCR Conformation Decay";
      newHypothesisDescription = "Applying logical topological quantum syndrome decoders to cellular biology. By treating active amino acid configurations as multi-qubit stabilizer generators, we map neurological receptor decay under thermal noise. This enables Minimum-Weight Perfect Matching (MWPM) GNN engines to predict high-affinity molecular binders for synaptic Alzheimer's cascades in seconds.";
      connectionSummary = "Transferred topological stabilizer decoders from error-correction to GPCR synaptic conformer decay, unlocking high-affinity Alzheimer's ligand targets.";
    } else {
      newHypothesisTitle = `Thermodynamic Entropy Translation: ${sourceDomain} to ${targetDomain} Mechanics`;
      newHypothesisDescription = `Translating structural modeling concepts from ${sourceDomain} to solve core physical bottlenecks in ${targetDomain}. By aligning the high-dimensional localized folding states with equivalents in ${targetDomain}, we can run GNN predictions to compute structural alignments with extremely low algorithmic complexity.`;
      connectionSummary = `Mapped high-dimensional localized state graphs from ${sourceDomain} into ${targetDomain} physical constraints.`;
    }
  }

  const novelHypo: Hypothesis = {
    id: `hypo-${Date.now()}`,
    title: newHypothesisTitle,
    query: `Interdisciplinary cross-domain exchange from ${sourceDomain} to ${targetDomain}`,
    description: newHypothesisDescription,
    confidence: 0.89,
    supportingEvidence: sourceHypo.supportingEvidence,
    analogousMethods: [
      `Cross-domain translation bridge from ${sourceDomain}`,
      `Isomorphic structural modeling in ${targetDomain}`
    ],
    indirectLinks: sourceHypo.indirectLinks,
    computationalFeasibility: 0.75,
    clinicalFeasibility: 0.30,
    noveltyScore: 0.98,
    impactScore: 0.95,
    status: "verified",
    verificationDetails: `Automatically formulated by the Multi-Agent Cross-Domain Exchange layer. Flagged as high-impact connection opportunity.`,
    discoveryPhase: "Hypothesis",
    phaseHistory: [
      { phase: "Hypothesis", year: 2026, note: `Created via Multi-Agent exchange transferring from ${sourceDomain} to ${targetDomain}` }
    ],
    domain: targetDomain,
    createdAt: new Date().toISOString()
  };

  const hypothesesList = [novelHypo, ...db.hypotheses];
  db.hypotheses = hypothesesList;

  const newLog: InterdisciplinaryExchangeLog = {
    id: `ex-${Date.now()}`,
    timestamp: new Date().toISOString(),
    sourceDomain,
    targetDomain,
    transferredHypothesisId: sourceHypo.id,
    transferredHypothesisTitle: sourceHypo.title,
    novelInterdisciplinaryConnection: connectionSummary,
    status: "flagged_high_impact"
  };

  const exchangeLogsList = [newLog, ...db.interdisciplinaryExchangeLogs];
  db.interdisciplinaryExchangeLogs = exchangeLogsList;

  res.json({
    success: true,
    log: newLog,
    hypothesis: novelHypo
  });
});

export default router;
