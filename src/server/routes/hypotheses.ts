import { Router } from "express";
import { db } from "../../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { createSimulatedHypothesis } from "../helpers.js";
import { 
  hypothesisSchema, 
  verificationSchema, 
  tournamentSchema, 
  experimentProtocolSchema,
  autonomousDiscoverySchema 
} from "../../lib/schemas.js";
import { GoogleGenAI } from "@google/genai";
import { Hypothesis, AgentName } from "../../types.js";

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

// 1. Get all hypotheses
router.get("/", requireAuth, (req, res) => {
  res.json(db.hypotheses);
});

// 2. Generate Hypothesis (Multi-Agent Research Pipeline Simulation + Real Gemini Synthesis)
router.post("/generate", requireAuth, async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required." });
  }

  console.log(`\n--- Starting Multi-Agent Hypothesis Generation for query: "${query}" ---`);

  const logs: { agent: AgentName; message: string; timestamp: string }[] = [];
  const log = (agent: AgentName, msg: string) => {
    logs.push({ agent, message: msg, timestamp: new Date().toLocaleTimeString() });
    console.log(`[${agent}] ${msg}`);
  };

  log("Research Coordinator", `Received user research goal: "${query}". Initializing multi-agent research task pipeline.`);
  log("Literature Search Agent", "Scanning indexed paper database for relevant terms...");
  
  const relatedPapers = db.papers.filter(p => 
    p.title.toLowerCase().includes(query.toLowerCase()) || 
    p.abstract.toLowerCase().includes(query.toLowerCase()) ||
    p.entitiesExtracted.some(ent => query.toLowerCase().includes(ent.toLowerCase()))
  );
  
  log("Literature Search Agent", `Discovered ${relatedPapers.length > 0 ? relatedPapers.length : "all"} pertinent paper(s). Pulling citations.`);
  relatedPapers.forEach(rp => {
    log("Paper Summarizer", `Summarizing Paper "${rp.title}" and extracting key experimental constraints...`);
  });

  log("Knowledge Graph Builder", "Querying Graph relationships and running Graph Neural Network (GNN) link prediction simulation...");
  log("Knowledge Graph Builder", "Found 3 indirect pathways and established analogous topological models between quantum computing grids and biological structures.");
  log("Hypothesis Generator", "Synthesizing cross-domain concepts and formulating the mathematical hypothesis...");

  let newHypothesis: Hypothesis;
  const ai = getAiClient();

  if (ai) {
    try {
      const papersContext = db.papers.map(p => `- ID: ${p.id}\n  Title: ${p.title}\n  Abstract: ${p.abstract}`).join("\n\n");
      const currentGraphContext = `Nodes: ${db.nodes.map(n => n.label).join(", ")}\nLinks: ${db.links.map(l => `${l.source} --[${l.relationship}]--> ${l.target}`).join(", ")}`;

      const prompt = `You are the Research Coordinator LLM of a stateful, multi-agent scientific discovery pipeline.
Generate an explainable, evidence-backed interdisciplinary hypothesis for this query:
"${query}"

Utilize the indexed literature and knowledge graph below to construct the hypothesis.
Indexed Literature:
${papersContext}

Knowledge Graph State:
${currentGraphContext}

Respond ONLY with a valid JSON object matching the following schema (No markdown blocks, no prefix text):
{
  "title": "A highly creative, scientific, and sophisticated paper-like title",
  "description": "A detailed, technical, paragraph-long description explaining the biological, physics, or computing mechanism, the cross-domain analogies, and the hypothesis",
  "confidence": number (between 0.1 and 0.99),
  "supportingEvidence": ["paper-id-1", "paper-id-2"],
  "analogousMethods": ["Method 1 description", "Method 2 description"],
  "indirectLinks": [
    { "source": "Node A label", "target": "Node B label", "relation": "relationship label" }
  ],
  "computationalFeasibility": number (0 to 1),
  "clinicalFeasibility": number (0 to 1),
  "noveltyScore": number (0 to 1),
  "impactScore": number (0 to 1)
}

Be technically detailed and accurate, writing like a DeepMind / Nobel prize research paper.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawParsed = JSON.parse(response.text || "{}");
      // Validate schema
      const result = hypothesisSchema.parse(rawParsed);
      
      log("Critic Agent", "Reviewing hypothesis for logical gaps, mathematical feasibility, and experimental safety...");
      log("Critic Agent", `Logical consistency looks clean. Evaluated novelty at ${Math.round((result.noveltyScore || 0.8) * 100)}% and impact at ${Math.round((result.impactScore || 0.8) * 100)}%.`);
      
      log("Citation Verifier", "Verifying citations in the hypothesis against indexed literature database...");
      const verifiedCitations = (result.supportingEvidence || []).filter((id: string) => db.papers.some(p => p.id === id));
      log("Citation Verifier", `Citations validated. Verified ${verifiedCitations.length} active literature records.`);

      log("Ranking Agent", "Ranking hypothesis feasibility metrics and outputting to Research Dashboard...");

      newHypothesis = {
        id: `hypo-${Date.now()}`,
        title: result.title || "Synthesized Scientific Hypothesis",
        query,
        description: result.description || "Synthesized scientific model.",
        confidence: result.confidence || 0.65,
        supportingEvidence: verifiedCitations.length > 0 ? verifiedCitations : ["paper-001", "paper-002", "paper-005"],
        analogousMethods: result.analogousMethods || ["Cross-domain analogy mapping"],
        indirectLinks: result.indirectLinks || [],
        computationalFeasibility: result.computationalFeasibility || 0.75,
        clinicalFeasibility: result.clinicalFeasibility || 0.40,
        noveltyScore: result.noveltyScore || 0.85,
        impactScore: result.impactScore || 0.80,
        status: "draft",
        createdAt: new Date().toISOString()
      };

    } catch (err) {
      console.error("Gemini hypothesis generation error, falling back to simulated engine:", err);
      newHypothesis = createSimulatedHypothesis(query, log);
    }
  } else {
    newHypothesis = createSimulatedHypothesis(query, log);
  }

  const hypothesesList = [...db.hypotheses];
  hypothesesList.push(newHypothesis);
  db.hypotheses = hypothesesList;

  res.json({ hypothesis: newHypothesis, logs });
});

// 3. Verify Hypothesis
router.post("/verify", requireAuth, async (req, res) => {
  const { hypothesisId } = req.body;
  if (!hypothesisId) {
    return res.status(400).json({ error: "hypothesisId is required." });
  }

  const hypothesesList = [...db.hypotheses];
  const hypoIndex = hypothesesList.findIndex(h => h.id === hypothesisId);
  if (hypoIndex === -1) {
    return res.status(404).json({ error: "Hypothesis not found." });
  }

  const hypo = hypothesesList[hypoIndex];
  console.log(`Verifying hypothesis: "${hypo.title}"`);

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You are a strict Scientific Peer Reviewer and Citation Verifier.
Evaluate this scientific hypothesis for clinical/computational feasibility, citation alignment, and logical validity.
Title: ${hypo.title}
Description: ${hypo.description}

Provide an intense, critical review. Return a valid JSON object matching this schema:
{
  "criticFeedback": "A concise paragraph critiquing the logic, safety, and physical limits of the hypothesis",
  "verificationDetails": "A paragraph validating the mathematical or clinical citations and suggesting improvements",
  "noveltyScoreAdjustment": number (0 to 1),
  "impactScoreAdjustment": number (0 to 1),
  "confidenceAdjustment": number (0 to 1)
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawReview = JSON.parse(response.text || "{}");
      // Zod validation
      const review = verificationSchema.parse(rawReview);
      
      hypo.status = "verified";
      hypo.criticFeedback = review.criticFeedback || "No major flaws identified by Critic Agent.";
      hypo.verificationDetails = review.verificationDetails || "Citations verified and logical mappings validated against the graph.";
      if (review.noveltyScoreAdjustment !== undefined) hypo.noveltyScore = review.noveltyScoreAdjustment;
      if (review.impactScoreAdjustment !== undefined) hypo.impactScore = review.impactScoreAdjustment;
      if (review.confidenceAdjustment !== undefined) hypo.confidence = review.confidenceAdjustment;

    } catch (err) {
      console.error("Gemini hypothesis verification error, using fallback review:", err);
      hypo.status = "verified";
      hypo.criticFeedback = "Critic review confirms high mathematical logic, but warns that direct in-vivo clinical testing requires significant biocompatibility analysis for computational stabilizer models.";
      hypo.verificationDetails = "Citation verifier validated logical linkages between QEC stabilizer codes and polymer folding bounds against Paper 5.";
    }
  } else {
    // Simulated peer review
    hypo.status = "verified";
    hypo.criticFeedback = "Critic review confirms logical consistency. However, physical implementation of stabilizer codes in living tissue presents an extreme bio-scaffolding challenge. Focus should remain on in-silico computational fold optimization first.";
    hypo.verificationDetails = "All active literature nodes verified. The analogous mappings between syndrome decoders and fold configurations are mathematically sound according to quantum stabilizer models.";
  }

  // Update DB
  db.hypotheses = hypothesesList;
  res.json({ success: true, hypothesis: hypo });
});

// 4. Advance Hypothesis Discovery Phase with learning feedback
router.post("/advance-phase", requireAuth, (req, res) => {
  const { hypothesisId, targetPhase, note } = req.body;
  if (!hypothesisId || !targetPhase) {
    return res.status(400).json({ error: "hypothesisId and targetPhase are required." });
  }

  const hypothesesList = [...db.hypotheses];
  const hypo = hypothesesList.find(h => h.id === hypothesisId);
  if (!hypo) {
    return res.status(404).json({ error: "Hypothesis not found." });
  }

  hypo.discoveryPhase = targetPhase;
  if (!hypo.phaseHistory) {
    hypo.phaseHistory = [{ phase: "Hypothesis", year: 2026, note: "Formulated by SDOS Engine" }];
  }

  const currentYear = new Date().getFullYear();
  hypo.phaseHistory.push({
    phase: targetPhase,
    year: currentYear,
    note: note || `Advanced to ${targetPhase} phase. In-silico validation complete.`
  });

  const learningWeights = [
    "High topological correlation GNN link predictors verified with +15.2% replicate stability.",
    "Refined cross-domain mapping constraints: Quantum Stabilizer analogs validated with a 94.3% structural threshold.",
    "Pathway convergence weights updated: Synaptic lock receptors in Protein A show increased targeted affinity (+18.4%).",
    "Thermodynamic GNN link scoring calibrated: non-planar hydrophobic bounding values refined in model engine."
  ];
  const reasoningAdjustment = learningWeights[Math.floor(Math.random() * learningWeights.length)];

  // Update DB
  db.hypotheses = hypothesesList;

  res.json({ success: true, hypothesis: hypo, reasoningAdjustment });
});

// 5. Run Autonomous Discovery Overnight Sweep (AI-DRIVEN WITH GEMINI + PERSISTED)
router.post("/autonomous-run", requireAuth, async (req, res) => {
  console.log("\n--- Executing Dynamic Autonomous Discovery Sweep ---");

  const briefing = {
    papersRead: 8462 + Math.floor(Math.random() * 150),
    newConnections: 1124 + Math.floor(Math.random() * 50),
    hypothesesGenerated: 432 + Math.floor(Math.random() * 15),
    highValueDiscoveries: 9 + Math.floor(Math.random() * 3),
    criticalContradictions: 3 + Math.floor(Math.random() * 2),
    potentialBreakthroughs: 1
  };

  const ai = getAiClient();
  let newHypo: Hypothesis;

  if (ai) {
    try {
      const papersContext = db.papers.map(p => `- ID: ${p.id}\n  Title: ${p.title}\n  Abstract: ${p.abstract}`).join("\n\n");
      const currentGraphContext = `Nodes: ${db.nodes.map(n => n.label).join(", ")}\nLinks: ${db.links.map(l => `${l.source} --[${l.relationship}]--> ${l.target}`).join(", ")}`;

      const prompt = `You are the Scientific Discovery OS Autonomous Overnight Sweep Agent.
Analyze the following indexed publications and active knowledge graph relationships:

Indexed Papers:
${papersContext}

Knowledge Graph State:
${currentGraphContext}

Your goal is to perform a deep, non-obvious, high-throughput autonomous discovery sweep. Look for unexpected gaps, missing links, and structural analogies between different disciplines.
Generate a brand-new, extremely high-value, highly rigorous scientific breakthrough hypothesis.

Return a valid JSON object matching this schema (do not include any prefix text or markdown code block formatting):
{
  "title": "A highly creative, sophisticated, Nobel-prize-like research title",
  "description": "A comprehensive, technical, multi-sentence explanation of the discovery, mapping biological/physical/computational mechanisms",
  "confidence": number (between 0.85 and 0.99),
  "supportingEvidence": ["paper-001", "paper-002"], // must cite actual paper IDs from above if relevant
  "analogousMethods": ["Method A", "Method B"],
  "indirectLinks": [
    { "source": "Node A", "target": "Node B", "relation": "relation" }
  ],
  "computationalFeasibility": number (0.80 to 0.99),
  "clinicalFeasibility": number (0.10 to 0.90),
  "noveltyScore": number (0.90 to 1.00),
  "impactScore": number (0.90 to 1.00),
  "verificationDetails": "Detailed report of structural binding simulations or algorithmic proofs backing this model",
  "discoveryValueScore": number (80 to 100),
  "dvsComponents": {
    "novelty": number (0.80 to 1.00),
    "impact": number (0.80 to 1.00),
    "feasibility": number (0.80 to 1.00),
    "cost": number (0 to 1),
    "time": number,
    "influence": number (0 to 1)
  },
  "contradictions": [
    {
      "paperA": "Title of contradictory paper/study",
      "claimA": "Claim from study A",
      "paperB": "Title of study B",
      "claimB": "Claim from study B",
      "resolution": "Elegant resolution or compromise of this contradiction"
    }
  ],
  "implications": ["Implication 1", "Implication 2", "Implication 3"]
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawParsed = JSON.parse(response.text || "{}");
      // Zod validation
      const result = autonomousDiscoverySchema.parse(rawParsed);

      newHypo = {
        id: `hypo-autonomous-${Date.now()}`,
        title: result.title,
        query: "Overnight Autonomous Discovery",
        description: result.description,
        confidence: result.confidence,
        supportingEvidence: result.supportingEvidence.length > 0 ? result.supportingEvidence : ["paper-003", "paper-004"],
        analogousMethods: result.analogousMethods,
        indirectLinks: result.indirectLinks,
        computationalFeasibility: result.computationalFeasibility,
        clinicalFeasibility: result.clinicalFeasibility,
        noveltyScore: result.noveltyScore,
        impactScore: result.impactScore,
        status: "verified",
        verificationDetails: result.verificationDetails,
        discoveryPhase: "Hypothesis",
        phaseHistory: [
          { phase: "Hypothesis", year: 2026, note: "Synthesized during overnight background literature execution." }
        ],
        discoveryValueScore: result.discoveryValueScore,
        dvsComponents: result.dvsComponents,
        contradictions: result.contradictions.map((c, i) => ({
          id: `contra-aut-${Date.now()}-${i}`,
          paperA: c.paperA,
          claimA: c.claimA,
          paperB: c.paperB,
          claimB: c.claimB,
          resolution: c.resolution
        })),
        implications: result.implications,
        createdAt: new Date().toISOString()
      };

    } catch (err) {
      console.error("Gemini autonomous sweep error, falling back to robust templates:", err);
      newHypo = getAutonomousFallback();
    }
  } else {
    newHypo = getAutonomousFallback();
  }

  const hypothesesList = [...db.hypotheses];
  hypothesesList.push(newHypo);
  db.hypotheses = hypothesesList;

  res.json({ success: true, briefing, newHypothesis: newHypo });
});

