"use server";

import crypto from "node:crypto";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { currentUserId } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashAnswer, listChallenges } from "@/lib/challenges";
import { evaluateAchievements } from "@/lib/gamification/evaluate";
import {
  POINTS_BY_DIFFICULTY,
  CATEGORY_META,
  type ChallengeDifficulty,
  type AnswerType,
} from "@/lib/challenges/config";

function slugify(s: string): string {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "challenge"
  );
}

export interface ChallengeFormState {
  error: string | null;
}

/**
 * Create a community challenge from the authoring form. useFormState-shaped: on
 * a validation error it RETURNS the message (no redirect) so the form stays
 * mounted and keeps everything the user typed; only success navigates away.
 */
export async function createChallenge(
  _prev: ChallengeFormState,
  formData: FormData,
): Promise<ChallengeFormState> {
  const userId = await currentUserId();
  if (!userId) redirect("/login");

  const get = (k: string) => String(formData.get(k) ?? "").trim();
  const title = get("title");
  const summary = get("summary");
  const track = get("track") === "break" ? "break" : "make";
  const category = get("category");
  const difficulty = (["EASY", "MEDIUM", "HARD", "INSANE"].includes(get("difficulty"))
    ? get("difficulty")
    : "EASY") as ChallengeDifficulty;
  const body = get("body");
  const answer = get("answer");
  const answerType = (["number", "text", "flag"].includes(get("answerType"))
    ? get("answerType")
    : "text") as AnswerType;
  const starter = get("starter");
  const starterLang = get("starterLang") || "python";
  const hints = get("hints")
    .split("\n")
    .map((h) => h.trim())
    .filter(Boolean)
    .slice(0, 5);

  if (!title || !summary || !body || !answer) {
    return { error: "Title, summary, description, and answer are all required." };
  }
  if (!CATEGORY_META[category] || CATEGORY_META[category].track !== track) {
    return { error: "Pick a category that matches the track." };
  }

  const caseSensitive = answerType === "flag";
  const answerHash = hashAnswer(answer, answerType, caseSensitive);
  const points = POINTS_BY_DIFFICULTY[difficulty] ?? 50;

  // Unique slug across both file and DB challenges.
  const fileSlugs = new Set(listChallenges().map((c) => c.slug));
  let slug = "";
  for (let i = 0; i < 5; i++) {
    const candidate = `${slugify(title)}-${crypto.randomBytes(3).toString("hex")}`;
    if (fileSlugs.has(candidate)) continue;
    const exists = await prisma.challenge.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!exists) {
      slug = candidate;
      break;
    }
  }
  if (!slug) return { error: "Could not generate a unique link. Try a slightly different title." };

  await prisma.challenge.create({
    data: {
      slug,
      authorId: userId,
      title,
      summary,
      track,
      category,
      difficulty,
      points,
      body,
      starter: starter || null,
      starterLang,
      answerHash,
      answerType,
      caseSensitive,
      hints,
      status: "PUBLISHED",
    },
  });

  await evaluateAchievements(userId).catch(() => {});
  revalidatePath("/learn");
  redirect(`/challenges/${slug}`);
}

/** Toggle the current user's upvote on a community challenge. */
export async function toggleChallengeVote(
  slug: string,
): Promise<{ upvotes: number; voted: boolean }> {
  const userId = await currentUserId();
  const challenge = await prisma.challenge.findUnique({
    where: { slug },
    select: { id: true, upvoteCount: true },
  });
  if (!userId || !challenge) return { upvotes: challenge?.upvoteCount ?? 0, voted: false };

  const existing = await prisma.challengeVote.findUnique({
    where: { userId_challengeId: { userId, challengeId: challenge.id } },
  });

  if (existing) {
    const [, updated] = await prisma.$transaction([
      prisma.challengeVote.delete({ where: { id: existing.id } }),
      prisma.challenge.update({
        where: { id: challenge.id },
        data: { upvoteCount: { decrement: 1 } },
        select: { upvoteCount: true },
      }),
    ]);
    revalidatePath("/learn");
    return { upvotes: updated.upvoteCount, voted: false };
  }

  const [, updated] = await prisma.$transaction([
    prisma.challengeVote.create({ data: { userId, challengeId: challenge.id } }),
    prisma.challenge.update({
      where: { id: challenge.id },
      data: { upvoteCount: { increment: 1 } },
      select: { upvoteCount: true },
    }),
  ]);
  revalidatePath("/learn");
  return { upvotes: updated.upvoteCount, voted: true };
}

export interface ChallengeCommentDTO {
  id: string;
  body: string;
  author: string;
  createdAt: string;
}

/** Post a comment on a challenge's discussion. Returns the created comment. */
export async function postChallengeComment(
  slug: string,
  body: string,
): Promise<ChallengeCommentDTO | null> {
  const userId = await currentUserId();
  if (!userId) return null;
  const text = body.trim();
  if (!text) return null;

  const c = await prisma.challengeComment.create({
    data: { slug, authorId: userId, body: text.slice(0, 5000) },
    include: { author: { select: { username: true } } },
  });
  revalidatePath(`/challenges/${slug}`);
  return {
    id: c.id,
    body: c.body,
    author: c.author?.username ?? "someone",
    createdAt: c.createdAt.toISOString(),
  };
}
