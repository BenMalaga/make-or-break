/**
 * Daily activity streak math. Kept pure + framework-free so it is trivially
 * unit-testable; the server action applies the result to the User row.
 */

function toDayNumber(d: Date): number {
  // Days since epoch in the server's local time. Good enough for a streak; a
  // production build would anchor to the user's timezone.
  return Math.floor(
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() / 86_400_000,
  );
}

export interface StreakUpdate {
  streakCount: number;
  longestStreak: number;
  changed: boolean;
}

export function nextStreak(
  lastActiveOn: Date | null,
  currentStreak: number,
  longestStreak: number,
  now: Date = new Date(),
): StreakUpdate {
  const today = toDayNumber(now);

  if (lastActiveOn == null) {
    return { streakCount: 1, longestStreak: Math.max(1, longestStreak), changed: true };
  }

  const last = toDayNumber(lastActiveOn);
  const gap = today - last;

  if (gap <= 0) {
    // Already active today - no change.
    return { streakCount: currentStreak, longestStreak, changed: false };
  }
  const streakCount = gap === 1 ? currentStreak + 1 : 1;
  return {
    streakCount,
    longestStreak: Math.max(longestStreak, streakCount),
    changed: true,
  };
}
