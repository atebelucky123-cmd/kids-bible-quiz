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

// A question's clock: null shownAt means it hasn't been shown yet, so its
// clock hasn't started.
function secondsLeft(timeLimitSeconds: number, shownAt: Date | null) {
  if (!shownAt) return timeLimitSeconds;
  const elapsedSeconds = Math.floor((Date.now() - shownAt.getTime()) / 1000);
  return Math.max(0, timeLimitSeconds - elapsedSeconds);
}

// A couple of seconds' slack so an answer tapped at 00:01 isn't rejected
// just because the request took a moment to reach the server.
const TIMER_GRACE_SECONDS = 2;

function timeIsUp(timeLimitSeconds: number, shownAt: Date | null) {
  if (!shownAt) return false;
  return (Date.now() - shownAt.getTime()) / 1000 > timeLimitSeconds + TIMER_GRACE_SECONDS;
}

// The current question's time left.
export function secondsRemainingFor(attempt: { timeLimitSeconds: number; questionShownAt: Date | null }) {
  return secondsLeft(attempt.timeLimitSeconds, attempt.questionShownAt);
}

// The fields that close out an attempt. Shared by finishing the last
// question, skipping it, quitting, and abandoning via "Start a New Quiz".
function finishedFields(score: number, totalQuestions: number) {
  return {
    status: "FINISHED" as const,
    completedAt: new Date(),
    // 0 only if every question was deleted mid-quiz (see resolveCurrentQuestion).
    percentage: totalQuestions === 0 ? 0 : (score / totalQuestions) * 100,
  };
}

// Loads an attempt the student owns and can still act on.
async function loadInProgressAttempt(userId: number, attemptId: number) {
  const attempt = await prisma.quizAttempt.findUnique({ where: { id: attemptId } });

  // Same 404 whether the attempt doesn't exist or belongs to someone else —
  // never confirm another student's attempt ID is valid (spec Section 20).
  if (!attempt || attempt.userId !== userId) {
    throw new AppError("Quiz attempt not found", 404, "NOT_FOUND");
  }
  if (attempt.status !== "IN_PROGRESS") {
    throw new AppError("This quiz has already finished", 409, "ATTEMPT_FINISHED");
  }
  return attempt;
}

type AttemptRow = NonNullable<Awaited<ReturnType<typeof prisma.quizAttempt.findUnique>>>;

// The attempt's current question. The admin can delete a question nobody
// has answered yet — including one waiting further along in a quiz a child
// is partway through. Rather than leave that quiz stuck, drop the deleted
// question from the attempt so it carries on and doesn't count against the
// score. (Answered, skipped or timed-out questions can't be deleted: their
// answer rows block it.)
async function resolveCurrentQuestion(attempt: AttemptRow) {
  let current = attempt;
  while (current.currentQuestionIndex < current.questionIds.length) {
    const question = await prisma.question.findUnique({
      where: { id: current.questionIds[current.currentQuestionIndex] },
    });
    if (question) return { attempt: current, question };
    const questionIds = current.questionIds.filter((_, i) => i !== current.currentQuestionIndex);
    current = await prisma.quizAttempt.update({
      where: { id: current.id },
      data: { questionIds, totalQuestions: questionIds.length, questionShownAt: null },
    });
  }
  return { attempt: current, question: null };
}

