"use client";

import { useState, useTransition } from "react";
import { Send, Loader2, MessagesSquare, AlertTriangle } from "lucide-react";
import { postChallengeComment, type ChallengeCommentDTO } from "@/lib/actions/challenges";
import { PostBody } from "@/components/community/post-body";
import { timeAgo } from "@/lib/utils";

/**
 * The Discussion tab of a challenge. A flat comment list plus a composer. Bodies
 * render through the safe PostBody renderer (markdown-lite, no HTML injection).
 */
export function ChallengeDiscussion({
  slug,
  initialComments,
}: {
  slug: string;
  initialComments: ChallengeCommentDTO[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text || pending) return;
    setError(null);
    start(async () => {
      try {
        const created = await postChallengeComment(slug, text);
        if (created) {
          setComments((c) => [...c, created]);
          setDraft("");
        } else {
          // null = the server rejected it (no session / empty). Say so instead
          // of silently doing nothing; the draft stays in the box.
          setError("Could not post your comment. Try again in a moment.");
        }
      } catch {
        setError("Could not reach the server. Check your connection and try again.");
      }
    });
  }

  return (
    <div className="flex h-full flex-col">
      <div className="scrollbar-thin flex-1 space-y-4 overflow-y-auto pr-1">
        {comments.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            <MessagesSquare className="size-5" />
            No comments yet. Ask a question or drop a hint (no full spoilers).
          </div>
        ) : (
          comments.map((c) => (
            <div key={c.id} className="rounded-lg border bg-card p-3">
              <div className="mb-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{c.author}</span>
                <span>{timeAgo(new Date(c.createdAt))}</span>
              </div>
              <div className="text-sm">
                <PostBody body={c.body} />
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={submit} className="mt-3 space-y-2 border-t pt-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Add to the discussion. Wrap code in ```backticks```. Please avoid full spoilers."
          rows={3}
          className="scrollbar-thin w-full resize-none rounded-md border border-input bg-background p-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        {error ? (
          <p className="flex items-center gap-1.5 text-xs text-destructive">
            <AlertTriangle className="size-3.5" /> {error}
          </p>
        ) : null}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={pending || !draft.trim()}
            className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Send className="size-3.5" />}
            Comment
          </button>
        </div>
      </form>
    </div>
  );
}
