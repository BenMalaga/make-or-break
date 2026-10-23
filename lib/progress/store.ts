"use client";

import { useEffect, useState } from "react";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { ACHIEVEMENTS } from "@/lib/gamification/achievements";
import { POINTS, tagToCategory, type SkillCategory } from "@/lib/gamification/points";
import { rankForPoints, type RankProgress } from "@/lib/gamification/ranks";

/**
 * The whole progress system, client-side. There is no account and no server:
 * everything the learner does lives here and persists to localStorage under
 * "mob.progress.v1". Content (lessons, challenges, machines) is read from MDX
 * by server components; this store only holds what the learner did and earned.
 *
 * Design notes:
 * - A points ledger (`events`) is the single source of truth for points, the
 *   activity heatmap, and streaks. Derived values are computed by selectors,
 *   never stored, so nothing can drift out of sync.
 * - Badge awarding is inline in the mutating actions: each action returns the
 *   codes of badges newly earned so callers can toast them.
 * - Consumers must gate progress-dependent rendering on `useProgressHydrated`
 *   (the persisted store rehydrates after mount) to avoid SSR mismatches.
 */

export interface QuizRecord {
  selected: number;
  correct: boolean;
}

export interface InteractiveState {
  quizzes: Record<string, QuizRecord>;
  exercises: Record<string, boolean>;
}

export interface LessonProgress {
  completedAt?: number;
  notes?: string;
  interactive?: InteractiveState;
}

export interface SolveRecord {
  solvedAt: number;
  attempts: number;
  points: number;
}

export interface DailyRecord {
  slug: string;
  attempts: number;
  solvedAt?: number;
  points: number;
}

export interface FlagRecord {
  at: number;
  points: number;
  kind: "USER" | "ROOT";
}

export interface MachineProgressLocal {
  flags: Record<string, FlagRecord>;
  tasks: Record<string, boolean>;
  hints: string[];
}

export interface ExamRecord {
  cert: string;
  mode: string;
  score: number;
  passed: boolean;
  correctCount: number;
  totalCount: number;
  at: number;
}

export interface ProgressEvent {
  t: number;
  kind: "lesson" | "challenge" | "daily" | "flag" | "first_blood" | "exam" | "hint";
  ref: string;
  points: number;
}

interface ProgressState {
  lessons: Record<string, LessonProgress>;
  challenges: Record<string, SolveRecord>;
  daily: Record<string, DailyRecord>;
  machines: Record<string, MachineProgressLocal>;
  exams: ExamRecord[];
  badges: Record<string, number>;
  events: ProgressEvent[];
  completeLesson: (slug: string) => string[];
  reopenLesson: (slug: string) => void;
  setNotes: (slug: string, notes: string) => void;
  setInteractive: (slug: string, data: InteractiveState) => void;
  bumpChallengeAttempts: (slug: string) => void;
  solveChallenge: (slug: string, points: number) => string[];
  recordDaily: (dateKey: string, slug: string, correct: boolean, points: number) => string[];
  recordFlag: (
    machineSlug: string,
    flagKey: string,
    kind: "USER" | "ROOT",
    points: number,
  ) => string[];
  toggleTask: (machineSlug: string, taskId: string, done: boolean) => void;
  unlockHint: (machineSlug: string, hintKey: string, cost: number) => boolean;
  addExam: (record: ExamRecord) => string[];
  exportJSON: () => string;
}

const MAX_EVENTS = 4000;

function pushEvent(
  events: ProgressEvent[],
  kind: ProgressEvent["kind"],
  ref: string,
  points: number,
): ProgressEvent[] {
  const next = [...events, { t: Date.now(), kind, ref, points }];
  return next.length > MAX_EVENTS ? next.slice(next.length - MAX_EVENTS) : next;
}

