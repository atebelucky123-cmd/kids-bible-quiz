import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth } from "../middleware/requireAuth";
import {
  startQuizSchema,
  attemptParamsSchema,
  submitAnswerSchema,
  skipQuestionSchema,
  pastQuestionParamsSchema,
} from "../validators/quiz.validators";
import {
  start,
  getQuestion,
  answer,
  skip,
  quit,
  result,
  availableQuizzes,
  pastQuestion,
  answerPast,
  timeoutPast,
} from "../controllers/quiz.controller";

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
// Earlier questions (the app's Previous button), addressed by position in the quiz.
quizRouter.get(
  "/:attemptId/questions/:position",
  requireAuth,
  validate({ params: pastQuestionParamsSchema }),
  pastQuestion
);
quizRouter.post(
  "/:attemptId/questions/:position/answer",
  requireAuth,
  validate({ params: pastQuestionParamsSchema, body: submitAnswerSchema }),
  answerPast
);
quizRouter.post(
  "/:attemptId/questions/:position/timeout",
  requireAuth,
  validate({ params: pastQuestionParamsSchema }),
  timeoutPast
);
quizRouter.post("/:attemptId/quit", requireAuth, validate({ params: attemptParamsSchema }), quit);
// No POST /complete — answering, skipping or quitting already finalizes the
// attempt (see the comment above getResult() in quiz.service.ts).
quizRouter.get("/:attemptId/result", requireAuth, validate({ params: attemptParamsSchema }), result);
