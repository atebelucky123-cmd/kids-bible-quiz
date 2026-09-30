import { AnswerOption, AttemptStatus } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";

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

type TimedAttempt = { timeLimitSeconds: number; questionShownAt: Date | null };

export function secondsRemainingFor(attempt: TimedAttempt) {
  // Not shown yet, so its clock hasn't started.
  if (!attempt.questionShownAt) return attempt.timeLimitSeconds;
  const elapsedSeconds = Math.floor((Date.now() - attempt.questionShownAt.getTime()) / 1000);
  return Math.max(0, attempt.timeLimitSeconds - elapsedSeconds);
}

// A couple of seconds' slack so an answer tapped at 00:01 isn't rejected
// just because the request took a moment to reach the server.
const TIMER_GRACE_SECONDS = 2;

function isTimeUp(attempt: TimedAttempt) {
  if (!attempt.questionShownAt) return false;
  const elapsedSeconds = (Date.now() - attempt.questionShownAt.getTime()) / 1000;
  return elapsedSeconds > attempt.timeLimitSeconds + TIMER_GRACE_SECONDS;
}

// The fields that close out an attempt. Shared by finishing the last
// question, skipping it, quitting, and abandoning via "Start a New Quiz".
function finishedFields(score: number, totalQuestions: number) {
  return {
    status: "FINISHED" as const,
    completedAt: new Date(),
    percentage: (score / totalQuestions) * 100,
  };
}

// Loads an attempt the student owns and can still act on, plus its current
// question. Every in-quiz action (view, answer, skip) starts with these checks.
async function loadActiveAttempt(userId: number, attemptId: number) {
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
  return { attempt, question };
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

// The student's own choice, made from the list returned here — replaces the
// old flat age-eligible question pool entirely (developer decision, see the
// "Named Quizzes" plan). A quiz's own ageMin/ageMax gates which quizzes a
// student even sees; there's no further per-question age filtering once
// they've picked one.
export async function listAvailableQuizzes(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    throw new AppError("User not found", 404, "NOT_FOUND");
  }

  const quizzes = await prisma.quiz.findMany({
    where: { isActive: true, ageMin: { lte: user.age }, ageMax: { gte: user.age } },
    include: { _count: { select: { questions: { where: { isActive: true } } } } },
    orderBy: { title: "asc" },
  });

  return quizzes
    .map((q) => ({
      id: q.id,
      title: q.title,
      ageMin: q.ageMin,
      ageMax: q.ageMax,
      timeLimitSeconds: q.timeLimitSeconds,
      questionCount: q._count.questions,
    }))
    .filter((q) => q.questionCount > 0);
}

export async function startQuiz(userId: number, restart: boolean, quizId: number) {
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
    // double tap), resume instead of silently creating a second one,
    // regardless of which quiz was requested this time.
    return toAttemptSummary(existing);
  }

  if (existing && restart) {
    // There's no separate ABANDONED status in the schema (spec Section 16
    // only calls for finished/continue) — finalize it as FINISHED with
    // whatever was scored so far, an honest record of a quiz the student
    // walked away from rather than a new status value.
    await prisma.quizAttempt.update({
      where: { id: existing.id },
      data: finishedFields(existing.score, existing.totalQuestions),
    });
  }

  const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
  if (!quiz) {
    throw new AppError("Quiz not found", 404, "NOT_FOUND");
  }
  // Never trust that a client only ever requests a quiz it was shown by
  // listAvailableQuizzes — re-check active + age-eligibility server-side
  // (spec Section 20's "do not trust the client" posture, same as the age
  // check on registration).
  if (!quiz.isActive || user.age < quiz.ageMin || user.age > quiz.ageMax) {
    throw new AppError("This quiz isn't available for you right now", 409, "QUIZ_NOT_AVAILABLE");
  }

  const activeQuestions = await prisma.question.findMany({ where: { quizId, isActive: true } });
  if (activeQuestions.length === 0) {
    throw new AppError("This quiz doesn't have any questions yet", 409, "NO_QUESTIONS_AVAILABLE");
  }

  // The admin's exact set, just shuffled — no random subset/cap. The
  // client's 70-question ceiling (spec Section 10) is enforced instead at
  // question-creation time (admin.service.ts's createQuestion).
  const questionIds = shuffle(activeQuestions).map((q) => q.id);

  const attempt = await prisma.quizAttempt.create({
    data: {
      userId,
      quizId,
      questionIds,
      totalQuestions: questionIds.length,
      timeLimitSeconds: quiz.timeLimitSeconds,
    },
  });

  return toAttemptSummary(attempt);
}

