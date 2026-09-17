import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { startQuizSchema, attemptParamsSchema, submitAnswerSchema } from "../validators/quiz.validators";
import { start, getQuestion, answer } from "../controllers/quiz.controller";

// Scoring/results (complete + result endpoints) are implemented in
// Phase 9 (Scoring & Results).
export const quizRouter = Router();

quizRouter.post("/start", requireAuth, validate({ body: startQuizSchema }), start);
quizRouter.get("/:attemptId", requireAuth, validate({ params: attemptParamsSchema }), getQuestion);
quizRouter.post(
  "/:attemptId/answer",
  requireAuth,
  validate({ params: attemptParamsSchema, body: submitAnswerSchema }),
  answer
);
