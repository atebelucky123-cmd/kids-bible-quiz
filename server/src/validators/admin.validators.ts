import { z } from "zod";
import { passwordSchema } from "./auth.validators";

const answerOptionSchema = z.enum(["A", "B", "C", "D"]);

const ageRangeRefinement = <T extends { ageMin?: number; ageMax?: number }>(data: T, ctx: z.RefinementCtx) => {
  if (data.ageMin !== undefined && data.ageMax !== undefined && data.ageMin > data.ageMax) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Minimum age cannot be greater than maximum age",
      path: ["ageMin"],
    });
  }
};

export const createQuestionSchema = z
  .object({
    questionText: z.string().trim().min(1, "Question text is required").max(1000),
    optionA: z.string().trim().min(1, "Option A is required").max(255),
    optionB: z.string().trim().min(1, "Option B is required").max(255),
    optionC: z.string().trim().min(1, "Option C is required").max(255),
    optionD: z.string().trim().min(1, "Option D is required").max(255),
    correctOption: answerOptionSchema,
    ageMin: z.coerce.number().int().min(5).max(12),
    ageMax: z.coerce.number().int().min(5).max(12),
    isActive: z.boolean().optional(),
  })
  .superRefine(ageRangeRefinement);

// Every field optional (a PATCH may only toggle `isActive`), but age bounds
// are still cross-checked when both happen to be present in the same request.
export const updateQuestionSchema = z
  .object({
    questionText: z.string().trim().min(1).max(1000).optional(),
    optionA: z.string().trim().min(1).max(255).optional(),
    optionB: z.string().trim().min(1).max(255).optional(),
    optionC: z.string().trim().min(1).max(255).optional(),
    optionD: z.string().trim().min(1).max(255).optional(),
    correctOption: answerOptionSchema.optional(),
    ageMin: z.coerce.number().int().min(5).max(12).optional(),
    ageMax: z.coerce.number().int().min(5).max(12).optional(),
    isActive: z.boolean().optional(),
  })
  .superRefine(ageRangeRefinement);

export const questionIdParamsSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const attemptsQuerySchema = z.object({
  status: z.enum(["IN_PROGRESS", "FINISHED"]).optional(),
  search: z.string().trim().max(200).optional(),
});

export const changeAdminPasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: passwordSchema,
});
