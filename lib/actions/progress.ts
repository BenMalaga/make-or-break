"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { POINTS } from "@/lib/gamification";
import { recordActivity } from "@/lib/gamification/apply";
import { evaluateAchievements } from "@/lib/gamification/evaluate";

/** Mark a lesson complete. Awards points once (idempotent). */
export async function markLessonComplete(lessonId: string) {
  const user = await requireUser();
  const existing = await prisma.lessonProgress.findUnique({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    select: { completed: true, completedAt: true },
  });
  const wasComplete = existing?.completed ?? false;

  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completed: true, completedAt: new Date() },
    update: { completed: true, completedAt: existing?.completedAt ?? new Date() },
  });

  let awarded = 0;
  let badges: string[] = [];
  if (!wasComplete) {
    awarded = POINTS.LESSON_COMPLETE;
    await recordActivity(user.id, awarded);
    badges = await evaluateAchievements(user.id);
  }
  revalidatePath("/dashboard");
  return { ok: true as const, awarded, badges };
}

/** Reopen a lesson (does not claw back points). */
export async function markLessonIncomplete(lessonId: string) {
  const user = await requireUser();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completed: false },
    update: { completed: false, completedAt: null },
  });
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Persist a lesson's per-user notes. */
export async function setLessonNotes(lessonId: string, notes: string) {
  const user = await requireUser();
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, notes },
    update: { notes },
  });
  return { ok: true as const };
}

/** Persist a lesson's interactive state (quiz answers, exercise checks). */
export async function setLessonInteractive(lessonId: string, data: unknown) {
  const user = await requireUser();
  const json = data as Prisma.InputJsonValue;
  await prisma.lessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, interactive: json },
    update: { interactive: json },
  });
  return { ok: true as const };
}
