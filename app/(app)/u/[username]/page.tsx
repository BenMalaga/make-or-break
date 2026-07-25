import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { Flame, Server, BookOpen, Crown, Radar as RadarIcon, CalendarDays, MessageSquare } from "lucide-react";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { FollowButton } from "@/components/community/follow-button";
import { RankProgressCard } from "@/components/gamification/rank-progress-card";
import { StatCard } from "@/components/dashboard/stat-card";
import { DifficultyBadge } from "@/components/machines/difficulty-badge";
import { SkillRadar } from "@/components/gamification/skill-radar";
import { ActivityHeatmap } from "@/components/gamification/activity-heatmap";
import { BadgeGrid } from "@/components/gamification/badge-grid";
import { computeSkillPoints, computeActivity } from "@/lib/gamification/stats";
import { SKILL_CATEGORIES } from "@/lib/gamification";

export async function generateMetadata(
  props: {
    params: Promise<{ username: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  return { title: `${params.username}'s profile` };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default async function ProfilePage(props: { params: Promise<{ username: string }> }) {
  const params = await props.params;
  const viewer = await requireUser();

  const user = await prisma.user.findUnique({
    where: { username: params.username },
    include: { profile: true },
  });
  if (!user) notFound();

  const isMe = viewer.id === user.id;
  const [followerCount, followingCount, iFollow] = await Promise.all([
    prisma.follow.count({ where: { followingId: user.id } }),
    prisma.follow.count({ where: { followerId: user.id } }),
    isMe
      ? Promise.resolve(false)
      : prisma.follow
          .findUnique({
            where: { followerId_followingId: { followerId: viewer.id, followingId: user.id } },
            select: { id: true },
          })
          .then(Boolean),
  ]);

  const [lessonsDone, machinesOwned, ownedMachines, skillPoints, activity, achievements, earned] =
    await Promise.all([
      prisma.lessonProgress.count({ where: { userId: user.id, completed: true } }),
      prisma.machineProgress.count({ where: { userId: user.id, rootOwned: true } }),
      prisma.machineProgress.findMany({
        where: { userId: user.id, rootOwned: true },
        include: { machine: { select: { name: true, slug: true, difficulty: true } } },
        orderBy: { rootOwnedAt: "desc" },
        take: 8,
      }),
      computeSkillPoints(user.id),
      computeActivity(user.id),
      prisma.achievement.findMany({ orderBy: { category: "asc" } }),
      prisma.userAchievement.findMany({
        where: { userId: user.id },
        select: { achievement: { select: { code: true } } },
      }),
    ]);

  const earnedSet = new Set(earned.map((e) => e.achievement.code));
  const radarData = SKILL_CATEGORIES.map((c) => ({ category: cap(c), points: skillPoints[c] }));
  const badges = achievements.map((a) => ({
    code: a.code,
    name: a.name,
    description: a.description,
    icon: a.icon ?? "Star",
    earned: earnedSet.has(a.code),
  }));

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-start gap-4">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-2xl font-bold text-primary">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold">{user.username}</h1>
          <p className="text-muted-foreground">{user.rankTitle}</p>
          {user.profile?.bio ? <p className="mt-1 text-sm">{user.profile.bio}</p> : null}
          <div className="mt-2 flex gap-4 text-sm text-muted-foreground">
            <span>
              <span className="font-semibold text-foreground">{followerCount}</span> followers
            </span>
            <span>
              <span className="font-semibold text-foreground">{followingCount}</span> following
            </span>
          </div>
        </div>
        {!isMe ? (
          <div className="flex items-center gap-2">
            <FollowButton username={user.username} initialFollowing={iFollow} />
            <Button asChild variant="outline" size="sm">
              <Link href={`/messages/${user.username}`}>
                <MessageSquare className="size-4" /> Message
              </Link>
            </Button>
          </div>
        ) : null}
      </div>

      <RankProgressCard points={user.points} />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard icon={<Flame className="size-4" />} label="Longest streak" value={user.longestStreak} sub="days" />
        <StatCard icon={<BookOpen className="size-4" />} label="Lessons done" value={lessonsDone} />
        <StatCard icon={<Server className="size-4" />} label="Machines rooted" value={machinesOwned} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <RadarIcon className="size-4 text-primary" /> Skill profile
            </h2>
          </div>
          <div className="p-3">
            <SkillRadar data={radarData} />
          </div>
        </div>

        <div className="rounded-lg border bg-card">
          <div className="border-b px-5 py-3">
            <h2 className="flex items-center gap-2 text-sm font-semibold">
              <CalendarDays className="size-4 text-primary" /> Activity
            </h2>
          </div>
          <div className="p-5">
            <ActivityHeatmap activity={activity} />
          </div>
        </div>
      </div>

      <BadgeGrid badges={badges} />

      <div className="rounded-lg border bg-card">
        <div className="border-b px-5 py-3">
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <Crown className="size-4 text-success" /> Recently owned
          </h2>
        </div>
        {ownedMachines.length === 0 ? (
          <p className="px-5 py-6 text-sm text-muted-foreground">No machines owned yet.</p>
        ) : (
          <ul className="divide-y divide-border/60">
            {ownedMachines.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/machines/${o.machine.slug}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-accent/40"
                >
                  <span className="font-medium">{o.machine.name}</span>
                  <DifficultyBadge difficulty={o.machine.difficulty} />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