// As above, plus its current question. Answering and skipping the current
// question start with these checks.
async function loadActiveAttempt(userId: number, attemptId: number) {
  const { attempt, question } = await resolveCurrentQuestion(await loadInProgressAttempt(userId, attemptId));
  if (!question) {
    throw new AppError("This quiz has no more questions", 409, "ATTEMPT_COMPLETE");
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

// Where an earlier question stands once the quiz has moved past it:
//   DONE   — answered correctly; read-only, answer shown
//   CLOSED — its timer ran out; read-only, answer shown
//   OPEN   — skipped; the student can still go back and answer it
type PastQuestionState = "DONE" | "CLOSED" | "OPEN";

function pastStateFrom(answers: { isCorrect: boolean; timedOut: boolean }[]): PastQuestionState {
  if (answers.some((a) => a.isCorrect)) return "DONE";
  if (answers.some((a) => a.timedOut)) return "CLOSED";
  return "OPEN";
}

async function answersForQuestion(attemptId: number, questionId: number) {
  return prisma.answer.findMany({ where: { attemptId, questionId }, orderBy: { answeredAt: "asc" } });
}

// Positions of passed questions that are still OPEN (skipped, not yet answered).
async function openSkippedPositions(attempt: { id: number; questionIds: number[]; currentQuestionIndex: number }) {
  const passedIds = attempt.questionIds.slice(0, attempt.currentQuestionIndex);
  const answers = await prisma.answer.findMany({ where: { attemptId: attempt.id, questionId: { in: passedIds } } });
  return passedIds.flatMap((id, position) =>
    pastStateFrom(answers.filter((a) => a.questionId === id)) === "OPEN" ? [position] : []
  );
}

// Finishes the attempt once there's nothing left to do: every question has
// been reached and no skipped question is still waiting to be answered.
// Returns whether it finished.
async function finishIfDone(attemptId: number) {
  const attempt = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: attemptId } });
  if (attempt.status !== "IN_PROGRESS" || attempt.currentQuestionIndex < attempt.questionIds.length) return false;
  if ((await openSkippedPositions(attempt)).length > 0) return false;
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { ...finishedFields(attempt.score, attempt.totalQuestions), revisitQuestionId: null, revisitShownAt: null },
  });
  return true;
}

// A point (and star) only for a right *first* answer. Skip/timeout rows
// have no selected option, so they don't count as a first answer — a
// skipped question answered correctly on return still scores.
function earnsPoint(isCorrect: boolean, earlierAnswers: { selectedOption: AnswerOption | null }[]) {
  return isCorrect && earlierAnswers.every((a) => a.selectedOption === null);
}

export async function getCurrentQuestion(userId: number, attemptId: number) {
  const resolved = await resolveCurrentQuestion(await loadInProgressAttempt(userId, attemptId));
  let { attempt } = resolved;
  const { question } = resolved;

  // Past the last question but some skipped ones are still open: the app
  // offers going back to them, or finishing.
  if (!question) {
    const openPositions = await openSkippedPositions(attempt);
    if (openPositions.length === 0) {
      await finishIfDone(attemptId);
      throw new AppError("This quiz has no more questions", 409, "ATTEMPT_COMPLETE");
    }
    return {
      ...toAttemptSummary(attempt),
      atEnd: true,
      openSkipped: openPositions.length,
      firstOpenPosition: openPositions[0],
      secondsRemaining: 0,
      question: null,
    };
  }

  // The question's timer starts the first time it's fetched, i.e. when the
  // student actually sees it. Only set once, so re-fetching the same
  // question (reopening the app, coming back from an earlier question)
  // never quietly resets its clock.
  if (!attempt.questionShownAt) {
    attempt = await prisma.quizAttempt.update({
      where: { id: attemptId },
      data: { questionShownAt: new Date() },
    });
  }

  return {
    ...toAttemptSummary(attempt),
    atEnd: false,
    openSkipped: 0,
    firstOpenPosition: null,
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
  if (timeIsUp(attempt.timeLimitSeconds, attempt.questionShownAt)) {
    throw new AppError("Time's up for this question", 409, "TIME_UP");
  }

  // The server is the only thing that ever compares against
  // correctOption — the client only ever sends which letter it picked
  // (spec Sections 14 & 20: never trust a client-supplied correctness or
  // score).
  const isCorrect = selectedOption === question.correctOption;
  const point = earnsPoint(isCorrect, await answersForQuestion(attemptId, question.id));

  await prisma.answer.create({
    data: { attemptId, questionId: question.id, selectedOption, isCorrect },
  });

  // Wrong answers keep the student on the same question (spec Section 13's
  // provisional retry behaviour), with a fresh timer window for the retry
  // rather than letting it keep counting down from the first try.
  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: isCorrect
      ? {
          score: point ? attempt.score + 1 : attempt.score,
          currentQuestionIndex: attempt.currentQuestionIndex + 1,
          questionShownAt: null,
        }
      : { questionShownAt: new Date() },
  });
  const isQuizComplete = isCorrect && (await finishIfDone(attemptId));

  return {
    correct: isCorrect,
    earnedStar: point,
    message: isCorrect ? CORRECT_FEEDBACK : WRONG_FEEDBACK,
    attempt: toAttemptSummary(updated),
    isQuizComplete,
    score: updated.score,
    secondsRemaining: isCorrect ? null : secondsRemainingFor(updated),
  };
}

