import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { healthRouter } from "./routes/health.routes";
import { authRouter } from "./routes/auth.routes";
import { meRouter } from "./routes/me.routes";
import { quizRouter } from "./routes/quiz.routes";
import { adminRouter } from "./routes/admin.routes";
import { notFound } from "./middleware/notFound";
import { errorHandler } from "./middleware/errorHandler";

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

app.use("/api/health", healthRouter);
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/quiz", quizRouter);
app.use("/api/admin", adminRouter);

// Must be last: 404 for anything unmatched, then the central error handler.
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Kids Bible Quiz API listening on http://localhost:${PORT}`);
});
