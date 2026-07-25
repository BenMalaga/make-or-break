import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, MessageSquarePlus } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { loadFeed, FEED_SORTS, isFeedSort } from "@/lib/community";
import { LucideIcon } from "@/components/lucide-icon";
import { Button } from "@/components/ui/button";
import { PostCard } from "@/components/community/post-card";
import { JoinButton } from "@/components/community/join-button";
import { cn } from "@/lib/utils";

export async function generateMetadata(
  props: {
    params: Promise<{ slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const c = await prisma.community.findUnique({ where: { slug: params.slug }, select: { name: true } });
  return { title: c ? `${c.name} - Community` : "Community" };
}

export default async function CommunityPage(
  props: {
    params: Promise<{ slug: string }>;
    searchParams: Promise<{ sort?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  const user = await requireUser();
  const sort = isFeedSort(searchParams.sort) ? searchParams.sort : "hot";

  const community = await prisma.community.findUnique({
    where: { slug: params.slug },
    select: { id: true, slug: true, name: true, description: true, icon: true, memberCount: true },
  });
  if (!community) notFound();

  const [membership, feed] = await Promise.all([
    prisma.communityMember.findUnique({
      where: { userId_communityId: { userId: user.id, communityId: community.id } },
      select: { id: true },
    }),
    loadFeed({ userId: user.id, sort, communityId: community.id }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/community"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> Community
      </Link>

      <div className="flex flex-col gap-4 rounded-lg border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <LucideIcon name={community.icon} className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{community.name}</h1>
            <p className="text-sm text-muted-foreground">{community.description}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {community.memberCount} {community.memberCount === 1 ? "member" : "members"}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <JoinButton communityId={community.id} initialJoined={!!membership} size="default" />
          <Button asChild>
            <Link href={`/community/submit?community=${community.id}`}>
              <MessageSquarePlus className="size-4" /> New post
            </Link>
          </Button>
        </div>
      </div>

      <div className="inline-flex rounded-lg border bg-card p-1">
        {FEED_SORTS.map((s) => (
          <Link
            key={s.id}
            href={`/community/c/${community.slug}?sort=${s.id}`}
            className={cn(
              "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              sort === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <LucideIcon name={s.icon} className="size-4" />
            {s.label}
          </Link>
        ))}
      </div>

      {feed.length === 0 ? (
        <div className="rounded-lg border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">No posts in {community.name} yet.</p>
          <Button asChild className="mt-4" size="sm">
            <Link href={`/community/submit?community=${community.id}`}>
              <MessageSquarePlus className="size-4" /> Start the first post
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {feed.map((item) => (
            <PostCard key={item.id} item={item} showCommunity={false} />
          ))}
        </div>
      )}
    </div>
  );
}
