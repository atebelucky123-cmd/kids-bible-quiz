import bcrypt from "bcryptjs";
import { User } from "@prisma/client";
import { prisma } from "../lib/prisma";
import { AppError } from "../utils/AppError";
import { signSession } from "../utils/jwt";
import { registerSchema, loginSchema } from "../validators/auth.validators";
import { z } from "zod";

const SALT_ROUNDS = 10;

// Never send the password hash (or other internal fields we don't need to)
// back to the client.
export function toPublicUser(user: User) {
  return {
    id: user.id,
    firstName: user.firstName,
    middleName: user.middleName,
    lastName: user.lastName,
    age: user.age,
    hobbies: user.hobbies,
    favoriteColor: user.favoriteColor,
    favoriteAnimal: user.favoriteAnimal,
    role: user.role,
  };
}

export async function registerUser(input: z.infer<typeof registerSchema>) {
  // Client requirement: age 5-12 inclusive. Ages outside that range get the
  // client's specific rejection response, not a generic validation error.
  if (input.age > 12) {
    throw new AppError("Oops, the age is too high", 400, "AGE_TOO_HIGH");
  }
  if (input.age < 5) {
    throw new AppError("This quiz is for children aged 5 to 12", 400, "AGE_TOO_LOW");
  }

  const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

  const user = await prisma.user.create({
    data: {
      firstName: input.firstName,
      middleName: input.middleName || null,
      lastName: input.lastName,
      age: input.age,
      mobileNumber: input.mobileNumber,
      hobbies: input.hobbies,
      favoriteColor: input.favoriteColor,
      favoriteAnimal: input.favoriteAnimal,
      passwordHash,
    },
  });

  const token = signSession({ userId: user.id, role: user.role });
  return { user: toPublicUser(user), token };
}

export async function loginUser(input: z.infer<typeof loginSchema>) {
  // First names are not unique (spec Section 6) — an internal ID is the
  // real identity. Check the password against every user with this first
  // name rather than assuming the first match is the right one.
  const candidates = await prisma.user.findMany({
    where: { firstName: { equals: input.firstName, mode: "insensitive" } },
  });

  for (const candidate of candidates) {
    const matches = await bcrypt.compare(input.password, candidate.passwordHash);
    if (matches) {
      const token = signSession({ userId: candidate.id, role: candidate.role });
      return { user: toPublicUser(candidate), token };
    }
  }

  throw new AppError("Incorrect first name or password", 401, "INVALID_CREDENTIALS");
}
