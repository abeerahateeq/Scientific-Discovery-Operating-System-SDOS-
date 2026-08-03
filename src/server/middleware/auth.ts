import { Request, Response, NextFunction } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const expectedPasscode = process.env.APP_PASSCODE || "sdos-secret-2026";
  
  const authHeader = req.headers.authorization;
  if (authHeader) {
    const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : authHeader;
    if (token !== expectedPasscode) {
      return res.status(401).json({ error: "Unauthorized. Invalid passcode." });
    }
  }
  
  next();
}

