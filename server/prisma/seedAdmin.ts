import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const SALT_ROUNDS = 10;

// Development plan Appendix A: a single shared admin login, seeded once,
// with a placeholder password meant to be changed on first real use via the
// admin dashboard's own Settings screen (PATCH /api/admin/me/password).
// The password itself is generated here and printed once — it is never
// written to a file or committed to the repo.
const ADMIN_FIRST_NAME = "Admin";

function generatePlaceholderPassword(): string {
  // Alphanumeric only, per the client's password rule (spec Section 4) —
  // built from explicit letter/digit pools rather than a generic random
  // string so it's guaranteed to satisfy the "at least one of each" rule
  // enforced by passwordSchema, not just probably likely to.
  const letters = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const pick = (pool: string, count: number) =>
    Array.from({ length: count }, () => pool[crypto.randomInt(pool.length)]);

  const chars = [...pick(letters, 8), ...pick(digits, 4)];
  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

async function main() {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    console.log(`An admin account already exists (id ${existingAdmin.id}, first name "${existingAdmin.firstName}"). Nothing to do.`);
    return;
  }

  const placeholderPassword = generatePlaceholderPassword();
  const passwordHash = await bcrypt.hash(placeholderPassword, SALT_ROUNDS);

  const admin = await prisma.user.create({
    data: {
      firstName: ADMIN_FIRST_NAME,
      lastName: "User",
      age: 18,
      mobileNumber: "0000000000",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(`Created admin account (id ${admin.id}).`);
  console.log(`  First name: ${ADMIN_FIRST_NAME}`);
  console.log(`  Password:   ${placeholderPassword}`);
  console.log(`Log in once at the admin dashboard and change this password from Settings.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