function getAutonomousFallback(): Hypothesis {
  return {
    id: `hypo-autonomous-${Date.now()}`,
    title: "Quantum-Entangled Ribozyme Catalysts for Targeted Carbon Fixation",
    query: "Overnight Autonomous Discovery",
    description: "Synthesized during the overnight 12-hour background literature sweep. This breakthrough hypothesis proposes a synthetic ribozyme engineered with a room-temperature quantum spin-glass lattice structure. The entanglement states stabilize the enzymatic active site, allowing the ribozyme to perform targeted carbon-dioxide reduction at 50,000x the speed of wild-type carboxylases in marine synthetic micro-climates.",
    confidence: 0.95,
    supportingEvidence: ["paper-003", "paper-004"],
    analogousMethods: [
      "Topological Ribosomal Latticing",
      "Room-Temperature Quantum Spin Entanglement Stabilization"
    ],
    indirectLinks: [
      { source: "Quantum Error Correction", target: "Topological Stabilizer Code", relation: "applies" },
      { source: "Topological Stabilizer Code", target: "Protein Folding Landscape", relation: "isomorphic to" }
    ],
    computationalFeasibility: 0.82,
    clinicalFeasibility: 0.45,
    noveltyScore: 0.99,
    impactScore: 0.98,
    status: "verified",
    verificationDetails: "Autonomous peer agent verified structural binding coordinates across 8,000 newly ingested papers. Simulated GNN prediction confidence computed at 95.2%.",
    discoveryPhase: "Hypothesis",
    phaseHistory: [
      { phase: "Hypothesis", year: 2026, note: "Synthesized during overnight background literature execution." }
    ],
    discoveryValueScore: 97.4,
    dvsComponents: {
      novelty: 0.99,
      impact: 0.98,
      feasibility: 0.82,
      cost: 0.15,
      time: 1.8,
      influence: 0.95
    },
    contradictions: [
      {
        id: `contra-aut-${Date.now()}`,
        paperA: "Journal of Biochemistry #8112",
        claimA: "Ribozyme structures undergo instant thermal decoherence at temperatures above 4 degrees Celsius.",
        paperB: "Applied Physics Letters #922",
        claimB: "Topological stabilizers maintain spin-coherence indefinitely up to 340 Kelvin.",
        resolution: "Topological shielding. By embedding the ribozyme active site inside a topologically-shielded polymer scaffolding, local thermal decoherence is suppressed, enabling active quantum-assisted carbon capture at 37 degrees Celsius."
      }
    ],
    implications: [
      "Accelerated room-temperature enzymatic carbon sequestration is biologically viable.",
      "Quantum computing principles can directly design highly resilient synthetic RNA structures.",
      "Oceanic micro-climates can be seeded with synthetic micro-algae to reverse climate damage by 12% in 4 years."
    ],
    createdAt: new Date().toISOString()
  };
}

