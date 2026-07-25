import Link from "next/link";
import type { Metadata } from "next";
import { MessageSquarePlus, Plus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadFeed, FEED_SORTS, isFeedSort } from "@/lib/community";
import { LucideIcon } from "@/components/lucide-icon";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";
import { JoinButton } from "@/components/community/join-button";
import { CommunityTabs } from "@/components/community/community-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Community" };

export default async function CommunityFeedPage(
  props: {
    searchParams: Promise<{ sort?: string; scope?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const user = await requireUser();
  const sort = isFeedSort(searchParams.sort) ? searchParams.sort : "hot";
  const scope = searchParams.scope === "joined" ? "joined" : "all";

  const [memberships, discover] = await Promise.all([
    prisma.communityMember.findMany({
      where: { userId: user.id },
      select: { community: { select: { id: true, slug: true, name: true, icon: true } } },
      orderBy: { community: { name: "asc" } },
    }),
    prisma.community.findMany({
      orderBy: [{ memberCount: "desc" }, { threadCount: "desc" }],
      take: 12,
      select: { id: true, slug: true, name: true, icon: true, memberCount: true },
    }),
  ]);

  const joinedIds = memberships.map((m) => m.community.id);
  const joinedSet = new Set(joinedIds);

  const feed = await loadFeed({
    userId: user.id,
    sort,
    communityIds: scope === "joined" && joinedIds.length ? joinedIds : undefined,
  });

  const sortHref = (s: string) => `/community?sort=${s}${scope === "joined" ? "&scope=joined" : ""}`;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Community"
        subtitle="Join communities, share what you build and break, and help each other out."
        action={
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/community/create">
                <Plus className="size-4" /> Create community
              </Link>
            </Button>
            <Button asChild>
              <Link href="/community/submit">
                <MessageSquarePlus className="size-4" /> New post
              </Link>
            </Button>
          </div>
        }
      />

      <CommunityTabs active="feed" />

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        {/* Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-2">
            <div className="inline-flex rounded-lg border bg-card p-1">
              {FEED_SORTS.map((s) => (
                <Link
                  key={s.id}
                  href={sortHref(s.id)}
                  className={cn(
                    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    sort === s.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <LucideIcon name={s.icon} className="size-4" />
                  {s.label}
                </Link>
              ))}
            </div>
            {joinedIds.length > 0 ? (
              <div className="inline-flex rounded-lg border bg-card p-1 text-sm">
                <Link
                  href={`/community?sort=${sort}`}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium transition-colors",
                    scope === "all" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  All
                </Link>
                <Link
                  href={`/community?sort=${sort}&scope=joined`}
                  className={cn(
                    "rounded-md px-3 py-1.5 font-medium transition-colors",
                    scope === "joined" ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  My communities
                </Link>
              </div>
            ) : null}
          </div>

          {feed.length === 0 ? (
            <div className="rounded-lg border border-dashed p-10 text-center">
              <p className="text-sm text-muted-foreground">
                {scope === "joined"
                  ? "Nothing in your communities yet."
                  : "No posts yet. Be the first."}
              </p>
              <Button asChild className="mt-4" size="sm">
                <Link href="/community/submit">
                  <MessageSquarePlus className="size-4" /> New post
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {feed.map((item) => (
                <PostCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <aside className="space-y-6">
          {memberships.length > 0 ? (
            <section>
              <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Your communities
              </h2>
              <ul className="space-y-1">
                {memberships.map((m) => (
                  <li key={m.community.id}>
                    <Link
                      href={`/community/c/${m.community.slug}`}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-accent/50"
                    >
                      <LucideIcon name={m.community.icon} className="size-4 text-primary" />
                      {m.community.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          <section>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Discover
            </h2>
            <ul className="space-y-2">
              {discover.map((c) => (
                <li key={c.id} className="flex items-center gap-2">
                  <Link
                    href={`/community/c/${c.slug}`}
                    className="flex min-w-0 flex-1 items-center gap-2 text-sm hover:text-primary"
                  >
                    <LucideIcon name={c.icon} className="size-4 shrink-0 text-primary" />
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{c.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {c.memberCount} {c.memberCount === 1 ? "member" : "members"}
                      </span>
                    </span>
                  </Link>
                  <JoinButton communityId={c.id} initialJoined={joinedSet.has(c.id)} />
                </li>
              ))}
            </ul>
          </section>
        </aside>
      </div>
    </div>
  );
}
