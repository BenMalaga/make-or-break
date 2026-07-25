"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { hashFlag } from "@/lib/flags";
import { recordActivity } from "@/lib/gamification/apply";
import { evaluateAchievements } from "@/lib/gamification/evaluate";
import { POINTS, rankTitleForPoints } from "@/lib/gamification";

export type SubmitFlagResult =
  | { result: "CORRECT"; flagLabel: string; points: number; firstBlood: boolean }
  | { result: "INCORRECT" }
  | { result: "DUPLICATE"; flagLabel: string }
  | { result: "RATE_LIMITED" };

const RATE_WINDOW_MS = 30_000;
const RATE_MAX = 10;

/**
 * Validate a flag submission. Hashes server-side and compares to the stored
 * SHA-256 (never stores plaintext). Awards points, records the owning, detects
 * first blood on root, and logs anti-cheat metadata (ip, ua, submitted hash).
 */
export async function submitFlag(
  machineId: string,
  rawFlag: string,
): Promise<SubmitFlagResult> {
  const user = await requireUser();
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = h.get("user-agent") ?? null;

  // Basic rate limit (Redis-backed in Phase 4; DB-count for now).
  const recent = await prisma.flagSubmission.count({
    where: { userId: user.id, createdAt: { gte: new Date(Date.now() - RATE_WINDOW_MS) } },
  });
  if (recent >= RATE_MAX) {
    await prisma.flagSubmission.create({
      data: { userId: user.id, machineId, submittedHash: "", result: "RATE_LIMITED", ip, userAgent },
    });
    return { result: "RATE_LIMITED" };
  }

  const submittedHash = hashFlag(rawFlag);
  const flags = await prisma.flag.findMany({ where: { machineId } });
  const matched = flags.find((f) =>
    f.perUserSalted ? f.hash === hashFlag(rawFlag, user.id) : f.hash === submittedHash,
  );

  if (!matched) {
    await prisma.flagSubmission.create({
      data: { userId: user.id, machineId, submittedHash, result: "INCORRECT", ip, userAgent },
    });
    return { result: "INCORRECT" };
  }

  const progress = await prisma.machineProgress.findUnique({
    where: { userId_machineId: { userId: user.id, machineId } },
  });
  const alreadyOwned = matched.type === "USER" ? progress?.userOwned : progress?.rootOwned;
  if (alreadyOwned) {
    await prisma.flagSubmission.create({
      data: { userId: user.id, machineId, flagId: matched.id, submittedHash, result: "DUPLICATE", ip, userAgent },
    });
    return { result: "DUPLICATE", flagLabel: matched.label };
  }

  const ownFields =
    matched.type === "USER"
      ? { userOwned: true, userOwnedAt: new Date() }
      : { rootOwned: true, rootOwnedAt: new Date() };

  // Claim the own transition atomically: ensure the progress row exists, then
  // flip not-owned -> owned in a single guarded update. Only the request that
  // actually flips it (count === 1) awards, so two concurrent correct
  // submissions cannot both pass the "already owned" check and double-award.
  const basePoints = matched.points;
  await prisma.machineProgress.upsert({
    where: { userId_machineId: { userId: user.id, machineId } },
    create: { userId: user.id, machineId },
    update: {},
  });
  const claimed = await prisma.machineProgress.updateMany({
    where: {
      userId: user.id,
      machineId,
      ...(matched.type === "USER" ? { userOwned: false } : { rootOwned: false }),
    },
    data: { ...ownFields, pointsEarned: { increment: basePoints } },
  });
  if (claimed.count === 0) {
    // Lost the race: a concurrent submission already claimed this own.
    await prisma.flagSubmission.create({
      data: { userId: user.id, machineId, flagId: matched.id, submittedHash, result: "DUPLICATE", ip, userAgent },
    });
    return { result: "DUPLICATE", flagLabel: matched.label };
  }

  // First blood on ROOT: claim it atomically so only one submission wins the
  // bonus even under concurrency. ownsCount increments on every root own.
  let firstBlood = false;
  let points = basePoints;
  if (matched.type === "ROOT") {
    const claimedFb = await prisma.machine.updateMany({
      where: { id: machineId, firstBloodUserId: null },
      data: { firstBloodUserId: user.id, firstBloodAt: new Date() },
    });
    firstBlood = claimedFb.count === 1;
    if (firstBlood) {
      points += POINTS.FIRST_BLOOD_BONUS;
      await prisma.machineProgress.update({
        where: { userId_machineId: { userId: user.id, machineId } },
        data: { pointsEarned: { increment: POINTS.FIRST_BLOOD_BONUS } },
      });
    }
    await prisma.machine.update({
      where: { id: machineId },
      data: { ownsCount: { increment: 1 } },
    });
  }

  await prisma.flagSubmission.create({
    data: {
      userId: user.id,
      machineId,
      flagId: matched.id,
      submittedHash,
      result: "CORRECT",
      isFirstBlood: firstBlood,
      pointsAwarded: points,
      ip,
      userAgent,
    },
  });

  await recordActivity(user.id, points);
  await evaluateAchievements(user.id);
  revalidatePath(`/machines`);
  return { result: "CORRECT", flagLabel: matched.label, points, firstBlood };
}

/** Toggle a machine task's completion for the current user. */
export async function toggleTask(taskId: string, done: boolean) {
  const user = await requireUser();
  if (done) {
    await prisma.machineTaskCompletion.upsert({
      where: { taskId_userId: { taskId, userId: user.id } },
      create: { taskId, userId: user.id },
      update: {},
    });
  } else {
    await prisma.machineTaskCompletion.deleteMany({ where: { taskId, userId: user.id } });
  }
  return { ok: true as const };
}

/** Unlock a progressive hint, deducting its point cost once. */
export async function unlockHint(hintId: string) {
  const user = await requireUser();
  const hint = await prisma.hint.findUnique({ where: { id: hintId } });
  if (!hint) return { ok: false as const, error: "Hint not found" };

  const existing = await prisma.hintUnlock.findUnique({
    where: { userId_hintId: { userId: user.id, hintId } },
  });
  if (existing) return { ok: true as const, body: hint.body };

  await prisma.hintUnlock.create({
    data: { userId: user.id, hintId, pointCost: hint.pointCost },
  });

  if (hint.pointCost > 0) {
    const u = await prisma.user.findUnique({
      where: { id: user.id },
      select: { points: true },
    });
    const points = Math.max(0, (u?.points ?? 0) - hint.pointCost);
    await prisma.user.update({
      where: { id: user.id },
      data: { points, rankTitle: rankTitleForPoints(points) },
    });
  }
  revalidatePath("/machines");
  return { ok: true as const, body: hint.body };
}
