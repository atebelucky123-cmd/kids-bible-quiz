import { AnswerOption } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { startQuiz, getCurrentQuestion, submitAnswer } from "../services/quiz.service";

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const { restart } = req.body as { restart: boolean };
    const attempt = await startQuiz(req.user!.userId, restart);
    res.status(201).json(attempt);
  } catch (err) {
    next(err);
  }
}

export async function getQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = Number(req.params.attemptId);
    const data = await getCurrentQuestion(req.user!.userId, attemptId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function answer(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = Number(req.params.attemptId);
    const { selectedOption } = req.body as { selectedOption: AnswerOption };
    const result = await submitAnswer(req.user!.userId, attemptId, selectedOption);
    res.json(result);
  } catch (err) {
    next(err);
  }
}
