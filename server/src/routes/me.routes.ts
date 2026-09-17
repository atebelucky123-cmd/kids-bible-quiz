import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { me } from "../controllers/auth.controller";
import { getAttempts } from "../controllers/me.controller";

export const meRouter = Router();

// GET /api/me returns the same shape as GET /api/auth/me — reusing that
// controller rather than duplicating the "load user, strip password hash"
// logic (spec Section 19 lists both endpoints; they serve the same purpose).
meRouter.get("/", requireAuth, me);
meRouter.get("/attempts", requireAuth, getAttempts);
