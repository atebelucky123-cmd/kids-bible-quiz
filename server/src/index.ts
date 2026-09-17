import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { prisma } from "./lib/prisma";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Phase 1 scope: a single health-check route to prove the server boots and
// can reach the database. Auth/quiz/admin routes are built in later phases.
app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: "ok", database: "connected" });
  } catch (err) {
    res.status(503).json({ status: "error", database: "unreachable" });
  }
});

app.listen(PORT, () => {
  console.log(`Kids Bible Quiz API listening on http://localhost:${PORT}`);
});
