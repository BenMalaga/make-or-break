"use client";

import { useFormState } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { submitReply } from "@/lib/actions/community";
import { PendingButton } from "./pending-button";

/** Thread reply form. useFormState keeps the draft on a validation error. */
export function ReplyForm({ threadId }: { threadId: string }) {
  const [state, action] = useFormState(submitReply, { error: null });

  return (
    <form action={action} className="space-y-3">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}
      <input type="hidden" name="threadId" value={threadId} />
      <textarea
        name="body"
        required
        rows={6}
        placeholder="Add to the conversation. Wrap code or commands in triple backticks (```) to embed them."
        className="w-full rounded-md border border-input bg-background p-3 font-mono text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      <p className="text-xs text-muted-foreground">
        Use ```bash for a terminal block, ```python for code, or `backticks` inline.
      </p>
      <div className="flex justify-end">
        <PendingButton pendingLabel="Posting">Post reply</PendingButton>
      </div>
    </form>
  );
}
