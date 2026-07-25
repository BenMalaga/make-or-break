import { NextResponse } from "next/server";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getChallengeAnySource, checkAnswerAnySource } from "@/lib/challenges";
import { evaluateAchievements } from "@/lib/gamification/evaluate";
import { recordActivity } from "@/lib/gamification/apply";

/**
 * POST /api/challenges/[slug]/submit  { answer: string }
 *
 * Judges a submitted answer server-side against either an official (file) or a
 * community (DB, hashed) challenge. The canonical answer never reaches the
 * client. On a first correct solve it records a ChallengeSolve, awards points,
 * and bumps the community challenge's solve count. Works for guests too.
 */
export async function POST(req: Request, props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const userId = await currentUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = params;
  const challenge = await getChallengeAnySource(slug);
  if (!challenge) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = (await req.json().catch(() => null)) as { answer?: unknown } | null;
  const submission = typeof body?.answer === "string" ? body.answer : "";
  if (!submission.trim()) {
    return NextResponse.json({ error: "Empty answer" }, { status: 400 });
  }

  const existing = await prisma.challengeSolve.findUnique({
    where: { userId_slug: { userId, slug } },
    select: { solved: true, attempts: true },
  });
  const alreadySolved = existing?.solved ?? false;

  // Attempt cap on an unsolved challenge: stop scripted brute-force of a small
  // answer keyspace (and the per-attempt disk read + DB write amplification).
  const MAX_ATTEMPTS = 100;
  if (!alreadySolved && (existing?.attempts ?? 0) >= MAX_ATTEMPTS) {
    return NextResponse.json(
      { error: "Too many attempts. Take a break and try again later." },
      { status: 429 },
    );
  }

  const correct = (await checkAnswerAnySource(slug, submission)) === true;
  const points = challenge.meta.points;

  // Always record the attempt.
  await prisma.challengeSolve.upsert({
    where: { userId_slug: { userId, slug } },
    create: { userId, slug, attempts: 1, solved: false },
    update: { attempts: { increment: 1 } },
  });

  let pointsAwarded = 0;
  if (correct && !alreadySolved) {
    // Flip unsolved -> solved atomically; only the request that actually flips
    // it awards, so concurrent correct submissions cannot double-award (TOCTOU).
    const flipped = await prisma.challengeSolve.updateMany({
      where: { userId, slug, solved: false },
      data: { solved: true, solvedAt: new Date(), pointsEarned: points },
    });
    if (flipped.count === 1) {
      pointsAwarded = points;
      if (challenge.source === "db") {
        await prisma.challenge.update({ where: { slug }, data: { solveCount: { increment: 1 } } });
      }
      // Funnel the point award through recordActivity so points, the cached
      // rankTitle, and the daily streak all stay consistent.
      await recordActivity(userId, points);
      await evaluateAchievements(userId).catch(() => {});
    }
  }

  return NextResponse.json({
    correct,
    alreadySolved,
    solved: correct || alreadySolved,
    pointsAwarded,
  });
}
