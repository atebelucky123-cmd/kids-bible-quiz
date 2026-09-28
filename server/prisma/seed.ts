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

// Sample quizzes for local development/testing only. These are NOT the
// client's real question set — per the spec, real Bible questions are
// supplied by the client and entered through the admin dashboard.
const sampleQuizzes: {
  title: string;
  ageMin: number;
  ageMax: number;
  timeLimitSeconds: number;
  questions: SampleQuestion[];
}[] = [
  {
    title: "Bible Beginnings",
    ageMin: 5,
    ageMax: 10,
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
        questionText: "Who was swallowed by a big fish?",
        optionA: "Jonah",
        optionB: "Daniel",
        optionC: "Samuel",
        optionD: "Elijah",
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
        questionText: "Who was Jesus' mother?",
        optionA: "Martha",
        optionB: "Mary",
        optionC: "Elizabeth",
        optionD: "Ruth",
        correctOption: "B",
      },
      {
        questionText: "Who was thrown into the lions' den?",
        optionA: "Daniel",
        optionB: "Joseph",
        optionC: "Gideon",
        optionD: "Samson",
        correctOption: "A",
      },
      {
        questionText: "Who was the first man God created?",
        optionA: "Cain",
        optionB: "Abel",
        optionC: "Noah",
        optionD: "Adam",
        correctOption: "D",
      },
    ],
  },
  {
    title: "Kings & Miracles",
    ageMin: 7,
    ageMax: 12,
    timeLimitSeconds: 30,
    questions: [
      {
        questionText: "Who led the Israelites out of Egypt?",
        optionA: "Joshua",
        optionB: "Aaron",
        optionC: "Moses",
        optionD: "Abraham",
        correctOption: "C",
      },
      {
        questionText: "Who defeated the giant Goliath with a sling and a stone?",
        optionA: "Saul",
        optionB: "David",
        optionC: "Solomon",
        optionD: "Samson",
        correctOption: "B",
      },
      {
        questionText: "What did God give Moses on Mount Sinai?",
        optionA: "A golden crown",
        optionB: "The Ten Commandments",
        optionC: "A book of songs",
        optionD: "A wooden staff",
        correctOption: "B",
      },
      {
        questionText: "How many disciples did Jesus choose?",
        optionA: "7",
        optionB: "10",
        optionC: "12",
        optionD: "15",
        correctOption: "C",
      },
      {
        questionText: "What was the first thing God created?",
        optionA: "The sun",
        optionB: "Animals",
        optionC: "Light",
        optionD: "People",
        correctOption: "C",
      },
      {
        questionText: "At a wedding in Cana, what did Jesus turn water into?",
        optionA: "Bread",
        optionB: "Wine",
        optionC: "Oil",
        optionD: "Milk",
        correctOption: "B",
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
  console.log(`Seeded ${sampleQuizzes.length} sample quizzes with ${totalQuestions} questions (skipping any that already exist).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
