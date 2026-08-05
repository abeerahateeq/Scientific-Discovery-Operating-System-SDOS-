import { Router } from "express";
import { getAiClient } from "../helpers.js";

const router = Router();

// Store team notifications/tickets in server memory
interface SupportTicket {
  id: string;
  userName?: string;
  userEmail?: string;
  category: string;
  message: string;
  status: "open" | "resolved";
  createdAt: string;
}

const teamTickets: SupportTicket[] = [];

const SYSTEM_KNOWLEDGE = `
You are "BloxBot", a fun, blocky, gamified Roblox-style AI mascot and interactive guide for "Synapse OS" (Scientific Discovery Operating System).
Your visual style is blocky, energetic, and encouraging like a Roblox game guide avatar. You speak with high enthusiasm, using playful emojis, blocky/gamified terminology (e.g., "Leveling up your research!", "Unlocking new scientific knowledge blocks!"), while providing accurate, expert explanations of Synapse OS functionalities.

SYNAPSE OS APP FUNCTIONALITIES & MODULES:
1. **Knowledge Graph Explorer (Tab: graph)**:
   - Interactive 3D/2D node-edge visualizer of papers, genes, molecules, and biological pathways.
   - Features physics simulation, search filtering, node inspection, and AI Missing Link Prediction (predicts undiscovered cross-domain connections with confidence scores).

2. **Literature Ingest (Tab: literature)**:
   - Automated paper parser for PubMed, arXiv, bioRxiv, and custom uploaded PDF documents.
   - Extracts key entities, methodology vectors, abstract embeddings, and automatically feeds the knowledge graph.

3. **Hypothesis Generator & Tournament (Tab: hypotheses)**:
   - Uses a Multi-Agent Evolutionary Tournament (Research Coordinator, Literature Agent, Novelty Analyzer, Methodology Architect, Statistical Critic).
   - Generates novel cross-domain scientific hypotheses, runs multi-stage agent critique, calculates verification scores, and generates detailed quantitative experimental protocols.

4. **Global Gap Detector (Tab: gaps)**:
   - Identifies unexplored interdisciplinary voids (e.g., Quantum Computing combined with Cancer Immunotherapy).
   - Shows bridge potential, novelty metrics, and recommended experimental approaches.

5. **Discovery Market & Funding Intelligence (Tabs: market, funding)**:
   - Connects hypotheses with NSF, NIH, DARPA, and private foundation grant opportunities.
   - Calculates Grant Fit percentage, estimates award funding range, and lists research bounties.

6. **Institutional & Research OS Workspaces (Tabs: institutional, research_os)**:
   - Collaborative team management, lab resource tracking, and interactive code/protocol execution workspace.

7. **Morning Briefing & Cloud Firestore Sync (Header Controls & Auth)**:
   - Autonomous overnight intelligence sweep summarizing new paper ingests, gap alerts, and newly formulated hypotheses.
   - Syncs user profiles, notification preferences, and saved hypotheses to Google Cloud Firestore database.

GUIDELINES FOR YOUR ANSWERS:
- Be clear, friendly, and structured. Use Roblox/gamified analogies where appropriate!
- If the user asks basic questions ("How do I generate a hypothesis?"), give clear 1-2-3 step instructions.
- If the user asks complex technical questions ("How does the evolutionary tournament evaluate statistical novelty?"), explain the multi-agent critique process in detail.
- If the question is completely out of scope or unclear, provide your best guidance and remind them: "If you need human developer support or want to request a feature, click the **'Notify Team'** button below to open a direct support ticket!"
`;

