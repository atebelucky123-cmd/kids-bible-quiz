import { PrismaClient, AnswerOption } from "@prisma/client";

const prisma = new PrismaClient();

// Sample questions for local development/testing only. These are NOT the
// client's real question set — per the spec, real Bible questions are
// supplied by the client and entered through the admin dashboard (Phase 11).
const sampleQuestions: {
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerOption;
  ageMin: number;
  ageMax: number;
}[] = [
  {
    questionText: "Who built the ark?",
    optionA: "Noah",
    optionB: "Moses",
    optionC: "David",
    optionD: "Peter",
    correctOption: "A",
    ageMin: 5,
    ageMax: 9,
  },
  {
    questionText: "Who was swallowed by a big fish?",
    optionA: "Jonah",
    optionB: "Daniel",
    optionC: "Samuel",
    optionD: "Elijah",
    correctOption: "A",
    ageMin: 5,
    ageMax: 9,
  },
  {
    questionText: "In which town was Jesus born?",
    optionA: "Nazareth",
    optionB: "Jerusalem",
    optionC: "Bethlehem",
    optionD: "Bethany",
    correctOption: "C",
    ageMin: 5,
    ageMax: 10,
  },
  {
    questionText: "Who was Jesus' mother?",
    optionA: "Martha",
    optionB: "Mary",
    optionC: "Elizabeth",
    optionD: "Ruth",
    correctOption: "B",
    ageMin: 5,
    ageMax: 9,
  },
  {
    questionText: "Who was thrown into the lions' den?",
    optionA: "Daniel",
    optionB: "Joseph",
    optionC: "Gideon",
    optionD: "Samson",
    correctOption: "A",
    ageMin: 6,
    ageMax: 10,
  },
  {
    questionText: "Who led the Israelites out of Egypt?",
    optionA: "Joshua",
    optionB: "Aaron",
    optionC: "Moses",
    optionD: "Abraham",
    correctOption: "C",
    ageMin: 6,
    ageMax: 12,
  },
  {
    questionText: "Who defeated the giant Goliath with a sling and a stone?",
    optionA: "Saul",
    optionB: "David",
    optionC: "Solomon",
    optionD: "Samson",
    correctOption: "B",
    ageMin: 6,
    ageMax: 12,
  },
  {
    questionText: "Who was the first man God created?",
    optionA: "Cain",
    optionB: "Abel",
    optionC: "Noah",
    optionD: "Adam",
    correctOption: "D",
    ageMin: 5,
    ageMax: 9,
  },
  {
    questionText: "What did God give Moses on Mount Sinai?",
    optionA: "A golden crown",
    optionB: "The Ten Commandments",
    optionC: "A book of songs",
    optionD: "A wooden staff",
    correctOption: "B",
    ageMin: 8,
    ageMax: 12,
  },
  {
    questionText: "How many disciples did Jesus choose?",
    optionA: "7",
    optionB: "10",
    optionC: "12",
    optionD: "15",
    correctOption: "C",
    ageMin: 8,
    ageMax: 12,
  },
  {
    questionText: "What was the first thing God created?",
    optionA: "The sun",
    optionB: "Animals",
    optionC: "Light",
    optionD: "People",
    correctOption: "C",
    ageMin: 7,
    ageMax: 12,
  },
  {
    questionText: "At a wedding in Cana, what did Jesus turn water into?",
    optionA: "Bread",
    optionB: "Wine",
    optionC: "Oil",
    optionD: "Milk",
    correctOption: "B",
    ageMin: 9,
    ageMax: 12,
  },
];

async function main() {
  // Dev-only reset: clear existing sample questions and reinsert, so this
  // script is safe to re-run. Does not touch users, attempts, or answers.
  await prisma.question.deleteMany();

  await prisma.question.createMany({
    data: sampleQuestions.map((q) => ({ ...q, isActive: true })),
  });

  console.log(`Seeded ${sampleQuestions.length} sample questions.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
