import { Request, Response } from "express";

// Catches any request that didn't match a route, keeping 404s in the same
// JSON error shape as everything else instead of Express's default HTML page.
export function notFound(req: Request, res: Response) {
  res.status(404).json({
    error: { message: `No route for ${req.method} ${req.path}`, code: "NOT_FOUND" },
  });
}
