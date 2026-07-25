import "server-only";
import { prisma } from "@/lib/db";
import type { FeedItem } from "@/components/community/post-card";

export type FeedSort = "hot" | "new" | "top";
export const FEED_SORTS: { id: FeedSort; label: string; icon: string }[] = [
  { id: "hot", label: "Hot", icon: "Flame" },
  { id: "new", label: "New", icon: "Clock" },
  { id: "top", label: "Top", icon: "TrendingUp" },
];

export function isFeedSort(v: string | undefined): v is FeedSort {
  return v === "hot" || v === "new" || v === "top";
}

/**
 * Load a ranked feed of posts. Scope it to one community, to a set of
 * communities (the user's joined ones), or leave both unset for everything.
 * Ranking is done in app over the most recent `take` posts, which is plenty at
 * this scale and keeps "hot" simple.
 */
export async function loadFeed(opts: {
  userId: string;
  sort: FeedSort;
  communityId?: string;
  communityIds?: string[];
  take?: number;
  skip?: number;
}): Promise<FeedItem[]> {
  const where = opts.communityId
    ? { communityId: opts.communityId }
    : opts.communityIds
      ? { communityId: { in: opts.communityIds } }
      : { communityId: { not: null } };

  // "new" can paginate at the DB level; hot/top rank in app so they pull a
  // wider window, and the caller slices with skip/take on the ranked result.
  const dbTake = opts.sort === "new" ? (opts.take ?? 100) : 300;
  const threads = await prisma.forumThread.findMany({
    where,
    orderBy: { createdAt: "desc" },
    skip: opts.sort === "new" ? opts.skip ?? 0 : 0,
    take: dbTake,
    select: {
      id: true,
      title: true,
      createdAt: true,
      postCount: true,
      author: { select: { username: true, image: true } },
      community: { select: { slug: true, name: true, icon: true } },
      // The opening post is the thread's body; take the earliest one.
      posts: { orderBy: { createdAt: "asc" }, take: 1, select: { body: true } },
    },
  });

  const ids = threads.map((t) => t.id);
  const [voteAgg, myVotes] = await Promise.all([
    ids.length
      ? prisma.vote.groupBy({
          by: ["forumThreadId", "value"],
          where: { forumThreadId: { in: ids } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    ids.length
      ? prisma.vote.findMany({
          where: { userId: opts.userId, forumThreadId: { in: ids } },
          select: { forumThreadId: true, value: true },
        })
      : Promise.resolve([]),
  ]);

  const scoreMap = new Map<string, number>();
  for (const g of voteAgg) {
    if (!g.forumThreadId) continue;
    const delta = g.value === "UP" ? g._count._all : -g._count._all;
    scoreMap.set(g.forumThreadId, (scoreMap.get(g.forumThreadId) ?? 0) + delta);
  }
  const myVoteMap = new Map<string, "UP" | "DOWN">();
  for (const v of myVotes) if (v.forumThreadId) myVoteMap.set(v.forumThreadId, v.value);

  const items: FeedItem[] = threads.map((t) => ({
    id: t.id,
    title: t.title,
    createdAt: t.createdAt,
    postCount: t.postCount,
    score: scoreMap.get(t.id) ?? 0,
    myVote: myVoteMap.get(t.id) ?? null,
    author: t.author.username,
    authorImage: t.author.image,
    body: t.posts[0]?.body ?? "",
    community: t.community,
  }));

  const skip = opts.skip ?? 0;
  const take = opts.take ?? 100;

  if (opts.sort === "new") return items; // DB already applied skip/take
  if (opts.sort === "top") {
    items.sort((a, b) => b.score - a.score || +new Date(b.createdAt) - +new Date(a.createdAt));
    return items.slice(skip, skip + take);
  }
  // Hot: score decayed by age, with a floor so brand-new posts still surface.
  const now = Date.now();
  const hot = (it: FeedItem) =>
    (it.score + 1) / Math.pow((now - +new Date(it.createdAt)) / 3_600_000 + 2, 1.3);
  items.sort((a, b) => hot(b) - hot(a));
  return items.slice(skip, skip + take);
}
