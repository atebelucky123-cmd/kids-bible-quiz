import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import { startQuizSchema, attemptParamsSchema, submitAnswerSchema } from "../validators/quiz.validators";
import { start, getQuestion, answer, result } from "../controllers/quiz.controller";

export const quizRouter = Router();

quizRouter.post("/start", requireAuth, validate({ body: startQuizSchema }), start);
quizRouter.get("/:attemptId", requireAuth, validate({ params: attemptParamsSchema }), getQuestion);
quizRouter.post(
  "/:attemptId/answer",
  requireAuth,
  validate({ params: attemptParamsSchema, body: submitAnswerSchema }),
  answer
);
// No POST /complete — see the comment above getResult() in quiz.service.ts
// for why finalizing already happens inside submitAnswer.
quizRouter.get("/:attemptId/result", requireAuth, validate({ params: attemptParamsSchema }), result);
