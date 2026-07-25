import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton.
 *
 * Next.js dev hot-reloads modules, which would otherwise create a new
 * PrismaClient (and a new connection pool) on every reload and exhaust
 * Postgres connections. We cache the instance on `globalThis` in non-prod.
 *
 * This is the ONLY place a PrismaClient should be constructed. Import
 * `prisma` from "@/lib/db" everywhere else.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