// The student tapping "Skip", or the current question's timer running out
// (timedOut). Either way it scores nothing for now and the quiz moves on;
// a skipped question can be gone back to later, a timed-out one can't.
// questionId must match the current question so a repeated request
// (double tap, retry after a network blip) can't skip the next one too.
export async function skipQuestion(userId: number, attemptId: number, questionId: number, timedOut: boolean) {
  const { attempt, question } = await loadActiveAttempt(userId, attemptId);

  if (question.id !== questionId) {
    throw new AppError("This question has already moved on", 409, "QUESTION_CHANGED");
  }

  await prisma.answer.create({
    data: { attemptId, questionId: question.id, selectedOption: null, isCorrect: false, timedOut },
  });

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { currentQuestionIndex: attempt.currentQuestionIndex + 1, questionShownAt: null },
  });
  const isQuizComplete = await finishIfDone(attemptId);

  return {
    // Only revealed after a timeout, when the question is closed for good.
    // A plain skip keeps it hidden, since it can still be answered later.
    correctOption: timedOut ? question.correctOption : null,
    attempt: toAttemptSummary(updated),
    isQuizComplete,
    score: updated.score,
  };
}

// Loads a question the quiz has already moved past, for the Previous button.
async function loadPastQuestion(userId: number, attemptId: number, position: number) {
  const attempt = await loadInProgressAttempt(userId, attemptId);
  if (position >= attempt.currentQuestionIndex || position >= attempt.questionIds.length) {
    throw new AppError("You can only look back at earlier questions", 409, "NOT_A_PAST_QUESTION");
  }
  const questionId = attempt.questionIds[position];
  const question = await prisma.question.findUnique({ where: { id: questionId } });
  if (!question) {
    throw new AppError("That question is no longer available", 500, "QUESTION_MISSING");
  }
  const answers = await answersForQuestion(attemptId, questionId);
  return { attempt, question, answers, state: pastStateFrom(answers) };
}

// Closes a skipped question whose own timer ran out, the same way a timeout
// on the current question does.
async function closeRevisit(attemptId: number, questionId: number) {
  await prisma.answer.create({
    data: { attemptId, questionId, selectedOption: null, isCorrect: false, timedOut: true },
  });
  await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: { revisitQuestionId: null, revisitShownAt: null },
  });
}

