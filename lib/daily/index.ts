import "server-only";
import { listChallenges } from "@/lib/challenges";

/**
 * The Daily Drop selection logic. SERVER ONLY (reads the challenge files). The
 * drop for a given UTC day is chosen deterministically by hashing the date, so
 * every learner gets the same drop and the client never needs the whole bank or
 * any answer. The server passes only the chosen slug to the client.
 */

// The day the Daily Drop launched, used to number the drops.
const EPOCH = "2026-07-20";

/** UTC calendar day "YYYY-MM-DD" for a Date (toISOString is UTC). */
export function dateKeyOf(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/** Today's UTC dateKey. */
export function todayKey(): string {
  return dateKeyOf(new Date());
}

/** Human-facing drop number ("Daily Drop #N"), 1-based from the epoch. */
export function dropNumber(dateKey: string): number {
  const a = Date.parse(`${EPOCH}T00:00:00Z`);
  const b = Date.parse(`${dateKey}T00:00:00Z`);
  return Math.floor((b - a) / 86_400_000) + 1;
}

/** FNV-1a 32-bit hash, deterministic and dependency-free. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** The daily-eligible challenge slugs, sorted for a stable index.
 *  Prefers challenges with `daily: true` frontmatter. Falls back to all
 *  challenges if none are curated, so the drop never stalls. */
export function dailyBank(): string[] {
  const all = listChallenges();
  const curated = all.filter((c) => c.daily);
  const pool = curated.length > 0 ? curated : all;
  return pool
    .map((c) => c.slug)
    .sort();
}

/** The challenge slug that is the drop for the given UTC dateKey, or null. */
export function dropForDate(dateKey: string): string | null {
  const bank = dailyBank();
  if (bank.length === 0) return null;
  return bank[hash(dateKey) % bank.length];
}
