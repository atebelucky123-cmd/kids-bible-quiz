import { AttemptStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

// The client's notes cap a quiz at 70 questions; the exact per-quiz count
// and time limit are Open Requirements (development plan Appendix A) —
// these are reasonable configurable defaults, not confirmed final values,
// until the admin dashboard (Phase 11) can set them.
const DEFAULT_QUESTION_COUNT = 20;
const MAX_QUESTIONS_PER_QUIZ = 70;
const DEFAULT_TIME_LIMIT_SECONDS = 30;

function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function toPublicQuestion(question: {
  id: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
}) {
  // Never send the correct answer to the client (spec Sections 8 & 20) —
  // the server is the only thing that ever sees `correctOption`.
  return {
    id: question.id,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
  };
}

function toAttemptSummary(attempt: {
  id: number;
  status: AttemptStatus;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeLimitSeconds: number;
}) {
  return {
    attemptId: attempt.id,
    status: attempt.status,
    currentQuestionIndex: attempt.currentQuestionIndex,
    totalQuestions: attempt.totalQuestions,
    timeLimitSeconds: attempt.timeLimitSeconds,
  };
}

export async function startQuiz(userId: number, restart: boolean) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const existing = await prisma.quizAttempt.findFirst({
    where: { userId, status: "IN_PROGRESS" },
    orderBy: { lastActivityAt: "desc" },
  });

  if (existing && !restart) {
    // The Home screen should navigate straight to an existing in-progress
    // attempt rather than calling this — but if it does anyway (stale UI,
    // double tap), resume instead of silently creating a second one.
    return toAttemptSummary(existing);
  }

  if (existing && restart) {
    // There's no separate ABANDONED status in the schema (spec Section 16
    // only calls for finished/continue) — finalize it as FINISHED with
    // whatever was scored so far, an honest record of a quiz the student
    // walked away from rather than a new status value.
    await prisma.quizAttempt.update({
      where: { id: existing.id },
      data: {
        status: "FINISHED",
        completedAt: new Date(),
        percentage: (existing.score / existing.totalQuestions) * 100,
      },
    });
  }

  const eligibleQuestions = await prisma.question.findMany({
    where: { isActive: true, ageMin: { lte: user.age }, ageMax: { gte: user.age } },
  });

  if (eligibleQuestions.length === 0) {
    throw new AppError("No questions are available for your age yet", 409, "NO_QUESTIONS_AVAILABLE");
  }

  const questionCount = Math.min(eligibleQuestions.length, DEFAULT_QUESTION_COUNT, MAX_QUESTIONS_PER_QUIZ);
  const questionIds = shuffle(eligibleQuestions)
    .slice(0, questionCount)
    .map((q) => q.id);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      questionIds,
      totalQuestions: questionIds.length,
      timeLimitSeconds: DEFAULT_TIME_LIMIT_SECONDS,
    },
  });

  return toAttemptSummary(attempt);
}

export async function getCurrentQuestion(userId: number, attemptId: number) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });

  // Same 404 whether the attempt doesn't exist or belongs to someone else —
  // never confirm another student's attempt ID is valid (spec Section 20).
  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Quiz attempt not found", 404, "NOT_FOUND");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new AppError("This quiz has already finished", 409, "ATTEMPT_FINISHED");
  }
  if (attempt.currentQuestionIndex >= attempt.questionIds.length) {
    throw new AppError("This quiz has no more questions", 409, "ATTEMPT_COMPLETE");
  }

  const questionId = attempt.questionIds[attempt.currentQuestionIndex];
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new AppError("That question is no longer available", 500, "QUESTION_MISSING");
  }

  // The current question's timer starts when the attempt last moved
  // forward (created, or — from Phase 8 on — the last answer submitted).
  // This read-only endpoint never touches lastActivityAt itself, so
  // re-fetching the same question doesn't quietly reset its clock.
  const elapsedSeconds = Math.floor((Date.now() - attempt.lastActivityAt.getTime()) / 1000);
  const secondsRemaining = Math.max(0, attempt.timeLimitSeconds - elapsedSeconds);

  return {
    ...toAttemptSummary(attempt),
    secondsRemaining,
    question: toPublicQuestion(question),
  };
}
