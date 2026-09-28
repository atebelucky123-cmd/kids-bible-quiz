import { Request, Response, NextFunction } from "express";
import * as adminService from "../services/admin.service";

export async function overview(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminService.getOverview());
  } catch (err) {
    next(err);
  }
}

export async function listQuizzes(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminService.listQuizzes());
  } catch (err) {
    next(err);
  }
}

export async function createQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    res.status(201).json(await adminService.createQuiz(req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as unknown as { id: number };
    res.json(await adminService.updateQuiz(id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as unknown as { id: number };
    await adminService.deleteQuiz(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listQuestionsForQuiz(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = req.params as unknown as { quizId: number };
    res.json(await adminService.listQuestionsForQuiz(quizId));
  } catch (err) {
    next(err);
  }
}

export async function createQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { quizId } = req.params as unknown as { quizId: number };
    res.status(201).json(await adminService.createQuestion(quizId, req.body));
  } catch (err) {
    next(err);
  }
}

export async function updateQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as unknown as { id: number };
    res.json(await adminService.updateQuestion(id, req.body));
  } catch (err) {
    next(err);
  }
}

export async function deleteQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { id } = req.params as unknown as { id: number };
    await adminService.deleteQuestion(id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

export async function listStudents(_req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminService.listStudents());
  } catch (err) {
    next(err);
  }
}

export async function listAttempts(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await adminService.listAttempts(req.query as { status?: "IN_PROGRESS" | "FINISHED"; search?: string }));
  } catch (err) {
    next(err);
  }
}

export async function changePassword(req: Request, res: Response, next: NextFunction) {
  try {
    await adminService.changeAdminPassword(req.user!.userId, req.body);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}
