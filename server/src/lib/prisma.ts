import { PrismaClient } from "@prisma/client";

// Reuse a single PrismaClient across hot reloads in development so we don't
// exhaust Postgres connections every time tsx watch restarts the process.
const globalForPrisma = global as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
