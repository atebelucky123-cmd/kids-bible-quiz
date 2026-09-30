import { PrismaClient, AnswerOption } from "@prisma/client";

const prisma = new PrismaClient();

type SampleQuestion = {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerOption;
};

// The default quiz for a fresh database. The client adds their own quizzes
// and questions through the admin dashboard.
const sampleQuizzes: {
  title: string;
  ageMin: number;
  ageMax: number;
  timeLimitSeconds: number;
  questions: SampleQuestion[];
}[] = [
  {
    // The one default quiz shipped at handover — the same five questions as
    // the production setup SQL, so local and live data match.
    title: "Bible Basics",
    ageMin: 5,
    ageMax: 12,
    timeLimitSeconds: 30,
    questions: [
      {
        questionText: "Who built the ark?",
        optionA: "Noah",
        optionB: "Moses",
        optionC: "David",
        optionD: "Peter",
        correctOption: "A",
      },
      {
        questionText: "In which town was Jesus born?",
        optionA: "Nazareth",
        optionB: "Jerusalem",
        optionC: "Bethlehem",
        optionD: "Bethany",
        correctOption: "C",
      },
      {
        questionText: "Who defeated the giant Goliath with a sling and a stone?",
        optionA: "Saul",
        optionB: "David",
        optionC: "Samson",
        optionD: "Solomon",
        correctOption: "B",
      },
      {
        questionText: "Who was swallowed by a big fish?",
        optionA: "Daniel",
        optionB: "Jonah",
        optionC: "Elijah",
        optionD: "Samuel",
        correctOption: "B",
      },
      {
        questionText: "How many disciples did Jesus choose?",
        optionA: "7",
        optionB: "10",
        optionC: "15",
        optionD: "12",
        correctOption: "D",
      },
    ],
  },
];

async function main() {
  // Idempotent by title/text rather than delete-then-recreate: local dev
  // attempts/answers can reference these questions (Answer -> Question is
  // onDelete: NoAction), so a destructive reset would crash the moment any
  // dev quiz has actually been played.
  for (const sampleQuiz of sampleQuizzes) {
    const quiz =
      (await prisma.quiz.findFirst({ where: { title: sampleQuiz.title } })) ??
      (await prisma.quiz.create({
        data: {
          title: sampleQuiz.title,
          ageMin: sampleQuiz.ageMin,
          ageMax: sampleQuiz.ageMax,
          timeLimitSeconds: sampleQuiz.timeLimitSeconds,
        },
      }));

    for (const q of sampleQuiz.questions) {
      const existing = await prisma.question.findFirst({
        where: { quizId: quiz.id, questionText: q.questionText },
      });
      if (!existing) {
        await prisma.question.create({ data: { ...q, quizId: quiz.id } });
      }
    }
  }

  const totalQuestions = sampleQuizzes.reduce((sum, q) => sum + q.questions.length, 0);
  console.log(`Seeded ${sampleQuizzes.length} quiz with ${totalQuestions} questions (skipping any that already exist).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
