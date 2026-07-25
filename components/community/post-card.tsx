import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { LucideIcon } from "@/components/lucide-icon";
import { PostBody } from "./post-body";
import { VoteButton } from "./vote-button";

export interface FeedItem {
  id: string;
  title: string;
  // Date from a server render, or an ISO string once it crosses a server-action
  // boundary; PostCard normalizes with new Date().
  createdAt: Date | string;
  postCount: number;
  score: number;
  myVote: "UP" | "DOWN" | null;
  author: string;
  authorImage: string | null;
  body: string;
  community: { slug: string; name: string; icon: string } | null;
}

/**
 * One post in the feed: a vote column plus the community, a link to the author's
 * profile, the title, the full post body, and the comment link. The body is
 * rendered here (not just the header) so the feed reads like a real feed.
 */
export function PostCard({ item, showCommunity = true }: { item: FeedItem; showCommunity?: boolean }) {
  return (
    <div className="hover-lift flex gap-2 rounded-lg border bg-card p-3">
      <VoteButton threadId={item.id} initialScore={item.score} initialMyVote={item.myVote} size="sm" />
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
          {showCommunity && item.community ? (
            <>
              <LucideIcon name={item.community.icon} className="size-3.5" />
              <Link
                href={`/community/c/${item.community.slug}`}
                className="font-medium text-foreground/80 hover:text-primary hover:underline"
              >
                {item.community.name}
              </Link>
              <span>&middot;</span>
            </>
          ) : null}
          <Link href={`/u/${item.author}`} className="hover:text-primary hover:underline">
            {item.author}
          </Link>
          <span>&middot;</span>
          <span>{formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}</span>
        </div>

        <Link href={`/community/thread/${item.id}`} className="group block">
          <h3 className="mt-1 font-semibold leading-snug group-hover:text-primary">{item.title}</h3>
        </Link>

        {item.body ? (
          <div className="mt-2 text-sm">
            <PostBody body={item.body} />
          </div>
        ) : null}

        <Link
          href={`/community/thread/${item.id}`}
          className="mt-2.5 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <MessageSquare className="size-3.5" />
          {item.postCount} {item.postCount === 1 ? "comment" : "comments"}
        </Link>
      </div>
    </div>
  );
}
