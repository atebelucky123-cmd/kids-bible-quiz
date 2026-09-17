import jwt from "jsonwebtoken";

const SECRET: string =
  process.env.SESSION_SECRET ??
  (() => {
    throw new Error("SESSION_SECRET is not set — check your .env file.");
  })();

export type SessionPayload = {
  userId: number;
  role: "STUDENT" | "ADMIN";
};

const SESSION_COOKIE_NAME = "session";
const SESSION_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export function signSession(payload: SessionPayload): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" });
}

export function verifySession(token: string): SessionPayload {
  return jwt.verify(token, SECRET) as SessionPayload;
}

export const sessionCookie = {
  name: SESSION_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: SESSION_MAX_AGE_MS,
  },
};
