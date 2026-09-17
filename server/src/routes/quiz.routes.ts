import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { startQuizSchema, attemptParamsSchema } from "../validators/quiz.validators";
import { start, getQuestion } from "../controllers/quiz.controller";

// Answer submission and scoring/results are implemented in Phase 8
// (Answering & Progress Persistence) and Phase 9 (Scoring & Results).
export const quizRouter = Router();

quizRouter.post("/start", requireAuth, validate({ body: startQuizSchema }), start);
quizRouter.get("/:attemptId", requireAuth, validate({ params: attemptParamsSchema }), getQuestion);
