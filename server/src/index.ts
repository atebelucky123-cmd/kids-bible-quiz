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

// Falling back to `origin: true` here would reflect *any* request's Origin
// header and allow it — combined with credentials: true, that lets any
// website make authenticated requests using a visitor's session cookie.
// Falling back to the same origins .env.example documents keeps local dev
// working unconfigured while never silently opening the API to the world.
const DEFAULT_CORS_ORIGINS = ["http://localhost:8081", "http://localhost:5173"];
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(",") ?? DEFAULT_CORS_ORIGINS, credentials: true }));
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