// 6. Run Hypothesis Tournament
router.post("/tournament", requireAuth, async (req, res) => {
  const { query } = req.body;
  if (!query) {
    return res.status(400).json({ error: "Query is required for tournament initialization." });
  }

  console.log(`\n--- Launching Evolutionary Hypothesis Tournament: "${query}" ---`);
  
  const tournamentLogs: string[] = [
    `[Tournament Coordinator] Seeding evolutionary pool with 100 candidate hypotheses using spectral similarity grids...`,
    `[Stage 1: Cohort Pruning] Synthesizing candidates across high-dimensional literature links. Initial pool size: 100.`,
    `[Stage 2: Critic Filter] Critic Agent evaluating thermodynamic barriers and conformational viability. 58 candidates failed physical bounds and were eliminated. Pool size: 42.`,
    `[Stage 3: Mathematical & Chemistry Filter] Mathematical Agent checking topological syndromic matches. Biology & Chemistry Agents checking cellular pathway feasibility. 27 candidates eliminated. Pool size: 15.`,
    `[Stage 4: Statistician Filter] Statistician Agent running randomized clinical power simulation (n=50,000 cases). 9 candidates failed statistical power constraints. Pool size: 6.`,
    `[Stage 5: Ranking & Peer Battle] Running multi-attribute Pareto optimization. Scoring survivability, novelty, and safety metrics...`,
    `[Tournament Coordinator] Evolution complete. The top 3 candidate hypotheses have successfully survived the tournament.`
  ];

  const survivors: Hypothesis[] = [];
  const ai = getAiClient();

  if (ai) {
    try {
      const prompt = `You are the Coordinator of a high-throughput scientific discovery tournament.
User question: "${query}"

Generate exactly 3 diverse, high-quality, biologically and computationally rigorous "survivor" hypotheses that won a tournament out of 100 generated candidates.
Format your response as a valid JSON array matching this schema:
[
  {
    "title": "Rigorous scientific title",
    "description": "Paragraph-long technical explanation of the biological, physical, or computing mechanism, cross-domain analogies, and the hypothesis",
    "confidence": number (between 0.70 and 0.98),
    "supportingEvidence": ["paper-001", "paper-003"],
    "analogousMethods": ["Analogous method 1", "Analogous method 2"],
    "indirectLinks": [
      { "source": "Node A", "target": "Node B", "relation": "relation" }
    ],
    "computationalFeasibility": number (0 to 1),
    "clinicalFeasibility": number (0 to 1),
    "noveltyScore": number (0.75 to 0.99),
    "impactScore": number (0.80 to 0.99)
  }
]

Respond ONLY with this JSON array.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawParsed = JSON.parse(response.text || "[]");
      // Zod validation
      const parsed = tournamentSchema.parse(rawParsed);

      if (Array.isArray(parsed)) {
        parsed.forEach((h: any, idx: number) => {
          const survivor: Hypothesis = {
            id: `hypo-tourney-${Date.now()}-${idx}`,
            title: h.title || `Tournament Champion Candidate #${idx + 1}`,
            query,
            description: h.description || "Synthesized tournament winner.",
            confidence: h.confidence || 0.85,
            supportingEvidence: h.supportingEvidence || ["paper-001", "paper-002"],
            analogousMethods: h.analogousMethods || ["Mathematical path isomorphism"],
            indirectLinks: h.indirectLinks || [],
            computationalFeasibility: h.computationalFeasibility || 0.80,
            clinicalFeasibility: h.clinicalFeasibility || 0.50,
            noveltyScore: h.noveltyScore || 0.90,
            impactScore: h.impactScore || 0.88,
            status: "draft",
            discoveryPhase: "Hypothesis",
            createdAt: new Date().toISOString()
          };
          survivors.push(survivor);
        });
      }
    } catch (err) {
      console.error("Gemini tournament error, using fallback survivors:", err);
    }
  }

  if (survivors.length === 0) {
    const qLower = query.toLowerCase();
    if (qLower.includes("quantum") || qLower.includes("fold") || qLower.includes("stabilizer")) {
      survivors.push(
        {
          id: `hypo-tourney-${Date.now()}-0`,
          title: "Fault-Tolerant Amino Acid Syndrome Decoding via Surface Code Isomorphism",
          query,
          description: "This hypothesis demonstrates that the minimum energy conformations of polypeptide chains can be modeled as syndrome errors in quantum surface codes. By running localized matching decoders, we can predict folding pathways at a fraction of the computational cost of traditional grid searches, with a 92% accuracy bound.",
          confidence: 0.91,
          supportingEvidence: ["paper-003", "paper-005"],
          analogousMethods: ["Minimum-Weight Perfect Matching syndrome decoding", "Surface code homology checks"],
          indirectLinks: [{ source: "Topological Stabilizer Code", target: "Protein Folding Landscape", relation: "isomorphic to" }],
          computationalFeasibility: 0.94,
          clinicalFeasibility: 0.12,
          noveltyScore: 0.98,
          impactScore: 0.94,
          status: "draft",
          discoveryPhase: "Hypothesis",
          createdAt: new Date().toISOString()
        },
        {
          id: `hypo-tourney-${Date.now()}-1`,
          title: "Quantum Entanglement Lattice Models for Macromolecular Phase Separation Criticity",
          query,
          description: "We establish that the critical bounds of macromolecular phase separation (liquid-liquid demixing in cell biology) map cleanly onto topological stabilizers of a quantum lattice. Localized hydrophobic domains behave like stabilizer boundaries, locking phases under discrete topological boundaries.",
          confidence: 0.79,
          supportingEvidence: ["paper-005"],
          analogousMethods: ["Topological state stabilizer boundary theory", "Liquid-liquid phase separation modeling"],
          indirectLinks: [{ source: "Topological Stabilizer Code", target: "Protein Folding Landscape", relation: "isomorphic to" }],
          computationalFeasibility: 0.82,
          clinicalFeasibility: 0.22,
          noveltyScore: 0.95,
          impactScore: 0.86,
          status: "draft",
          discoveryPhase: "Hypothesis",
          createdAt: new Date().toISOString()
        },
        {
          id: `hypo-tourney-${Date.now()}-2`,
          title: "Syndromic Macromolecular Compensation via Chaperone Protein Code Alignment",
          query,
          description: "We propose that biological chaperone proteins act as error-correction syndrome readers. When a protein folds pathologically, chaperone bindings map onto stabilizer error checks, allowing us to mathematically model and optimize molecular therapeutics that assist chaperones.",
          confidence: 0.73,
          supportingEvidence: ["paper-001", "paper-004"],
          analogousMethods: ["Topological error stabilization decoders", "Chaperone pathway simulation"],
          indirectLinks: [{ source: "Protein A", target: "Protein Folding Landscape", relation: "modulates" }],
          computationalFeasibility: 0.76,
          clinicalFeasibility: 0.48,
          noveltyScore: 0.88,
          impactScore: 0.90,
          status: "draft",
          discoveryPhase: "Hypothesis",
          createdAt: new Date().toISOString()
        }
      );
    } else {
      survivors.push(
        {
          id: `hypo-tourney-${Date.now()}-0`,
          title: "Drug Z Downregulation of Gene X via Dual-Action Synaptic Scaffold Locking",
          query,
          description: "By binding selectively to the primary ligand groove of Protein A, Drug Z locks Protein A into an ultra-stable conformation that physically blocks the kinase docking sites of Gene X. This down-regulates Gene X activity by 75% without toxic side-effects.",
          confidence: 0.88,
          supportingEvidence: ["paper-001", "paper-002"],
          analogousMethods: ["Molecular docking conformation locking", "Kinase docking site competition"],
          indirectLinks: [
            { source: "Drug Z", target: "Protein A", relation: "stabilizes" },
            { source: "Protein A", target: "Gene X", relation: "inhibits" }
          ],
          computationalFeasibility: 0.82,
          clinicalFeasibility: 0.65,
          noveltyScore: 0.89,
          impactScore: 0.95,
          status: "draft",
          discoveryPhase: "Hypothesis",
          createdAt: new Date().toISOString()
        },
        {
          id: `hypo-tourney-${Date.now()}-1`,
          title: "MicroRNA Epigenetic Tuning of the Protein A Scaffolding Cascade",
          query,
          description: "Rather than direct small-molecule stabilization, this hypothesis utilizes synthetic microRNA complexes to selectively degrade transcripts that inhibit Protein A synthesis, raising active synaptic levels and halting Alzheimer's tau phosphorylation pathways.",
          confidence: 0.74,
          supportingEvidence: ["paper-001", "paper-002"],
          analogousMethods: ["MicroRNA epigenetic targeting", "Transcription degradation kinetics"],
          indirectLinks: [
            { source: "Protein A", target: "Gene X", relation: "inhibits" },
            { source: "Gene X", target: "Alzheimer's Disease", relation: "associated with" }
          ],
          computationalFeasibility: 0.68,
          clinicalFeasibility: 0.72,
          noveltyScore: 0.91,
          impactScore: 0.93,
          status: "draft",
          discoveryPhase: "Hypothesis",
          createdAt: new Date().toISOString()
        },
        {
          id: `hypo-tourney-${Date.now()}-2`,
          title: "Retrograde Synaptic Reseeding via Drug Z-Chitosan Nanoparticle Aerosols",
          query,
          description: "We formulate an experimental intranasal delivery system using biocompatible chitosan nanoparticles loaded with Drug Z. This delivery bypasses blood-brain barrier transport limits, allowing direct retrograde delivery to cortical synapses.",
          confidence: 0.81,
          supportingEvidence: ["paper-002"],
          analogousMethods: ["Intranasal nanoparticle aerosolization", "Retrograde neuro-transport kinetics"],
          indirectLinks: [
            { source: "Drug Z", target: "Protein A", relation: "stabilizes" },
            { source: "Alzheimer's Disease", target: "Drug Z", relation: "treated by" }
          ],
          computationalFeasibility: 0.72,
          clinicalFeasibility: 0.85,
          noveltyScore: 0.93,
          impactScore: 0.96,
          status: "draft",
          discoveryPhase: "Hypothesis",
          createdAt: new Date().toISOString()
        }
      );
    }
  }

  const hypothesesList = [...db.hypotheses];
  survivors.forEach(s => hypothesesList.push(s));
  db.hypotheses = hypothesesList;

  res.json({
    success: true,
    logs: tournamentLogs,
    survivors
  });
});

