-- AlterTable
ALTER TABLE "answers" ADD COLUMN     "timed_out" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "quiz_attempts" ADD COLUMN     "revisit_question_id" INTEGER,
ADD COLUMN     "revisit_shown_at" TIMESTAMP(3);
