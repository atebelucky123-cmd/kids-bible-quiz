import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { secondsRemainingFor } from "./quiz.service";
import { z } from "zod";
import {
  createQuestionSchema,
  updateQuestionSchema,
  attemptsQuerySchema,
  changeAdminPasswordSchema,
} from "../validators/admin.validators";

const SALT_ROUNDS = 10;

// Display-only grouping for the Overview chart (development plan Appendix
// A) — the underlying Question model keeps a freeform ageMin/ageMax, this
// never changes how questions are stored or filtered.
const AGE_BANDS = [
  { label: "5-7", min: 5, max: 7 },
  { label: "8-10", min: 8, max: 10 },
  { label: "11-12", min: 11, max: 12 },
] as const;

function bandFor(age: number) {
  return AGE_BANDS.find((band) => age >= band.min && age <= band.max)?.label ?? null;
}

export async function getOverview() {
  const [totalStudents, totalQuestions, activeQuestions, totalAttempts, completedAttempts, attemptsWithAge] =
    await Promise.all([
      prisma.user.count({ where: { role: "STUDENT" } }),
      prisma.question.count(),
      prisma.question.count({ where: { isActive: true } }),
      prisma.quizAttempt.count(),
      prisma.quizAttempt.count({ where: { status: "FINISHED" } }),
      prisma.quizAttempt.findMany({ select: { user: { select: { age: true } } } }),
    ]);

  const ageBandBreakdown = AGE_BANDS.map((band) => ({
    band: band.label,
    attempts: attemptsWithAge.filter((a) => bandFor(a.user.age) === band.label).length,
  }));

  return {
    counts: {
      students: totalStudents,
      questions: totalQuestions,
      activeQuestions,
      attempts: totalAttempts,
      completedAttempts,
    },
    completionRate: totalAttempts === 0 ? 0 : Math.round((completedAttempts / totalAttempts) * 1000) / 10,
    ageBandBreakdown,
  };
}

export async function listQuestions() {
  return prisma.question.findMany({ orderBy: { createdAt: "desc" } });
}

export async function createQuestion(input: z.infer<typeof createQuestionSchema>) {
  return prisma.question.create({
    data: { ...input, isActive: input.isActive ?? true },
  });
}

export async function updateQuestion(id: number, input: z.infer<typeof updateQuestionSchema>) {
  const existing = await prisma.question.findUnique({ where: { id } });
  if (!existing) {
    throw new AppError("Question not found", 404, "NOT_FOUND");
  }

  // ageMin/ageMax cross-validation runs against the *merged* result, since a
  // PATCH can legitimately send only one of the two bounds.
  const merged = { ageMin: existing.ageMin, ageMax: existing.ageMax, ...input };
  if (merged.ageMin > merged.ageMax) {
    throw new AppError("Minimum age cannot be greater than maximum age", 400, "INVALID_AGE_RANGE");
  }

  return prisma.question.update({ where: { id }, data: input });
}

export async function deleteQuestion(id: number) {
  try {
    await prisma.question.delete({ where: { id } });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") {
      throw new AppError("Question not found", 404, "NOT_FOUND");
    }
    // The Answer -> Question relation is onDelete: Restrict (schema.prisma)
    // — a question that already has recorded answers can't be hard-deleted
    // without destroying grading history. Deactivating is the safe
    // equivalent: it stops appearing in new quizzes without touching the
    // past attempts that reference it.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
      throw new AppError(
        "This question has already been used in a quiz attempt — deactivate it instead of deleting.",
        409,
        "QUESTION_IN_USE"
      );
    }
    throw err;
  }
}

export async function listStudents() {
  const students = await prisma.user.findMany({
    where: { role: "STUDENT" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      firstName: true,
      middleName: true,
      lastName: true,
      age: true,
      createdAt: true,
      attempts: {
        where: { status: "FINISHED" },
        orderBy: { completedAt: "desc" },
        take: 1,
        select: { percentage: true, completedAt: true },
      },
      _count: { select: { attempts: true } },
    },
  });

  // Never expose mobileNumber, passwordHash, or any other authentication/
  // contact detail here — spec Section 21 and the approved UI design's own
  // privacy note both call this out explicitly for the Students tab.
  return students.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    middleName: s.middleName,
    lastName: s.lastName,
    age: s.age,
    joinedAt: s.createdAt,
    attemptCount: s._count.attempts,
    lastResult: s.attempts[0] ?? null,
  }));
}

export async function listAttempts(filters: z.infer<typeof attemptsQuerySchema>) {
  const attempts = await prisma.quizAttempt.findMany({
    where: {
      ...(filters.status && { status: filters.status }),
      ...(filters.search && {
        user: {
          OR: [
            { firstName: { contains: filters.search, mode: "insensitive" } },
            { lastName: { contains: filters.search, mode: "insensitive" } },
          ],
        },
      }),
    },
    orderBy: { startedAt: "desc" },
    include: { user: { select: { id: true, firstName: true, lastName: true, age: true } } },
  });

  return attempts.map((attempt) => {
    const endedAt = attempt.completedAt ?? attempt.lastActivityAt;
    return {
      id: attempt.id,
      student: attempt.user,
      status: attempt.status,
      currentQuestionIndex: attempt.currentQuestionIndex,
      totalQuestions: attempt.totalQuestions,
      score: attempt.score,
      percentage: attempt.percentage,
      startedAt: attempt.startedAt,
      completedAt: attempt.completedAt,
      durationSeconds: Math.max(0, Math.floor((endedAt.getTime() - attempt.startedAt.getTime()) / 1000)),
      secondsRemaining: attempt.status === "IN_PROGRESS" ? secondsRemainingFor(attempt) : null,
    };
  });
}

export async function changeAdminPassword(
  userId: number,
  input: z.infer<typeof changeAdminPasswordSchema>
) {
  const admin = await prisma.user.findUnique({ where: { id: userId } });
  if (!admin || admin.role !== "ADMIN") {
    throw new AppError("Admin account not found", 404, "NOT_FOUND");
  }

  const matches = await bcrypt.compare(input.currentPassword, admin.passwordHash);
  if (!matches) {
    throw new AppError("Current password is incorrect", 401, "INVALID_CREDENTIALS");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
