import { Router } from "express";

const router = Router();

router.post("/verify", (req, res) => {
  const { passcode } = req.body;
  const expectedPasscode = process.env.APP_PASSCODE || "sdos-secret-2026";
  if (passcode === expectedPasscode) {
    return res.json({ success: true });
  }
  return res.status(401).json({ error: "Invalid passcode" });
});

export default router;
