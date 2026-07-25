import { prisma } from "@/lib/db";

/**
 * Evaluate and award any newly-earned achievements for a user. Idempotent
 * (skips already-earned). Called after points-earning actions. Returns the
 * codes newly awarded so callers can notify.
 */
export async function evaluateAchievements(userId: string): Promise<string[]> {
  const [lessonsDone, solves, created, rootOwned, firstBloods, user, existing, writeupsPub, pathsDone] =
    await Promise.all([
      prisma.lessonProgress.count({ where: { userId, completed: true } }),
      prisma.challengeSolve.count({ where: { userId, solved: true } }),
      prisma.challenge.count({ where: { authorId: userId } }),
      prisma.machineProgress.count({ where: { userId, rootOwned: true } }),
      prisma.machine.count({ where: { firstBloodUserId: userId } }),
      prisma.user.findUnique({ where: { id: userId }, select: { longestStreak: true, streakCount: true } }),
      prisma.userAchievement.findMany({
        where: { userId },
        select: { achievement: { select: { code: true } } },
      }),
      prisma.writeup.count({ where: { userId, status: "PUBLISHED" } }),
      prisma.pathProgress.count({ where: { userId, completed: true } }),
    ]);

  const streak = Math.max(user?.longestStreak ?? 0, user?.streakCount ?? 0);
  const earned = new Set(existing.map((e) => e.achievement.code));
  const want: string[] = [];
  if (lessonsDone >= 1) want.push("first_lesson");
  if (lessonsDone >= 10) want.push("lessons_10");
  if (lessonsDone >= 50) want.push("lessons_50");
  if (pathsDone >= 1) want.push("path_complete");
  if (solves >= 1) want.push("first_challenge");
  if (solves >= 10) want.push("solve_10");
  if (solves >= 25) want.push("solve_25");
  if (created >= 1) want.push("first_creation");
  if (streak >= 7) want.push("streak_7");
  if (streak >= 30) want.push("streak_30");
  if (writeupsPub >= 1) want.push("writeup_published");
  if (rootOwned >= 1) want.push("first_own");
  if (firstBloods >= 1) want.push("first_blood");
  if (rootOwned >= 10) want.push("own_10");

  const toAward = want.filter((c) => !earned.has(c));
  if (toAward.length === 0) return [];

  const defs = await prisma.achievement.findMany({
    where: { code: { in: toAward } },
    select: { id: true, code: true },
  });
  await prisma.userAchievement.createMany({
    data: defs.map((d) => ({ userId, achievementId: d.id })),
    skipDuplicates: true,
  });
  return defs.map((d) => d.code);
}

export interface AchievementProgress {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  earned: boolean;
  earnedAt: Date | null;
}

/** Every achievement with whether this user has earned it (for display). */
export async function getAchievementProgress(userId: string): Promise<AchievementProgress[]> {
  const [defs, earned] = await Promise.all([
    prisma.achievement.findMany({ orderBy: [{ category: "asc" }, { name: "asc" }] }),
    prisma.userAchievement.findMany({
      where: { userId },
      select: { achievementId: true, earnedAt: true },
    }),
  ]);
  const earnedMap = new Map(earned.map((e) => [e.achievementId, e.earnedAt]));
  return defs.map((d) => ({
    code: d.code,
    name: d.name,
    description: d.description,
    icon: d.icon ?? "Star",
    category: d.category,
    earned: earnedMap.has(d.id),
    earnedAt: earnedMap.get(d.id) ?? null,
  }));
}
