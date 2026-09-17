import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { register, login, logout, me } from "../controllers/auth.controller";

export const authRouter = Router();

authRouter.post("/register", validate({ body: registerSchema }), register);
authRouter.post("/login", validate({ body: loginSchema }), login);
authRouter.post("/logout", logout);
authRouter.get("/me", requireAuth, me);
