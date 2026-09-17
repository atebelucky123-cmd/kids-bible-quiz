import { Router } from "express";

// Endpoints (register, login, logout, me) are implemented in Phase 4 —
// Authentication & User Registration. Mounted now so the route structure
// and prefix (/api/auth) are settled before that phase adds handlers.
export const authRouter = Router();