export async function getCurrentQuestion(userId: number, attemptId: number) {
  const loaded = await loadActiveAttempt(userId, attemptId);
  const { question } = loaded;
  let { attempt } = loaded;

  // The question's timer starts the first time it's fetched, i.e. when the
  // student actually sees it. Only set once, so re-fetching the same
  // question (reopening the app) never quietly resets its clock.
  if (!attempt.questionShownAt) {
    attempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { questionShownAt: new Date() },
    });
  }

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
  const { attempt, question } = await loadActiveAttempt(userId, attemptId);

  // Timer integrity lives here, not only in the app's countdown (spec
  // Section 12). Once time is up the app has to skip the question instead,
  // which reveals the answer and awards nothing.
  if (isTimeUp(attempt)) {
    throw new AppError("Time's up for this question", 409, "TIME_UP");
  }

  // The server is the only thing that ever compares against
  // correctOption — the client only ever sends which letter it picked
  // (spec Sections 14 & 20: never trust a client-supplied correctness or
  // score).
  const isCorrect = selectedOption === question.correctOption;

  // Developer decision: a question only scores (and earns a star) when the
  // *first* answer to it is right. Retries are still unlimited so a child
  // can always move on, but without this every finished quiz was 100%.
  const earlierAnswers = await prisma.answer.count({ where: { attemptId, questionId: question.id } });
  const earnsPoint = isCorrect && earlierAnswers === 0;

  await prisma.answer.create({
    data: { attemptId, questionId: question.id, selectedOption, isCorrect },
  });

  // Wrong answers keep the student on the same question (spec Section 13's
  // provisional retry behaviour), with a fresh timer window for the retry
  // rather than letting it keep counting down from the first try.
  const newScore = earnsPoint ? attempt.score + 1 : attempt.score;
  const newIndex = isCorrect ? attempt.currentQuestionIndex + 1 : attempt.currentQuestionIndex;
  const isQuizComplete = newIndex >= attempt.questionIds.length;

  // Finalizing here rather than in a separate "complete" call: without it,
  // a fully-answered attempt stayed IN_PROGRESS with an out-of-range
  // currentQuestionIndex, which the Home screen misread as resumable.
  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: isCorrect
      ? {
          score: newScore,
          currentQuestionIndex: newIndex,
          questionShownAt: null,
          ...(isQuizComplete && finishedFields(newScore, attempt.totalQuestions)),
        }
      : { questionShownAt: new Date() },
  });

  return {
    correct: isCorrect,
    earnedStar: earnsPoint,
    message: isCorrect ? CORRECT_FEEDBACK : WRONG_FEEDBACK,
    attempt: toAttemptSummary(updated),
    isQuizComplete,
    score: updated.score,
    secondsRemaining: isQuizComplete ? null : secondsRemainingFor(updated),
  };
}

// Used both for the student tapping "Skip" and for the question's timer
// running out. Either way the question scores nothing and the quiz moves
// on. questionId must match the current question so a repeated request
// (double tap, retry after a network blip) can't skip the next one too.
export async function skipQuestion(userId: number, attemptId: number, questionId: number) {
  const { attempt, question } = await loadActiveAttempt(userId, attemptId);

  if (question.id !== questionId) {
    throw new AppError("This question has already moved on", 409, "QUESTION_CHANGED");
  }

  await prisma.answer.create({
    data: { attemptId, questionId: question.id, selectedOption: null, isCorrect: false },
  });

  const newIndex = attempt.currentQuestionIndex + 1;
  const isQuizComplete = newIndex >= attempt.questionIds.length;

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: {
      currentQuestionIndex: newIndex,
      questionShownAt: null,
      ...(isQuizComplete && finishedFields(attempt.score, attempt.totalQuestions)),
    },
  });

  return {
    // Safe to reveal: this question is over and can no longer be scored.
    // The app shows it after a timeout so the child still learns the answer.
    correctOption: question.correctOption,
    attempt: toAttemptSummary(updated),
    isQuizComplete,
    score: updated.score,
  };
}

