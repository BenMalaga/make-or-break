/**
 * Rank ladder. `points` is the cumulative threshold to hold the rank. The
 * user's cached `rankTitle` is recomputed whenever points change.
 */
export interface Rank {
  title: string;
  minPoints: number;
  /** lucide icon name for the rank badge. */
  icon: string;
}

export const RANKS: Rank[] = [
  { title: "Newcomer", minPoints: 0, icon: "Egg" },
  { title: "Script Kiddie", minPoints: 50, icon: "Bug" },
  { title: "Novice", minPoints: 150, icon: "Sprout" },
  { title: "Apprentice", minPoints: 400, icon: "Wrench" },
  { title: "Hacker", minPoints: 800, icon: "Terminal" },
  { title: "Pro Hacker", minPoints: 1600, icon: "Skull" },
  { title: "Elite Hacker", minPoints: 3000, icon: "Zap" },
  { title: "Guru", minPoints: 5000, icon: "Brain" },
  { title: "Master", minPoints: 8000, icon: "Crown" },
  { title: "Legend", minPoints: 12000, icon: "Trophy" },
];

export interface RankProgress {
  current: Rank;
  next: Rank | null;
  /** 0-100 progress toward the next rank (100 if at max rank). */
  percentToNext: number;
  pointsIntoRank: number;
  pointsForNext: number;
}

export function rankForPoints(points: number): RankProgress {
  let current = RANKS[0];
  let next: Rank | null = null;
  for (let i = 0; i < RANKS.length; i++) {
    if (points >= RANKS[i].minPoints) {
      current = RANKS[i];
      next = RANKS[i + 1] ?? null;
    }
  }
  if (!next) {
    return {
      current,
      next: null,
      percentToNext: 100,
      pointsIntoRank: points - current.minPoints,
      pointsForNext: 0,
    };
  }
  const span = next.minPoints - current.minPoints;
  const into = points - current.minPoints;
  return {
    current,
    next,
    percentToNext: Math.min(100, Math.round((into / span) * 100)),
    pointsIntoRank: into,
    pointsForNext: next.minPoints - points,
  };
}

export function rankTitleForPoints(points: number): string {
  return rankForPoints(points).current.title;
}
