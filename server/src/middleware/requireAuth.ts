import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/AppError";
import { sessionCookie, verifySession } from "../utils/jwt";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { userId: number; role: "STUDENT" | "ADMIN" };
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  // Web admin dashboard: httpOnly cookie. Mobile app: Authorization header,
  // since cookie persistence isn't reliable enough across iOS/Android to
  // depend on alone (see Phase 5 notes).
  const bearer = req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.slice("Bearer ".length)
    : undefined;
  const token = bearer ?? req.cookies?.[sessionCookie.name];
  if (!token) {
    return next(new AppError("You need to be logged in", 401, "UNAUTHENTICATED"));
  }
  try {
    req.user = verifySession(token);
    next();
  } catch {
    next(new AppError("Your session has expired — please log in again", 401, "UNAUTHENTICATED"));
  }
}

export function requireAdmin(req: Request, _res: Response, next: NextFunction) {
  if (req.user?.role !== "ADMIN") {
    return next(new AppError("Admin access required", 403, "FORBIDDEN"));
  }
  next();
}
