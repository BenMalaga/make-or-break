"use server";

import { getChallenge, checkAnswer } from "@/lib/challenges";
import { todayKey, dropForDate, dropNumber } from "@/lib/daily";
import type { AnswerType, ChallengeDifficulty, ChallengeTrack } from "@/lib/challenges/config";

export interface DailyDropView {
  dateKey: string;
  /** The drop's challenge slug; the client needs it to record the solve. */
  slug: string;
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
  /** Always 0: solve state lives in the browser store, so the client computes the streak. */
  streak: number;
}

/** Today's drop. No answer ever leaves the server. */
export async function getTodayDrop(): Promise<DailyDropView | null> {
  const dateKey = todayKey();
  const slug = dropForDate(dateKey);
  if (!slug) return null;

  const challenge = getChallenge(slug);
  if (!challenge) return null;

  return {
    dateKey,
    slug,
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
    streak: 0,
  };
}

export interface DailySubmitResult {
  correct: boolean;
  error?: string;
}

/**
 * Grade a submitted answer for TODAY's drop. The server recomputes the slug
 * from the date, so a client cannot claim an arbitrary challenge as today's.
 * Nothing is stored or awarded here: the client records the result in its local
 * store, where recordDaily awards the points once (idempotent) and tracks
 * attempts, so the attempt cap is enforced client-side too.
 */
export async function submitDailyDrop(answer: string): Promise<DailySubmitResult> {
  const dateKey = todayKey();
  const slug = dropForDate(dateKey);
  if (!slug) return fail("There is no drop today.");

  const submission = (answer ?? "").trim();
  if (!submission) return fail("Enter an answer first.");

  return { correct: checkAnswer(slug, submission) === true };
}

function fail(msg: string): DailySubmitResult {
  return { correct: false, error: msg };
}
