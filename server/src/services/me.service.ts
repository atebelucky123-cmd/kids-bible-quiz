import { prisma } from "../lib/prisma";
import { secondsRemainingFor } from "./quiz.service";

// One star per correct answer, per the client's "Well done + star" feedback
// (spec Section 13) — so cumulative stars earned is just the sum of scores
// across finished attempts, not a separately tracked column.
export async function getAttemptsSummary(userId: number) {
  const attempts = await prisma.quizAttempt.findMany({
    where: { userId },
    orderBy: { lastActivityAt: "desc" },
    select: {
      id: true,
      status: true,
      score: true,
      totalQuestions: true,
      percentage: true,
      currentQuestionIndex: true,
      timeLimitSeconds: true,
      lastActivityAt: true,
      startedAt: true,
      completedAt: true,
    },
  });

  const inProgressRow = attempts.find((attempt) => attempt.status === "IN_PROGRESS") ?? null;
  // The client's own timer stub (development plan Appendix A) leaves what
  // happens on expiry undecided, but the Home screen still needs to know
  // whether resuming is actually possible — the current question can't be
  // answered once its timer has run out, so Continue Quiz would just be a
  // dead end. secondsRemaining lets the Home screen fall back to
  // Start-a-New-Quiz-only in that case, per feedback from on-device testing.
  const inProgressAttempt = inProgressRow
    ? { ...inProgressRow, secondsRemaining: secondsRemainingFor(inProgressRow) }
    : null;

  const finishedAttempts = attempts.filter(
    (attempt): attempt is typeof attempt & { completedAt: Date } =>
      attempt.status === "FINISHED" && attempt.completedAt !== null
  );

  const lastResult = finishedAttempts.reduce<(typeof finishedAttempts)[number] | null>(
    (latest, attempt) => (!latest || attempt.completedAt > latest.completedAt ? attempt : latest),
    null
  );

  return {
    attempts,
    inProgressAttempt,
    stats: {
      quizzesCompleted: finishedAttempts.length,
      starsEarned: finishedAttempts.reduce((sum, attempt) => sum + attempt.score, 0),
      lastResult,
    },
  };
}
