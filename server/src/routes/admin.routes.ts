import { Router } from "express";
import { validate } from "../middleware/validate";
import { requireAuth, requireAdmin } from "../middleware/requireAuth";
import {
  createQuestionSchema,
  updateQuestionSchema,
  questionIdParamsSchema,
  attemptsQuerySchema,
  changeAdminPasswordSchema,
} from "../validators/admin.validators";
import * as admin from "../controllers/admin.controller";

export const adminRouter = Router();

// Every route below is admin-only. Login itself reuses POST /api/auth/login
// (spec Section 19 lists a separate admin login, but the seeded admin is
// just a User row with role ADMIN — the existing first-name+password flow
// already returns a token whose role this middleware checks).
adminRouter.use(requireAuth, requireAdmin);

adminRouter.get("/overview", admin.overview);

adminRouter.get("/questions", admin.listQuestions);
adminRouter.post("/questions", validate({ body: createQuestionSchema }), admin.createQuestion);
adminRouter.patch(
  "/questions/:id",
  validate({ params: questionIdParamsSchema, body: updateQuestionSchema }),
  admin.updateQuestion
);
adminRouter.delete("/questions/:id", validate({ params: questionIdParamsSchema }), admin.deleteQuestion);

adminRouter.get("/students", admin.listStudents);

adminRouter.get("/attempts", validate({ query: attemptsQuerySchema }), admin.listAttempts);

adminRouter.patch("/me/password", validate({ body: changeAdminPasswordSchema }), admin.changePassword);