export async function getPastQuestion(userId: number, attemptId: number, position: number) {
  const loaded = await loadPastQuestion(userId, attemptId, position);
  const { question } = loaded;
  let { attempt, state } = loaded;
  let secondsRemaining: number | null = null;

  if (state === "OPEN") {
    // Opening a skipped question starts its own timer. Coming back to the
    // same one keeps its clock going rather than restarting it.
    if (attempt.revisitQuestionId !== question.id) {
      attempt = await prisma.quizAttempt.update({
        where: { id: attemptId },
        data: { revisitQuestionId: question.id, revisitShownAt: new Date() },
      });
    }
    if (timeIsUp(attempt.timeLimitSeconds, attempt.revisitShownAt)) {
      await closeRevisit(attemptId, question.id);
      state = "CLOSED";
    } else {
      secondsRemaining = secondsLeft(attempt.timeLimitSeconds, attempt.revisitShownAt);
    }
  }

  return {
    position,
    totalQuestions: attempt.totalQuestions,
    currentQuestionIndex: attempt.currentQuestionIndex,
    state,
    question: toPublicQuestion(question),
    // Never revealed for an OPEN question — it can still be answered.
    correctOption: state === "OPEN" ? null : question.correctOption,
    secondsRemaining,
    // The current question's clock keeps running while looking back. Null
    // when it hasn't been shown yet, so there's no clock to warn about.
    currentSecondsRemaining: attempt.questionShownAt ? secondsRemainingFor(attempt) : null,
  };
}

export async function answerPastQuestion(
  userId: number,
  attemptId: number,
  position: number,
  selectedOption: AnswerOption
) {
  const { attempt, question, answers, state } = await loadPastQuestion(userId, attemptId, position);

  if (state !== "OPEN") {
    throw new AppError("This question can't be answered any more", 409, "QUESTION_CLOSED");
  }
  if (attempt.revisitQuestionId !== question.id) {
    throw new AppError("Open this question again before answering", 409, "QUESTION_NOT_OPEN");
  }
  if (timeIsUp(attempt.timeLimitSeconds, attempt.revisitShownAt)) {
    throw new AppError("Time's up for this question", 409, "TIME_UP");
  }

  const isCorrect = selectedOption === question.correctOption;
  const point = earnsPoint(isCorrect, answers);

  await prisma.answer.create({
    data: { attemptId, questionId: question.id, selectedOption, isCorrect },
  });

  const updated = await prisma.quizAttempt.update({
    where: { id: attemptId },
    data: isCorrect
      ? { score: point ? attempt.score + 1 : attempt.score, revisitQuestionId: null, revisitShownAt: null }
      : { revisitShownAt: new Date() },
  });
  const isQuizComplete = isCorrect && (await finishIfDone(attemptId));

  return {
    correct: isCorrect,
    earnedStar: point,
    message: isCorrect ? CORRECT_FEEDBACK : WRONG_FEEDBACK,
    isQuizComplete,
    score: updated.score,
    secondsRemaining: isCorrect ? null : secondsLeft(updated.timeLimitSeconds, updated.revisitShownAt),
  };
}

// A revisited skipped question's own timer ran out: close it and reveal
// the answer. Harmless to call early — it only ever costs the student.
export async function timeoutPastQuestion(userId: number, attemptId: number, position: number) {
  const { question, state } = await loadPastQuestion(userId, attemptId, position);
  if (state === "OPEN") {
    await closeRevisit(attemptId, question.id);
  }
  const isQuizComplete = await finishIfDone(attemptId);
  return { correctOption: question.correctOption, isQuizComplete };
}

// Ends the quiz early. Questions not reached (or skipped and never
// answered) simply score nothing, so the percentage reflects the whole quiz.
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
    data: { ...finishedFields(attempt.score, attempt.totalQuestions), revisitQuestionId: null, revisitShownAt: null },
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

// There's no separate POST /complete in this API: answering, skipping,
// quitting and the past-question actions all finalize the attempt
// themselves, so this is only the read side.
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
    // Skip/timeout rows aren't real answers.
    const picks = answers.filter((a) => a.selectedOption !== null);
    let outcome: ReviewOutcome;
    if (answers.length === 0) outcome = "NOT_ANSWERED";
    else if (picks[0]?.isCorrect) outcome = "CORRECT";
    else if (picks.some((a) => a.isCorrect)) outcome = "CORRECT_AFTER_RETRY";
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
        firstAnswer: picks[0]?.selectedOption ?? null,
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
