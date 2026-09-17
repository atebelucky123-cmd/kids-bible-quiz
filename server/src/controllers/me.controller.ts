import { Request, Response, NextFunction } from "express";
import { getAttemptsSummary } from "../services/me.service";

export async function getAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    const summary = await getAttemptsSummary(req.user!.userId);
    res.json(summary);
  } catch (err) {
    next(err);
  }
}
