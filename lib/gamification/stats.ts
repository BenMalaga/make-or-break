import { prisma } from "@/lib/db";
import { SKILL_CATEGORIES, tagToCategory, type SkillCategory } from "./points";

/**
 * Aggregate a user's points per skill category (for the profile radar).
 * A CORRECT flag adds its points to every category its machine's tags map to;
 * a completed lesson adds a small credit to each of its mapped categories.
 */
export async function computeSkillPoints(
  userId: string,
): Promise<Record<SkillCategory, number>> {
  const totals = Object.fromEntries(SKILL_CATEGORIES.map((c) => [c, 0])) as Record<
    SkillCategory,
    number
  >;

  const [subs, lessons] = await Promise.all([
    prisma.flagSubmission.findMany({
      where: { userId, result: "CORRECT" },
      select: { pointsAwarded: true, machine: { select: { tags: true } } },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lesson: { select: { tags: true } } },
    }),
  ]);

  for (const s of subs) {
    const cats = new Set<SkillCategory>();
    for (const t of s.machine.tags) {
      const c = tagToCategory(t);
      if (c) cats.add(c);
    }
    for (const c of cats) totals[c] += s.pointsAwarded;
  }
  for (const l of lessons) {
    const cats = new Set<SkillCategory>();
    for (const t of l.lesson.tags) {
      const c = tagToCategory(t);
      if (c) cats.add(c);
    }
    for (const c of cats) totals[c] += 5;
  }
  return totals;
}

export interface ActivityDay {
  date: string; // YYYY-MM-DD
  count: number;
}

/** Daily activity counts (correct flags + lesson completions) for the heatmap. */
export async function computeActivity(
  userId: string,
  days = 182,
): Promise<ActivityDay[]> {
  const since = new Date();
  since.setDate(since.getDate() - days);

  const [subs, lessons] = await Promise.all([
    prisma.flagSubmission.findMany({
      where: { userId, result: "CORRECT", createdAt: { gte: since } },
      select: { createdAt: true },
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true, completedAt: { gte: since } },
      select: { completedAt: true },
    }),
  ]);

  const map = new Map<string, number>();
  const bump = (d: Date | null) => {
    if (!d) return;
    const key = d.toISOString().slice(0, 10);
    map.set(key, (map.get(key) ?? 0) + 1);
  };
  subs.forEach((s) => bump(s.createdAt));
  lessons.forEach((l) => bump(l.completedAt));

  return [...map.entries()].map(([date, count]) => ({ date, count }));
}
