import { prisma } from "@/lib/db";
import { nextStreak } from "./streak";
import { rankTitleForPoints } from "./ranks";

/**
 * Apply an activity event to a user: bump the daily streak, add points, and
 * recompute the cached rank title. SERVER ONLY. Every points-awarding path
 * (lesson complete, flag capture, writeup publish) funnels through here so the
 * streak/rank cache stays consistent.
 */
export async function recordActivity(userId: string, pointsDelta = 0) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { points: true, streakCount: true, longestStreak: true, lastActiveOn: true },
  });
  if (!user) return null;

  const streak = nextStreak(user.lastActiveOn, user.streakCount, user.longestStreak);

  // Increment points atomically so two concurrent awards cannot clobber each
  // other (a read-modify-write here lost points under a race). rankTitle is a
  // cached display value recomputed from the authoritative post-increment total.
  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      points: { increment: pointsDelta },
      streakCount: streak.streakCount,
      longestStreak: streak.longestStreak,
      lastActiveOn: new Date(),
    },
    select: { points: true, streakCount: true },
  });
  await prisma.user.update({
    where: { id: userId },
    data: { rankTitle: rankTitleForPoints(updated.points) },
  });

  return { points: updated.points, streakCount: updated.streakCount };
}
