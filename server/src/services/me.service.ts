import { prisma } from "../lib/prisma";

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
      startedAt: true,
      completedAt: true,
    },
  });

  const inProgressAttempt = attempts.find((attempt) => attempt.status === "IN_PROGRESS") ?? null;
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