/** Day key (YYYY-MM-DD) in the browser's local time. */
export function dayKeyOf(t: number): string {
  const d = new Date(t);
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

/**
 * Badge rules, evaluated over local state. Mirrors the old server evaluator,
 * minus achievements for features that needed accounts (community, write-ups)
 * and global firsts (first blood), which have no meaning without a server.
 */
function earnedCodes(s: {
  lessons: Record<string, LessonProgress>;
  challenges: Record<string, SolveRecord>;
  machines: Record<string, MachineProgressLocal>;
  events: ProgressEvent[];
}): string[] {
  const lessonsDone = Object.values(s.lessons).filter((l) => l.completedAt).length;
  const solves = Object.keys(s.challenges).length;
  const rootOwned = Object.values(s.machines).filter((m) =>
    Object.values(m.flags).some((f) => f.kind === "ROOT"),
  ).length;
  const streak = longestStreakFrom(s.events);
  const want: string[] = [];
  if (lessonsDone >= 1) want.push("first_lesson");
  if (lessonsDone >= 10) want.push("lessons_10");
  if (lessonsDone >= 50) want.push("lessons_50");
  if (solves >= 1) want.push("first_challenge");
  if (solves >= 10) want.push("solve_10");
  if (solves >= 25) want.push("solve_25");
  if (streak >= 7) want.push("streak_7");
  if (streak >= 30) want.push("streak_30");
  if (rootOwned >= 1) want.push("first_own");
  if (rootOwned >= 10) want.push("own_10");
  return want;
}

function newBadges(
  want: string[],
  earned: Record<string, number>,
): { badges: Record<string, number>; fresh: string[] } {
  const fresh = want.filter((c) => !(c in earned));
  if (!fresh.length) return { badges: earned, fresh };
  const next = { ...earned };
  for (const c of fresh) next[c] = Date.now();
  return { badges: next, fresh };
}

function activeDaySet(events: ProgressEvent[]): Set<string> {
  return new Set(events.filter((e) => e.points > 0).map((e) => dayKeyOf(e.t)));
}

/** Longest run of consecutive activity days in the ledger (local days). */
export function longestStreakFrom(events: ProgressEvent[]): number {
  const sorted = [...activeDaySet(events)].sort();
  let best = 0;
  let run = 0;
  let prev: number | null = null;
  for (const key of sorted) {
    const n = Math.floor(new Date(`${key}T12:00:00`).getTime() / 86_400_000);
    run = prev !== null && n - prev === 1 ? run + 1 : 1;
    prev = n;
    if (run > best) best = run;
  }
  return best;
}

/** Current streak: consecutive active days ending today, or yesterday if today has none yet. */
export function currentStreakFrom(events: ProgressEvent[]): number {
  const days = activeDaySet(events);
  const cursor = new Date();
  if (!days.has(dayKeyOf(cursor.getTime()))) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  for (let i = 0; i < 3650; i++) {
    const key = dayKeyOf(cursor.getTime());
    if (!days.has(key)) break;
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export const useProgress = create<ProgressState>()(
  persist(
    (set, get) => ({
      lessons: {},
      challenges: {},
      daily: {},
      machines: {},
      exams: [],
      badges: {},
      events: [],

      completeLesson: (slug) => {
        const s = get();
        if (s.lessons[slug]?.completedAt) return [];
        const events = pushEvent(s.events, "lesson", slug, POINTS.LESSON_COMPLETE);
        const lessons = {
          ...s.lessons,
          [slug]: { ...s.lessons[slug], completedAt: Date.now() },
        };
        const want = earnedCodes({ ...s, lessons, events });
        const { badges, fresh } = newBadges(want, s.badges);
        set({ lessons, events, badges });
        return fresh;
      },

      reopenLesson: (slug) => {
        const s = get();
        const cur = s.lessons[slug];
        if (!cur) return;
        const { completedAt: _drop, ...rest } = cur;
        set({ lessons: { ...s.lessons, [slug]: rest } });
      },

      setNotes: (slug, notes) => {
        const s = get();
        set({ lessons: { ...s.lessons, [slug]: { ...s.lessons[slug], notes } } });
      },

      setInteractive: (slug, data) => {
        const s = get();
        set({
          lessons: { ...s.lessons, [slug]: { ...s.lessons[slug], interactive: data } },
        });
      },

      bumpChallengeAttempts: (slug) => {
        const s = get();
        const cur = s.challenges[slug];
        set({
          challenges: {
            ...s.challenges,
            [slug]: {
              solvedAt: cur?.solvedAt ?? 0,
              attempts: (cur?.attempts ?? 0) + 1,
              points: cur?.points ?? 0,
            },
          },
        });
      },

      solveChallenge: (slug, points) => {
        const s = get();
        const cur = s.challenges[slug];
        if (cur?.solvedAt) return [];
        const events = pushEvent(s.events, "challenge", slug, points);
        const challenges = {
          ...s.challenges,
          [slug]: { solvedAt: Date.now(), attempts: (cur?.attempts ?? 0) + 1, points },
        };
        const want = earnedCodes({ ...s, challenges, events });
        const { badges, fresh } = newBadges(want, s.badges);
        set({ challenges, events, badges });
        return fresh;
      },

      recordDaily: (dateKey, slug, correct, points) => {
        const s = get();
        const prev = s.daily[dateKey] ?? { slug, attempts: 0, points: 0 };
        const already = Boolean(prev.solvedAt);
        const next: DailyRecord = {
          slug,
          attempts: prev.attempts + 1,
          solvedAt: already ? prev.solvedAt : correct ? Date.now() : undefined,
          points: already ? prev.points : correct ? points : prev.points,
        };
        let events = s.events;
        if (correct && !already) events = pushEvent(events, "daily", slug, points);
        const want = earnedCodes({ ...s, events });
        const { badges, fresh } = newBadges(want, s.badges);
        set({ daily: { ...s.daily, [dateKey]: next }, events, badges });
        return fresh;
      },

      recordFlag: (machineSlug, flagKey, kind, points) => {
        const s = get();
        const m = s.machines[machineSlug] ?? { flags: {}, tasks: {}, hints: [] };
        if (m.flags[flagKey]) return [];
        const events = pushEvent(
          s.events,
          kind === "ROOT" ? "first_blood" : "flag",
          `${machineSlug}:${flagKey}`,
          points,
        );
        const machines = {
          ...s.machines,
          [machineSlug]: {
            ...m,
            flags: { ...m.flags, [flagKey]: { at: Date.now(), points, kind } },
          },
        };
        const want = earnedCodes({ ...s, machines, events });
        const { badges, fresh } = newBadges(want, s.badges);
        set({ machines, events, badges });
        return fresh;
      },

      toggleTask: (machineSlug, taskId, done) => {
        const s = get();
        const m = s.machines[machineSlug] ?? { flags: {}, tasks: {}, hints: [] };
        set({
          machines: {
            ...s.machines,
            [machineSlug]: { ...m, tasks: { ...m.tasks, [taskId]: done } },
          },
        });
      },

      unlockHint: (machineSlug, hintKey, cost) => {
        const s = get();
        const m = s.machines[machineSlug] ?? { flags: {}, tasks: {}, hints: [] };
        if (m.hints.includes(hintKey)) return true;
        if (totalPoints(s) < cost) return false;
        set({
          machines: {
            ...s.machines,
            [machineSlug]: { ...m, hints: [...m.hints, hintKey] },
          },
          events: pushEvent(s.events, "hint", `${machineSlug}:${hintKey}`, -cost),
        });
        return true;
      },

      addExam: (record) => {
        const s = get();
        const events = pushEvent(s.events, "exam", record.cert, record.passed ? record.score : 0);
        const want = earnedCodes({ ...s, events });
        const { badges, fresh } = newBadges(want, s.badges);
        set({ exams: [record, ...s.exams].slice(0, 50), events, badges });
        return fresh;
      },

      exportJSON: () => {
        const s = get();
        return JSON.stringify({ exportedAt: new Date().toISOString(), ...s }, null, 2);
      },
    }),
    { name: "mob.progress.v1", version: 1 },
  ),
);

/** Total points across the ledger (hint unlocks spend points, so they subtract). */
export function totalPoints(s: { events: ProgressEvent[] }): number {
  return s.events.reduce((sum, e) => sum + e.points, 0);
}

export function rankForPointsLocal(points: number): RankProgress {
  return rankForPoints(points);
}

/** True after the persisted store has rehydrated on the client. */
export function useProgressHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}

export interface ActivityDay {
  date: string;
  count: number;
}

/** Daily activity counts for the heatmap (positive events only). */
export function activityDaysFrom(events: ProgressEvent[], days = 182): ActivityDay[] {
  const since = Date.now() - days * 86_400_000;
  const map = new Map<string, number>();
  for (const e of events) {
    if (e.points <= 0 || e.t < since) continue;
    const key = dayKeyOf(e.t);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return [...map.entries()].map(([date, count]) => ({ date, count }));
}

/** Points per skill-radar category. `tagsByRef` maps a lesson/challenge/machine
 * slug (the part of an event ref before the first ":") to its content tags. */
export function skillPointsFrom(
  events: ProgressEvent[],
  tagsByRef: Record<string, string[]>,
): Record<SkillCategory, number> {
  const totals = Object.fromEntries(
    (
      ["web", "network", "linux", "windows", "crypto", "privesc", "recon", "forensics"] as const
    ).map((c) => [c, 0]),
  ) as Record<SkillCategory, number>;
  for (const e of events) {
    if (e.points <= 0) continue;
    const ref = e.ref.split(":")[0];
    const cats = new Set<SkillCategory>();
    for (const t of tagsByRef[ref] ?? []) {
      const c = tagToCategory(t);
      if (c) cats.add(c);
    }
    for (const c of cats) totals[c] += e.points;
  }
  return totals;
}

/** The achievement definitions that exist in a no-account world. */
export function achievementList() {
  const kept = new Set([
    "first_lesson", "lessons_10", "lessons_50", "first_challenge",
    "solve_10", "solve_25", "streak_7", "streak_30", "first_own", "own_10",
  ]);
  return ACHIEVEMENTS.filter((a) => kept.has(a.code));
}
