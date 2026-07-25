import "server-only";
import { prisma } from "@/lib/db";

/**
 * Lightweight per-user write throttles. Backed by counting recent rows in the
 * same tables the writes land in, so there is no external store and no new
 * table: a spam loop is capped by how many rows it already created in the
 * window. Callers reject the write when the helper returns true. This mirrors
 * the DB-count limiter already used for flag submissions (lib/actions/machines.ts).
 */

const MINUTE = 60_000;

/** True once the user has sent >= max direct messages within windowMs. */
export async function directMessagesOverLimit(userId: string, max = 20, windowMs = MINUTE) {
  const count = await prisma.directMessage.count({
    where: { senderId: userId, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
  return count >= max;
}

/** True once the user has started >= max threads within windowMs. */
export async function threadsOverLimit(userId: string, max = 8, windowMs = 5 * MINUTE) {
  const count = await prisma.forumThread.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
  return count >= max;
}

/** True once the user has posted >= max replies within windowMs. */
export async function repliesOverLimit(userId: string, max = 25, windowMs = MINUTE) {
  const count = await prisma.forumPost.count({
    where: { authorId: userId, createdAt: { gte: new Date(Date.now() - windowMs) } },
  });
  return count >= max;
}
