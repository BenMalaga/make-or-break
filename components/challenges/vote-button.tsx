"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp } from "lucide-react";
import { toggleChallengeVote } from "@/lib/actions/challenges";
import { cn } from "@/lib/utils";

/** Upvote toggle for a community challenge. Optimistic, reconciles with server. */
export function VoteButton({
  slug,
  initialUpvotes,
  initialVoted,
}: {
  slug: string;
  initialUpvotes: number;
  initialVoted: boolean;
}) {
  const [upvotes, setUpvotes] = useState(initialUpvotes);
  const [voted, setVoted] = useState(initialVoted);
  const [pending, start] = useTransition();

  function toggle() {
    const prevVoted = voted;
    const prevUpvotes = upvotes;
    const nextVoted = !voted;
    setVoted(nextVoted);
    setUpvotes((u) => u + (nextVoted ? 1 : -1));
    start(async () => {
      try {
        const res = await toggleChallengeVote(slug);
        setUpvotes(res.upvotes);
        setVoted(res.voted);
      } catch {
        // Roll the optimistic vote back if the server never recorded it.
        setVoted(prevVoted);
        setUpvotes(prevUpvotes);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={voted}
      title={voted ? "Remove upvote" : "Upvote this challenge"}
      className={cn(
        "flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors",
        voted
          ? "border-primary/40 bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
      )}
    >
      <ArrowBigUp className={cn("size-4", voted && "fill-current")} /> {upvotes}
    </button>
  );
}
