import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { sessionCookie } from "../utils/jwt";
import { registerUser, loginUser, toPublicUser } from "../services/auth.service";

// The web admin dashboard relies on the httpOnly cookie alone (never touches
// the token directly). The mobile app can't rely on cookie persistence
// working consistently across iOS/Android, so it also gets the raw token in
// the response body to store itself (in the device keychain via
// expo-secure-store) and send back as `Authorization: Bearer <token>`.
// requireAuth accepts either.
export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await registerUser(req.body);
    res.cookie(sessionCookie.name, token, sessionCookie.options);
    res.status(201).json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await loginUser(req.body);
    res.cookie(sessionCookie.name, token, sessionCookie.options);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export async function logout(_req: Request, res: Response) {
  res.clearCookie(sessionCookie.name, sessionCookie.options);
  res.status(204).send();
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    const user = await prisma.user.findUnique({ where: { id: req.user!.userId } });
    if (!user) {
      throw new AppError("User not found", 404, "NOT_FOUND");
    }
    res.json({ user: toPublicUser(user) });
  } catch (err) {
    next(err);
  }
}
