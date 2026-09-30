import { z } from "zod";

export const startQuizSchema = z.object({
  quizId: z.coerce.number().int().positive(),
  // "Start a New Quiz" on the Home screen (approved UI design, Appendix C)
  // abandons the current in-progress attempt rather than resuming it.
  restart: z.boolean().optional().default(false),
});

export const attemptParamsSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
});

export const submitAnswerSchema = z.object({
  selectedOption: z.enum(["A", "B", "C", "D"]),
});

export const skipQuestionSchema = z.object({
  questionId: z.coerce.number().int().positive(),
});
