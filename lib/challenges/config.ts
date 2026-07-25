/**
 * Client-safe challenge config: types plus display metadata for categories and
 * difficulty. No filesystem access and no answers, so this is safe to import
 * from client components. The server-only loader and answer check live in
 * ./index.ts.
 */

export type ChallengeTrack = "make" | "break";
export type ChallengeDifficulty = "EASY" | "MEDIUM" | "HARD" | "INSANE";
export type AnswerType = "number" | "text" | "flag";

/** Everything the client is allowed to see about a challenge. No answer. */
export interface ChallengeMeta {
  slug: string;
  title: string;
  summary: string;
  track: ChallengeTrack;
  category: string;
  difficulty: ChallengeDifficulty;
  points: number;
  tags: string[];
  answerType: AnswerType;
  /** Language the editor opens in (must be one of lib/build/run.ts LANGUAGES). */
  starterLang?: string;
  /** Optional starter code dropped into the editor. */
  starter?: string;
  hints: string[];
  /** True when this challenge is curated for the Daily Drop bank. */
  daily?: boolean;
  /** Set for community-authored (DB) challenges: the author's username. */
  author?: string;
  /** True when this is a community-created challenge (not official content). */
  community?: boolean;
  /** Upvotes on a community challenge. */
  upvotes?: number;
}

export const DIFFICULTY_ORDER: ChallengeDifficulty[] = ["EASY", "MEDIUM", "HARD", "INSANE"];

export const DIFFICULTY_LABEL: Record<ChallengeDifficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  INSANE: "Insane",
};

/**
 * Semantic-token classes per difficulty (text + subtle background). These use
 * the Catppuccin difficulty tokens (globals.css) so challenges match the rest of
 * the app (DifficultyBadge, paths, certs) and flip correctly with the theme,
 * instead of hard-coded raw Tailwind weights. The literal strings are here in
 * full so Tailwind's JIT includes them.
 */
export const DIFFICULTY_CLASS: Record<ChallengeDifficulty, string> = {
  EASY: "text-easy bg-easy/10 border-easy/20",
  MEDIUM: "text-medium bg-medium/10 border-medium/20",
  HARD: "text-hard bg-hard/10 border-hard/20",
  INSANE: "text-insane bg-insane/10 border-insane/20",
};

export const POINTS_BY_DIFFICULTY: Record<ChallengeDifficulty, number> = {
  EASY: 50,
  MEDIUM: 100,
  HARD: 200,
  INSANE: 350,
};

export interface CategoryMeta {
  label: string;
  icon: string; // lucide icon name
  track: ChallengeTrack;
  blurb: string;
}

/**
 * Categories, each pinned to a track. Make = build/compute; Break = capture the
 * flag. Only categories that a browser IDE + a submitted answer can actually
 * grade are listed (no live pwn/binary targets).
 */
export const CATEGORY_META: Record<string, CategoryMeta> = {
  // Make
  code: { label: "Code", icon: "Code2", track: "make", blurb: "Write a program that produces the answer." },
  logic: { label: "Logic", icon: "Braces", track: "make", blurb: "Reason it out, then prove it in code." },
  algorithms: { label: "Algorithms", icon: "Binary", track: "make", blurb: "Efficiency and the right data structure." },
  math: { label: "Math", icon: "Sigma", track: "make", blurb: "Number theory and computation." },
  // Break
  crypto: { label: "Cryptography", icon: "KeyRound", track: "break", blurb: "Break the encoding or the cipher." },
  forensics: { label: "Forensics", icon: "Search", track: "break", blurb: "Dig the answer out of the data." },
  web: { label: "Web", icon: "Globe", track: "break", blurb: "Find the flaw in how the app handles input." },
  misc: { label: "Misc", icon: "Shapes", track: "break", blurb: "Puzzles that do not fit a box." },
};

export function categoryMeta(category: string): CategoryMeta {
  return (
    CATEGORY_META[category] ?? {
      label: category,
      icon: "Puzzle",
      track: "break",
      blurb: "",
    }
  );
}

/** Placeholder text for the answer field, by answer type. */
export function answerPlaceholder(type: AnswerType): string {
  switch (type) {
    case "number":
      return "Enter the number";
    case "flag":
      return "MOB{...}";
    default:
      return "Enter your answer";
  }
}
