import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import {
  startQuizSchema,
  attemptParamsSchema,
  submitAnswerSchema,
  skipQuestionSchema,
} from "../validators/quiz.validators";
import { start, getQuestion, answer, skip, quit, result, availableQuizzes } from "../controllers/quiz.controller";

export const quizRouter = Router();

// Must come before "/:attemptId" so Express doesn't treat "available" as an attemptId.
quizRouter.get("/available", requireAuth, availableQuizzes);
quizRouter.post("/start", requireAuth, validate({ body: startQuizSchema }), start);
quizRouter.get("/:attemptId", requireAuth, validate({ params: attemptParamsSchema }), getQuestion);
quizRouter.post(
  "/:attemptId/answer",
  requireAuth,
  validate({ params: attemptParamsSchema, body: submitAnswerSchema }),
  answer
);
// Also used when a question's timer runs out.
quizRouter.post(
  "/:attemptId/skip",
  requireAuth,
  validate({ params: attemptParamsSchema, body: skipQuestionSchema }),
  skip
);
quizRouter.post("/:attemptId/quit", requireAuth, validate({ params: attemptParamsSchema }), quit);
// No POST /complete — answering, skipping or quitting already finalizes the
// attempt (see the comment above getResult() in quiz.service.ts).
quizRouter.get("/:attemptId/result", requireAuth, validate({ params: attemptParamsSchema }), result);
