import { Router } from "express";
import { db } from "../../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { findShortestPath } from "../helpers.js";
import { GoogleGenAI } from "@google/genai";

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

// 1. Get entire Knowledge Graph
router.get("/", requireAuth, (req, res) => {
  const allNodes = [...db.nodes];
  const allLinks = [...db.links];

  db.papers.forEach(p => {
    const paperNodeId = `paper-node-${p.id}`;
    if (!allNodes.some(n => n.id === paperNodeId)) {
      allNodes.push({
        id: paperNodeId,
        label: p.title,
        group: "paper",
        val: 20,
        description: `Scientific Paper published in ${p.journal} (${p.year}). Abstract: ${p.abstract}`
      });
    }

    // Add edge from paper to concepts (mentions)
    p.entitiesExtracted.forEach(entName => {
      const targetNode = db.nodes.find(n => n.label.toLowerCase() === entName.toLowerCase());
      if (targetNode) {
        allLinks.push({
          id: `link-paper-mentions-${p.id}-${targetNode.id}`,
          source: paperNodeId,
          target: targetNode.id,
          relationship: "mentions",
          confidence: 0.95,
          evidencePaperIds: [p.id]
        });
      }
    });

    // Add authors
    const authorList = p.authors.split(",").map(a => a.trim());
    authorList.forEach(authorName => {
      const authorNodeId = `author-node-${authorName.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
      if (!allNodes.some(n => n.id === authorNodeId)) {
        allNodes.push({
          id: authorNodeId,
          label: authorName,
          group: "author",
          val: 18,
          description: `Researcher / Author of ${p.title}.`
        });
      }

      allLinks.push({
        id: `link-author-authored-${authorNodeId}-${p.id}`,
        source: authorNodeId,
        target: paperNodeId,
        relationship: "related to",
        confidence: 0.99,
        evidencePaperIds: [p.id]
      });
    });

    // Add references (cites)
    if (p.references && Array.isArray(p.references)) {
      p.references.forEach((ref, idx) => {
        const refId = `ref-node-${p.id}-${idx}`;
        if (!allNodes.some(n => n.id === refId)) {
          allNodes.push({
            id: refId,
            label: ref.title,
            group: "paper",
            val: 12,
            description: `Cited bibliography citation: "${ref.title}" by ${ref.authors} in ${ref.journal} (${ref.year || "unknown"}).`
          });
        }
        allLinks.push({
          id: `link-paper-cites-${p.id}-${refId}`,
          source: paperNodeId,
          target: refId,
          relationship: "cites",
          confidence: 0.90,
          evidencePaperIds: [p.id]
        });
      });
    }
  });

  res.json({ nodes: allNodes, links: allLinks });
});

// 2. Relationship Discovery Path Engine
router.post("/discover", requireAuth, async (req, res) => {
  const { sourceId, targetId } = req.body;
  if (!sourceId || !targetId) {
    return res.status(400).json({ error: "sourceId and targetId are required." });
  }

  const pathNodeIds = findShortestPath(sourceId, targetId, db.nodes, db.links);
  if (!pathNodeIds) {
    return res.json({ 
      path: [], 
      connections: [], 
      geminiExplanation: "No indirect connection path was found between these nodes in the current database. Try ingesting more papers to expand the scientific graph." 
    });
  }

  const pathNodes = pathNodeIds.map(id => db.nodes.find(n => n.id === id)!);
  const pathConnections: any[] = [];
  
  for (let i = 0; i < pathNodeIds.length - 1; i++) {
    const u = pathNodeIds[i];
    const v = pathNodeIds[i + 1];
    const link = db.links.find(l => {
      const s = typeof l.source === 'string' ? l.source : (l.source as any).id;
      const t = typeof l.target === 'string' ? l.target : (l.target as any).id;
      return (s === u && t === v) || (s === v && t === u);
    });
    
    if (link) {
      pathConnections.push({
        source: db.nodes.find(n => n.id === (typeof link.source === 'string' ? link.source : (link.source as any).id))!.label,
        target: db.nodes.find(n => n.id === (typeof link.target === 'string' ? link.target : (link.target as any).id))!.label,
        relationship: link.relationship,
        confidence: link.confidence
      });
    }
  }

  let explanation = "";
  const ai = getAiClient();
  if (ai) {
    try {
      const pathDescriptionStr = pathNodes.map((n, idx) => {
        const nextConn = pathConnections[idx];
        return `${n.label} (${n.group})${nextConn ? ` --[${nextConn.relationship}]--> ` : ""}`;
      }).join("");

      const prompt = `You are a Senior Scientist and AI Research Coordinator.
Explain the potential scientific significance of this discovered indirect connection chain. Synthesize an explainable, evidence-backed interdisciplinary hypothesis.
The path is:
${pathDescriptionStr}

Details on nodes:
${pathNodes.map(n => `- ${n.label}: ${n.description}`).join("\n")}

Be highly professional, informative, and detailed. Highlight potential cross-domain breakthroughs, Confidence assessment, and possible biological/computational validation approaches.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt
      });

      explanation = response.text || "Failed to generate explanation.";
    } catch (err) {
      console.error("Gemini path explanation error, falling back:", err);
      explanation = `Connection synthesized. The pathway bridges ${pathNodes[0].label} and ${pathNodes[pathNodes.length - 1].label} through a series of ${pathNodes.length - 1} biological/computational hops. This represents a prime target for interdisciplinary synthesis.`;
    }
  } else {
    // Simulated discovery report
    explanation = `### Path Synthesis Report
This pathway establishes a highly promising interdisciplinary bridge between **${pathNodes[0].label}** (${pathNodes[0].group}) and **${pathNodes[pathNodes.length-1].label}** (${pathNodes[pathNodes.length-1].group}).

#### Key Scientific Analogies & Bridges:
1. **Biological Mechanism**: The pathway travels through **${pathNodes.slice(1, -1).map(n => n.label).join(", ")}**, connecting distinct mechanistic levels.
2. **Confidence Bounds**: Based on individual edge weights, the compound confidence for this path is **${Math.round(pathConnections.reduce((acc, c) => acc * c.confidence, 1) * 100)}%**.
3. **Hypothesis**: By leveraging the mathematical similarities or mechanistic links between these nodes, we can target therapeutic bottlenecks. Specifically, using computational methods modeled from ${pathNodes[1]?.label || "quantum physics"} can optimize drug design or genetic modeling associated with ${pathNodes[pathNodes.length-1].label}.`;
  }

  res.json({
    path: pathNodes.map(n => n.label),
    connections: pathConnections,
    geminiExplanation: explanation
  });
});

export default router;
