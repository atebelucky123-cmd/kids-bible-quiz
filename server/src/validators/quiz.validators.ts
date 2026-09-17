import { z } from "zod";

export const startQuizSchema = z.object({
  // "Start a New Quiz" on the Home screen (approved UI design, Appendix C)
  // abandons the current in-progress attempt rather than resuming it.
  restart: z.boolean().optional().default(false),
});

export const attemptParamsSchema = z.object({
  attemptId: z.coerce.number().int().positive(),
});
