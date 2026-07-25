"use client";

import { useState, useTransition } from "react";
import { ArrowBigUp, ArrowBigDown } from "lucide-react";
import { setThreadVote, type VoteDir } from "@/lib/actions/community";
import { cn } from "@/lib/utils";

const contrib = (v: VoteDir | null) => (v === "UP" ? 1 : v === "DOWN" ? -1 : 0);

/**
 * Up/down vote control for a thread. The net score sits between the arrows.
 * Optimistic: the score and highlighted arrow update immediately, then reconcile
 * with the server's real numbers (and roll back on failure).
 */
export function VoteButton({
  threadId,
  initialScore,
  initialMyVote,
  size = "md",
}: {
  threadId: string;
  initialScore: number;
  initialMyVote: VoteDir | null;
  size?: "sm" | "md";
}) {
  const [score, setScore] = useState(initialScore);
  const [myVote, setMyVote] = useState<VoteDir | null>(initialMyVote);
  const [pending, startTransition] = useTransition();

  function vote(dir: VoteDir, e: React.MouseEvent) {
    // The card links to the thread; a vote must not navigate.
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    const prevVote = myVote;
    const prevScore = score;
    const next = myVote === dir ? null : dir; // same arrow again clears the vote
    setScore((s) => s - contrib(myVote) + contrib(next));
    setMyVote(next);
    startTransition(async () => {
      try {
        const res = await setThreadVote(threadId, dir);
        setScore(res.score);
        setMyVote(res.myVote);
      } catch {
        setScore(prevScore);
        setMyVote(prevVote);
      }
    });
  }

  const iconSize = size === "sm" ? "size-4" : "size-5";
  return (
    <div className="flex flex-col items-center">
      <button
        type="button"
        onClick={(e) => vote("UP", e)}
        disabled={pending}
        aria-pressed={myVote === "UP"}
        aria-label="Upvote"
        className={cn(
          "rounded-md p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          myVote === "UP" ? "text-primary" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        <ArrowBigUp className={cn(iconSize, myVote === "UP" && "fill-primary")} />
      </button>
      <span
        className={cn(
          "text-xs font-semibold tabular-nums",
          myVote === "UP" && "text-primary",
          myVote === "DOWN" && "text-destructive",
        )}
      >
        {score}
      </span>
      <button
        type="button"
        onClick={(e) => vote("DOWN", e)}
        disabled={pending}
        aria-pressed={myVote === "DOWN"}
        aria-label="Downvote"
        className={cn(
          "rounded-md p-0.5 outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring",
          myVote === "DOWN" ? "text-destructive" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
        )}
      >
        <ArrowBigDown className={cn(iconSize, myVote === "DOWN" && "fill-destructive")} />
      </button>
    </div>
  );
}