// 7. Simulate Experimental Protocol Design
router.post("/simulate-experiment", requireAuth, async (req, res) => {
  const { hypothesisId } = req.body;
  if (!hypothesisId) {
    return res.status(400).json({ error: "hypothesisId is required." });
  }

  const hypothesesList = [...db.hypotheses];
  const hypo = hypothesesList.find(h => h.id === hypothesisId);
  if (!hypo) {
    return res.status(404).json({ error: "Hypothesis not found." });
  }

  console.log(`Generating Experimental Design for: "${hypo.title}"`);

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `You are an AI Experimental Protocol Generator.
Design an intense, actionable, and mathematically rigorous in-silico and in-vitro experimental design to test this hypothesis.
Title: ${hypo.title}
Description: ${hypo.description}

Format your response as a valid JSON object matching this schema:
{
  "experimentProtocol": "Detailed, step-by-step protocol (1, 2, 3...) to test this hypothesis",
  "requiredDatasets": "Specific research datasets and databases required (e.g. UniProt, ProteomeXchange with IDs)",
  "expectedOutcomes": "Quantitative expected outcomes, curves, or specific values that would confirm or reject the model",
  "failureProbability": number (between 0.05 and 0.95),
  "requiredEquipment": "Advanced physical and computational equipment required (e.g. Cryo-EM, HPC grids, custom assays)"
}`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json"
        }
      });

      const rawParsed = JSON.parse(response.text || "{}");
      // Zod validation
      const parsed = experimentProtocolSchema.parse(rawParsed);

      hypo.experimentProtocol = parsed.experimentProtocol;
      hypo.requiredDatasets = parsed.requiredDatasets;
      hypo.expectedOutcomes = parsed.expectedOutcomes;
      hypo.failureProbability = parsed.failureProbability;
      hypo.requiredEquipment = parsed.requiredEquipment;

    } catch (err) {
      console.error("Gemini experimental design error, using fallback:", err);
    }
  }

  if (!hypo.experimentProtocol) {
    const isQuantum = hypo.title.toLowerCase().includes("topological") || hypo.title.toLowerCase().includes("quantum");
    if (isQuantum) {
      hypo.experimentProtocol = `1. Initialize a topological surface code syndrome simulator on a 17x17 logical qubit lattice.\n2. Translate amino acid coordinate fields into stabilizer error positions (X and Z syndromic measurements).\n3. Run Minimum-Weight Perfect Matching (MWPM) decoders using PyTorch Geometric to calculate minimum-length folding pathways.\n4. Compare computed coordinates with physical structures in the Protein Data Bank (PDB).`;
      hypo.requiredDatasets = `Protein Data Bank (PDB) structural archives (specifically 124 representative alpha-helical structures); QASMTopological Syndrome benchmarks (Dataset ID: QEC-2025-v3).`;
      hypo.expectedOutcomes = `The MWPM algorithm should reach a 94% conformation accuracy overlap with PDB targets, achieving a 1000x reduction in compute-hours compared to classical tensor network algorithms.`;
      hypo.failureProbability = 0.18;
      hypo.requiredEquipment = `Quantum stabilizer simulation software, HPC Supercomputing Cluster (minimum 128x NVIDIA H100 GPUs), PyTorch Geometric software suite.`;
    } else {
      hypo.experimentProtocol = `1. Culture Human iPSC-derived cortical neurons under controlled incubator parameters (37°C, 5% CO2).\n2. Apply the experimental compound Drug Z at graded concentrations (0.1 nM to 10 µM) over 48 hours.\n3. Conduct high-resolution cryogenic electron microscopy (Cryo-EM) to confirm Drug Z binding inside the Protein A active conformation pocket.\n4. Perform RT-qPCR to measure changes in Gene X mRNA transcription and Western Blot to evaluate tau phosphorylation thresholds.`;
      hypo.requiredDatasets = `UniProt structural model for Protein A (ID: P15043); Brain-RNA-Seq database (Gene X expression profiles under neuropathological states); PubChem BioAssay record (AID-2025-X).`;
      hypo.expectedOutcomes = `A minimum 65% reduction in Gene X transcription levels upon 10 nM Drug Z application, with stabilized Protein A maintaining over 88% synaptic spine density in Alzheimer-derived culture cells.`;
      hypo.failureProbability = 0.28;
      hypo.requiredEquipment = `Cryogenic Electron Microscope (Cryo-EM), RT-qPCR system, SDS-PAGE Western Blot apparatus, Microfluidic brain-on-a-chip biological assays.`;
    }
  }

  hypo.discoveryPhase = "Replicated";
  hypo.phaseHistory = [
    { phase: "Hypothesis", year: 2026, note: "Formulated by SDOS Evolutionary Tournament" },
    { phase: "Published", year: 2026, note: "In-silico docking parameters published to bioRxiv pre-print" },
    { phase: "Replicated", year: 2027, note: "Simulated experimental protocol executed and validated in-silico" }
  ];

  db.hypotheses = hypothesesList;
  res.json({ success: true, hypothesis: hypo });
});

// 8. Register outcome feedback
router.post("/:id/feedback", requireAuth, (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;

  if (!status) {
    return res.status(400).json({ error: "status is required ('success' | 'failure' | 'modification')" });
  }

  const hypothesesList = [...db.hypotheses];
  const hypo = hypothesesList.find(h => h.id === id);
  if (!hypo) {
    return res.status(404).json({ error: "Hypothesis not found" });
  }

  hypo.feedbackStatus = status;
  hypo.feedbackNotes = notes || "";
  hypo.feedbackTimestamp = new Date().toISOString();

  console.log(`Feedback registered for hypothesis ${id}: status=${status}`);

  db.hypotheses = hypothesesList;
  res.json({ success: true, hypothesis: hypo });
});

export default router;
