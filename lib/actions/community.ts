"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { normalizeCommunitySlug } from "@/lib/forum";
import { threadsOverLimit, repliesOverLimit } from "@/lib/rate-limit";
import { loadFeed, type FeedSort } from "@/lib/community";
import type { FeedItem } from "@/components/community/post-card";

const MAX_TITLE = 200;
const MAX_BODY = 40000;

type Result = { ok: false; error: string } | { ok: true; redirect: string };

// ---- Communities ------------------------------------------------------------

/** Create a community and auto-join the creator. */
export async function createCommunity(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const slug = normalizeCommunitySlug(String(formData.get("slug") ?? name));

  if (name.length < 3) return { ok: false, error: "Give the community a name (at least 3 characters)." };
  if (slug.length < 3) return { ok: false, error: "The URL name needs at least 3 letters or numbers." };
  if (description.length < 8) return { ok: false, error: "Add a short description so people know what it is about." };

  const existing = await prisma.community.findUnique({ where: { slug }, select: { id: true } });
  if (existing) return { ok: false, error: `The name "${slug}" is taken. Pick another.` };

  await prisma.community.create({
    data: {
      slug,
      name,
      description,
      createdById: user.id,
      memberCount: 1,
      members: { create: { userId: user.id } },
    },
  });

  revalidatePath("/community");
  return { ok: true, redirect: `/community/c/${slug}` };
}

/** Join or leave a community. Returns the new membership state. */
export async function toggleMembership(communityId: string): Promise<{ joined: boolean }> {
  const user = await requireUser();
  const existing = await prisma.communityMember.findUnique({
    where: { userId_communityId: { userId: user.id, communityId } },
    select: { id: true },
  });

  if (existing) {
    await prisma.$transaction([
      prisma.communityMember.delete({ where: { id: existing.id } }),
      prisma.community.update({ where: { id: communityId }, data: { memberCount: { decrement: 1 } } }),
    ]);
    revalidatePath("/community");
    return { joined: false };
  }

  await prisma.$transaction([
    prisma.communityMember.create({ data: { userId: user.id, communityId } }),
    prisma.community.update({ where: { id: communityId }, data: { memberCount: { increment: 1 } } }),
  ]);
  revalidatePath("/community");
  return { joined: true };
}

// ---- Posts (threads) --------------------------------------------------------

