import { listChallenges } from "./index";
import type { ChallengeMeta } from "./config";

/**
 * The "challenge of the day": a deterministic pick from the stable pool of
 * official (file) challenges, keyed by the UTC date, so everyone sees the same
 * one on a given day and it rotates at midnight UTC. Community challenges are
 * excluded so the pool does not shift under people mid-day.
 */
export function dailyChallenge(now: Date = new Date()): ChallengeMeta | null {
  const pool = listChallenges().sort((a, b) => a.slug.localeCompare(b.slug));
  if (!pool.length) return null;
  const key = now.toISOString().slice(0, 10); // YYYY-MM-DD (UTC)
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return pool[(h >>> 0) % pool.length];
}
