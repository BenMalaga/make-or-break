import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

/**
 * GET /api/me/export - download all of the current user's progress + writeups
 * as JSON. Portable, so a user never feels locked in. (The localStorage import
 * from the personal-app era is unnecessary now that data lives in Postgres.)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const [user, lessonProgress, machineProgress, submissions, writeups, hintUnlocks, achievements] =
    await Promise.all([
      prisma.user.findUnique({
        where: { id: userId },
        select: {
          username: true, email: true, points: true, rankTitle: true,
          streakCount: true, longestStreak: true, createdAt: true,
        },
      }),
      prisma.lessonProgress.findMany({
        where: { userId },
        include: { lesson: { select: { slug: true, title: true } } },
      }),
      prisma.machineProgress.findMany({
        where: { userId },
        include: { machine: { select: { slug: true, name: true } } },
      }),
      prisma.flagSubmission.findMany({
        where: { userId, result: "CORRECT" },
        include: { machine: { select: { slug: true } } },
      }),
      prisma.writeup.findMany({ where: { userId } }),
      prisma.hintUnlock.findMany({ where: { userId } }),
      prisma.userAchievement.findMany({
        where: { userId },
        include: { achievement: { select: { code: true, name: true } } },
      }),
    ]);

  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    user,
    lessonProgress,
    machineProgress,
    submissions,
    writeups,
    hintUnlocks,
    achievements,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="make-or-break-${user?.username ?? "data"}.json"`,
    },
  });
}
