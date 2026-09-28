-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "age_min" INTEGER NOT NULL,
    "age_max" INTEGER NOT NULL,
    "time_limit_seconds" INTEGER NOT NULL DEFAULT 30,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- Data migration: bucket everything that already exists (questions and the
-- attempts that reference them) under one imported quiz, since quiz_id is
-- about to become required on both tables. Nothing is lost — the client can
-- rename/reorganize this quiz via the admin dashboard afterward.
INSERT INTO "quizzes" ("title", "age_min", "age_max", "time_limit_seconds", "is_active", "updated_at")
VALUES ('Imported Questions', 5, 12, 30, true, CURRENT_TIMESTAMP);

-- AlterTable: questions loses its per-question age range, gains quiz_id
ALTER TABLE "questions" ADD COLUMN "quiz_id" INTEGER;
UPDATE "questions" SET "quiz_id" = (SELECT "id" FROM "quizzes" WHERE "title" = 'Imported Questions');
ALTER TABLE "questions" ALTER COLUMN "quiz_id" SET NOT NULL;
DROP INDEX IF EXISTS "questions_age_min_age_max_idx";
ALTER TABLE "questions" DROP COLUMN "age_min";
ALTER TABLE "questions" DROP COLUMN "age_max";

-- AlterTable: quiz_attempts records which quiz it was for
ALTER TABLE "quiz_attempts" ADD COLUMN "quiz_id" INTEGER;
UPDATE "quiz_attempts" SET "quiz_id" = (SELECT "id" FROM "quizzes" WHERE "title" = 'Imported Questions');
ALTER TABLE "quiz_attempts" ALTER COLUMN "quiz_id" SET NOT NULL;

-- CreateIndex
CREATE INDEX "quizzes_age_min_age_max_idx" ON "quizzes"("age_min", "age_max");

-- CreateIndex
CREATE INDEX "quizzes_is_active_idx" ON "quizzes"("is_active");

-- CreateIndex
CREATE INDEX "questions_quiz_id_idx" ON "questions"("quiz_id");

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
-- NO ACTION, not RESTRICT: see the Answer -> Question FK comment in
-- schema.prisma (Phase 12 fix) — RESTRICT raises a Postgres error code
-- Prisma's client doesn't map to a known error, NO ACTION does.
ALTER TABLE "quiz_attempts" ADD CONSTRAINT "quiz_attempts_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
