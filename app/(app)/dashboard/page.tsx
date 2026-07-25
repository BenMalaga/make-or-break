import Link from "next/link";
import { ArrowRight, Flame, BookOpen, Server, Trophy, Clock, Users } from "lucide-react";
import type { Metadata } from "next";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadFeed } from "@/lib/community";
import { RankProgressCard } from "@/components/gamification/rank-progress-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { BadgeGrid } from "@/components/gamification/badge-grid";
import { DailyDropWidget } from "@/components/dashboard/daily-drop-widget";
import { getTodayDrop } from "@/lib/actions/daily";
import { InfiniteFeed } from "@/components/community/infinite-feed";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/layout/page-header";
import { evaluateAchievements, getAchievementProgress } from "@/lib/gamification/evaluate";
import { rankTitleForPoints } from "@/lib/gamification";
import { timeAgo } from "@/lib/utils";

export const metadata: Metadata = { title: "Dashboard" };

/** First published lesson (by module + lesson order) the user has not completed. */
async function getRecommendedLesson(userId: string) {
  const [lessons, done] = await Promise.all([
    prisma.lesson.findMany({
      where: { status: "PUBLISHED" },
      include: { module: true },
      orderBy: [{ module: { order: "asc" } }, { order: "asc" }],
    }),
    prisma.lessonProgress.findMany({
      where: { userId, completed: true },
      select: { lessonId: true },
    }),
  ]);
  const doneSet = new Set(done.map((d) => d.lessonId));
  return lessons.find((l) => !doneSet.has(l.id)) ?? null;
}

export default async function DashboardPage() {
  const user = await requireUser();

  const [lessonTotal, lessonsDone, machineTotal, machinesOwned, recent, continueRow, recommended] =
    await Promise.all([
      prisma.lesson.count({ where: { status: "PUBLISHED" } }),
      prisma.lessonProgress.count({ where: { userId: user.id, completed: true } }),
      prisma.machine.count({ where: { status: "PUBLISHED" } }),
      prisma.machineProgress.count({ where: { userId: user.id, rootOwned: true } }),
      prisma.lessonProgress.findMany({
        where: { userId: user.id, completed: true },
        include: { lesson: { include: { module: true } } },
        orderBy: { completedAt: "desc" },
        take: 5,
      }),
      prisma.lessonProgress.findFirst({
        where: { userId: user.id, completed: false },
        include: { lesson: { include: { module: true } } },
        orderBy: { updatedAt: "desc" },
      }),
      getRecommendedLesson(user.id),
    ]);

  const next = continueRow?.lesson ?? recommended;
  const nextHref = next ? `/learn/${next.module.slug}/${next.slug}` : "/learn";

  const feed = await loadFeed({ userId: user.id, sort: "hot", take: 10 });

  // Catch up any newly-earned badges (idempotent), then read them for display.
  await evaluateAchievements(user.id).catch(() => {});
  const badges = await getAchievementProgress(user.id);

  // Daily Drop widget data.
  const drop = await getTodayDrop();

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user.username}`} subtitle="Here is where you left off." />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <RankProgressCard points={user.points} />

        {/* Continue / next up */}
        <div className="flex flex-col justify-between rounded-lg border bg-card p-5">
          <div>
            <p className="text-xs text-muted-foreground">
              {continueRow ? "Continue learning" : recommended ? "Recommended next" : "Get started"}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {next ? next.title : "No lessons yet"}
            </p>
            {next ? (
              <p className="text-sm text-muted-foreground">{next.module.title}</p>
            ) : (
              <p className="text-sm text-muted-foreground">
                Pick a track and start your first lesson.
              </p>
            )}
          </div>
          <Button asChild className="mt-4 w-fit">
            <Link href={nextHref}>
              {next ? "Resume" : "Browse the academy"} <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>

      {drop ? (
        <DailyDropWidget
          dropNumber={drop.dropNumber}
          title={drop.meta.title}
          solved={drop.state.solved}
          attempts={drop.state.attempts}
          streak={drop.streak}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Flame className="size-4" />}
          label="Current streak"
          value={user.streakCount}
          sub={`Longest: ${user.longestStreak} days`}
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
          value={rankTitleForPoints(user.points)}
          sub={`${user.points} pts`}
        />
      </div>

      <BadgeGrid badges={badges} />

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
                  key={r.id}
                  href={`/learn/${r.lesson.module.slug}/${r.lesson.slug}`}
                  className="flex items-center justify-between gap-3 px-5 py-3 text-sm transition-colors hover:bg-accent/40"
                >
                  <span className="truncate">
                    Completed <span className="font-medium">{r.lesson.title}</span>
                  </span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {r.completedAt ? timeAgo(r.completedAt) : ""}
                  </span>
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

      {/* Community feed: scroll the dashboard straight into the community */}
      <section className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-lg font-semibold">
            <Users className="size-5 text-primary" /> From the community
          </h2>
          <Link href="/community" className="text-sm font-medium text-primary hover:underline">
            Open community
          </Link>
        </div>
        <InfiniteFeed initial={feed} sort="hot" />
      </section>
    </div>
  );
}
