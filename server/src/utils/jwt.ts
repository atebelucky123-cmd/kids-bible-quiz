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

const isProduction = process.env.NODE_ENV === "production";

export const sessionCookie = {
  name: SESSION_COOKIE_NAME,
  options: {
    httpOnly: true,
    secure: isProduction,
    // The admin dashboard (Vercel) and this API (Render) are on genuinely
    // different domains in production — a real cross-site request, not
    // just cross-port like local dev. SameSite=Lax cookies are never sent
    // on cross-site fetch/XHR (only top-level navigation), so the cookie
    // would silently get dropped on every request after login. None
    // requires Secure, which is only true in production (HTTPS); locally,
    // both the API and admin dev server share "localhost", so Lax already
    // works there and doesn't need the broader None.
    sameSite: (isProduction ? "none" : "lax") as "none" | "lax",
    maxAge: SESSION_MAX_AGE_MS,
  },
};