/** Create a post (thread + first message) in a community. */
export async function createPost(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const communityId = String(formData.get("communityId") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();

  if (!communityId) return { ok: false, error: "Pick a community to post in." };
  const community = await prisma.community.findUnique({ where: { id: communityId }, select: { id: true } });
  if (!community) return { ok: false, error: "That community no longer exists." };
  if (title.length < 4) return { ok: false, error: "Give the post a real title (at least 4 characters)." };
  if (title.length > MAX_TITLE) return { ok: false, error: "That title is too long." };
  if (body.length > MAX_BODY) return { ok: false, error: "That post is too long." };
  if (await threadsOverLimit(user.id)) {
    return { ok: false, error: "You are posting too fast. Take a short break and try again." };
  }

  const thread = await prisma.forumThread.create({
    data: {
      title,
      communityId,
      authorId: user.id,
      postCount: 1,
      lastPostAt: new Date(),
      posts: { create: { authorId: user.id, body: body || title } },
    },
    select: { id: true },
  });
  await prisma.community.update({ where: { id: communityId }, data: { threadCount: { increment: 1 } } });

  revalidatePath("/community");
  return { ok: true, redirect: `/community/thread/${thread.id}` };
}

/** Add a reply to a thread. */
export async function createReply(formData: FormData): Promise<Result> {
  const user = await requireUser();
  const threadId = String(formData.get("threadId") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (!threadId) return { ok: false, error: "Missing thread." };
  if (body.length < 2) return { ok: false, error: "Write something first." };
  if (body.length > MAX_BODY) return { ok: false, error: "That reply is too long." };
  if (await repliesOverLimit(user.id)) {
    return { ok: false, error: "You are replying too fast. Take a short break and try again." };
  }

  const thread = await prisma.forumThread.findUnique({
    where: { id: threadId },
    select: { id: true, locked: true },
  });
  if (!thread) return { ok: false, error: "That thread no longer exists." };
  if (thread.locked) return { ok: false, error: "This thread is locked." };

  await prisma.$transaction([
    prisma.forumPost.create({ data: { threadId, authorId: user.id, body } }),
    prisma.forumThread.update({
      where: { id: threadId },
      data: { postCount: { increment: 1 }, lastPostAt: new Date() },
    }),
  ]);
  revalidatePath(`/community/thread/${threadId}`);
  return { ok: true, redirect: `/community/thread/${threadId}` };
}

export type VoteDir = "UP" | "DOWN";

/**
 * Set the current user's vote on a thread. Clicking the same direction again
 * removes the vote; the opposite direction flips it. Returns the user's new vote
 * and the net score (upvotes minus downvotes).
 */
export async function setThreadVote(
  threadId: string,
  dir: VoteDir,
): Promise<{ myVote: VoteDir | null; score: number }> {
  const user = await requireUser();
  const existing = await prisma.vote.findUnique({
    where: { userId_forumThreadId: { userId: user.id, forumThreadId: threadId } },
    select: { id: true, value: true },
  });

  let myVote: VoteDir | null;
  if (existing?.value === dir) {
    await prisma.vote.delete({ where: { id: existing.id } });
    myVote = null;
  } else if (existing) {
    await prisma.vote.update({ where: { id: existing.id }, data: { value: dir } });
    myVote = dir;
  } else {
    await prisma.vote.create({ data: { userId: user.id, forumThreadId: threadId, value: dir } });
    myVote = dir;
  }

  const [up, down] = await Promise.all([
    prisma.vote.count({ where: { forumThreadId: threadId, value: "UP" } }),
    prisma.vote.count({ where: { forumThreadId: threadId, value: "DOWN" } }),
  ]);
  return { myVote, score: up - down };
}

/** Follow or unfollow a user by username. Returns the new state and count. */
export async function toggleFollow(
  username: string,
): Promise<{ following: boolean; followerCount: number }> {
  const me = await requireUser();
  const target = await prisma.user.findUnique({ where: { username }, select: { id: true } });
  if (!target || target.id === me.id) {
    const followerCount = target ? await prisma.follow.count({ where: { followingId: target.id } }) : 0;
    return { following: false, followerCount };
  }

  const existing = await prisma.follow.findUnique({
    where: { followerId_followingId: { followerId: me.id, followingId: target.id } },
    select: { id: true },
  });
  if (existing) {
    await prisma.follow.delete({ where: { id: existing.id } });
  } else {
    await prisma.follow.create({ data: { followerId: me.id, followingId: target.id } });
  }

  const followerCount = await prisma.follow.count({ where: { followingId: target.id } });
  revalidatePath(`/u/${username}`);
  return { following: !existing, followerCount };
}

/** Fetch a page of the global feed. Used by the dashboard's infinite scroll. */
export async function fetchFeedPage(sort: FeedSort, skip: number): Promise<FeedItem[]> {
  const user = await requireUser();
  return loadFeed({ userId: user.id, sort, skip, take: 10 });
}

// ---- useFormState wrappers --------------------------------------------------
// On success they redirect; on a validation error they RETURN the message (no
// redirect) so the form stays mounted and keeps everything the user typed.

export interface CommunityFormState {
  error: string | null;
}

export async function submitNewCommunity(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const res = await createCommunity(formData);
  if (res.ok) redirect(res.redirect);
  return { error: res.error };
}

export async function submitPost(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const res = await createPost(formData);
  if (res.ok) redirect(res.redirect);
  return { error: res.error };
}

export async function submitReply(
  _prev: CommunityFormState,
  formData: FormData,
): Promise<CommunityFormState> {
  const res = await createReply(formData);
  if (res.ok) redirect(res.redirect);
  return { error: res.error };
}
