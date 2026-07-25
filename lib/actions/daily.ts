"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { getChallengeAnySource, checkAnswerAnySource } from "@/lib/challenges";
import { recordActivity } from "@/lib/gamification/apply";
import { todayKey, dropForDate, dropNumber } from "@/lib/daily";
import { currentStreak } from "@/lib/daily/streak";
import type { AnswerType, ChallengeDifficulty, ChallengeTrack } from "@/lib/challenges/config";

const DAILY_POINTS = 25;
const MAX_ATTEMPTS = 100;

export interface DailyDropView {
  dateKey: string;
  dropNumber: number;
  meta: {
    title: string;
    summary: string;
    category: string;
    difficulty: ChallengeDifficulty;
    answerType: AnswerType;
    track: ChallengeTrack;
    hints: string[];
  };
  body: string;
  state: { solved: boolean; attempts: number; solvedAt: string | null };
  streak: number;
}

async function computeStreak(userId: string, today: string): Promise<number> {
  const rows = await prisma.dailyDropSolve.findMany({
    where: { userId, solved: true },
    select: { dateKey: true },
  });
  return currentStreak(new Set(rows.map((r) => r.dateKey)), today);
}

/** Today's drop for the current user (no answer leaves the server). */
export async function getTodayDrop(): Promise<DailyDropView | null> {
  const user = await requireUser();
  const dateKey = todayKey();
  const slug = dropForDate(dateKey);
  if (!slug) return null;

  const challenge = await getChallengeAnySource(slug);
  if (!challenge) return null;

  // Ensure the row exists so time-to-solve counts from the first view.
  const row = await prisma.dailyDropSolve.upsert({
    where: { userId_dateKey: { userId: user.id, dateKey } },
    create: { userId: user.id, dateKey, slug },
    update: {},
  });

  return {
    dateKey,
    dropNumber: dropNumber(dateKey),
    meta: {
      title: challenge.meta.title,
      summary: challenge.meta.summary,
      category: challenge.meta.category,
      difficulty: challenge.meta.difficulty,
      answerType: challenge.meta.answerType,
      track: challenge.meta.track,
      hints: challenge.meta.hints,
    },
    body: challenge.body,
    state: {
      solved: row.solved,
      attempts: row.attempts,
      solvedAt: row.solvedAt?.toISOString() ?? null,
    },
    streak: await computeStreak(user.id, dateKey),
  };
}

export interface DailySubmitResult {
  correct: boolean;
  solved: boolean;
  attempts: number;
  streak: number;
  pointsAwarded: number;
  error?: string;
}

/**
 * Grade a submitted answer for TODAY's drop. The server recomputes the slug from
 * the date, so the client cannot claim an arbitrary challenge as today's. Only
 * the first correct solve awards points, guarded by an atomic flip.
 */
export async function submitDailyDrop(answer: string): Promise<DailySubmitResult> {
  const user = await requireUser();
  const dateKey = todayKey();
  const slug = dropForDate(dateKey);
  if (!slug) return fail("There is no drop today.");

  const submission = (answer ?? "").trim();
  if (!submission) return fail("Enter an answer first.");

  const row = await prisma.dailyDropSolve.upsert({
    where: { userId_dateKey: { userId: user.id, dateKey } },
    create: { userId: user.id, dateKey, slug },
    update: {},
  });

  if (row.solved) {
    return {
      correct: true,
      solved: true,
      attempts: row.attempts,
      streak: await computeStreak(user.id, dateKey),
      pointsAwarded: 0,
    };
  }
  if (row.attempts >= MAX_ATTEMPTS) {
    return fail("Too many attempts today. Come back for tomorrow's drop.");
  }

  const correct = (await checkAnswerAnySource(slug, submission)) === true;
  await prisma.dailyDropSolve.update({
    where: { id: row.id },
    data: { attempts: { increment: 1 } },
  });

  let pointsAwarded = 0;
  if (correct) {
    const flip = await prisma.dailyDropSolve.updateMany({
      where: { id: row.id, solved: false },
      data: { solved: true, solvedAt: new Date() },
    });
    if (flip.count === 1) {
      pointsAwarded = DAILY_POINTS;
      await recordActivity(user.id, DAILY_POINTS);
    }
  }

  revalidatePath("/daily");
  return {
    correct,
    solved: correct,
    attempts: row.attempts + 1,
    streak: await computeStreak(user.id, dateKey),
    pointsAwarded,
  };
}

function fail(msg: string): DailySubmitResult {
  return { correct: false, solved: false, attempts: 0, streak: 0, pointsAwarded: 0, error: msg };
}
