/**
 * Achievement (badge) definitions. Seeded into the Achievement table; the
 * evaluator in ./evaluate.ts awards UserAchievement rows when conditions are
 * met. `icon` values must exist in the LucideIcon map.
 */
export interface AchievementDef {
  code: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  // Learning
  { code: "first_lesson", name: "First Steps", description: "Complete your first lesson", icon: "Sprout", category: "learning", points: 0 },
  { code: "lessons_10", name: "Getting Serious", description: "Complete 10 lessons", icon: "BookOpen", category: "learning", points: 0 },
  { code: "lessons_50", name: "Scholar", description: "Complete 50 lessons", icon: "GraduationCap", category: "learning", points: 0 },
  { code: "path_complete", name: "Trailblazer", description: "Complete a skill path", icon: "Route", category: "learning", points: 0 },
  // Challenges
  { code: "first_challenge", name: "Puzzle Cracked", description: "Solve your first challenge", icon: "Puzzle", category: "challenges", points: 0 },
  { code: "solve_10", name: "Problem Solver", description: "Solve 10 challenges", icon: "Sigma", category: "challenges", points: 0 },
  { code: "solve_25", name: "Relentless", description: "Solve 25 challenges", icon: "Swords", category: "challenges", points: 0 },
  { code: "first_creation", name: "Challenge Author", description: "Publish your first challenge", icon: "Wand2", category: "community", points: 0 },
  // Consistency
  { code: "streak_7", name: "On Fire", description: "Reach a 7-day activity streak", icon: "Flame", category: "consistency", points: 0 },
  { code: "streak_30", name: "Unstoppable", description: "Reach a 30-day activity streak", icon: "Zap", category: "consistency", points: 0 },
  // Community + machines
  { code: "writeup_published", name: "Documentarian", description: "Publish a write-up", icon: "FileText", category: "community", points: 0 },
  { code: "first_own", name: "Initiate", description: "Root your first machine", icon: "Server", category: "machines", points: 0 },
  { code: "first_blood", name: "First Blood", description: "Be the first to root a machine", icon: "Flag", category: "machines", points: 0 },
  { code: "own_10", name: "Box Collector", description: "Root 10 machines", icon: "Crown", category: "machines", points: 0 },
];
