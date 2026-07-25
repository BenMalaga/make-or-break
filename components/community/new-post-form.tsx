"use client";

import Link from "next/link";
import { useFormState } from "react-dom";
import { TriangleAlert } from "lucide-react";
import { submitPost } from "@/lib/actions/community";
import { Button } from "@/components/ui/button";
import { PostComposer } from "@/components/community/post-composer";
import { PendingButton } from "./pending-button";

/**
 * New-post form. useFormState so a validation error shows inline and keeps
 * everything typed (the old redirect-on-error blanked the whole post).
 */
export function NewPostForm({
  communities,
  defaultCommunity,
}: {
  communities: { id: string; name: string }[];
  defaultCommunity?: string;
}) {
  const [state, action] = useFormState(submitPost, { error: null });

  return (
    <form action={action} className="space-y-4">
      {state.error ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
          <TriangleAlert className="size-4 shrink-0" /> {state.error}
        </div>
      ) : null}

      <div className="space-y-1.5">
        <label htmlFor="communityId" className="text-sm font-medium">
          Community
        </label>
        <select
          id="communityId"
          name="communityId"
          defaultValue={defaultCommunity ?? communities[0].id}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {communities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="title" className="text-sm font-medium">
          Title
        </label>
        <input
          id="title"
          name="title"
          required
          maxLength={200}
          placeholder="What is your post about?"
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>

      <div className="space-y-1.5">
        <label className="text-sm font-medium">Body</label>
        <PostComposer />
        <p className="text-xs text-muted-foreground">
          Use the toolbar for code, terminal blocks, and formatting. Preview to see how it will look.
        </p>
      </div>

      <div className="flex justify-end gap-2">
        <Button asChild variant="ghost">
          <Link href="/community">Cancel</Link>
        </Button>
        <PendingButton pendingLabel="Posting">Post</PendingButton>
      </div>
    </form>
  );
}
