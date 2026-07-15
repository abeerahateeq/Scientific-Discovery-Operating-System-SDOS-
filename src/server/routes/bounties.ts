import { Router } from "express";
import { db } from "../../lib/db.js";
import { requireAuth } from "../middleware/auth.js";
import { Bounty } from "../../types.js";

const router = Router();

// 1. Get all bounties
router.get("/", requireAuth, (req, res) => {
  res.json(db.bounties);
});

// 2. Create new bounty
router.post("/", requireAuth, (req, res) => {
  const { title, description, reward, discipline } = req.body;
  if (!title || !description || !reward || !discipline) {
    return res.status(400).json({ error: "Missing required bounty fields." });
  }

  const newBounty: Bounty = {
    id: `bounty-${Date.now()}`,
    title,
    description,
    reward,
    discipline,
    status: "open",
    createdAt: new Date().toISOString()
  };

  const bountiesList = [...db.bounties];
  bountiesList.push(newBounty);
  db.bounties = bountiesList;

  res.json({ success: true, bounty: newBounty });
});

// 3. Claim bounty by linking a hypothesis
router.post("/claim", requireAuth, (req, res) => {
  const { bountyId, hypothesisId } = req.body;
  if (!bountyId || !hypothesisId) {
    return res.status(400).json({ error: "bountyId and hypothesisId are required." });
  }

  const bountiesList = [...db.bounties];
  const bountyIndex = bountiesList.findIndex(b => b.id === bountyId);
  if (bountyIndex === -1) {
    return res.status(404).json({ error: "Bounty not found." });
  }

  const hypothesesList = [...db.hypotheses];
  const hypothesis = hypothesesList.find(h => h.id === hypothesisId);
  if (!hypothesis) {
    return res.status(404).json({ error: "Hypothesis not found." });
  }

  const bounty = bountiesList[bountyIndex];
  bounty.status = "completed";
  bounty.linkedHypothesisId = hypothesisId;

  db.bounties = bountiesList;
  res.json({ success: true, bounty });
});

export default router;
