import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { formatDistanceToNow } from "date-fns";
import { ArrowLeft, Lock, Pin } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { LucideIcon } from "@/components/lucide-icon";
import { VoteButton } from "@/components/community/vote-button";
import { PostBody } from "@/components/community/post-body";
import { ReplyForm } from "@/components/community/reply-form";

export async function generateMetadata(
  props: {
    params: Promise<{ id: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  const thread = await prisma.forumThread.findUnique({
    where: { id: params.id },
    select: { title: true },
  });
  return { title: thread ? `${thread.title} - Community` : "Community" };
}

export default async function ThreadPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const user = await requireUser();

  const thread = await prisma.forumThread.findUnique({
    where: { id: params.id },
    select: {
      id: true,
      title: true,
      pinned: true,
      locked: true,
      community: { select: { slug: true, name: true, icon: true } },
      author: { select: { username: true } },
      posts: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          body: true,
          createdAt: true,
          author: { select: { username: true } },
        },
      },
    },
  });
  if (!thread) notFound();

  const [myVote, up, down] = await Promise.all([
    prisma.vote.findUnique({
      where: { userId_forumThreadId: { userId: user.id, forumThreadId: thread.id } },
      select: { value: true },
    }),
    prisma.vote.count({ where: { forumThreadId: thread.id, value: "UP" } }),
    prisma.vote.count({ where: { forumThreadId: thread.id, value: "DOWN" } }),
  ]);
  const score = up - down;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href={thread.community ? `/community/c/${thread.community.slug}` : "/community"}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" />
        {thread.community ? thread.community.name : "Community"}
      </Link>

      <div className="flex gap-3">
        <VoteButton
          threadId={thread.id}
          initialScore={score}
          initialMyVote={myVote?.value ?? null}
        />
        <div className="min-w-0 flex-1">
          {thread.community ? (
            <Link
              href={`/community/c/${thread.community.slug}`}
              className="mb-1 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary"
            >
              <LucideIcon name={thread.community.icon} className="size-3.5" />
              {thread.community.name}
            </Link>
          ) : null}
          <h1 className="flex items-start gap-2 text-2xl font-bold">
            {thread.pinned ? <Pin className="mt-1 size-5 shrink-0 text-primary" /> : null}
            {thread.locked ? <Lock className="mt-1 size-5 shrink-0 text-muted-foreground" /> : null}
            {thread.title}
          </h1>
        </div>
      </div>

      <div className="space-y-3">
        {thread.posts.map((post, i) => (
          <article key={post.id} className="rounded-lg border bg-card p-4">
            <div className="mb-2 flex items-center justify-between gap-3 text-xs text-muted-foreground">
              <Link
                href={`/u/${post.author.username}`}
                className="font-medium text-foreground hover:text-primary hover:underline"
              >
                {post.author.username}
              </Link>
              <span>
                {i === 0 ? "posted " : "replied "}
                {formatDistanceToNow(post.createdAt, { addSuffix: true })}
              </span>
            </div>
            <PostBody body={post.body} />
          </article>
        ))}
      </div>

      {thread.locked ? (
        <p className="rounded-lg border border-dashed p-4 text-center text-sm text-muted-foreground">
          This thread is locked. No new replies.
        </p>
      ) : (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold">Reply</h2>
          <ReplyForm threadId={thread.id} />
        </section>
      )}
    </div>
  );
}
