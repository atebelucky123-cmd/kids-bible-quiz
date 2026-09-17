import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { sessionCookie } from "../utils/jwt";
import { registerUser, loginUser, toPublicUser } from "../services/auth.service";

export async function register(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await registerUser(req.body);
    res.cookie(sessionCookie.name, token, sessionCookie.options);
    res.status(201).json({ user });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const { user, token } = await loginUser(req.body);
    res.cookie(sessionCookie.name, token, sessionCookie.options);
    res.json({ user });
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
