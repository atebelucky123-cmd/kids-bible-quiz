import { AnswerOption, AttemptStatus } from "@prisma/client";
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

export function secondsRemainingFor(attempt: { timeLimitSeconds: number; lastActivityAt: Date }) {
  const elapsedSeconds = Math.floor((Date.now() - attempt.lastActivityAt.getTime()) / 1000);
  return Math.max(0, attempt.timeLimitSeconds - elapsedSeconds);
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
  return {
    ...toAttemptSummary(attempt),
    secondsRemaining: secondsRemainingFor(attempt),
    question: toPublicQuestion(question),
  };
}

const CORRECT_FEEDBACK = "Well done!";
// Verbatim client wording (spec Section 13) — do not reword.
const WRONG_FEEDBACK = "Whoops! That is the wrong answer, let's try again.";

export async function submitAnswer(userId: number, attemptId: number, selectedOption: AnswerOption) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });

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

  // The server is the only thing that ever compares against
  // correctOption — the client only ever sends which letter it picked
  // (spec Sections 14 & 20: never trust a client-supplied correctness or
  // score).
  const isCorrect = selectedOption === question.correctOption;

  await prisma.answer.create({
    data: { attemptId, questionId, selectedOption, isCorrect },
  });

  // Wrong answers keep the student on the same question — unlimited
  // retries, per the spec's provisional reading of the client's notes
  // (development plan Appendix A, "wrong-answer retry limit"). Either way,
  // touching the row bumps lastActivityAt (@updatedAt), giving a fresh
  // timer window for the retry rather than letting it keep counting down
  // from the original attempt at this question.
  const newScore = isCorrect ? attempt.score + 1 : attempt.score;
  const newIndex = isCorrect ? attempt.currentQuestionIndex + 1 : attempt.currentQuestionIndex;
  const isQuizComplete = newIndex >= attempt.questionIds.length;

  // Finalizing here (rather than waiting for a separate Phase 9 "complete"
  // call) matters even before the real result screen exists: without it,
  // a fully-answered attempt stayed IN_PROGRESS forever with an
  // out-of-range currentQuestionIndex, which the Home screen (Phase 6)
  // misread as a resumable quiz — showing "Question 10 of 9" and a
  // Continue Quiz button for a run that was already over, and leaving the
  // real score out of stats entirely. Computed from newScore, not a
  // second read of the row, since Prisma's increment operator can't be
  // referenced within the same write to derive a percentage.
  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: isCorrect
      ? {
          score: newScore,
          currentQuestionIndex: newIndex,
          ...(isQuizComplete && {
            status: "FINISHED" as const,
            completedAt: new Date(),
            percentage: (newScore / attempt.totalQuestions) * 100,
          }),
        }
      : { lastActivityAt: new Date() },
  });

  return {
    correct: isCorrect,
    message: isCorrect ? CORRECT_FEEDBACK : WRONG_FEEDBACK,
    attempt: toAttemptSummary(updated),
    isQuizComplete,
    score: updated.score,
    // Once every question is answered there's no "current question" left
    // to time — the real result screen (score, percentage, cheers audio)
    // is Phase 9's job, not this endpoint's.
    secondsRemaining: isQuizComplete ? null : secondsRemainingFor(updated),
  };
}
