"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, BookOpen, Clock, Flame, Server, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { RankProgressCard } from "@/components/gamification/rank-progress-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BadgeGrid, type BadgeItem } from "@/components/gamification/badge-grid";
import { DailyDropWidget } from "@/components/dashboard/daily-drop-widget";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";
import { SkillRadar } from "@/components/gamification/skill-radar";
import {
  achievementList,
  activityDaysFrom,
  currentStreakFrom,
  longestStreakFrom,
  rankForPointsLocal,
  skillPointsFrom,
  totalPoints,
  useProgress,
  useProgressHydrated,
} from "@/lib/progress/store";
import { currentStreak } from "@/lib/daily/streak";
import { formatPoints, timeAgo } from "@/lib/utils";

export interface DashLesson {
  slug: string;
  title: string;
  tags: string[];
  moduleSlug: string;
}

export interface DashModule {
  slug: string;
  title: string;
}

export interface DashMachine {
  slug: string;
  tags: string[];
}

export interface DashDrop {
  dateKey: string;
  dropNumber: number;
  title: string;
}

export interface DashboardProps {
  lessons: DashLesson[];
  modules: DashModule[];
  machineTags: DashMachine[];
  drop: DashDrop | null;
}

/**
 * The whole dashboard. Content metadata arrives as plain props from the server
 * page; every progress value is derived from the local store, neutral (0s,
 * nothing done) until the persisted state rehydrates.
 */
