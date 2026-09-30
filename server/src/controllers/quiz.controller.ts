import { AnswerOption } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import {
  startQuiz,
  getCurrentQuestion,
  submitAnswer,
  getResult,
  skipQuestion,
  quitQuiz,
  getPastQuestion,
  answerPastQuestion,
  timeoutPastQuestion,
  listAvailableQuizzes,
} from "../services/quiz.service";

export async function availableQuizzes(req: Request, res: Response, next: NextFunction) {
  try {
    res.json(await listAvailableQuizzes(req.user!.userId));
  } catch (err) {
    next(err);
  }
}

export async function start(req: Request, res: Response, next: NextFunction) {
  try {
    const { restart, quizId } = req.body as { restart: boolean; quizId: number };
    const attempt = await startQuiz(req.user!.userId, restart, quizId);
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

export async function result(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = Number(req.params.attemptId);
    const data = await getResult(req.user!.userId, attemptId);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function skip(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = Number(req.params.attemptId);
    const { questionId, timedOut } = req.body as { questionId: number; timedOut: boolean };
    res.json(await skipQuestion(req.user!.userId, attemptId, questionId, timedOut));
  } catch (err) {
    next(err);
  }
}

export async function quit(req: Request, res: Response, next: NextFunction) {
  try {
    const attemptId = Number(req.params.attemptId);
    res.json(await quitQuiz(req.user!.userId, attemptId));
  } catch (err) {
    next(err);
  }
}

// Earlier questions, for the app's Previous button.
function pastParams(req: Request) {
  return { attemptId: Number(req.params.attemptId), position: Number(req.params.position) };
}

export async function pastQuestion(req: Request, res: Response, next: NextFunction) {
  try {
    const { attemptId, position } = pastParams(req);
    res.json(await getPastQuestion(req.user!.userId, attemptId, position));
  } catch (err) {
    next(err);
  }
}

export async function answerPast(req: Request, res: Response, next: NextFunction) {
  try {
    const { attemptId, position } = pastParams(req);
    const { selectedOption } = req.body as { selectedOption: AnswerOption };
    res.json(await answerPastQuestion(req.user!.userId, attemptId, position, selectedOption));
  } catch (err) {
    next(err);
  }
}

export async function timeoutPast(req: Request, res: Response, next: NextFunction) {
  try {
    const { attemptId, position } = pastParams(req);
    res.json(await timeoutPastQuestion(req.user!.userId, attemptId, position));
  } catch (err) {
    next(err);
  }
}