// Ends the quiz early. Questions not reached simply score nothing, so the
// percentage reflects the whole quiz, not just the part attempted.
export async function quitQuiz(userId: number, attemptId: number) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });

  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Quiz attempt not found", 404, "NOT_FOUND");
  }
  // Already over (e.g. quit tapped twice) — nothing to do, and the result
  // screen can load either way.
  if (attempt.status === "FINISHED") {
    return toAttemptSummary(attempt);
  }

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: finishedFields(attempt.score, attempt.totalQuestions),
  });
  return toAttemptSummary(updated);
}

// Client's notes, taken literally: "Grades above 70 gets a cheers
// sounds." Exactly 70% does not qualify (spec Section 15) — the boundary
// is checked against the stored, unrounded percentage, never a display
// value, and decided here once so every caller gets the same answer
// rather than each re-implementing the ">70" comparison itself.
const CHEERS_THRESHOLD_PERCENT = 70;

type ReviewOutcome = "CORRECT" | "CORRECT_AFTER_RETRY" | "MISSED" | "NOT_ANSWERED";

// There's no separate POST /complete in this API: submitAnswer, skipQuestion
// and quitQuiz all finalize the attempt themselves, so this is only the
// read side — fetching the result once it exists.
export async function getResult(userId: number, attemptId: number) {
  const attempt = await prisma.quizAttempt.findUnique({
    where: { id: attemptId },
    include: { answers: { orderBy: { answeredAt: "asc" } } },
  });

  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Quiz attempt not found", 404, "NOT_FOUND");
  }
  if (attempt.status !== "FINISHED" || attempt.percentage === null || !attempt.completedAt) {
    throw new AppError("This quiz isn't finished yet", 409, "ATTEMPT_NOT_FINISHED");
  }

  // Correct answers are only ever revealed here, once the attempt is
  // finished and can't be changed — never through the question API.
  const questions = await prisma.question.findMany({ where: { id: { in: attempt.questionIds } } });
  const questionsById = new Map(questions.map((q) => [q.id, q]));

  const review = attempt.questionIds.flatMap((questionId) => {
    // A question never reached can be deleted later by the admin; there's
    // nothing meaningful to show for it then.
    const question = questionsById.get(questionId);
    if (!question) return [];

    const answers = attempt.answers.filter((a) => a.questionId === questionId);
    let outcome: ReviewOutcome;
    if (answers.length === 0) outcome = "NOT_ANSWERED";
    else if (answers[0].isCorrect) outcome = "CORRECT";
    else if (answers.some((a) => a.isCorrect)) outcome = "CORRECT_AFTER_RETRY";
    else outcome = "MISSED";

    return [
      {
        questionId,
        questionText: question.questionText,
        optionA: question.optionA,
        optionB: question.optionB,
        optionC: question.optionC,
        optionD: question.optionD,
        correctOption: question.correctOption,
        // Their first pick, so a wrong first guess is visible even if they
        // got it right on a retry. Null when they skipped or ran out of time.
        firstAnswer: answers.find((a) => a.selectedOption !== null)?.selectedOption ?? null,
        outcome,
      },
    ];
  });

  return {
    attemptId: attempt.id,
    score: attempt.score,
    totalQuestions: attempt.totalQuestions,
    percentage: attempt.percentage,
    completedAt: attempt.completedAt,
    playCheers: attempt.percentage > CHEERS_THRESHOLD_PERCENT,
    review,
  };
}