export function DashboardView({ lessons, modules, machineTags, drop }: DashboardProps) {
  const store = useProgress();
  const hydrated = useProgressHydrated();

  const events = hydrated ? store.events : [];
  const lessonsState = hydrated ? store.lessons : {};
  const dailyState = hydrated ? store.daily : {};
  const machinesState = hydrated ? store.machines : {};
  const badgesState = hydrated ? store.badges : {};

  const lessonBySlug = useMemo(() => new Map(lessons.map((l) => [l.slug, l])), [lessons]);
  const moduleTitleBySlug = useMemo(
    () => new Map(modules.map((m) => [m.slug, m.title])),
    [modules],
  );

  const points = totalPoints({ events });
  const rank = rankForPointsLocal(points);
  const streak = currentStreakFrom(events);
  const longest = longestStreakFrom(events);

  const lessonTotal = lessons.length;
  const lessonsDone = Object.values(lessonsState).filter((l) => l.completedAt).length;
  const machineTotal = machineTags.length;
  const machinesOwned = Object.values(machinesState).filter((m) =>
    Object.values(m.flags).some((f) => f.kind === "ROOT"),
  ).length;

  // Last five completions, newest first, titled from the server-passed catalog.
  const recent = Object.entries(lessonsState)
    .filter(([, l]) => l.completedAt)
    .sort((a, b) => (b[1].completedAt ?? 0) - (a[1].completedAt ?? 0))
    .slice(0, 5)
    .map(([slug, l]) => ({
      slug,
      at: l.completedAt as number,
      title: lessonBySlug.get(slug)?.title ?? slug,
      moduleSlug: lessonBySlug.get(slug)?.moduleSlug ?? "",
    }));

  // Continue card: the first incomplete lesson in catalog order after the last
  // completed one, falling back to the first incomplete lesson overall.
  const orderOf = useMemo(() => new Map(lessons.map((l, i) => [l.slug, i])), [lessons]);
  const lastDoneIdx = useMemo(() => {
    let max = -1;
    for (const [slug, l] of Object.entries(lessonsState)) {
      if (!l.completedAt) continue;
      const idx = orderOf.get(slug) ?? -1;
      if (idx > max) max = idx;
    }
    return max;
  }, [lessonsState, orderOf]);
  const continueLesson = useMemo(() => {
    const done = (slug: string) => Boolean(lessonsState[slug]?.completedAt);
    return (
      lessons.slice(lastDoneIdx + 1).find((l) => !done(l.slug)) ??
      lessons.find((l) => !done(l.slug)) ??
      null
    );
  }, [lessons, lessonsState, lastDoneIdx]);
  const continueLabel =
    continueLesson && (orderOf.get(continueLesson.slug) ?? 0) > lastDoneIdx
      ? "Continue learning"
      : "Recommended next";
  const continueHref = continueLesson
    ? `/learn/${continueLesson.moduleSlug}/${continueLesson.slug}`
    : "/learn";
  const allDone = !continueLesson && lessonTotal > 0;

  const badgeItems: BadgeItem[] = achievementList().map((a) => ({
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon,
    earned: a.code in badgesState,
  }));

  const activity = activityDaysFrom(events);

  // Skill radar: lesson tags come from the catalog, machine tags from the
  // machine frontmatter, both passed from the server.
  const tagsByRef = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const l of lessons) map[l.slug] = l.tags;
    for (const m of machineTags) map[m.slug] = m.tags;
    return map;
  }, [lessons, machineTags]);
  const skillData = Object.entries(skillPointsFrom(events, tagsByRef)).map(
    ([category, pts]) => ({ category, points: pts }),
  );

  // Daily Drop widget state, streak over solved drops from the store.
  const dailyRec = drop ? dailyState[drop.dateKey] : undefined;
  const dropSolved = Boolean(dailyRec?.solvedAt);
  const dropAttempts = dailyRec?.attempts ?? 0;
  const dropStreak = useMemo(() => {
    if (!drop) return 0;
    const solvedKeys = new Set(
      Object.entries(dailyState)
        .filter(([, r]) => r.solvedAt)
        .map(([key]) => key),
    );
    return currentStreak(solvedKeys, drop.dateKey);
  }, [dailyState, drop]);

  return (
    <div className="space-y-6">
      <PageHeader title="Welcome back" subtitle="Here is where you left off." />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <RankProgressCard points={points} />

        {/* Continue / next up */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-5">
          <div>
            <p className="text-xs text-muted-foreground">
              {continueLesson ? continueLabel : "Get started"}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {continueLesson ? continueLesson.title : allDone ? "All lessons complete" : "No lessons yet"}
            </p>
            {continueLesson ? (
              <p className="text-sm text-muted-foreground">
                {moduleTitleBySlug.get(continueLesson.moduleSlug) ?? continueLesson.moduleSlug}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                {allDone
                  ? "Nice work. Replay anything or go own some boxes."
                  : "Pick a track and start your first lesson."}
              </p>
            )}
          </div>
          <Button asChild className="mt-4 w-fit">
            <Link href={continueHref}>
              {continueLesson ? "Resume" : "Browse the academy"} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {drop ? (
        <DailyDropWidget
          dropNumber={drop.dropNumber}
          title={drop.title}
          solved={dropSolved}
          attempts={dropAttempts}
          streak={dropStreak}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className="size-4" />}
          label="Current streak"
          value={streak}
          sub={`Longest: ${longest} days`}
        />
        <StatCard
          icon={<BookOpen className="size-4" />}
          label="Lessons"
          value={`${lessonsDone}/${lessonTotal}`}
          sub="completed"
        />
        <StatCard
          icon={<Server className="size-4" />}
          label="Machines"
          value={`${machinesOwned}/${machineTotal}`}
          sub="fully solved"
        />
        <StatCard
          icon={<Trophy className="size-4" />}
          label="Rank"
          value={rank.current.title}
          sub={`${formatPoints(points)} pts`}
        />
      </div>

      <BadgeGrid badges={badgeItems} />

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Activity</h2>
          <ActivityHeatmap activity={activity} />
        </div>
        <div className="rounded-lg border bg-card p-5">
          <h2 className="mb-3 text-sm font-semibold">Skill profile</h2>
          <SkillRadar data={skillData} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <Clock className="size-4 text-muted-foreground" /> Recent activity
            </h2>
          </div>
          <div className="divide-y divide-border/60">
            {recent.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                Nothing yet. Complete a lesson to see it here.
              </p>
            ) : (
              recent.map((r) => (
                <Link
                  key={r.slug}
                  href={`/learn/${r.moduleSlug}/${r.slug}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="truncate">
                    Completed <span className="font-medium">{r.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(r.at)}</span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 gap-4">
          <Link
            href="/learn"
            className="hover-lift flex flex-col justify-between rounded-lg border bg-card p-5"
          >
            <BookOpen className="size-6 text-primary" />
            <span className="mt-6 font-semibold">Learn</span>
            <span className="text-xs text-muted-foreground">Paths, modules, certs</span>
          </Link>
          <Link
            href="/machines"
            className="hover-lift flex flex-col justify-between rounded-lg border bg-card p-5"
          >
            <Server className="size-6 text-primary" />
            <span className="mt-6 font-semibold">Machines</span>
            <span className="text-xs text-muted-foreground">Own some boxes</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