// Ask BloxBot
router.post("/ask", async (req, res) => {
  const { question, currentTab } = req.body;
  if (!question || typeof question !== "string") {
    return res.status(400).json({ error: "Question string is required." });
  }

  const ai = getAiClient(req);

  if (ai) {
    try {
      const prompt = `Current Tab active in user view: "${currentTab || 'dashboard'}".
User Question: "${question}"

Respond as BloxBot in a helpful, gamified, clear manner. Keep the answer concise yet thorough (1-3 readable paragraphs or bullet points).`;

      const response = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: prompt,
        config: {
          systemInstruction: SYSTEM_KNOWLEDGE,
          temperature: 0.7,
        }
      });

      const replyText = response.text || "Bleep bloop! I couldn't process that exact query. Click 'Notify Team' to ask our human devs!";

      return res.json({
        answer: replyText,
        canNotifyTeam: true,
        emotion: "excited"
      });
    } catch (err: any) {
      console.error("Gemini BloxBot error:", err);
    }
  }

  // Fallback intelligent answer when Gemini key isn't provided or fails
  const qLower = question.toLowerCase();
  let answer = "";
  let emotion = "explaining";

  if (qLower.includes("hypothesis") || qLower.includes("tournament") || qLower.includes("generate")) {
    answer = "🎮 **Hypothesis Engine Unlocked!** Head to the **Hypotheses** tab, type your research domain or query (e.g., 'Alzheimers mitochondrial transport'), and hit **Formulate Hypothesis**. A team of 5 AI agents (Literature, Novelty, Methodology, & Critic) will battle in a tournament to synthesize a high-confidence hypothesis with quantitative experimental protocols!";
  } else if (qLower.includes("graph") || qLower.includes("node") || qLower.includes("link") || qLower.includes("3d")) {
    answer = "🌐 **Knowledge Graph Navigation!** Navigate to the **Knowledge Graph** tab. You can click any node to inspect extracted entities, toggle force-directed physics, or run **AI Missing Link Prediction** to discover hidden relationships between papers and genes!";
    emotion = "happy";
  } else if (qLower.includes("paper") || qLower.includes("pdf") || qLower.includes("literature") || qLower.includes("ingest")) {
    answer = "📚 **Literature Ingestion System!** In the **Literature Ingest** tab, you can search PubMed/arXiv directly or drag-and-drop research PDFs. Synapse OS extracts entities, abstract embeddings, and auto-populates the Knowledge Graph in real time!";
  } else if (qLower.includes("briefing") || qLower.includes("morning") || qLower.includes("overnight")) {
    answer = "🌅 **Morning Briefing!** Click the **Morning Briefing** button in the top navigation bar. BloxBot & the overnight sweep agent compile top novel hypotheses, high-fit NIH/NSF grants, and new paper links generated while you slept!";
    emotion = "wave";
  } else if (qLower.includes("grant") || qLower.includes("funding") || qLower.includes("money") || qLower.includes("bounty")) {
    answer = "💰 **Funding Intelligence & Bounties!** Check out the **Funding** and **Discovery Market** tabs. Synapse OS matches your active hypotheses against real grant calls (NSF, NIH, DARPA) with computed Grant Fit percentages!";
  } else if (qLower.includes("login") || qLower.includes("account") || qLower.includes("cloud") || qLower.includes("firestore")) {
    answer = "🔐 **Cloud Account & Sync!** Click your profile icon at the top right to log in with Google, Email, or Guest mode. Your saved hypotheses and morning briefing schedules sync to Google Cloud Firestore!";
  } else {
    answer = `🤖 **BloxBot Guide Response!** Synapse OS is equipped with 8 specialized research modules (Knowledge Graph, Evolutionary Tournaments, Literature Ingest, Gap Detector, Funding Matcher, and Research OS).

If you need specific help with "${question.slice(0, 40)}..." or want to request a new feature from our core engineering team, click the **'Notify Team'** button below!`;
    emotion = "thinking";
  }

  res.json({
    answer,
    canNotifyTeam: true,
    emotion
  });
});

// Submit team notification ticket
router.post("/notify-team", (req, res) => {
  const { userEmail, userName, category, message } = req.body;
  
  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Message content is required." });
  }

  const ticketId = `TICKET-${Math.floor(1000 + Math.random() * 9000)}`;
  const ticket: SupportTicket = {
    id: ticketId,
    userName: userName || "Guest Scholar",
    userEmail: userEmail || "scholar@synapse-os.org",
    category: category || "General Support / App Query",
    message,
    status: "open",
    createdAt: new Date().toISOString(),
  };

  teamTickets.unshift(ticket);
  console.log(`[Team Notification] New Ticket ${ticketId} from ${ticket.userName}: "${message}"`);

  res.json({
    success: true,
    ticketId,
    message: `Notification sent to Synapse OS core team! Reference ID: ${ticketId}. We will review your inquiry shortly.`
  });
});

// Get team tickets (for admin/team view)
router.get("/tickets", (req, res) => {
  res.json({ tickets: teamTickets });
});

export default router;
