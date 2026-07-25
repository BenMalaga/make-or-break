/** The UTC dateKey one day before the given one. */
export function prevKey(dateKey: string): string {
  const t = Date.parse(`${dateKey}T00:00:00Z`) - 86_400_000;
  return new Date(t).toISOString().slice(0, 10);
}

/**
 * Current daily streak: the run of consecutive solved days ending today (or
 * yesterday if today's drop is not solved yet, so an unfinished today does not
 * break a live streak). Pure; safe to import anywhere.
 */
export function currentStreak(solvedKeys: Set<string>, today: string): number {
  let cursor = today;
  if (!solvedKeys.has(cursor)) cursor = prevKey(cursor);
  let streak = 0;
  while (solvedKeys.has(cursor)) {
    streak++;
    cursor = prevKey(cursor);
  }
  return streak;
}
