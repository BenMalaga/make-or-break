import Link from "next/link";
import type { Metadata } from "next";
import { Trophy } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LucideIcon } from "@/components/lucide-icon";
import { CommunityTabs } from "@/components/community/community-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { rankForPoints } from "@/lib/gamification";
import { formatPoints, cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Leaderboard - Community" };

export default async function CommunityLeaderboardPage() {
  const me = await requireUser();
  const users = await prisma.user.findMany({
    where: { bannedAt: null },
    orderBy: [{ points: "desc" }, { createdAt: "asc" }],
    take: 100,
    select: { id: true, username: true, points: true, rankTitle: true, image: true },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        subtitle="Join communities, share what you build and break, and help each other out."
      />

      <CommunityTabs active="leaderboard" />

      <div className="max-w-2xl space-y-4">
        <div>
          <h2 className="flex items-center gap-2 text-xl font-bold">
            <Trophy className="size-5 text-primary" /> Leaderboard
          </h2>
          <p className="text-sm text-muted-foreground">Global ranking by total points.</p>
        </div>

        <div className="overflow-hidden rounded-lg border bg-card">
          {users.map((u, i) => {
            const rank = rankForPoints(u.points).current;
            const isMe = u.id === me.id;
            return (
              <Link
                key={u.id}
                href={`/u/${u.username}`}
                className={cn(
                  "flex items-center gap-4 border-b px-5 py-3 last:border-b-0 transition-colors hover:bg-accent/40",
                  isMe && "bg-primary/5",
                )}
              >
                <span
                  className={cn(
                    "w-6 text-center font-mono text-sm font-semibold",
                    i === 0 && "text-yellow-500",
                    i === 1 && "text-zinc-400",
                    i === 2 && "text-amber-600",
                    i > 2 && "text-muted-foreground",
                  )}
                >
                  {i + 1}
                </span>
                <div className="flex size-8 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <LucideIcon name={rank.icon} className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">
                    {u.username}{" "}
                    {isMe ? <span className="text-xs text-muted-foreground">(you)</span> : null}
                  </p>
                  <p className="text-xs text-muted-foreground">{rank.title}</p>
                </div>
                <span className="font-mono font-semibold text-primary">
                  {formatPoints(u.points)}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
